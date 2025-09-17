const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel.js");
const mongoose = require("mongoose");

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


// Create new superadmin from component
const createNewSuperAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Check if email already exists
    const existing = await UserModel.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new superadmin
    const newSuperAdmin = new UserModel({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "superadmin",
    });

    await newSuperAdmin.save();

    return res.status(201).json({
      success: true,
      message: "Super Admin created successfully",
      data: {
        id: newSuperAdmin._id,
        name: newSuperAdmin.name,
        email: newSuperAdmin.email,
        role: newSuperAdmin.role,
      },
    });
  } catch (err) {
    console.error("Error creating superadmin:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all superadmins
const getAllSuperAdmins = async (req, res) => {
  try {
    const superAdmins = await UserModel.find({ role: "superadmin" })
      .select("-password") // Exclude password from response
      .sort({ createdAt: -1 }); // Sort by newest first

    return res.status(200).json({
      success: true,
      data: superAdmins,
      message: "Super Admins fetched successfully",
    });
  } catch (err) {
    console.error("Error fetching superadmins:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update superadmin details
const updateSuperAdmin = async (req, res) => {
  const { userId } = req.params;
  const { name, email, password } = req.body;

  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Find the user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if email already exists for another user
    if (email && email.toLowerCase().trim() !== user.email) {
      const existingEmail = await UserModel.findOne({ 
        email: email.toLowerCase().trim(),
        _id: { $ne: userId }
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Update fields
    if (name && name.trim()) user.name = name.trim();
    if (email && email.trim()) user.email = email.toLowerCase().trim();
    if (password && password.trim()) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Super Admin updated successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (err) {
    console.error("Error updating superadmin:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// Delete superadmin
const deleteSuperAdmin = async (req, res) => {
  const { userId } = req.params;

  try {
    // Prevent deleting the current user
    if (userId === req.userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await UserModel.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Super Admin deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting superadmin:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Login user (superadmin only)
const loginUser = async (req, res) => {
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

// Check if the user is authenticated
const isAuthenticated = async (req, res) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Get user data
const getUserData = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }
    return res.json({
      success: true,
      userData: {
        id: user._id,
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

// Logout
const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    res.json({ success: true, message: "Logged Out successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

module.exports = {
  createNewSuperAdmin,
  getAllSuperAdmins,
  updateSuperAdmin,
  deleteSuperAdmin,
  loginUser,
  isAuthenticated,
  getUserData,
  logout,
};
