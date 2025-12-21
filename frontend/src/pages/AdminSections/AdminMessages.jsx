import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import "../../styles/adminStyles/AdminMessages.css";

const API_BASE_URL = (
  process.env.NODE_ENV === "development"
    ? "http://localhost:8800"
    : process.env.REACT_APP_API_BASE_URL
).replace(/\/$/, "");

const AdminMessages = ({ user }) => {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const selectedRef = useRef(null);

  const token = user?.token;
  const currentAdminID = user?.id ?? user?.userID;
  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const loadConversations = async () => {
    setLoadingList(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/chat/conversations`, authHeaders);
      setConversations(res.data || []);
    } catch (err) {
      console.error("list conversations", err);
    } finally {
      setLoadingList(false);
    }
  };

  const markRead = async (conversationID) => {
    if (!conversationID) return;
    try {
      await axios.patch(
        `${API_BASE_URL}/chat/conversations/${conversationID}/read`,
        {},
        authHeaders
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationID === conversationID ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (err) {
      console.error("mark read", err);
    }
  };

  const loadMessages = async (conversationID) => {
    if (!conversationID) return;
    setLoadingMessages(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/chat/conversations/${conversationID}/messages`,
        authHeaders
      );
      setMessages(res.data.messages || []);
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationID === conversationID ? { ...c, unreadCount: 0 } : c
        )
      );
      await markRead(conversationID);
    } catch (err) {
      console.error("load messages", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const deleteConversation = async () => {
    if (!selectedRef.current) return;
    if (!window.confirm("Delete this chat?")) return;
    const conversationID = selectedRef.current.conversationID;
    try {
      await axios.delete(`${API_BASE_URL}/chat/conversations/${conversationID}`, authHeaders);
      setConversations((prev) => prev.filter((c) => c.conversationID !== conversationID));
      setSelected(null);
      selectedRef.current = null;
      setMessages([]);
    } catch (err) {
      console.error("delete conversation", err);
    }
  };

  useEffect(() => {
    if (!token) return undefined;
    loadConversations();

    const socket = io(API_BASE_URL, { auth: { token }, transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("conversation:updated", ({ conversationID, lastMessageAt }) => {
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.conversationID === conversationID ? { ...c, lastMessageAt } : c
        );
        return updated.sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt));
      });
    });

    const appendIfCurrent = (msg) => {
      setMessages((prev) => {
        if (msg.conversationID !== selectedRef.current?.conversationID) return prev;
        return [...prev, msg];
      });
      const fromOther = msg.senderUserID !== currentAdminID;
      if (msg.conversationID === selectedRef.current?.conversationID && fromOther) {
        markRead(msg.conversationID);
      }
      if (msg.conversationID !== selectedRef.current?.conversationID && fromOther) {
        setConversations((prev) =>
          prev
            .map((c) =>
              c.conversationID === msg.conversationID
                ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessageAt: msg.createdAt || c.lastMessageAt }
                : c
            )
            .sort(
              (a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt)
            )
        );
      }
    };

    socket.on("message:new", appendIfCurrent);
    socket.on("message:sent", appendIfCurrent);

    socket.on("conversation:deleted", ({ conversationID }) => {
      setConversations((prev) => prev.filter((c) => c.conversationID !== conversationID));
      if (selectedRef.current?.conversationID === conversationID) {
        setSelected(null);
        selectedRef.current = null;
        setMessages([]);
      }
    });

    return () => socket.disconnect();
  }, [token]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, selected?.conversationID]);

  const handleSelect = (convo) => {
    setSelected(convo);
    selectedRef.current = convo;
    loadMessages(convo.conversationID);
    if (socketRef.current) {
      socketRef.current.emit("join-conversation", { conversationID: convo.conversationID });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selected || sending) return;
    setSending(true);
    try {
      await axios.post(
        `${API_BASE_URL}/chat/conversations/${selected.conversationID}/messages`,
        { body: input.trim() },
        authHeaders
      );
      setInput("");
    } catch (err) {
      console.error("send message", err);
    } finally {
      setSending(false);
    }
  };

  if (!user || user.role !== "Admin") return <div className="adminMessages">Unauthorized</div>;

  return (
    <div className="adminMessages">
      <div className="convoList">
        <div className="convoListHeader">User Chats</div>
        {loadingList ? (
          <div className="muted">Loading…</div>
        ) : conversations.length === 0 ? (
          <div className="muted">No conversations yet.</div>
        ) : (
          conversations.map((c) => (
            <div
              key={c.conversationID}
              className={`convoItem ${selected?.conversationID === c.conversationID ? "active" : ""}`}
              onClick={() => handleSelect(c)}
            >
              <div className="convoTitle">
                {c.userName || c.userEmail || `User ${c.userID}`}
                {c.unreadCount > 0 && <span className="convoBadge">{c.unreadCount}</span>}
              </div>
              <div className="convoMeta">{new Date(c.lastMessageAt || c.createdAt).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
      <div className="messagePane">
        {selected ? (
          <>
            <div className="messageHeader">
              <span>Conversation #{selected.conversationID}</span>
              <button className="deleteBtn" onClick={deleteConversation}>Delete</button>
            </div>
            <div className="messageList">
              {loadingMessages ? (
                <div className="muted">Loading messages…</div>
              ) : messages.length === 0 ? (
                <div className="muted">No messages yet.</div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.messageID}
                    className={
                      m.messageType === "system"
                        ? "msgRow system"
                        : `msgRow ${m.messageType === "admin" ? "mine" : "theirs"}`
                    }
                  >
                    <div className="msgBody">{m.messageType === "system" ? `Solved: ${m.body}` : m.body}</div>
                    <div className="msgMeta">{new Date(m.createdAt).toLocaleTimeString()}</div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>
            <div className="messageInput">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a reply"
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />
              <button onClick={sendMessage} disabled={sending || !input.trim()}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="muted centered">Select a conversation.</div>
        )}
      </div>
    </div>
  );
};

export default AdminMessages;
