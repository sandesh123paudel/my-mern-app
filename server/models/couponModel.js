const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
     
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    usageLimit: {
      type: Number,
      required: true,
      min: 1,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Location restrictions
    applicableLocations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Location",
      },
    ],

    // Service restrictions
    applicableServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
couponSchema.index({ code: 1 });
couponSchema.index({ expiryDate: 1 });
couponSchema.index({ isActive: 1 });

// Virtual properties
couponSchema.virtual("isExpired").get(function () {
  return new Date() > this.expiryDate;
});

couponSchema.virtual("isValid").get(function () {
  const now = new Date();
  return (
    this.isActive && now <= this.expiryDate && this.usedCount < this.usageLimit
  );
});

couponSchema.virtual("remainingUses").get(function () {
  return Math.max(0, this.usageLimit - this.usedCount);
});

// Instance methods
couponSchema.methods.canBeUsedForOrder = function (locationId, serviceId) {
  if (!this.isValid) return false;

  // Check location restrictions
  if (this.applicableLocations.length > 0 && locationId) {
    const isLocationValid = this.applicableLocations.some(
      (loc) => loc.toString() === locationId.toString()
    );
    if (!isLocationValid) return false;
  }

  // Check service restrictions
  if (this.applicableServices.length > 0 && serviceId) {
    const isServiceValid = this.applicableServices.some(
      (srv) => srv.toString() === serviceId.toString()
    );
    if (!isServiceValid) return false;
  }

  return true;
};

couponSchema.methods.calculateDiscount = function (orderTotal) {
  if (!this.isValid) return 0;
  return (orderTotal * this.discountPercentage) / 100;
};

couponSchema.methods.incrementUsage = function () {
  this.usedCount += 1;
  return this.save();
};

// Static methods
couponSchema.statics.findValidCoupon = function (code) {
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
    expiryDate: { $gte: new Date() },
    $expr: { $lt: ["$usedCount", "$usageLimit"] },
  });
};

couponSchema.set("toJSON", { virtuals: true });

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
