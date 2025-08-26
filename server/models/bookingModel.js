const mongoose = require("mongoose");

// Schema for selected items with full details embedded (no references)
const selectedItemSchema = new mongoose.Schema(
  {
    // Item details (copied from source)
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },

    // Price information
    pricePerPerson: {
      type: Number,
      default: 0,
      min: 0,
    },
    pricePerOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Item classification
    category: {
      type: String,
      enum: [
        "entree",
        "mains",
        "desserts",
        "sides",
        "beverages",
        "addons",
        "package",
        "choices",
        "options",
      ],
      required: true,
    },

    type: {
      type: String,
      enum: ["included", "selected", "addon", "package", "choice", "option"],
      required: true,
    },

    // Quantity and details
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    groupName: {
      type: String,
      default: "",
    },

    // Dietary information (copied from source)
    isVegetarian: {
      type: Boolean,
      default: false,
    },
    isVegan: {
      type: Boolean,
      default: false,
    },
    allergens: {
      type: [String],
      default: [],
    },

    // Special notes
    notes: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

// Customer details schema
const customerDetailsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    specialInstructions: {
      type: String,
      default: "",
    },
    dietaryRequirements: {
      type: [String],
      enum: ["vegetarian", "vegan", "gluten-free", "halal-friendly"],
      default: [],
    },
    spiceLevel: {
      type: String,
      enum: ["mild", "medium", "hot", "extra-hot"],
      default: "medium",
    },
  },
  { _id: false }
);

// Address schema
const addressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      required: function () {
        return this.parent().deliveryType === "Delivery";
      },
      trim: true,
    },
    suburb: {
      type: String,
      required: function () {
        return this.parent().deliveryType === "Delivery";
      },
      trim: true,
    },
    postcode: {
      type: String,
      required: function () {
        return this.parent().deliveryType === "Delivery";
      },
      trim: true,
    },
    state: {
      type: String,
      required: function () {
        return this.parent().deliveryType === "Delivery";
      },
      trim: true,
    },
    country: {
      type: String,
      default: "Australia",
    },
  },
  { _id: false }
);

// Pricing schema
const pricingSchema = new mongoose.Schema(
  {
    basePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    modifierPrice: {
      type: Number,
      default: 0,
    },
    itemsPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    addonsPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

// Order source schema
const orderSourceSchema = new mongoose.Schema(
  {
    sourceType: {
      type: String,
      enum: ["menu", "customOrder"],
      required: true,
    },

    // Source ID (Menu ID or CustomOrder ID)
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // Source name (copied for reference)
    sourceName: {
      type: String,
      required: true,
    },

    basePrice: {
      type: Number,
      default: 0,
    },

    // Location and service info (copied for reference)
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    locationName: {
      type: String,
      required: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    serviceName: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// Main Booking Schema
const bookingSchema = new mongoose.Schema(
  {
    // Auto-generated booking reference
    bookingReference: {
      type: String,
      unique: true,
    },

    // Order source (Menu or CustomOrder)
    orderSource: {
      type: orderSourceSchema,
      required: true,
    },

    // Customer information
    customerDetails: {
      type: customerDetailsSchema,
      required: true,
    },

    // Order details
    peopleCount: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
    },

    // All selected items with full details (no references)
    selectedItems: [selectedItemSchema],

    // Pricing breakdown
    pricing: {
      type: pricingSchema,
      required: true,
    },

    // Delivery information
    deliveryType: {
      type: String,
      enum: ["Pickup", "Delivery","Event"],
      required: true,
      default: "Pickup",
    },

    deliveryDate: {
      type: Date,
      required: true,
    },

    // Address (only for delivery)
    address: {
      type: addressSchema,
      required: function () {
        return this.deliveryType === "Delivery";
      },
    },

    // Status tracking
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    // Payment information
    paymentStatus: {
      type: String,
      enum: ["pending", "deposit_paid", "fully_paid"],
      default: "pending",
    },

    depositAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Order date
    orderDate: {
      type: Date,
      default: Date.now,
    },

    // Admin fields
    adminNotes: {
      type: String,
      default: "",
    },

    cancellationReason: {
      type: String,
      default: "",
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },

    venueSelection: {
      type: String,
      enum: ["both", "indoor", "outdoor"],
      required: function () {
        return (
          this.orderSource?.sourceType === "menu" && this.isFunction === true
        );
      },
    },

    venueCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Helper field to identify if this booking is for a function
    isFunction: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
bookingSchema.index({ "customerDetails.email": 1 });
bookingSchema.index({ "customerDetails.phone": 1 });
bookingSchema.index({ deliveryDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ "orderSource.locationId": 1 });
bookingSchema.index({ "orderSource.sourceType": 1 });
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ isDeleted: 1 });

// Virtual properties
bookingSchema.virtual("isCustomOrder").get(function () {
  return this.orderSource?.sourceType === "customOrder";
});

bookingSchema.virtual("isMenuOrder").get(function () {
  return this.orderSource?.sourceType === "menu";
});

bookingSchema.virtual("totalItems").get(function () {
  return this.selectedItems?.length || 0;
});

// Pre-save middleware to generate booking reference
bookingSchema.pre("save", async function (next) {
  if (this.isNew && !this.bookingReference) {
    const generateReference = () => {
      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      return `BK${year}${month}${day}${random}`;
    };

    let reference = generateReference();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const existing = await this.constructor.findOne({
        bookingReference: reference,
      });

      if (!existing) {
        isUnique = true;
      } else {
        reference = generateReference();
        attempts++;
      }
    }

    if (!isUnique) {
      return next(new Error("Could not generate unique booking reference"));
    }

    this.bookingReference = reference;
  }

  // Validation
  if (!this.orderSource.sourceId) {
    return next(new Error("Source ID is required"));
  }

  if (!this.selectedItems || this.selectedItems.length === 0) {
    return next(new Error("At least one item must be selected"));
  }

  next();
});

// Static methods for analytics
bookingSchema.statics.getBookingStats = function (
  locationId = null,
  startDate = null,
  endDate = null
) {
  const matchQuery = { isDeleted: false };

  if (locationId) {
    matchQuery["orderSource.locationId"] = new mongoose.Types.ObjectId(
      locationId
    );
  }

  if (startDate && endDate) {
    matchQuery.orderDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: "$pricing.total" },
        totalPeople: { $sum: "$peopleCount" },
        averageOrderValue: { $avg: "$pricing.total" },
        customOrders: {
          $sum: {
            $cond: [{ $eq: ["$orderSource.sourceType", "customOrder"] }, 1, 0],
          },
        },
        menuOrders: {
          $sum: { $cond: [{ $eq: ["$orderSource.sourceType", "menu"] }, 1, 0] },
        },
      },
    },
  ]);
};

// Instance method to get items by category
bookingSchema.methods.getItemsByCategory = function () {
  const itemsByCategory = {};

  this.selectedItems.forEach((item) => {
    if (!itemsByCategory[item.category]) {
      itemsByCategory[item.category] = [];
    }
    itemsByCategory[item.category].push(item);
  });

  return itemsByCategory;
};

bookingSchema.set("toJSON", { virtuals: true });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
