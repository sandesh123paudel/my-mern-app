import mongoose from "mongoose";
import Service from "../models/ServiceModel.js";
import Menu from "../models/MenusModel.js";
import Location from "../models/LocationModel.js";

// @desc    Get all active services
// @route   GET /api/services
// @access  Public
export const getServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true })
      .populate("locationId", "name city")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      message: "Services fetched successfully",
      data: services,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Get active services by location ID
// @route   GET /api/services/location/:locationId
// @access  Public
export const getServicesByLocation = async (req, res) => {
  const { locationId } = req.params;

  // Check for valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(locationId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Location ID format",
    });
  }

  try {
    const services = await Service.find({
      locationId,
      isActive: true,
    }).populate("locationId", "name city");
    const location = await Location.findById(locationId);
    const name = location.name;

    return res.json({
      success: true,
      message: `Services for location ${name} fetched successfully`,
      data: services,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Get a single service with its active menus
// @route   GET /api/services/:id
// @access  Public
export const getServiceById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Service ID format" });
  }

  try {
    const service = await Service.findById(id).populate(
      "locationId",
      "name city"
    );
    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    const menus = await Menu.find({ serviceId: id, isActive: true });

    return res.json({
      success: true,
      message: "Service and menus fetched successfully",
      data: { service, menus },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new service
// @route   POST /api/services
// @access  Private/Admin
export const createService = async (req, res) => {
  const { name, locationId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(locationId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Location ID format" });
  }

  try {
    const location = await Location.findById(locationId);
    if (!location || !location.isActive) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or inactive location" });
    }

    const existingService = await Service.findOne({ name, locationId });
    if (existingService) {
      return res.status(400).json({
        success: false,
        message: "A service with this name already exists at this location",
      });
    }

    const service = new Service(req.body);
    const savedService = await service.save();
    await savedService.populate("locationId", "name city");

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: savedService,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private/Admin
export const updateService = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Service ID format" });
  }

  try {
    if (req.body.locationId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.locationId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Location ID format provided in body",
        });
      }
      const location = await Location.findById(req.body.locationId);
      if (!location || !location.isActive) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or inactive location" });
      }
    }

    const updatedService = await Service.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate("locationId", "name city");

    if (!updatedService) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    res.json({
      success: true,
      message: "Service updated successfully",
      data: updatedService,
    });
  } catch (error) {
    if (error.code === 11000) {
      // Handle potential duplicate name on update
      return res.status(400).json({
        success: false,
        message: "A service with this name already exists at this location",
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Deactivate a service (soft delete)
// @route   DELETE /api/services/:id
// @access  Private/Admin
export const deleteService = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Service ID format" });
  }

  try {
    const activeMenus = await Menu.findOne({ serviceId: id, isActive: true });
    if (activeMenus) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot deactivate service with active menus. Please deactivate menus first.",
      });
    }

    const service = await Service.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    res.json({ success: true, message: "Service deactivated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
