const { body } = require("express-validator");
const mongoose = require("mongoose");

exports.inquiryFormValidation = () => {
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
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error("Invalid venue ID format");
        }
        return true;
      }),

    body("serviceType")
      .notEmpty()
      .withMessage("Service type is required")
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error("Invalid service type ID format");
        }
        return true;
      }),

    body("message")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Message cannot exceed 1000 characters"),
  ];
};

exports.loginValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ];
};

exports.bookingFormValidation = () => {
  return [
    // DEBUG: Temporarily disable menu validation to isolate the issue
    body("menu").custom((value, { req }) => {
      if (req.body.isCustomOrder) {
        // For custom orders, just check if menu object exists
        if (!value) {
          throw new Error("Menu object is required");
        }

        // Check location for custom orders
        if (!value.locationId) {
          console.log("Missing locationId in menu:", value);
          throw new Error("Location is required for custom orders");
        }
      } else {
        // For regular orders
        if (!value || !value.menuId) {
          throw new Error("Menu ID is required for regular orders");
        }
      }

      return true;
    }),

    // Customer details validation
    body("customerDetails.name")
      .notEmpty()
      .withMessage("Name is required")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),

    body("customerDetails.email")
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),

    body("customerDetails.phone")
      .notEmpty()
      .withMessage("Contact number is required")
      .isLength({ min: 10, max: 15 })
      .withMessage("Contact number must be between 10-15 digits")
      .matches(/^[0-9+\-\s()]+$/)
      .withMessage("Contact number contains invalid characters"),

    body("customerDetails.specialInstructions")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Special instructions cannot exceed 1000 characters"),

    // People count validation
    body("peopleCount")
      .isInt({ min: 1, max: 1000 })
      .withMessage("Number of people must be between 1 and 1000"),

    // Delivery type validation
    body("deliveryType")
      .isIn(["Pickup", "Delivery"])
      .withMessage("Delivery type must be either Pickup or Delivery"),

    // Delivery date validation
    body("deliveryDate")
      .notEmpty()
      .withMessage("Delivery date is required")
      .isISO8601()
      .withMessage("Invalid date format")
      .custom((value) => {
        const now = new Date();
        const deliveryDate = new Date(value);

        if (deliveryDate <= now) {
          throw new Error("Delivery date must be in the future");
        }

        // Check if it's Monday (0 = Sunday, 1 = Monday)
        if (deliveryDate.getDay() === 1) {
          throw new Error("Delivery and pickup are not available on Mondays");
        }

        return true;
      }),

    // Address validation (conditional for delivery)
    body("address.street")
      .if(body("deliveryType").equals("Delivery"))
      .notEmpty()
      .withMessage("Street address is required for delivery")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Street address must be between 1 and 200 characters"),

    body("address.suburb")
      .if(body("deliveryType").equals("Delivery"))
      .notEmpty()
      .withMessage("Suburb is required for delivery")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Suburb must be between 1 and 100 characters"),

    body("address.postcode")
      .if(body("deliveryType").equals("Delivery"))
      .notEmpty()
      .withMessage("Postcode is required for delivery")
      .trim()
      .isLength({ min: 3, max: 10 })
      .withMessage("Postcode must be between 3 and 10 characters"),

    body("address.state")
      .if(body("deliveryType").equals("Delivery"))
      .notEmpty()
      .withMessage("State is required for delivery")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("State is required for delivery"),

    // Pricing validation
    body("pricing.total")
      .isFloat({ min: 0 })
      .withMessage("Total price must be a positive number"),

    // Selected items validation
    body("selectedItems")
      .isArray()
      .withMessage("Selected items must be an array")
      .custom((value, { req }) => {
        if (req.body.isCustomOrder && (!value || value.length === 0)) {
          throw new Error(
            "At least one item must be selected for custom orders"
          );
        }
        return true;
      }),

    // Custom order flag validation
    body("isCustomOrder")
      .optional()
      .isBoolean()
      .withMessage("isCustomOrder must be a boolean value"),
  ];
};
