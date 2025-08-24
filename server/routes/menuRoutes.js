const express = require("express");
const {
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
  getMenusByService,
  getMenusByLocation,
  calculateMenuPrice,
} = require("../controllers/menuController.js");
const userAuth = require("../middlewares/auth.js"); // Adjust path as needed

const menuRouter = express.Router();

// --- Public Routes ---
// Get all menus with optional filtering
menuRouter.get("/", getMenus);

// Get single menu by ID
menuRouter.get("/:id", getMenuById);

// Get menus by service ID
menuRouter.get("/service/:serviceId", getMenusByService);

// Get menus by location ID
menuRouter.get("/location/:locationId", getMenusByLocation);

// Calculate menu price based on selections (public route for price estimation)
menuRouter.post("/:id/calculate-price", calculateMenuPrice);

// --- Protected/Admin Routes ---
// Create new menu
menuRouter.post("/", userAuth, createMenu);

// Update menu
menuRouter.put("/:id", userAuth, updateMenu);

// Delete menu (soft delete)
menuRouter.delete("/:id", userAuth, deleteMenu);

module.exports = menuRouter;