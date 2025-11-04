import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http"; 
import { Server } from "socket.io";
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import streamifier from 'streamifier';

dotenv.config();

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json({limit: '10mb'}));
app.use(cookieParser());
const server = http.createServer(app); 
const PORT = process.env.PORT || 3000;
const boardMap = {};
const voiceRooms = {};
const boardHosts = {};

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
});

// Cloudinary Setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer();

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));
// Import routers and models from modular files
import authRouter from './routes/auth.js';
import whiteboardRouter from './routes/whiteboards.js';
import Whiteboard from './schema/whiteboard.js';


io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-board', async ({boardId, data, role}) => {
    if(boardId.length == 6){
      const regex = new RegExp(boardId + '$');
      const whiteboard = await Whiteboard.findOne({_id: { $regex: regex }});
      if(whiteboard){
        boardId = whiteboard._id;
      }
    }
    if(role == 'host'){
      boardMap[boardId] = data;
      boardHosts[boardId] = socket.id;
    }
    socket.join(boardId);
    if(role == 'viewer'){
      socket.emit('send-current-data', { data: boardMap[boardId], boardId: boardId });

      const hostSocketId = boardHosts[boardId];
      if (hostSocketId) {
        io.to(hostSocketId).emit('viewer-joined', {
          boardId,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
      }
    }
    console.log(`Socket ${socket.id} joined board ${boardId}`);
  });

  socket.on('canvas-data', ({ boardId, data }) => {
    socket.to(boardId).emit('canvas-data', { boardId, data });
  });

  socket.on('join-voice', ({ boardId, peerId }) => {
    if (!voiceRooms[boardId]) voiceRooms[boardId] = {};

    voiceRooms[boardId][socket.id] = peerId;
    socket.join(`voice-${boardId}`);

    console.log(`${peerId} joined voice in ${boardId}`);

    // Notify all others
    socket.to(`voice-${boardId}`).emit('user-joined-voice', {
      socketId: socket.id,
      peerId
    });

    // Send existing users to the new user
    const existingPeers = Object.entries(voiceRooms[boardId])
      .filter(([id]) => id !== socket.id)
      .map(([id, peerId]) => ({ socketId: id, peerId }));

    socket.emit('all-peers', existingPeers.map(user => user.peerId));
  });

  socket.on('leave-voice', ({ boardId }) => {
    if (voiceRooms[boardId]) {
      const peerId = voiceRooms[boardId][socket.id];
      delete voiceRooms[boardId][socket.id];
      socket.leave(`voice-${boardId}`);
      socket.to(`voice-${boardId}`).emit('user-left-voice', {
        socketId: socket.id,
        peerId,
      });
      console.log(`${peerId} left voice in ${boardId}`);
    }
  });


  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    for (const boardId in voiceRooms) {
      if (voiceRooms[boardId][socket.id]) {
        const peerId = voiceRooms[boardId][socket.id];
        delete voiceRooms[boardId][socket.id];
        socket.to(`voice-${boardId}`).emit('user-left-voice', {
          socketId: socket.id,
          peerId,
        });
      }
    }
  });
});

// Mount Routes
app.use("/api/auth", authRouter);
app.use("/api/whiteboards", whiteboardRouter);


server.listen(PORT, () => console.log(`Server with socket running on port ${PORT}`));
