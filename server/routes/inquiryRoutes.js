const express = require("express");
const {
  getInquiries,
  submitInquiry,
  updateInquiryStatus,
  deleteInquiry,
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

inquiryRouter.get("/inquiries", getInquiries);

// Admin routes (you might want to add authentication middleware here)
inquiryRouter.put("/inquiries/:id/status", userAuth, updateInquiryStatus);
inquiryRouter.delete("/inquiries/:id", userAuth, deleteInquiry);

module.exports = inquiryRouter;
