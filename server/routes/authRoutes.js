import express from "express";
import { loginValidator } from "../middlewares/validator.js";
import {
  createSuperAdmin,
  isAuthenticated,
  loginUser,
  logout,
} from "../controllers/authController.js";
import handleValidationErrors from "../utils/handleValidationErrors.js";
import userAuth from "../middlewares/auth.js";
const authRouter = express.Router();

// Create Super Admin Route
authRouter.post("/create-superadmin", createSuperAdmin);

//Login Route
authRouter.post("/login", loginValidator(), handleValidationErrors, loginUser);
authRouter.post("/logout", userAuth, logout);
authRouter.get("/is-auth", userAuth, isAuthenticated);

export default authRouter;
