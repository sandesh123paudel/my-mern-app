import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    city: {
      type: String,
      required: true,
    },
    address: String,
    contactInfo: {
      phone: String,
      email: String,
    },
    // Add-ons available for this menu
    addOns: [
      {
        name: {
          type: String,
          required: true,
        },
        description: String,
        price: {
          type: Number,
          required: true,
        },
        pricingType: {
          type: String,
          enum: ["per_piece", "per_plate", "per_order"],
          default: "per_piece",
        },
        category: {
          type: String,
          default: "general", // drinks, extras, sides, etc.
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Location = mongoose.model("Location", locationSchema);
export default Location;
