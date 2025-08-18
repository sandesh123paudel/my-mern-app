const express = require("express");
const {
  createMenuItem,
  deleteMenuItem,
  getMenuItemById,
  getMenuItems,
  updateMenuItem,
} = require("../controllers/menuItemController.js");
const userAuth = require("../middlewares/auth.js");
const menuItemRouter = express.Router();

// --- Public Routes ---
menuItemRouter.get("/", getMenuItems);
menuItemRouter.get("/:id", getMenuItemById);

// --- Protected/Admin Routes ---
menuItemRouter.post("/", userAuth, createMenuItem);
menuItemRouter.put("/:id", userAuth, updateMenuItem);
menuItemRouter.delete("/:id", userAuth, deleteMenuItem);

module.exports = menuItemRouter;
