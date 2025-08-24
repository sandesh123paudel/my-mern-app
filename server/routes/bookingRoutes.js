const express = require("express");
const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  updatePaymentStatus,
  updateBooking,
  getBookingStats,
  cancelBooking,
  getBookingsByCustomer,
  getBookingByReference,
  getCustomOrdersByLocation,
  getCustomOrderById,
  calculateCustomOrderPrice,
  getBookingItemsByCategory,
} = require("../controllers/bookingController.js");

const {
  bookingFormValidation,
  customOrderCalculationValidation,
  bookingStatusValidation,
  paymentStatusValidation,
  bookingUpdateValidation,
} = require("../middlewares/validator.js");

const handleValidationErrors = require("../utils/handleValidationErrors.js");
const userAuth = require("../middlewares/auth.js");

const bookingRouter = express.Router();

// Public routes
bookingRouter.post(
  "/",
  bookingFormValidation(),
  handleValidationErrors,
  createBooking
);

// Customer lookup routes (public)
bookingRouter.get("/customer/:email", getBookingsByCustomer);
bookingRouter.get("/reference/:reference", getBookingByReference);

// Custom order routes (public - for frontend)
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

// Admin routes (protected)
bookingRouter.get("/", userAuth, getAllBookings);
bookingRouter.get("/stats", userAuth, getBookingStats);
bookingRouter.get("/:id", userAuth, getBookingById);
bookingRouter.get(
  "/:id/items-by-category",
  userAuth,
  getBookingItemsByCategory
);

// Admin update routes (protected)
bookingRouter.patch(
  "/:id/status",
  userAuth,
  bookingStatusValidation(),
  handleValidationErrors,
  updateBookingStatus
);

bookingRouter.patch(
  "/:id/payment",
  userAuth,
  paymentStatusValidation(),
  handleValidationErrors,
  updatePaymentStatus
);

bookingRouter.put(
  "/:id",
  userAuth,
  bookingUpdateValidation(),
  handleValidationErrors,
  updateBooking
);

bookingRouter.put("/:id/cancel", userAuth, cancelBooking);

module.exports = bookingRouter;
