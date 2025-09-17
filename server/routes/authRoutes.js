const express = require("express");
const { 
  loginValidator, 
  createSuperAdminValidator, 
  updateSuperAdminValidator 
} = require("../middlewares/validator.js");
const {
  createNewSuperAdmin,
  getAllSuperAdmins,
  updateSuperAdmin,
  deleteSuperAdmin,
  getUserData,
  isAuthenticated,
  loginUser,
  logout,
} = require("../controllers/authController.js");
const handleValidationErrors = require("../utils/handleValidationErrors.js");
const userAuth = require("../middlewares/auth.js");

const authRouter = express.Router();



// Login Route
authRouter.post("/login", loginValidator(), handleValidationErrors, loginUser);
authRouter.post("/logout", userAuth, logout);
authRouter.get("/is-auth", userAuth, isAuthenticated);
authRouter.get("/data", userAuth, getUserData);

// Super Admin management routes
authRouter.post("/create-new-superadmin", userAuth, createSuperAdminValidator(), handleValidationErrors, createNewSuperAdmin);
authRouter.get("/superadmins", userAuth, getAllSuperAdmins);
authRouter.put("/superadmin/:userId", userAuth, updateSuperAdminValidator(), handleValidationErrors, updateSuperAdmin);
authRouter.delete("/superadmin/:userId", userAuth, deleteSuperAdmin);

module.exports = authRouter;