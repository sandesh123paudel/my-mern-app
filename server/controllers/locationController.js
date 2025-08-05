import mongoose from "mongoose";
import Location from "../models/LocationModel.js";
import Service from "../models/ServiceModel.js";

// @desc    Get all active locations
// @route   GET /api/locations
// @access  Public
export const getLocations = async (req, res) => {
  try {
    const locations = await Location.find({ isActive: true }).sort({
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
export const getLocationById = async (req, res) => {
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
export const createLocation = async (req, res) => {
  try {
    const { name, city } = req.body;

    if (!name || !city) {
      return res.status(400).json({
        success: false,
        message: "Name and city are required fields",
      });
    }

    const existingLocation = await Location.findOne({ name, city });
    if (existingLocation) {
      return res.status(400).json({
        success: false,
        message: "A location with this name already exists in this city",
      });
    }

    const location = new Location(req.body);
    const savedLocation = await location.save();

    return res.status(201).json({
      success: true,
      message: "Location created successfully",
      data: savedLocation,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A location with this name and city combination already exists.",
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// @desc    Update an existing location
// @route   PUT /api/locations/:id
// @access  Private/Admin
export const updateLocation = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Location ID format",
    });
  }

  try {
    const location = await Location.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

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
    return res.status(400).json({
      success: false,
      message: error.message || "Invalid update operation",
    });
  }
};

// @desc    Deactivate a location (soft delete)
// @route   DELETE /api/locations/:id
// @access  Private/Admin
export const deleteLocation = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Location ID format",
    });
  }

  try {
    // More efficient check: stop after finding one active service
    const hasActiveServices = await Service.findOne({
      locationId: id,
      isActive: true,
    });

    if (hasActiveServices) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot deactivate location with active services. Please deactivate services first.",
      });
    }

    const location = await Location.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    return res.json({
      success: true,
      message: "Location deactivated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
