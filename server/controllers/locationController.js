const mongoose = require("mongoose");

const Service = require("../models/ServiceModel.js");
const Location = require("../models/locationModel.js");

// Helper function to validate bank details
const validateBankDetails = (bankDetails) => {
  if (!bankDetails) return { isValid: true, errors: [] };

  const errors = [];

  if (!bankDetails.bankName || bankDetails.bankName.trim() === "") {
    errors.push("Bank name is required");
  }

  if (!bankDetails.accountName || bankDetails.accountName.trim() === "") {
    errors.push("Account name is required");
  }

  if (!bankDetails.bsb || !/^\d{6}$/.test(bankDetails.bsb)) {
    errors.push("BSB must be exactly 6 digits");
  }

  if (
    !bankDetails.accountNumber ||
    !/^\d{6,10}$/.test(bankDetails.accountNumber)
  ) {
    errors.push("Account number must be 6-10 digits");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// @desc    Get all active locations
// @route   GET /api/locations
// @access  Public
const getLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({
      createdAt: -1,
    });
    return res.json({
      success: true,
      message: "Locations fetched successfully",
      data: locations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Get a single location with its active services
// @route   GET /api/locations/:id
// @access  Public
const getLocationById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Location ID format",
    });
  }

  try {
    const location = await Location.findById(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    const services = await Service.find({
      locationId: id,
      isActive: true,
    });

    return res.json({
      success: true,
      message: "Location and services fetched successfully",
      data: {
        ...location.toObject(),
        services,
        hasBankDetails: location.hasBankDetails(), // Include bank details status
        formattedBankDetails: location.formattedBankDetails, // Include formatted bank details
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Create a new location
// @route   POST /api/locations
// @access  Private/Admin
const createLocation = async (req, res) => {
  try {
    const { name, city, bankDetails, ...otherData } = req.body;

    if (!name || !city) {
      return res.status(400).json({
        success: false,
        message: "Name and city are required fields.",
      });
    }

    // Validate bank details if provided
    if (bankDetails) {
      const validation = validateBankDetails(bankDetails);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid bank details",
          errors: validation.errors,
        });
      }
    }

    const existingLocation = await Location.findOne({ name, city });

    if (existingLocation) {
      if (existingLocation.status === "inactive") {
        // Reactivate the inactive location
        existingLocation.status = "active";

        // Update bank details if provided
        if (bankDetails) {
          existingLocation.bankDetails = {
            ...bankDetails,
            isActive:
              bankDetails.isActive !== undefined ? bankDetails.isActive : true,
          };
        }

        // Update other fields
        Object.assign(existingLocation, otherData);

        const updatedLocation = await existingLocation.save();

        return res.status(200).json({
          success: true,
          message: "Location reactivated successfully.",
          data: updatedLocation,
        });
      } else {
        // Location already exists and is active
        return res.status(400).json({
          success: false,
          message: "A location with this name already exists in this city.",
        });
      }
    }

    // Prepare location data
    const locationData = {
      name,
      city,
      ...otherData,
    };

    // Add bank details if provided
    if (bankDetails) {
      locationData.bankDetails = {
        ...bankDetails,
        isActive:
          bankDetails.isActive !== undefined ? bankDetails.isActive : true,
      };
    }

    // No existing location found, create a new one
    const location = new Location(locationData);
    const savedLocation = await location.save();

    return res.status(201).json({
      success: true,
      message: "Location created successfully.",
      data: savedLocation,
    });
  } catch (error) {
    // Handle specific Mongoose duplicate key error (if not already handled)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A location with this name and city combination already exists.",
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error.",
    });
  }
};

// @desc    Update an existing location
// @route   PUT /api/locations/:id
// @access  Private/Admin
const updateLocation = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Location ID format",
    });
  }

  try {
    const { bankDetails, ...otherData } = req.body;

    // Validate bank details if provided
    if (bankDetails) {
      const validation = validateBankDetails(bankDetails);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid bank details",
          errors: validation.errors,
        });
      }
    }

    // Find the existing location
    const existingLocation = await Location.findById(id);
    if (!existingLocation) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    // Prepare update data
    const updateData = { ...otherData };

    // Handle bank details update
    if (bankDetails) {
      updateData.bankDetails = {
        ...bankDetails,
        isActive:
          bankDetails.isActive !== undefined ? bankDetails.isActive : true,
      };
    }

    const location = await Location.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.json({
      success: true,
      message: "Location updated successfully",
      data: location,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A location with this name and city combination already exists.",
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Invalid update operation",
    });
  }
};

// @desc    Update bank details for a location
// @route   PATCH /api/locations/:id/bank-details
// @access  Private/Admin
const updateLocationBankDetails = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Location ID format",
    });
  }

  try {
    const { bankDetails } = req.body;

    if (!bankDetails) {
      return res.status(400).json({
        success: false,
        message: "Bank details are required",
      });
    }

    // Validate bank details
    const validation = validateBankDetails(bankDetails);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid bank details",
        errors: validation.errors,
      });
    }

    const location = await Location.findByIdAndUpdate(
      id,
      {
        bankDetails: {
          ...bankDetails,
          isActive:
            bankDetails.isActive !== undefined ? bankDetails.isActive : true,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    return res.json({
      success: true,
      message: "Bank details updated successfully",
      data: {
        location,
        hasBankDetails: location.hasBankDetails(),
        formattedBankDetails: location.formattedBankDetails,
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Get bank details for a location
// @route   GET /api/locations/:id/bank-details
// @access  Private/Admin
const getLocationBankDetails = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Location ID format",
    });
  }

  try {
    const location = await Location.findById(id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    return res.json({
      success: true,
      message: "Bank details retrieved successfully",
      data: {
        locationName: location.name,
        hasBankDetails: location.hasBankDetails(),
        bankDetails: location.bankDetails || null,
        formattedBankDetails: location.formattedBankDetails,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Get all locations with bank details status
// @route   GET /api/locations/with-bank-details
// @access  Private/Admin
const getLocationsWithBankDetailsStatus = async (req, res) => {
  try {
    const locations = await Location.find({ isActive: true }).sort({
      createdAt: -1,
    });

    const locationsWithStatus = locations.map((location) => ({
      ...location.toObject(),
      hasBankDetails: location.hasBankDetails(),
      formattedBankDetails: location.formattedBankDetails,
    }));

    return res.json({
      success: true,
      message: "Locations with bank details status fetched successfully",
      data: locationsWithStatus,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Deactivate a location (soft delete)
// @route   DELETE /api/locations/:id
// @access  Private/Admin
const deleteLocation = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Location ID format",
    });
  }

  try {
    // Check for active services before attempting to delete
    const hasActiveServices = await Service.findOne({
      locationId: id,
      isActive: true,
    });

    if (hasActiveServices) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete location with active services. Please deactivate or delete services first.",
      });
    }

    // If no active services exist, proceed with the hard delete
    const location = await Location.findByIdAndDelete(id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    return res.json({
      success: true,
      message: "Location deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

module.exports = {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  updateLocationBankDetails,
  getLocationBankDetails,
  getLocationsWithBankDetailsStatus,
  deleteLocation,
};
