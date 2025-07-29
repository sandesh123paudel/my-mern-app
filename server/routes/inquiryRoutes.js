import express from "express";
import { submitInquiry } from "../controllers/inquiryController.js";
import { inquiryFormValidation } from "../middlewares/validator.js";
import handleValidationErrors from "../utils/handleValidationErrors.js";
const inquiryRouter = express.Router();

inquiryRouter.post(
  "/submit-inquiry",
  inquiryFormValidation(),
  handleValidationErrors,
  submitInquiry
);

export default inquiryRouter;
