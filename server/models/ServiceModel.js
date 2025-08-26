const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true,
    },

    // NEW FIELDS FOR VENUE OPTIONS
    isFunction: {
      type: Boolean,
      default: false,
    },
    venueOptions: {
      both: {
        available: {
          type: Boolean,
          default: false,
        },
        minPeople: {
          type: Number,
          default: 70,
        },
        maxPeople: {
          type: Number,
          default: 120,
        },
        venueCharge: {
          type: Number,
          default: 0,
        },
      },
      indoor: {
        available: {
          type: Boolean,
          default: false,
        },
        minPeople: {
          type: Number,
          default: 35,
        },
        maxPeople: {
          type: Number,
          default: 60,
        },
        venueCharge: {
          type: Number,
          default: 0,
        },
      },
      outdoor: {
        available: {
          type: Boolean,
          default: false,
        },
        minPeople: {
          type: Number,
          default: 20,
        },
        maxPeople: {
          type: Number,
          default: 90,
        },
        venueCharge: {
          type: Number,
          default: 200, // Below 35 people
        },
        chargeThreshold: {
          type: Number,
          default: 35, // Charge applies below this number
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique service names per location
serviceSchema.index({ name: 1, locationId: 1 }, { unique: true });

// Check if model already exists before creating it
const Service =
  mongoose.models.Service || mongoose.model("Service", serviceSchema);

module.exports = Service;
