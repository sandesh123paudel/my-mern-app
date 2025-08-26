const mongoose = require("mongoose");
const Menu = require("../models/menusModel.js");
const Location = require("../models/locationModel.js");
const Service = require("../models/serviceModel.js");

const validateVenueOptions = (venueOptions, isFunction) => {
  if (!isFunction) return true; // Skip validation for non-function services

  if (!venueOptions) {
    throw new Error("Venue options are required for function services");
  }

  // Validate that at least one venue option is available
  const hasAvailableVenue =
    venueOptions.both?.available ||
    venueOptions.indoor?.available ||
    venueOptions.outdoor?.available;

  if (!hasAvailableVenue) {
    throw new Error(
      "At least one venue option must be available for function services"
    );
  }

  return true;
};

// @desc    Get all active services
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const services = await Service.find()
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
const getServicesByLocation = async (req, res) => {
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
const getServiceById = async (req, res) => {
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
const createService = async (req, res) => {
  const { name, locationId, isFunction, venueOptions } = req.body;

  if (!mongoose.Types.ObjectId.isValid(locationId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Location ID format" });
  }

  try {
    // Check for any service with this name/location, active or not
    const existingService = await Service.findOne({ name, locationId });

    if (existingService) {
      // If it's already active, it's a true duplicate
      if (existingService.isActive) {
        return res.status(400).json({
          success: false,
          message:
            "An active service with this name already exists at this location",
        });
      } else {
        // If it's inactive, re-activate it and return
        existingService.isActive = true;
        // You might want to update other fields from req.body as well
        Object.assign(existingService, req.body);
        const reactivatedService = await existingService.save();
        await reactivatedService.populate("locationId", "name city");
        return res.status(200).json({
          success: true,
          message: "Existing inactive service has been reactivated.",
          data: reactivatedService,
        });
      }
    }

    // If no service exists at all, create a new one
    const location = await Location.findById(locationId);
    if (!location || !location.isActive) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or inactive location" });
    }
    if (isFunction) {
      validateVenueOptions(venueOptions, isFunction);
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
const updateService = async (req, res) => {
  const { id } = req.params;
  const { isFunction, venueOptions } = req.body;

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
    if (
      isFunction ||
      (req.body.isFunction !== undefined && req.body.isFunction)
    ) {
      validateVenueOptions(venueOptions, isFunction);
    }

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
const deleteService = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Service ID format" });
  }

  try {
    // Check for active menus before attempting to delete
    const activeMenus = await Menu.findOne({ serviceId: id, isActive: true });
    if (activeMenus) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete service with active menus. Please deactivate or delete menus first.",
      });
    }

    // If no active menus exist, proceed with the hard delete
    const service = await Service.findByIdAndDelete(id);

    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    res.json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getServices,
  getServicesByLocation,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
