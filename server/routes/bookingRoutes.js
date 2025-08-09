import express from "express";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  updatePaymentStatus,
  updateBooking,
  getBookingStats,
  cancelBooking,
} from "../controllers/bookingController.js";
import { bookingFormValidation } from "../middlewares/validator.js";
import handleValidationErrors from "../utils/handleValidationErrors.js";
import userAuth from "../middlewares/auth.js";

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

export default bookingRouter;
