import UserModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// Set cookie
const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
  });
};

// Create superadmin
export const createSuperAdmin = async (req, res) => {
  try {
    const existing = await UserModel.findOne({ email: "admin@mccatering.com" });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Super Admin already exists",
      });
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const newAdmin = new UserModel({
      name: "MC Catering Admin",
      email: "admin@mccatering.com",
      password: hashedPassword,
      role: "superadmin",
    });

    await newAdmin.save();

    return res.status(201).json({
      success: true,
      message: "Super Admin created successfully",
    });
  } catch (err) {
    console.error("Error creating superadmin:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Login user (admin or superadmin)
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        token, // Optional if you want to store it client-side
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//Check if the user is authenticated or not
export const isAuthenticated = async (req, res) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const getUserData = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await UserModel.findById(userId);
    if (!userId) {
      return res.json({
        success: false,
        message: error.message,
      });
    }
    return res.json({
      success: true,
      userData: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "User data fetched successfully",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ success: true, message: "Logged Out successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
