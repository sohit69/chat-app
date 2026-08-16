import jwt from 'jsonwebtoken';
import { ErrorHandler } from "../src/utils/errorhandler.js"
import { CHAT_TOKEN } from '../constants/config.js';
const adminSecretKey = process.env.ADMIN_SECRET_KEY || "Admin@123";
import { User } from '../models/user.model.js';

export const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies[CHAT_TOKEN];

        if (!token) return next(new ErrorHandler("Please login to access this route", 401));

        const decodedData = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decodedData._id;
        next();

    } catch (error) {
        next(error)
    }
};

export const adminOnly = (req, res, next) => {
  try {
    const token = req.cookies["admin-token"];

    console.log("AdminOnly Token:", token); // 🔍 DEBUG

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No Token",
      });
    }

    // ✅ MUST MATCH LOGIN
    if (token !== "admin123") {
      return res.status(401).json({
        success: false,
        message: "Invalid Token",
      });
    }

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Auth Failed",
    });
  }
};

export const socketAuthenticator = async (err, socket, next) => {
    try {
        if (err) return next(err);

        const authToken = socket.request.cookies[CHAT_TOKEN];

        if (!authToken)
            return next(new ErrorHandler("Please login to access this route", 401));

        const decodedData = jwt.verify(authToken, process.env.JWT_SECRET);

        const user = await User.findById(decodedData._id);

        if (!user)
            return next(new ErrorHandler("Please login to access this route", 401));

        socket.user = user;

        return next();
    } catch (error) {
        console.log(error);
        return next(new ErrorHandler("Please login to access this route", 401));
    }
};