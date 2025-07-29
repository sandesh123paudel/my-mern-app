import { body } from "express-validator";

export const inquiryFormValidation = () => {
  return [
    body("name")
      .notEmpty()
      .withMessage("Name is required")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters long"),

    body("email")
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),

    body("contact")
      .notEmpty()
      .withMessage("Contact number is required")
      .isLength({ min: 10, max: 15 })
      .withMessage("Contact number must be between 10-15 digits")
      .matches(/^[0-9+\-\s()]+$/)
      .withMessage("Contact number contains invalid characters"),

    body("eventDate")
      .notEmpty()
      .withMessage("Event date is required")
      .isISO8601()
      .withMessage("Invalid date format")
      .custom((value) => {
        const today = new Date();
        const eventDate = new Date(value);

        // Reset time to compare only dates
        today.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);

        if (eventDate < today) {
          throw new Error("Event date cannot be in the past");
        }
        return true;
      }),

    body("numberOfPeople")
      .isInt({ min: 1, max: 10000 })
      .withMessage(
        "Number of people must be a positive integer between 1 and 10000"
      ),

    body("venue")
      .notEmpty()
      .withMessage("Venue is required")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Venue must be at least 2 characters long"),

    body("serviceType")
      .notEmpty()
      .withMessage("Service type is required")
      .trim(),

    body("message")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Message cannot exceed 1000 characters"),
  ];
};
