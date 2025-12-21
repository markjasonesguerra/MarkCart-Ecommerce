import express from "express";
import db from "../utils/db.js";
import { requireAuth, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

const MESSAGE_LIMIT_DEFAULT = 20;
const MESSAGE_LIMIT_MAX = 100;

const isAdminRole = (role) => String(role || "").toLowerCase() === "admin";

const getUnreadCount = async ({ conversationID, viewerID }) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS unread
     FROM messages m
     LEFT JOIN message_reads r ON r.messageID = m.messageID AND r.userID = ?
     WHERE m.conversationID = ?
       AND m.senderUserID <> ?
       AND m.deletedAt IS NULL
       AND r.messageID IS NULL`,
    [viewerID, conversationID, viewerID]
  );
  return rows?.[0]?.unread || 0;
};

const recordReads = async ({ conversationID, viewerID }) => {
  const [rows] = await db.query(
    `SELECT m.messageID
     FROM messages m
     LEFT JOIN message_reads r ON r.messageID = m.messageID AND r.userID = ?
     WHERE m.conversationID = ?
       AND m.senderUserID <> ?
       AND m.deletedAt IS NULL
       AND r.messageID IS NULL`,
    [viewerID, conversationID, viewerID]
  );

  if (!rows.length) return 0;

  const now = new Date();
  const values = rows.map((row) => [row.messageID, viewerID, now]);

  await db.query(
    "INSERT INTO message_reads (messageID, userID, readAt) VALUES ? ON DUPLICATE KEY UPDATE readAt = VALUES(readAt)",
    [values]
  );

  await db.query(
    "UPDATE messages SET isRead = 1 WHERE conversationID = ? AND senderUserID <> ? AND deletedAt IS NULL",
    [conversationID, viewerID]
  );

  return rows.length;
};

const ensureConversation = async (userID) => {
  const [active] = await db.query(
    "SELECT * FROM conversations WHERE userID = ? AND deletedAt IS NULL ORDER BY createdAt DESC LIMIT 1",
    [userID]
  );
  if (active.length > 0) return active[0];

  // If a soft-deleted conversation exists, resurrect it instead of inserting (avoids uniq constraint)
  const [deleted] = await db.query(
    "SELECT * FROM conversations WHERE userID = ? AND deletedAt IS NOT NULL ORDER BY deletedAt DESC LIMIT 1",
    [userID]
  );
  if (deleted.length > 0) {
    const convo = deleted[0];
    await db.query(
      "UPDATE conversations SET deletedAt = NULL, deletedByUserID = NULL, status = 'open', lastMessageAt = NOW() WHERE conversationID = ?",
      [convo.conversationID]
    );
    return {
      ...convo,
      status: "open",
      deletedAt: null,
      deletedByUserID: null,
      lastMessageAt: new Date(),
    };
  }

  const [result] = await db.query(
    "INSERT INTO conversations (userID, status, lastMessageAt) VALUES (?, 'open', NOW())",
    [userID]
  );
  return { conversationID: result.insertId, userID, status: "open", lastMessageAt: new Date() };
};

const fetchMessages = async ({ conversationID, before, since, limit }) => {
  const cursor = before || new Date();
  const pageSize = Math.min(Math.max(limit || MESSAGE_LIMIT_DEFAULT, 1), MESSAGE_LIMIT_MAX);
  const params = [conversationID];
  const sinceClause = since ? "AND m.createdAt >= ?" : "";
  if (since) params.push(since);
  params.push(cursor, pageSize);

  const [rows] = await db.query(
    `SELECT m.*, u.name AS senderName, u.role AS senderRole
     FROM messages m
     JOIN users u ON u.userID = m.senderUserID
     WHERE m.conversationID = ? ${sinceClause} AND m.createdAt < ? AND m.deletedAt IS NULL
     ORDER BY m.createdAt DESC
     LIMIT ?`,
    params
  );
  return rows.reverse();
};

const markRead = async ({ conversationID, viewerID }) => recordReads({ conversationID, viewerID });

// User: get or create their conversation
router.get("/my/conversation", requireAuth, async (req, res) => {
  try {
    const convo = await ensureConversation(req.user.userID);
    res.json(convo);
  } catch (err) {
    console.error("chat:my/conversation", err);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// User: list messages in their conversation
router.get("/my/messages", requireAuth, async (req, res) => {
  try {
    const convo = await ensureConversation(req.user.userID);
    let since = undefined;
    if (convo.status === "closed") {
      const [rows] = await db.query(
        "SELECT createdAt FROM messages WHERE conversationID = ? AND messageType = 'system' ORDER BY createdAt DESC LIMIT 1",
        [convo.conversationID]
      );
      if (rows.length > 0) {
        since = rows[0].createdAt;
      }
    }
    const messages = await fetchMessages({
      conversationID: convo.conversationID,
      before: req.query.before,
      since,
      limit: Number(req.query.limit),
    });
    const unreadBefore = await getUnreadCount({ conversationID: convo.conversationID, viewerID: req.user.userID });
    await recordReads({ conversationID: convo.conversationID, viewerID: req.user.userID });
    res.json({ conversationID: convo.conversationID, status: convo.status, messages, unreadBefore, unreadCount: 0 });
  } catch (err) {
    console.error("chat:my/messages", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// User: unread count without marking read (for badge)
router.get("/my/unread", requireAuth, async (req, res) => {
  try {
    const convo = await ensureConversation(req.user.userID);
    const unreadCount = await getUnreadCount({ conversationID: convo.conversationID, viewerID: req.user.userID });
    res.json({ conversationID: convo.conversationID, unreadCount });
  } catch (err) {
    console.error("chat:my/unread", err);
    res.status(500).json({ error: "Failed to fetch unread" });
  }
});

// User: send a message
router.post("/my/messages", requireAuth, async (req, res) => {
  const { body, attachments } = req.body;
  if (!body || typeof body !== "string" || body.trim().length < 1 || body.length > 2000) {
    return res.status(400).json({ error: "Message body must be 1-2000 characters" });
  }

  try {
    const convo = await ensureConversation(req.user.userID);
    // Re-open if previously closed
    if (convo.status === 'closed') {
      await db.query("UPDATE conversations SET status = 'open' WHERE conversationID = ?", [convo.conversationID]);
    }
    const [result] = await db.query(
      "INSERT INTO messages (conversationID, senderUserID, body, attachments, messageType, isRead) VALUES (?, ?, ?, ?, 'user', 0)",
      [convo.conversationID, req.user.userID, body.trim(), attachments ? JSON.stringify(attachments) : null]
    );
    await db.query("UPDATE conversations SET lastMessageAt = NOW(), status = 'open' WHERE conversationID = ?", [convo.conversationID]);
    const [rows] = await db.query("SELECT * FROM messages WHERE messageID = ?", [result.insertId]);
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${convo.conversationID}`).emit('message:new', rows[0]);
      io.to('admins').emit('conversation:updated', { conversationID: convo.conversationID, lastMessageAt: new Date() });
    }
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("chat:my/messages send", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Admin: list all conversations
router.get("/conversations", requireAuth, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, u.name AS userName, u.email AS userEmail
       , (
         SELECT COUNT(*) FROM messages m
         LEFT JOIN message_reads r ON r.messageID = m.messageID AND r.userID = ?
         WHERE m.conversationID = c.conversationID
           AND m.senderUserID <> ?
           AND m.deletedAt IS NULL
           AND r.messageID IS NULL
       ) AS unreadCount
       FROM conversations c
       JOIN users u ON u.userID = c.userID
       WHERE c.deletedAt IS NULL
       ORDER BY COALESCE(c.lastMessageAt, c.createdAt) DESC`,
       [req.user.userID, req.user.userID]
    );
    res.json(rows);
  } catch (err) {
    console.error("chat:conversations list", err);
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

// Admin or owner: fetch messages for a conversation
router.get("/conversations/:conversationID/messages", requireAuth, async (req, res) => {
  const { conversationID } = req.params;
  try {
    const [convos] = await db.query(
      "SELECT * FROM conversations WHERE conversationID = ? AND deletedAt IS NULL",
      [conversationID]
    );
    if (convos.length === 0) return res.status(404).json({ error: "Conversation not found" });
    const convo = convos[0];
    if (!isAdminRole(req.user.role) && convo.userID !== req.user.userID) {
      return res.status(403).json({ error: "Not allowed" });
    }
    const messages = await fetchMessages({
      conversationID,
      before: req.query.before,
      limit: Number(req.query.limit),
    });
    const unreadBefore = await getUnreadCount({ conversationID, viewerID: req.user.userID });
    await recordReads({ conversationID, viewerID: req.user.userID });
    res.json({ conversationID, messages, unreadBefore, unreadCount: 0 });
  } catch (err) {
    console.error("chat:convo messages", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Admin or owner: send a message to a conversation
router.post("/conversations/:conversationID/messages", requireAuth, async (req, res) => {
  const { conversationID } = req.params;
  const { body, attachments } = req.body;
  if (!body || typeof body !== "string" || body.trim().length < 1 || body.length > 2000) {
    return res.status(400).json({ error: "Message body must be 1-2000 characters" });
  }
  try {
    const [convos] = await db.query(
      "SELECT * FROM conversations WHERE conversationID = ? AND deletedAt IS NULL",
      [conversationID]
    );
    if (convos.length === 0) return res.status(404).json({ error: "Conversation not found" });
    const convo = convos[0];
    if (!isAdminRole(req.user.role) && convo.userID !== req.user.userID) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const messageType = isAdminRole(req.user.role) ? "admin" : "user";
    const [result] = await db.query(
      "INSERT INTO messages (conversationID, senderUserID, body, attachments, messageType, isRead) VALUES (?, ?, ?, ?, ?, 0)",
      [conversationID, req.user.userID, body.trim(), attachments ? JSON.stringify(attachments) : null, messageType]
    );
    await db.query("UPDATE conversations SET lastMessageAt = NOW(), status = 'open' WHERE conversationID = ?", [conversationID]);
    const [rows] = await db.query("SELECT * FROM messages WHERE messageID = ?", [result.insertId]);
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversationID}`).emit('message:new', rows[0]);
      io.to('admins').emit('conversation:updated', { conversationID, lastMessageAt: new Date() });
    }
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("chat:send message", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Mark all messages in a conversation as read by current viewer
router.patch("/conversations/:conversationID/read", requireAuth, async (req, res) => {
  const { conversationID } = req.params;
  try {
    const [convos] = await db.query(
      "SELECT * FROM conversations WHERE conversationID = ? AND deletedAt IS NULL",
      [conversationID]
    );
    if (convos.length === 0) return res.status(404).json({ error: "Conversation not found" });
    const convo = convos[0];
    if (!isAdminRole(req.user.role) && convo.userID !== req.user.userID) {
      return res.status(403).json({ error: "Not allowed" });
    }
    await recordReads({ conversationID, viewerID: req.user.userID });
    res.json({ message: "Marked as read", unreadCount: 0 });
  } catch (err) {
    console.error("chat:mark read", err);
    res.status(500).json({ error: "Failed to mark read" });
  }
});

// User: close/reopen their conversation (no delete)
router.patch("/my/conversation/status", requireAuth, async (req, res) => {
  const { status, note } = req.body; // expected 'closed' or 'open'
  if (!['closed', 'open'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const trimmedNote = typeof note === "string" ? note.trim() : "";

  try {
    const [convos] = await db.query(
      "SELECT * FROM conversations WHERE userID = ? AND deletedAt IS NULL LIMIT 1",
      [req.user.userID]
    );
    if (convos.length === 0) return res.status(404).json({ error: "Conversation not found" });
    const convo = convos[0];

    await db.query(
      "UPDATE conversations SET status = ?, lastMessageAt = CASE WHEN ? = 'closed' THEN NOW() ELSE lastMessageAt END WHERE conversationID = ?",
      [status, status, convo.conversationID]
    );

    let statusMessage = null;
    if (status === 'closed') {
      const body = trimmedNote || "User marked the issue as solved and closed the chat.";
      const [result] = await db.query(
        "INSERT INTO messages (conversationID, senderUserID, body, attachments, messageType, isRead) VALUES (?, ?, ?, NULL, 'system', 1)",
        [convo.conversationID, req.user.userID, body]
      );
      const [rows] = await db.query("SELECT * FROM messages WHERE messageID = ?", [result.insertId]);
      statusMessage = rows[0];
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${convo.conversationID}`).emit('conversation:status', { conversationID: convo.conversationID, status });
      io.to('admins').emit('conversation:status', { conversationID: convo.conversationID, status });
      if (statusMessage) {
        io.to(`conversation:${convo.conversationID}`).emit('message:new', statusMessage);
        io.to('admins').emit('message:new', statusMessage);
      }
    }

    res.json({ message: "Conversation status updated", status, statusMessage });
  } catch (err) {
    console.error("chat:update my conversation status", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// Admin: soft-delete a conversation (and its messages)
router.delete("/conversations/:conversationID", requireAuth, isAdmin, async (req, res) => {
  const { conversationID } = req.params;
  const deleterID = req.user.userID;

  try {
    const [convos] = await db.query(
      "SELECT * FROM conversations WHERE conversationID = ? AND deletedAt IS NULL",
      [conversationID]
    );
    if (convos.length === 0) return res.status(404).json({ error: "Conversation not found" });

    await db.query(
      "UPDATE conversations SET deletedAt = NOW(), deletedByUserID = ? WHERE conversationID = ?",
      [deleterID, conversationID]
    );
    await db.query(
      "UPDATE messages SET deletedAt = NOW(), deletedByUserID = ? WHERE conversationID = ?",
      [deleterID, conversationID]
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversationID}`).emit('conversation:deleted', { conversationID });
      io.to('admins').emit('conversation:deleted', { conversationID });
    }

    res.json({ message: "Conversation deleted" });
  } catch (err) {
    console.error("chat:delete conversation", err);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

export default router;