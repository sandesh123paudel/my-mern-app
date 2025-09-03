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

exports.createSuperAdminValidator = () => {
  return [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
  ];
};

// Validation for updating superadmin
exports.updateSuperAdminValidator = () => {
  return [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
  ];
};

// Login validation (existing, but updated)
exports.loginValidator = () => {
  return [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ];
};


// Updated booking form validation to match frontend data structure
exports.bookingFormValidation = () => {
  return [
    // Menu information validation (updated structure)
    body("menu").custom((value, { req }) => {
      if (!value) {
        throw new Error("Menu information is required");
      }

      // For custom orders, menuId can be null
      if (!req.body.isCustomOrder && !value.menuId) {
        throw new Error("Menu ID is required for regular orders");
      }

      // Location is always required
      if (!value.locationId) {
        throw new Error("Location ID is required");
      }

      // For custom orders, serviceId is required
      if (req.body.isCustomOrder && !value.serviceId) {
        throw new Error("Service ID is required for custom orders");
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

    // Dietary requirements validation
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
    // Add this after your existing validations in bookingFormValidation()
    // Venue validation for function services
    body("venueSelection").custom((value, { req }) => {
      // Only validate if this is a function service
      if (req.body.isFunction) {
        if (!value) {
          throw new Error("Venue selection is required for function services");
        }

        const validVenues = ["both", "indoor", "outdoor"];
        if (!validVenues.includes(value)) {
          throw new Error(
            "Venue selection must be one of: both, indoor, outdoor"
          );
        }
      }
      return true;
    }),

    body("venueCharge")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Venue charge must be a positive number"),

    body("isFunction")
      .optional()
      .isBoolean()
      .withMessage("isFunction must be a boolean value"),

    // NEW delivery type validation that handles function services:
    body("deliveryType").custom((value, { req }) => {
      if (req.body.isFunction) {
        // For function services, deliveryType should be "Event"
        if (value !== "Event") {
          throw new Error(
            "Delivery type must be 'Event' for function services"
          );
        }
      } else {
        // For regular services, use existing validation
        const validTypes = ["Pickup", "Delivery"];
        if (!validTypes.includes(value)) {
          throw new Error("Delivery type must be either Pickup or Delivery");
        }
      }
      return true;
    }),

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

        

        return true;
      }),

    body("address.street")
      .if(body("deliveryType").equals("Delivery"))
      .if((value, { req }) => !req.body.isFunction) // Skip for function services
      .notEmpty()
      .withMessage("Street address is required for delivery")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Street address must be between 1 and 200 characters"),

    // Apply the same pattern to other address fields:
    body("address.suburb")
      .if(body("deliveryType").equals("Delivery"))
      .if((value, { req }) => !req.body.isFunction)
      .notEmpty()
      .withMessage("Suburb is required for delivery")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Suburb must be between 1 and 100 characters"),

    body("address.postcode")
      .if(body("deliveryType").equals("Delivery"))
      .if((value, { req }) => !req.body.isFunction)
      .notEmpty()
      .withMessage("Postcode is required for delivery")
      .trim()
      .isLength({ min: 3, max: 10 })
      .withMessage("Postcode must be between 3 and 10 characters"),

    body("address.state")
      .if(body("deliveryType").equals("Delivery"))
      .if((value, { req }) => !req.body.isFunction)
      .notEmpty()
      .withMessage("State is required for delivery")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("State is required for delivery"),

    body("address.country")
      .if(body("deliveryType").equals("Delivery"))
      .if((value, { req }) => !req.body.isFunction)
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Country must be between 1 and 50 characters"),

    // Pricing validation
    // Update your pricing validation to include venue charges:
    body("pricing.total").custom((value, { req }) => {
      if (typeof value !== "number" || value < 0) {
        throw new Error("Total price must be a positive number");
      }

      // For function services, validate that venue charge is included in total if applicable
      if (req.body.isFunction && req.body.venueCharge > 0) {
        const expectedMinimum = req.body.venueCharge;
        if (value < expectedMinimum) {
          throw new Error("Total price should include venue charges");
        }
      }

      return true;
    }),

    body("pricing.basePrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Base price must be a positive number"),

    body("pricing.modifierPrice")
      .optional()
      .isNumeric()
      .withMessage("Modifier price must be a number"),

    body("pricing.itemsPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Items price must be a positive number"),

    body("pricing.addonsPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Addons price must be a positive number"),

    // Selected items validation (more flexible for both menu and custom orders)
    body("selectedItems").custom((items, { req }) => {
      // For custom orders, selectedItems is required
      if (req.body.isCustomOrder) {
        if (!Array.isArray(items) || items.length === 0) {
          throw new Error(
            "At least one item must be selected for custom orders"
          );
        }
      } else {
        // For menu orders, selectedItems can be optional if menuSelections is provided
        if (items && !Array.isArray(items)) {
          throw new Error("Selected items must be an array");
        }
      }

      // If items exist, validate their structure
      if (Array.isArray(items) && items.length > 0) {
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

          // Validate quantity
          if (
            item.quantity &&
            (typeof item.quantity !== "number" || item.quantity < 1)
          ) {
            throw new Error(
              `Item ${index + 1}: Quantity must be a positive number`
            );
          }

          // Validate dietary information
          if (
            item.isVegetarian !== undefined &&
            typeof item.isVegetarian !== "boolean"
          ) {
            throw new Error(
              `Item ${index + 1}: isVegetarian must be a boolean`
            );
          }

          if (item.isVegan !== undefined && typeof item.isVegan !== "boolean") {
            throw new Error(`Item ${index + 1}: isVegan must be a boolean`);
          }

          if (item.allergens && !Array.isArray(item.allergens)) {
            throw new Error(`Item ${index + 1}: allergens must be an array`);
          }
        });
      }

      return true;
    }),

    // Menu selections validation (optional, for menu orders)
    body("menuSelections")
      .optional()
      .isObject()
      .withMessage("Menu selections must be an object"),

    // Custom order flag validation
    body("isCustomOrder")
      .optional()
      .isBoolean()
      .withMessage("isCustomOrder must be a boolean value"),
  ];
};

