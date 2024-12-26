import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import lostAndFoundRoutes from './routes/lostAndFoundRoutes.js';

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import parcelRoutes from './routes/parcelRoutes.js';
import { ChatRoom } from './models/ChatRoom.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.development file
dotenv.config({
    path: path.resolve(__dirname, '../.env.development')
});

// Validate essential environment variables
if (!process.env.MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in environment variables');
    process.exit(1);
}

const app = express();

// Updated CORS configuration
app.use(cors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Ensure JSON parsing is before routes
app.use(express.json());
app.use("/", express.static("build"));
app.use("/api/auth", authRoutes);
app.use("/api/whoami", userRoutes);
app.use('/api/lost-and-found', lostAndFoundRoutes);
app.use('/api/parcel', parcelRoutes);

app.use('*', (req, res) => {
    res.redirect('/');
});

const PORT = process.env.BACKEND_PORT || 5000;
const URL = process.env.REACT_BACKEND_API_URL || 'http://localhost:' + PORT;

// Create and initialise websocket. This can be refactored to a new file.
const server = http.createServer(app);

export const io = new SocketIOServer(server, {
    cors: {
        origin: ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
    }
});

const userSocketMap = new Map();

export function getSocketIdByUser(userId) {
  return userSocketMap.get(userId.toString()) || null;
}

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap.set(userId, socket.id);
  }

  socket.on('JOIN_ROOM', (roomId) => {
    socket.join(roomId);
  });

  socket.on('CHAT_MESSAGE', async (data) => {
    try {
      const { chatRoomId, text, senderId } = data;
      const room = await ChatRoom.findById(chatRoomId);

      if (!room) return;

      const senderUser = await User.findOne({ enroll: senderId});
      room.messages.push({
        sender: senderUser._id,
        text,
      });
      await room.save();

      io.to(chatRoomId).emit('CHAT_MESSAGE', {
        sender: senderUser?.enroll,
        senderName: senderUser?.name || 'Unknown',
        text,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('CHAT_MESSAGE error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);

    for (const [uid, sid] of userSocketMap.entries()) {
      if (sid === socket.id) {
        userSocketMap.delete(uid);
        break;
      }
    }
  });
});

connectDB(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on ${URL}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  });

