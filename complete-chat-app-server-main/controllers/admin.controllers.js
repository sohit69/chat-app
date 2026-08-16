import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { ErrorHandler } from "../src/utils/errorhandler.js";

// 🔐 SECRET KEY
const adminSecretKey = "Admin@123";

// ==============================
// ✅ ADMIN LOGIN
// ==============================
export const adminLogin = async (req, res, next) => {
  try {
    const { secretKey } = req.body;

    if (secretKey !== "Admin@123") {
      return res.status(401).json({
        success: false,
        message: "Invalid Secret Key",
      });
    }

    res.cookie("admin-token", "admin123", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Admin Logged In",
    });
  } catch (error) {
    next(error);
  }
};

// ==============================
// ✅ ADMIN LOGOUT
// ==============================
export const adminLogout = async (req, res, next) => {
  try {
    res.cookie("admin-token", "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 0,
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ==============================
// ✅ ADMIN AUTH CHECK
// ==============================
export const getAdminData = async (req, res, next) => {
  try {
    const token = req.cookies["admin-token"];

    console.log("Token:", token); // 🔍 debug

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No Admin Token",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret123"
    );

    console.log("Decoded:", decoded);

    return res.status(200).json({
      success: true,
      admin: true,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or Expired Token",
    });
  }
};

// ==============================
// ✅ USERS
// ==============================
export const allUsers = async (req, res, next) => {
  try {
    const users = await User.find({});

    const updatedUsers = await Promise.all(
      users.map(async ({ _id, name, username, avatar }) => {
        const [groups, friends] = await Promise.all([
          Chat.countDocuments({ groupChat: true, members: _id }),
          Chat.countDocuments({ groupChat: false, members: _id }),
        ]);

        return {
          _id,
          name,
          username,
          avatar: avatar?.url || "",
          groups,
          friends,
        };
      })
    );

    return res.status(200).json({
      success: true,
      users: updatedUsers,
    });
  } catch (error) {
    next(error);
  }
};

// ==============================
// ✅ CHATS
// ==============================
export const allChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({})
      .populate("members", "name avatar")
      .populate("creator", "name avatar");

    const updatedChats = await Promise.all(
      chats.map(async ({ _id, name, groupChat, creator, members }) => {
        const totalMessages = await Message.countDocuments({ chat: _id });

        return {
          _id,
          name,
          groupChat,
          avatar: members.slice(0, 3).map((m) => m.avatar?.url || ""),
          members: members.map(({ _id, name, avatar }) => ({
            _id,
            name,
            avatar: avatar?.url || "",
          })),
          creator: {
            name: creator?.name || "None",
            avatar: creator?.avatar?.url || "",
          },
          totalMembers: members.length,
          totalMessages,
        };
      })
    );

    return res.status(200).json({
      success: true,
      chats: updatedChats,
    });
  } catch (error) {
    next(error);
  }
};

// ==============================
// ✅ MESSAGES
// ==============================
export const allMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({})
      .populate("sender", "name avatar")
      .populate("chat", "groupChat");

    const updatedMessages = messages.map(
      ({ content, attachments, _id, sender, createdAt, chat }) => ({
        _id,
        content,
        attachments,
        createdAt,
        chat: chat._id,
        groupChat: chat.groupChat,
        sender: {
          _id: sender._id,
          name: sender.name,
          avatar: sender.avatar?.url || "",
        },
      })
    );

    return res.status(200).json({
      success: true,
      messages: updatedMessages,
    });
  } catch (error) {
    next(error);
  }
};

// ==============================
// ✅ DASHBOARD
// ==============================
export const getDashboardStats = async (req, res, next) => {
  try {
    const [groupsCount, usersCount, messagesCount, totalChatsCount] =
      await Promise.all([
        Chat.countDocuments({ groupChat: true }),
        User.countDocuments(),
        Message.countDocuments(),
        Chat.countDocuments(),
      ]);

    return res.status(200).json({
      success: true,
      stats: {
        groupsCount,
        usersCount,
        messagesCount,
        totalChatsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};