import express from "express";
import {
  getInquiries,
  submitInquiry,
} from "../controllers/inquiryController.js";
import { inquiryFormValidation } from "../middlewares/validator.js";
import handleValidationErrors from "../utils/handleValidationErrors.js";
const inquiryRouter = express.Router();

inquiryRouter.post(
  "/submit-inquiry",
  inquiryFormValidation(),
  handleValidationErrors,
  submitInquiry
);

inquiryRouter.get("/inquiries", getInquiries); // Assuming you have a function to get all inquiries

export default inquiryRouter;
