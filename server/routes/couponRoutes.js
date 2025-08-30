const express = require("express");
const {
  validateCoupon,
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  useCoupon,
} = require("../controllers/couponController.js");

const userAuth = require("../middlewares/auth.js");

const couponRouter = express.Router();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

// Validate coupon code (for order confirmation)
couponRouter.post("/validate", validateCoupon);

// ============================================================================
// ADMIN ROUTES (Authentication required)
// ============================================================================

// Get all coupons
couponRouter.get("/", userAuth, getAllCoupons);

// Create new coupon
couponRouter.post("/", userAuth, createCoupon);

// Get coupon by ID
couponRouter.get("/:id", userAuth, getCouponById);

// Update coupon
couponRouter.put("/:id", userAuth, updateCoupon);

// Delete coupon
couponRouter.delete("/:id", userAuth, deleteCoupon);

// Use coupon (increment usage count)
couponRouter.put("/:id/use", userAuth, useCoupon);

module.exports = couponRouter;