// Validation for custom order price calculation
exports.customOrderCalculationValidation = () => {
  return [
    body("selections")
      .isObject()
      .withMessage("Selections must be an object")
      .custom((value) => {
        // Validate selections structure for custom orders
        if (value.categories && typeof value.categories !== "object") {
          throw new Error("Categories must be an object");
        }

        if (value.addons && !Array.isArray(value.addons)) {
          throw new Error("Addons must be an array");
        }

        return true;
      }),

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
      .withMessage("Deposit amount must be a positive number")
      .custom((value, { req }) => {
        // If deposit amount is provided, validate it's not greater than total
        if (value && req.body.totalAmount && value > req.body.totalAmount) {
          throw new Error("Deposit amount cannot be greater than total amount");
        }
        return true;
      }),
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
      .withMessage("Invalid spice level"),

    // Other optional fields
    body("peopleCount")
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage("Number of people must be between 1 and 1000"),

    body("deliveryType")
      .optional()
      .isIn(["Pickup", "Delivery", "Event"])
      .withMessage("Delivery type must be either Pickup, Delivery, or Event"),

    body("deliveryDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid date format")
      .custom((value) => {
        if (value) {
          const now = new Date();
          const deliveryDate = new Date(value);

          if (deliveryDate <= now) {
            throw new Error("Delivery date must be in the future");
          }

          // Check if it's Monday
          if (deliveryDate.getDay() === 1) {
            throw new Error("Delivery and pickup are not available on Mondays");
          }

          // Check business hours
          const hours = deliveryDate.getHours();
          if (hours < 11 || hours >= 20) {
            throw new Error(
              "Delivery/pickup time must be between 11 AM and 8 PM"
            );
          }
        }
        return true;
      }),

    body("adminNotes")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Admin notes cannot exceed 1000 characters"),

    // Address validation for delivery updates
    body("address.street")
      .if(body("deliveryType").equals("Delivery"))
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Street address must be between 1 and 200 characters"),

    body("address.suburb")
      .if(body("deliveryType").equals("Delivery"))
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Suburb must be between 1 and 100 characters"),

    body("address.postcode")
      .if(body("deliveryType").equals("Delivery"))
      .optional()
      .trim()
      .isLength({ min: 3, max: 10 })
      .withMessage("Postcode must be between 3 and 10 characters"),

    body("address.state")
      .if(body("deliveryType").equals("Delivery"))
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("State must be between 1 and 50 characters"),

    // Selected items validation for updates
    body("selectedItems")
      .optional()
      .isArray()
      .withMessage("Selected items must be an array")
      .custom((items) => {
        if (items && items.length > 0) {
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
        }
        return true;
      }),

    // Pricing validation for updates
    body("pricing.total")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Total price must be a positive number"),

    body("pricing.basePrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Base price must be a positive number"),

    body("pricing.modifierPrice")
      .optional()
      .isNumeric()
      .withMessage("Modifier price must be a number"),

    body("pricing.addonsPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Addons price must be a positive number"),
  ];
};

// Validation for cancellation
exports.bookingCancellationValidation = () => {
  return [
    body("reason")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Cancellation reason cannot exceed 500 characters"),
  ];
};

// Validation for customer booking lookup
exports.customerLookupValidation = () => {
  return [
    body("email")
      .optional()
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),

    body("phone")
      .optional()
      .isLength({ min: 10, max: 15 })
      .withMessage("Contact number must be between 10-15 digits")
      .matches(/^[0-9+\-\s()]+$/)
      .withMessage("Contact number contains invalid characters"),

    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
  ];
};
