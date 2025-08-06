import express from "express";
import {
  createMenuItem,
  deleteMenuItem,
  getMenuItemById,
  getMenuItems,
  updateMenuItem,
} from "../controllers/menuItemController.js";
import userAuth from "../middlewares/auth.js";
const menuItemRouter = express.Router();

// --- Public Routes ---
menuItemRouter.get("/", getMenuItems);
menuItemRouter.get("/:id", getMenuItemById);

// --- Protected/Admin Routes ---
menuItemRouter.post("/", userAuth, createMenuItem);
menuItemRouter.put("/:id", userAuth, updateMenuItem);
menuItemRouter.delete("/:id", userAuth, deleteMenuItem);

export default menuItemRouter;
