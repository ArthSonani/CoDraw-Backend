import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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

// User Schema & Model
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});

const User = mongoose.model("User", userSchema);

// Whiteboard Schema & Model
const whiteboardSchema = new mongoose.Schema({
  _id: {
    type: String, 
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  data: {
    type: Object,
    required: true
  },
  previewImage: {
    type: String, 
    default: ''
  },
  createdAt: { type: Date, default: Date.now },
});

const Whiteboard = mongoose.model("Whiteboard", whiteboardSchema);

// JWT Authentication Middleware
const authenticateUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Authentication Routes
const authRouter = express.Router();

// Signup Route
authRouter.post("/signup", async (req, res) => {

  console.log("Signup attempt:", req.body);
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None", // required for cross-site cookies
    });

    res.status(201).json({
      message: "User created and logged in",
      user: { id: user._id, name: user.name }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Login Route
authRouter.post("/login", async (req, res) => {

  console.log("Login attempt:", req.body);
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(400).json({ error: "Invalid password" });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  });

  res.json({ message: "Login successful", user: { id: user._id, name: user.name } });
});

// Logout Route
authRouter.post("/logout", (req, res) => {
  res.cookie("token", "", { expires: new Date(0), httpOnly: true });
  res.status(200).json({ message: "Logout successful" });
});

// Mount Routes
app.use("/api/auth", authRouter);
app.use("/api/whiteboards", whiteboardRouter);


server.listen(PORT, () => console.log(`Server with socket running on port ${PORT}`));
