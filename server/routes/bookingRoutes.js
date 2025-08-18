const express = require("express");
const { createBooking, getAllBookings, getBookingById, updateBookingStatus, updatePaymentStatus, updateBooking, getBookingStats, cancelBooking } = require("../controllers/bookingController.js");
const { bookingFormValidation } = require("../middlewares/validator.js");
const handleValidationErrors = require("../utils/handleValidationErrors.js");
const userAuth = require("../middlewares/auth.js");

const bookingRouter = express.Router();

// Public route
bookingRouter.post(
  "/",
  bookingFormValidation(),
  handleValidationErrors,
  createBooking
);

// Admin routes
bookingRouter.get("/", userAuth, getAllBookings);
bookingRouter.get("/stats", userAuth, getBookingStats);
bookingRouter.get("/:id", userAuth, getBookingById);
bookingRouter.patch("/:id/status", userAuth, updateBookingStatus);
bookingRouter.patch("/:id/payment", userAuth, updatePaymentStatus);
bookingRouter.put("/:id", userAuth, updateBooking);
bookingRouter.delete("/:id", userAuth, cancelBooking);

module.exports = bookingRouter;
