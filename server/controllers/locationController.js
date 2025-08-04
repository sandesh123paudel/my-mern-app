import Location from "../models/LocationModel.js";
import Service from "../models/ServiceModel.js";

// Get All Active Locations
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
      message: error.message,
    });
  }
};

// Get Single Location with Active Services
export const getLocationById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "No ID provided",
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
      message: error.message,
    });
  }
};

//POST -- Create a new Location
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
        message: "Duplicate entry: location with this name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

//PUT -- Update the existing location
export const updateLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, {
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
    return res.status(400).json({
      success: false,
      message: error.message || "Invalid update operation",
    });
  }
};

//DELETE location (soft delete - set isActive to false)
export const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if location has active services
    const activeServices = await Service.find({
      locationId: id,
      isActive: true,
    });

    if (activeServices.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete location with active services. Please deactivate services first.",
      });
    }

    // Soft delete by setting isActive: false
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
      data: location,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
