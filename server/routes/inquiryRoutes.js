import express from "express";
import {
  getInquiries,
  submitInquiry,
  updateInquiryStatus,
  deleteInquiry,
} from "../controllers/inquiryController.js";
import { inquiryFormValidation } from "../middlewares/validator.js";
import handleValidationErrors from "../utils/handleValidationErrors.js";
import userAuth from "../middlewares/auth.js";

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

export default inquiryRouter;
