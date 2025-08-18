const mongoose = require("mongoose");

// Schema for selected menu items
const selectedItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: function () {
        // Only require itemId if _id is not present (for backwards compatibility)
        return !this._id;
      },
    },
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ["entree", "mains", "desserts", "addons"],
      required: true,
    },
    type: {
      type: String,
      enum: ["included", "selected", "addon"],
      required: true,
    },
    groupName: String,
    isVegetarian: {
      type: Boolean,
      default: false,
    },
    isVegan: {
      type: Boolean,
      default: false,
    },
    allergens: [String],
    pricePerPerson: Number, // For addons
    totalPrice: Number, // For addons
  },
  { _id: false }
);

// Schema for customer details
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
      trim: true,
    },
  },
  { _id: false }
);

// Schema for delivery/pickup address
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
      trim: true,
    },
  },
  { _id: false }
);

// Schema for pricing breakdown
const pricingSchema = new mongoose.Schema(
  {
    basePrice: {
      type: Number,
      required: true,
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

// Updated menuInfoSchema to properly handle custom orders
const menuInfoSchema = new mongoose.Schema(
  {
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
      required: false, // Make it optional, we'll validate in pre-save hook
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: false, // Make it optional, we'll validate in pre-save hook
      default: null,
    },
    serviceName: String,
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true, // Location is always required
    },
    locationName: String,
  },
  { _id: false }
);

// Main booking schema with custom order support
const bookingSchema = new mongoose.Schema(
  {
    // Booking reference number (auto-generated)
    bookingReference: {
      type: String,
      unique: true,
    },

    // Menu information
    menu: {
      type: menuInfoSchema,
      required: true,
    },

    // Custom order flag
    isCustomOrder: {
      type: Boolean,
      default: false,
    },

    // Customer information
    customerDetails: {
      type: customerDetailsSchema,
      required: true,
    },

    // Number of people
    peopleCount: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
    },

    // Selected menu items
    selectedItems: [selectedItemSchema],

    // Pricing information
    pricing: {
      type: pricingSchema,
      required: true,
    },

    // Delivery information
    deliveryType: {
      type: String,
      enum: ["Pickup", "Delivery"],
      required: true,
      default: "Pickup",
    },

    deliveryDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          // Check if delivery date is not on Monday (0 = Sunday, 1 = Monday)
          return v.getDay() !== 1;
        },
        message: "Delivery and pickup are not available on Mondays",
      },
    },

    // Address (only for delivery)
    address: {
      type: addressSchema,
      required: function () {
        return this.deliveryType === "Delivery";
      },
    },

    // Booking status
    status: {
      type: String,
      enum: [
        "pending", // Initial booking submitted
        "confirmed", // Booking confirmed by admin
        "preparing", // Order being prepared
        "ready", // Ready for pickup/delivery
        "completed", // Order completed
        "cancelled", // Order cancelled by admin
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

    // Admin notes and cancellation reason
    adminNotes: {
      type: String,
      trim: true,
    },

    cancellationReason: {
      type: String,
      trim: true,
    },

    // For soft deletes
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Updated indexes to handle custom orders
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ "customerDetails.email": 1 });
bookingSchema.index({ "customerDetails.phone": 1 });
bookingSchema.index({ deliveryDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ orderDate: 1 });
bookingSchema.index({ "menu.locationId": 1 });
bookingSchema.index({ "menu.serviceId": 1 });
bookingSchema.index({ isCustomOrder: 1 });
bookingSchema.index({ isDeleted: 1 });

// Pre-save middleware to generate booking reference and validate custom orders
bookingSchema.pre("save", async function (next) {
  // Generate booking reference if new
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
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const existingBooking = await this.constructor.findOne({
        bookingReference: reference,
      });

      if (!existingBooking) {
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

  // Custom validation for menu fields based on order type
  if (this.isCustomOrder) {
    // For custom orders, menuId should be null
    if (this.menu.menuId !== null && this.menu.menuId !== undefined) {
      this.menu.menuId = null;
    }

    // For custom orders, serviceId can be null or a valid ObjectId
    // Location is always required and already validated by schema

    // Ensure at least one item is selected for custom orders
    if (!this.selectedItems || this.selectedItems.length === 0) {
      return next(
        new Error("At least one item must be selected for custom orders")
      );
    }
  } else {
    // For regular orders, menuId is required
    if (!this.menu.menuId) {
      return next(new Error("Menu ID is required for regular orders"));
    }

    // For regular orders, serviceId is required
    if (!this.menu.serviceId) {
      return next(new Error("Service ID is required for regular orders"));
    }
  }

  // Fix selectedItems - set itemId from _id if available
  if (this.selectedItems && this.selectedItems.length > 0) {
    this.selectedItems.forEach((item) => {
      if (item._id && !item.itemId) {
        item.itemId = item._id;
      }
    });
  }

  next();
});

// Static methods for admin dashboard
bookingSchema.statics.getBookingStats = function (
  locationId = null,
  startDate = null,
  endDate = null
) {
  const matchQuery = { isDeleted: false };

  if (locationId) {
    matchQuery["menu.locationId"] = new mongoose.Types.ObjectId(locationId);
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
          $sum: { $cond: [{ $eq: ["$isCustomOrder", true] }, 1, 0] },
        },
        regularOrders: {
          $sum: { $cond: [{ $eq: ["$isCustomOrder", false] }, 1, 0] },
        },
        statusCounts: {
          $push: "$status",
        },
      },
    },
    {
      $project: {
        totalBookings: 1,
        totalRevenue: 1,
        totalPeople: 1,
        averageOrderValue: { $round: ["$averageOrderValue", 2] },
        customOrders: 1,
        regularOrders: 1,
        statusCounts: {
          $reduce: {
            input: "$statusCounts",
            initialValue: {},
            in: {
              $mergeObjects: [
                "$$value",
                {
                  $arrayToObject: [
                    [
                      {
                        k: "$$this",
                        v: {
                          $add: [
                            {
                              $ifNull: [
                                {
                                  $getField: {
                                    field: "$$this",
                                    input: "$$value",
                                  },
                                },
                                0,
                              ],
                            },
                            1,
                          ],
                        },
                      },
                    ],
                  ],
                },
              ],
            },
          },
        },
      },
    },
  ]);
};

// Virtual for formatted booking reference
bookingSchema.virtual("formattedReference").get(function () {
  return this.bookingReference;
});

// Ensure virtual fields are serialized
bookingSchema.set("toJSON", { virtuals: true });
bookingSchema.set("toObject", { virtuals: true });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
