const mongoose = require("mongoose");

// Bank details schema
const bankDetailsSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    bsb: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^\d{6}$/.test(v); // BSB should be 6 digits
        },
        message: 'BSB should be 6 digits'
      }
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^\d{6,10}$/.test(v); // Account number should be 6-10 digits
        },
        message: 'Account number should be 6-10 digits'
      }
    },
    reference: {
      type: String,
      trim: true,
      default: '', // Optional reference for payments
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  { _id: false }
);

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
    bankDetails: {
      type: bankDetailsSchema,
      required: false, // Make it optional initially
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
locationSchema.index({ name: 1, city: 1 });
locationSchema.index({ isActive: 1 });

// Virtual to get formatted bank details for display
locationSchema.virtual('formattedBankDetails').get(function() {
  if (!this.bankDetails || !this.bankDetails.isActive) {
    return null;
  }
  
  return {
    bankName: this.bankDetails.bankName,
    accountName: this.bankDetails.accountName,
    bsb: this.bankDetails.bsb,
    accountNumber: this.bankDetails.accountNumber,
    reference: this.bankDetails.reference || this.name, // Use location name as default reference
  };
});

// Method to check if bank details are complete
locationSchema.methods.hasBankDetails = function() {
  return !!(
    this.bankDetails &&
    this.bankDetails.isActive &&
    this.bankDetails.bankName &&
    this.bankDetails.accountName &&
    this.bankDetails.bsb &&
    this.bankDetails.accountNumber
  );
};

// Static method to get locations with bank details
locationSchema.statics.getLocationsWithBankDetails = function() {
  return this.find({
    isActive: true,
    'bankDetails.isActive': true,
    'bankDetails.bankName': { $exists: true, $ne: '' },
    'bankDetails.accountName': { $exists: true, $ne: '' },
    'bankDetails.bsb': { $exists: true, $ne: '' },
    'bankDetails.accountNumber': { $exists: true, $ne: '' },
  });
};

// Ensure virtual fields are serialized
locationSchema.set('toJSON', { virtuals: true });
locationSchema.set('toObject', { virtuals: true });

const Location = mongoose.model("Location", locationSchema);
module.exports = Location;