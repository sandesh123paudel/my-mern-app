const express = require("express");
const {
  // Admin routes
  createCustomOrder,
  getAllCustomOrders,
  getCustomOrderById,
  updateCustomOrder,
  deleteCustomOrder,
  addItemToCategory,
  addFixedAddon,
  addVariableAddon,

  // Public routes
  getCustomOrdersByLocationPublic,
  getCustomOrderByIdPublic,
  calculateCustomOrderPricePublic,
  getLocationsWithCustomOrders,
} = require("../controllers/customOrderController.js");

const userAuth = require("../middlewares/auth.js");

const customOrderRouter = express.Router();

// =====================================================
// PUBLIC ROUTES (No Authentication Required)
// =====================================================

// Get all locations that have custom orders
customOrderRouter.get("/locations", getLocationsWithCustomOrders);

// Get custom orders by location (for customer browsing)
customOrderRouter.get("/location/:locationId", getCustomOrdersByLocationPublic);

// Get specific custom order details (for customer viewing)
customOrderRouter.get("/public/:id", getCustomOrderByIdPublic);

// Calculate price for custom order (for customer preview)
customOrderRouter.post(
  "/public/:id/calculate",
  calculateCustomOrderPricePublic
);

// =====================================================
// ADMIN ROUTES (Authentication Required)
// =====================================================

// Get all custom orders (admin dashboard)
customOrderRouter.get("/", userAuth, getAllCustomOrders);

// Create new custom order configuration
customOrderRouter.post("/", userAuth, createCustomOrder);

// Get specific custom order (admin view)
customOrderRouter.get("/:id", userAuth, getCustomOrderById);

// Update custom order configuration
customOrderRouter.put("/:id", userAuth, updateCustomOrder);

// Delete (deactivate) custom order
customOrderRouter.delete("/:id", userAuth, deleteCustomOrder);

// Add item to specific category
customOrderRouter.post(
  "/:id/categories/:categoryName/items",
  userAuth,
  addItemToCategory
);

// Add fixed addon to custom order
customOrderRouter.post("/:id/addons/fixed", userAuth, addFixedAddon);

// Add variable addon to custom order
customOrderRouter.post("/:id/addons/variable", userAuth, addVariableAddon);

module.exports = customOrderRouter;
