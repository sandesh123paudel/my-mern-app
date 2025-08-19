const express = require("express");
const {
  getInquiries,
  submitInquiry,
  getInquiryById,
  updateInquiryStatus,
  deleteInquiry,
  getInquiryStats,
} = require("../controllers/inquiryController.js");
const { inquiryFormValidation } = require("../middlewares/validator.js");
const handleValidationErrors = require("../utils/handleValidationErrors.js");
const userAuth = require("../middlewares/auth.js");

const inquiryRouter = express.Router();

// Public routes
inquiryRouter.post(
  "/submit-inquiry",
  inquiryFormValidation(),
  handleValidationErrors,
  submitInquiry
);

// Admin routes (protected)
inquiryRouter.get("/inquiries", userAuth, getInquiries);
inquiryRouter.get("/inquiries/stats", userAuth, getInquiryStats);
inquiryRouter.get("/inquiries/:id", userAuth, getInquiryById);
inquiryRouter.put("/inquiries/:id/status", userAuth, updateInquiryStatus);
inquiryRouter.delete("/inquiries/:id", userAuth, deleteInquiry);

module.exports = inquiryRouter;
