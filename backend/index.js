import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import db from './utils/db.js';

// Resolve __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';  // Product-related routes
import categoryRoutes from './routes/categories.js';
import cartRoutes from './routes/cart.js';
import passwordResetRoutes from './routes/passwordReset.js';
import profileRoutes from './routes/profile.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js'; // Import user routes
import vouchersRoute from "./routes/vouchers.js";
import reviewRoutes from "./routes/reviews.js"; // Corrected import name
import chatRoutes from "./routes/chat.js";

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());  // Parse incoming requests with JSON payloads

// Serve static files from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CORS: Allow only your frontend domain in production
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));


// Routes
app.use('/auth', authRoutes);  // Authentication (login, register, 2FA, etc.)
app.use('/products', productRoutes);  // Product-related routes (filter, low-stock, etc.)
app.use('/categories', categoryRoutes);  // Category-related routes
app.use('/cart', cartRoutes);  // Cart-related routes
app.use('/password-reset', passwordResetRoutes);  // Password reset routes
app.use('/profile', profileRoutes);  // Profile picture upload routes
app.use('/orders', orderRoutes);  // Orders route
app.use('/users', userRoutes); // Register user routes
app.use("/vouchers", vouchersRoute); // Voucher routes
app.use("/reviews", reviewRoutes); // review routes
app.use("/chat", chatRoutes); // chat routes

// Default route to check if server is running
app.get('/', (req, res) => {
  res.json('Hello, this is the backend API for the marketplace Mark Cart!');
});

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
});

app.set('io', io);

const socketAuth = (socket, next) => {
  try {
    const authHeader = socket.handshake.headers.authorization;
    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = socket.handshake.auth?.token || tokenFromHeader;
    if (!token) return next(new Error('unauthorized'));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { userID: payload.userID, role: payload.role, email: payload.email };
    next();
  } catch (err) {
    next(new Error('unauthorized'));
  }
};

const ensureConversation = async (userID) => {
  const [rows] = await db.query("SELECT * FROM conversations WHERE userID = ? LIMIT 1", [userID]);
  if (rows.length > 0) return rows[0];
  const [result] = await db.query(
    "INSERT INTO conversations (userID, status, lastMessageAt) VALUES (?, 'open', NOW())",
    [userID]
  );
  return { conversationID: result.insertId, userID, status: 'open', lastMessageAt: new Date() };
};

io.use(socketAuth);

io.on('connection', async (socket) => {
  const { userID, role } = socket.user;
  const isAdminRole = String(role || '').toLowerCase() === 'admin';

  if (isAdminRole) {
    socket.join('admins');
  } else {
    try {
      const convo = await ensureConversation(userID);
      socket.join(`conversation:${convo.conversationID}`);
      socket.emit('conversation:joined', { conversationID: convo.conversationID });
    } catch (err) {
      console.error('socket ensure conversation', err);
      socket.emit('error', 'Failed to join conversation');
    }
  }

  socket.on('join-conversation', async ({ conversationID }) => {
    if (!conversationID) return socket.emit('error', 'conversationID required');
    try {
      const [rows] = await db.query("SELECT * FROM conversations WHERE conversationID = ?", [conversationID]);
      if (rows.length === 0) return socket.emit('error', 'Conversation not found');
      const convo = rows[0];
      if (!isAdminRole && convo.userID !== userID) return socket.emit('error', 'Not allowed');
      socket.join(`conversation:${conversationID}`);
      socket.emit('conversation:joined', { conversationID });
    } catch (err) {
      console.error('socket join conversation', err);
      socket.emit('error', 'Join failed');
    }
  });

  socket.on('send-message', async ({ conversationID, body, attachments }) => {
    if (!body || typeof body !== 'string' || body.trim().length < 1 || body.length > 2000) {
      return socket.emit('error', 'Invalid message');
    }
    try {
      let targetConversationID = conversationID;
      if (!isAdminRole) {
        const convo = await ensureConversation(userID);
        targetConversationID = convo.conversationID;
      }
      const [convos] = await db.query("SELECT * FROM conversations WHERE conversationID = ?", [targetConversationID]);
      if (convos.length === 0) return socket.emit('error', 'Conversation not found');
      const convo = convos[0];
      if (!isAdminRole && convo.userID !== userID) return socket.emit('error', 'Not allowed');

      const messageType = isAdminRole ? 'admin' : 'user';
      const [result] = await db.query(
        "INSERT INTO messages (conversationID, senderUserID, body, attachments, messageType, isRead) VALUES (?, ?, ?, ?, ?, 0)",
        [targetConversationID, userID, body.trim(), attachments ? JSON.stringify(attachments) : null, messageType]
      );
      await db.query("UPDATE conversations SET lastMessageAt = NOW() WHERE conversationID = ?", [targetConversationID]);
      const [rows] = await db.query("SELECT * FROM messages WHERE messageID = ?", [result.insertId]);
      const message = rows[0];
      io.to(`conversation:${targetConversationID}`).emit('message:new', message);
      socket.emit('message:sent', message);
      io.to('admins').emit('conversation:updated', { conversationID: targetConversationID, lastMessageAt: new Date() });
    } catch (err) {
      console.error('socket send message', err);
      socket.emit('error', 'Send failed');
    }
  });

  socket.on('mark-read', async ({ conversationID }) => {
    if (!conversationID) return socket.emit('error', 'conversationID required');
    try {
      await db.query("UPDATE messages SET isRead = 1 WHERE conversationID = ? AND senderUserID <> ?", [conversationID, userID]);
      io.to(`conversation:${conversationID}`).emit('read-receipt', { conversationID, userID });
    } catch (err) {
      console.error('socket mark read', err);
      socket.emit('error', 'Mark read failed');
    }
  });
});

// Start the server
const PORT = process.env.PORT || 8800;
server.listen(PORT, () => {
  console.log('ENV DB_HOST:', process.env.DB_HOST);
  console.log('ENV CORS_ORIGIN:', process.env.CORS_ORIGIN);
  console.log(`Server is running on port ${PORT}`);
});