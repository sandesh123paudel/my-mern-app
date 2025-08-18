const express = require("express");
const { loginValidator } = require("../middlewares/validator.js");
const {
  createSuperAdmin,
  getUserData,
  isAuthenticated,
  loginUser,
  logout,
  getAllAdmins,
} = require("../controllers/authController.js");
const handleValidationErrors = require("../utils/handleValidationErrors.js");
const  userAuth  = require("../middlewares/auth.js");

const authRouter = express.Router();

// Create Super Admin Route
authRouter.post("/create-superadmin", createSuperAdmin);

//Login Route
authRouter.post("/login", loginValidator(), handleValidationErrors, loginUser);
authRouter.post("/logout", userAuth, logout);
authRouter.get("/is-auth", userAuth, isAuthenticated);
authRouter.get("/data", userAuth, getUserData);

// //admin users
// authRouter.get("/admins", superAdminAuth, getAllAdmins);

module.exports = authRouter;
