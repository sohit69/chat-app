
process.on("uncaughtException", (err) => {
  console.log("🔥 UNCAUGHT EXCEPTION:");
  console.error(err);
});

process.on("unhandledRejection", (err) => {
  console.log("🔥 UNHANDLED REJECTION:");
  console.error(err);
});

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { corsOptions } from "./constants/config.js";

import http from "http";
import { Server } from "socket.io";
import { v2 as cloudinary } from "cloudinary";
import { v4 as uuid } from "uuid";

import { connectToDB } from "./utils/connectToDB.js";
import { errorMiddleware } from "./middlewares/error.js";
import {
  CHAT_JOINED,
  CHAT_LEAVED,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  ONLINE_USERS,
  START_TYPING,
  STOP_TYPING,
} from "./constants/events.js";

import { Message } from "./models/message.model.js";
import { getSockets } from "./lib/helper.js";

import userRoute from "./routes/user.routes.js";
import chatRoute from "./routes/chat.routes.js";
import adminRoute from "./routes/admin.routes.js";
import { socketAuthenticator } from "./middlewares/auth.js";

dotenv.config();

console.log("Mongo URI =", process.env.MONGO_URI);

// Variables
const mongoURI =
  process.env.MONGO_URI || "mongodb://localhost:27017/complete-chat-app";
const PORT = process.env.PORT || 5000;

const userSocketIDs = new Map();
const onlineUsers = new Set();
const envMode = process.env.NODE_ENV || "development";
const adminSecretKey = process.env.ADMIN_SECRET_KEY || "Admin@123";

// ✅ DB CONNECT
connectToDB(mongoURI);
console.log("✅ DB Connected");

// ✅ CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log("✅ Cloudinary configured");

const app = express();

// ✅ CORS FIX
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

const server = http.createServer(app);

// ✅ SOCKET
const io = new Server(server, {
  cors: corsOptions,
});

app.set("io", io);

// ✅ MIDDLEWARE
app.use(express.json());
app.use(cookieParser());

// ✅ ROUTES
app.use("/api/v1/user", userRoute);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/admin", adminRoute);

console.log("✅ Routes loaded");

app.get("/", (req, res) => {
  res.send("Server is running");
});

// ✅ SOCKET AUTH
io.use((socket, next) => {
  cookieParser()(
    socket.request,
    socket.request.res,
    async (err) => await socketAuthenticator(err, socket, next)
  );
});

// ✅ SOCKET CONNECTION
io.on("connection", (socket) => {
  // 🔥 FIX: prevent crash if user missing
  if (!socket.user) {
    console.log("❌ Socket connected without user");
    return;
  }

  const user = socket.user;

  userSocketIDs.set(user._id.toString(), socket.id);

  socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
    try {
      const messageForRealTime = {
        content: message,
        _id: uuid(),
        sender: {
          _id: user._id,
          name: user.name,
        },
        chat: chatId,
        createdAt: new Date().toISOString(),
      };

      const messageForDB = {
        content: message,
        sender: user._id,
        chat: chatId,
      };

      const membersSocket = getSockets(members);

      io.to(membersSocket).emit(NEW_MESSAGE, {
        chatId,
        message: messageForRealTime,
      });

      io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });

      await Message.create(messageForDB);
    } catch (error) {
      console.log("❌ Message error:", error);
    }
  });

  socket.on(START_TYPING, ({ members, chatId }) => {
    const membersSockets = getSockets(members);
    socket.to(membersSockets).emit(START_TYPING, { chatId });
  });

  socket.on(STOP_TYPING, ({ members, chatId }) => {
    const membersSockets = getSockets(members);
    socket.to(membersSockets).emit(STOP_TYPING, { chatId });
  });

  socket.on(CHAT_JOINED, ({ userId, members }) => {
    onlineUsers.add(userId.toString());
    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
  });

  socket.on(CHAT_LEAVED, ({ userId, members }) => {
    onlineUsers.delete(userId.toString());
    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
  });

  socket.on("disconnect", () => {
    userSocketIDs.delete(user._id.toString());
    onlineUsers.delete(user._id.toString());
    socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers));
  });
});


app.use(errorMiddleware);


server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
export { userSocketIDs, adminSecretKey, envMode };