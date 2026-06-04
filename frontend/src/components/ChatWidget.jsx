import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import "../styles/Chat.css";
import { chat } from "../assets";

const API_BASE_URL = (
  process.env.NODE_ENV === "development"
    ? "http://localhost:8800"
    : process.env.REACT_APP_API_BASE_URL
).replace(/\/$/, "");

const ChatWidget = ({ user }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationID, setConversationID] = useState(null);
  const [conversationStatus, setConversationStatus] = useState("open");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeNote, setCloseNote] = useState("");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  const token = user?.token;
  const currentUserID = user?.id ?? user?.userID;
  const isAuthed = Boolean(currentUserID && token && user.role !== "Admin");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/chat/my/messages`, authHeaders);
      setConversationID(res.data.conversationID);
      setConversationStatus(res.data.status || "open");
      setMessages(res.data.messages || []);
      setUnreadCount(0);
    } catch (err) {
      console.error("load chat", err);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const loadUnread = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/chat/my/unread`, authHeaders);
      if (res.data?.conversationID && !conversationID) {
        setConversationID(res.data.conversationID);
      }
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      console.error("load unread", err);
    }
  }, [authHeaders, conversationID]);

  const markConversationRead = useCallback(async (cid) => {
    if (!cid) return;
    try {
      await axios.patch(`${API_BASE_URL}/chat/conversations/${cid}/read`, {}, authHeaders);
      setUnreadCount(0);
    } catch (err) {
      console.error("mark read", err);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (isAuthed) {
      loadUnread();
    }
  }, [isAuthed, loadUnread]);

  useEffect(() => {
    if (!isAuthed) return undefined;

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("conversation:joined", ({ conversationID: joinedID }) => {
      setConversationID(joinedID);
    });

    socket.on("conversation:status", ({ conversationID: cid, status }) => {
      if (!conversationID || cid === conversationID) {
        setConversationID((prev) => prev ?? cid);
        setConversationStatus(status || "open");
        if (status === "closed") {
          setMessages((prev) => prev.filter((m) => m.messageType === "system"));
          setUnreadCount(0);
        }
      }
    });

    const handleIncoming = (msg) => {
      setConversationID((prev) => prev ?? msg.conversationID);
      setMessages((prev) => {
        if (prev.some((m) => m.messageID === msg.messageID)) return prev;
        return [...prev, msg];
      });
      const fromOther = msg.senderUserID !== currentUserID;
      if (fromOther) {
        if (open) {
          markConversationRead(msg.conversationID || conversationID);
          setUnreadCount(0);
        } else {
          setUnreadCount((c) => c + 1);
        }
      }
    };

    socket.on("message:new", handleIncoming);
    socket.on("message:sent", handleIncoming);

    return () => {
      socket.disconnect();
    };
  }, [isAuthed, token, open, conversationID, currentUserID, markConversationRead]);

  useEffect(() => {
    if (!open || !isAuthed) return;
    loadMessages();
    if (conversationID) markConversationRead(conversationID);
  }, [open, isAuthed, conversationID, loadMessages, markConversationRead]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim() || sending || !conversationID || conversationStatus === "closed") return;
    setSending(true);
    try {
      const payload = { body: input.trim() };
      await axios.post(`${API_BASE_URL}/chat/my/messages`, payload, authHeaders);
      setInput("");
    } catch (err) {
      console.error("send message", err);
    } finally {
      setSending(false);
    }
  };

  const reopenConversation = async () => {
    try {
      await axios.patch(`${API_BASE_URL}/chat/my/conversation/status`, { status: "open" }, authHeaders);
      setConversationStatus("open");
    } catch (err) {
      console.error("reopen conversation", err);
    }
  };

  const submitCloseConversation = async () => {
    try {
      await axios.patch(
        `${API_BASE_URL}/chat/my/conversation/status`,
        { status: "closed", note: closeNote || undefined },
        authHeaders
      );
      setConversationStatus("closed");
      setShowCloseModal(false);
      setCloseNote("");
      await loadMessages();
    } catch (err) {
      console.error("close conversation", err);
    }
  };

  if (!isAuthed) return null;

  return (
    <div className={`chat-widget ${open ? "open" : ""}`}>
      <button className="chat-toggle" onClick={() => setOpen(!open)}>
        <img src={chat} alt="Chat" className="chat-icon-img" />
        <span className="chat-toggle-text">Chat</span>
        {unreadCount > 0 && <span className="chat-badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <span className="chat-title">
              <span>Chat</span>
            </span>
            <div className="chat-header-actions">
              {conversationStatus === "open" ? (
                <button className="chat-delete" onClick={() => setShowCloseModal(true)} title="Mark solved & close" aria-label="Mark solved and close">
                  ✓
                </button>
              ) : (
                <button className="chat-delete" onClick={reopenConversation} title="Reopen chat" aria-label="Reopen chat">
                  ↺
                </button>
              )}
              <button className="chat-minimize" onClick={() => setOpen(false)} aria-label="Minimize chat">
                –
              </button>
            </div>
          </div>
          <div className="chat-messages">
            {loading ? (
              <div className="chat-loading">Loading…</div>
            ) : messages.length === 0 ? (
              <div className="chat-empty">Start the conversation with us.</div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.messageID}
                  className={
                    m.messageType === "system"
                      ? "chat-bubble system"
                      : `chat-bubble ${m.senderUserID === currentUserID ? "me" : "them"}`
                  }
                >
                  <div className="chat-body">{m.body}</div>
                  <div className="chat-meta">{new Date(m.createdAt).toLocaleTimeString()}</div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={conversationStatus === "closed" ? "Chat closed. Reopen to send." : "Type a message"}
              disabled={conversationStatus === "closed"}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button
              onClick={conversationStatus === "closed" ? reopenConversation : sendMessage}
              disabled={sending || (!input.trim() && conversationStatus !== "closed")}
            >
              {conversationStatus === "closed" ? "Reopen" : "Send"}
            </button>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div className="chat-modal-backdrop" onClick={() => setShowCloseModal(false)}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-modal-title">Mark this chat as solved?</div>
            <p className="chat-modal-sub">We will notify support that your issue is resolved.</p>
            <label className="chat-modal-label" htmlFor="chat-close-note">
              Tell us briefly how it was resolved (optional):
            </label>
            <textarea
              id="chat-close-note"
              value={closeNote}
              onChange={(e) => setCloseNote(e.target.value)}
              placeholder="Example: The order arrived."
            />
            <div className="chat-modal-actions">
              <button className="chat-secondary" onClick={() => setShowCloseModal(false)}>
                Cancel
              </button>
              <button className="chat-primary" onClick={submitCloseConversation}>
                Mark solved & close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
