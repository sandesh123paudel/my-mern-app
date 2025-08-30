const express = require("express");
const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  updatePaymentStatus,
  updateBooking,
  getBookingStats,
  getUniqueDishesCount,
  cancelBooking,
  getBookingsByCustomer,
  getBookingByReference,
  getCustomOrdersByLocation,
  getCustomOrderById,
  calculateCustomOrderPrice,
  getBookingItemsByCategory,
  checkVenueAvailability,
  // New functions
  addAdminAddition,
  removeAdminAddition,
  getAdminAdditions,
  applyCouponToBooking,
  removeCouponFromBooking,
} = require("../controllers/bookingController.js");

const {
  bookingFormValidation,
  customOrderCalculationValidation,
  bookingStatusValidation,
  paymentStatusValidation,
  bookingUpdateValidation,
  bookingCancellationValidation,
} = require("../middlewares/validator.js");

const handleValidationErrors = require("../utils/handleValidationErrors.js");
const userAuth = require("../middlewares/auth.js");

const bookingRouter = express.Router();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

// Create new booking (now with coupon support)
bookingRouter.post(
  "/",
  bookingFormValidation(),
  handleValidationErrors,
  createBooking
);

// Customer lookup routes
bookingRouter.get("/customer/:email", getBookingsByCustomer);
bookingRouter.get("/reference/:reference", getBookingByReference);

// Custom order routes (for frontend)
bookingRouter.get(
  "/custom-orders/location/:locationId",
  getCustomOrdersByLocation
);
bookingRouter.get("/custom-orders/:id", getCustomOrderById);
bookingRouter.post(
  "/custom-orders/:id/calculate",
  customOrderCalculationValidation(),
  handleValidationErrors,
  calculateCustomOrderPrice
);

// Venue availability check
bookingRouter.get("/venue-availability", checkVenueAvailability);

// ============================================================================
// ADMIN ROUTES (Authentication required)
// ============================================================================

// Get all bookings with filters
bookingRouter.get("/", userAuth, getAllBookings);

// Get booking statistics and analytics
bookingRouter.get("/stats", userAuth, getBookingStats);

// Get unique dishes count for dashboard
bookingRouter.get("/unique-dishes", userAuth, getUniqueDishesCount);

// Get single booking by ID
bookingRouter.get("/:id", userAuth, getBookingById);

// Get booking items grouped by category
bookingRouter.get("/:id/items-by-category", userAuth, getBookingItemsByCategory);

// ============================================================================
// ADMIN UPDATE ROUTES (Authentication required)
// ============================================================================

// Update booking status
bookingRouter.put(
  "/:id/status",
  userAuth,
  bookingStatusValidation(),
  handleValidationErrors,
  updateBookingStatus
);

// Update payment status
bookingRouter.put(
  "/:id/payment",
  userAuth,
  paymentStatusValidation(),
  handleValidationErrors,
  updatePaymentStatus
);

// Update complete booking details
bookingRouter.put(
  "/:id",
  userAuth,
  bookingUpdateValidation(),
  handleValidationErrors,
  updateBooking
);

// Cancel booking
bookingRouter.put(
  "/:id/cancel",
  userAuth,
  bookingCancellationValidation(),
  handleValidationErrors,
  cancelBooking
);

// ============================================================================
// ADMIN ADDITION ROUTES (Authentication required)
// ============================================================================

// Get admin additions for a booking
bookingRouter.get("/:id/admin-additions", userAuth, getAdminAdditions);

// Add admin addition to booking
bookingRouter.post("/:id/admin-additions", userAuth, addAdminAddition);

// Remove admin addition from booking
bookingRouter.delete("/:id/admin-additions/:additionId", userAuth, removeAdminAddition);

// ============================================================================
// COUPON ROUTES (Authentication required for admin functions)
// ============================================================================

// Apply coupon to existing booking (admin only)
bookingRouter.put("/:id/apply-coupon", userAuth, applyCouponToBooking);

// Remove coupon from booking (admin only)
bookingRouter.delete("/:id/remove-coupon", userAuth, removeCouponFromBooking);

module.exports = bookingRouter;