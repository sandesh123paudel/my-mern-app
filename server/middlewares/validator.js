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
    // Order source validation
    body("orderSource").custom((value, { req }) => {
      if (!value) {
        throw new Error("Order source information is required");
      }

      // Check source type
      if (
        !value.sourceType ||
        !["menu", "customOrder"].includes(value.sourceType)
      ) {
        throw new Error("Source type must be either 'menu' or 'customOrder'");
      }

      // Check source ID
      if (!value.sourceId) {
        throw new Error("Source ID is required");
      }

      // Check location and service info
      if (!value.locationId) {
        throw new Error("Location ID is required");
      }

      if (!value.serviceId) {
        throw new Error("Service ID is required");
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

    // Simple dietary requirements validation
    body("customerDetails.dietaryRequirements")
      .optional()
      .isArray()
      .withMessage("Dietary requirements must be an array")
      .custom((value) => {
        if (value && value.length > 0) {
          const validRequirements = [
            "vegetarian",
            "vegan",
            "gluten-free",
            "halal-friendly",
          ];
          const invalidRequirements = value.filter(
            (req) => !validRequirements.includes(req)
          );
          if (invalidRequirements.length > 0) {
            throw new Error(
              `Invalid dietary requirements: ${invalidRequirements.join(", ")}`
            );
          }
        }
        return true;
      }),

    body("customerDetails.spiceLevel")
      .optional()
      .isIn(["mild", "medium", "hot", "extra-hot"])
      .withMessage("Spice level must be one of: mild, medium, hot, extra-hot"),

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
      .isArray({ min: 1 })
      .withMessage("At least one item must be selected")
      .custom((items) => {
        // Validate each item structure
        items.forEach((item, index) => {
          if (!item.name || typeof item.name !== "string") {
            throw new Error(
              `Item ${index + 1}: Name is required and must be a string`
            );
          }

          if (typeof item.totalPrice !== "number" || item.totalPrice < 0) {
            throw new Error(
              `Item ${index + 1}: Total price must be a positive number`
            );
          }

          if (!item.category || typeof item.category !== "string") {
            throw new Error(`Item ${index + 1}: Category is required`);
          }

          if (!item.type || typeof item.type !== "string") {
            throw new Error(`Item ${index + 1}: Type is required`);
          }
        });
        return true;
      }),
  ];
};

// Validation for custom order price calculation
exports.customOrderCalculationValidation = () => {
  return [
    body("selections").isObject().withMessage("Selections must be an object"),

    body("peopleCount")
      .isInt({ min: 1, max: 1000 })
      .withMessage("Number of people must be between 1 and 1000"),
  ];
};

// Validation for booking status updates
exports.bookingStatusValidation = () => {
  return [
    body("status")
      .isIn([
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "completed",
        "cancelled",
      ])
      .withMessage("Invalid status value"),

    body("adminNotes")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Admin notes cannot exceed 1000 characters"),
  ];
};

// Validation for payment status updates
exports.paymentStatusValidation = () => {
  return [
    body("paymentStatus")
      .isIn(["pending", "deposit_paid", "fully_paid"])
      .withMessage("Invalid payment status value"),

    body("depositAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Deposit amount must be a positive number"),
  ];
};

// Validation for booking updates
exports.bookingUpdateValidation = () => {
  return [
    // Customer details (optional updates)
    body("customerDetails.name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),

    body("customerDetails.email")
      .optional()
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),

    body("customerDetails.phone")
      .optional()
      .isLength({ min: 10, max: 15 })
      .withMessage("Contact number must be between 10-15 digits")
      .matches(/^[0-9+\-\s()]+$/)
      .withMessage("Contact number contains invalid characters"),

    body("customerDetails.specialInstructions")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Special instructions cannot exceed 1000 characters"),

    body("customerDetails.dietaryRequirements")
      .optional()
      .isArray()
      .withMessage("Dietary requirements must be an array"),

    body("customerDetails.spiceLevel")
      .optional()
      .isIn(["mild", "medium", "hot", "extra-hot"])
      .withMessage("Invalid spice level"),

    // Other optional fields
    body("peopleCount")
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage("Number of people must be between 1 and 1000"),

    body("deliveryType")
      .optional()
      .isIn(["Pickup", "Delivery"])
      .withMessage("Delivery type must be either Pickup or Delivery"),

    body("deliveryDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid date format"),

    body("adminNotes")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Admin notes cannot exceed 1000 characters"),
  ];
};
