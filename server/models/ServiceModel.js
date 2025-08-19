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
