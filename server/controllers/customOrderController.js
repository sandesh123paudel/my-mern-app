const mongoose = require("mongoose");
const CustomOrder = require("../models/customOrderModel.js");
const Location = require("../models/locationModel.js");
const Service = require("../models/serviceModel.js");

// Helper function to send response
const sendResponse = (res, statusCode, success, message, data = null) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

// Helper function to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// @desc    Create new custom order configuration
// @route   POST /api/custom-orders
// @access  Private (Admin only)
const createCustomOrder = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      description,
      locationId,
      serviceId,
      minPeople,
      maxPeople,
      categories,
      addons,
    } = req.body;

    // Validate location exists
    const location = await Location.findById(locationId);
    if (!location) {
      return sendResponse(res, 404, false, "Location not found");
    }

    // Validate service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return sendResponse(res, 404, false, "Service not found");
    }

    // Check if custom order with same name exists at location
    const existingCustomOrder = await CustomOrder.findOne({
      name,
      locationId,
    });
    if (existingCustomOrder) {
      return sendResponse(
        res,
        400,
        false,
        "Custom order with this name already exists at this location"
      );
    }

    // Create custom order
    const customOrderData = {
      name,
      description: description || "",
      locationId,
      serviceId,
      minPeople: minPeople || 1,
      maxPeople: maxPeople || 100,
      categories: categories || [],
      addons: addons || [],
      createdBy: req.user?.id,
    };

    const customOrder = new CustomOrder(customOrderData);
    const savedCustomOrder = await customOrder.save();

    // Populate references for response
    const populatedCustomOrder = await CustomOrder.findById(
      savedCustomOrder._id
    )
      .populate("locationId", "name city address")
      .populate("serviceId", "name description")
      .populate("createdBy", "name email");

    sendResponse(res, 201, true, "Custom order created successfully", {
      customOrder: populatedCustomOrder,
    });
  } catch (error) {
    console.error("Create custom order error:", error);

    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(
        (err) => err.message
      );
      return sendResponse(res, 400, false, "Validation error", {
        errors: errorMessages,
      });
    }

    sendResponse(res, 500, false, "Failed to create custom order", {
      error: error.message,
    });
  }
});

// @desc    Get all custom orders
// @route   GET /api/custom-orders
// @access  Private (Admin only)
const getAllCustomOrders = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      locationId,
      serviceId,
      isActive,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {};

    if (locationId) {
      query.locationId = locationId;
    }

    if (serviceId) {
      query.serviceId = serviceId;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const [customOrders, totalCount] = await Promise.all([
      CustomOrder.find(query)
        .populate("locationId", "name city address")
        .populate("serviceId", "name description")
        .populate("createdBy", "name email")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      CustomOrder.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    sendResponse(res, 200, true, "Custom orders retrieved successfully", {
      customOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get custom orders error:", error);
    sendResponse(res, 500, false, "Failed to retrieve custom orders", {
      error: error.message,
    });
  }
});

// @desc    Get custom order by ID (Admin)
// @route   GET /api/custom-orders/:id
// @access  Private (Admin only)
const getCustomOrderById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const customOrder = await CustomOrder.findById(id)
      .populate("locationId", "name city address phone email")
      .populate("serviceId", "name description")
      .populate("createdBy", "name email");

    if (!customOrder) {
      return sendResponse(res, 404, false, "Custom order not found");
    }

    sendResponse(res, 200, true, "Custom order retrieved successfully", {
      customOrder,
    });
  } catch (error) {
    console.error("Get custom order error:", error);
    sendResponse(res, 500, false, "Failed to retrieve custom order", {
      error: error.message,
    });
  }
});

// @desc    Update custom order
// @route   PUT /api/custom-orders/:id
// @access  Private (Admin only)
const updateCustomOrder = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      locationId,
      serviceId,
      minPeople,
      maxPeople,
      categories,
      addons,
      isActive,
    } = req.body;

    const customOrder = await CustomOrder.findById(id);
    if (!customOrder) {
      return sendResponse(res, 404, false, "Custom order not found");
    }

    // Validate location if provided
    if (locationId && locationId !== customOrder.locationId.toString()) {
      const location = await Location.findById(locationId);
      if (!location) {
        return sendResponse(res, 404, false, "Location not found");
      }
    }

    // Validate service if provided
    if (serviceId && serviceId !== customOrder.serviceId.toString()) {
      const service = await Service.findById(serviceId);
      if (!service) {
        return sendResponse(res, 404, false, "Service not found");
      }
    }

    // Check for duplicate name at location (if name or location changed)
    if (
      name &&
      (name !== customOrder.name ||
        locationId !== customOrder.locationId.toString())
    ) {
      const existingCustomOrder = await CustomOrder.findOne({
        name,
        locationId: locationId || customOrder.locationId,
        _id: { $ne: id },
      });
      if (existingCustomOrder) {
        return sendResponse(
          res,
          400,
          false,
          "Custom order with this name already exists at this location"
        );
      }
    }

    // Update fields
    if (name) customOrder.name = name;
    if (description !== undefined) customOrder.description = description;
    if (locationId) customOrder.locationId = locationId;
    if (serviceId) customOrder.serviceId = serviceId;
    if (minPeople !== undefined) customOrder.minPeople = minPeople;
    if (maxPeople !== undefined) customOrder.maxPeople = maxPeople;
    if (categories) customOrder.categories = categories;
    if (addons) customOrder.addons = addons;
    if (isActive !== undefined) customOrder.isActive = isActive;

    const updatedCustomOrder = await customOrder.save();

    // Populate references for response
    const populatedCustomOrder = await CustomOrder.findById(
      updatedCustomOrder._id
    )
      .populate("locationId", "name city address")
      .populate("serviceId", "name description")
      .populate("createdBy", "name email");

    sendResponse(res, 200, true, "Custom order updated successfully", {
      customOrder: populatedCustomOrder,
    });
  } catch (error) {
    console.error("Update custom order error:", error);

    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(
        (err) => err.message
      );
      return sendResponse(res, 400, false, "Validation error", {
        errors: errorMessages,
      });
    }

    sendResponse(res, 500, false, "Failed to update custom order", {
      error: error.message,
    });
  }
});

// @desc    Delete custom order
// @route   DELETE /api/custom-orders/:id
// @access  Private (Admin only)
const deleteCustomOrder = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const customOrder = await CustomOrder.findById(id);
    if (!customOrder) {
      return sendResponse(res, 404, false, "Custom order not found");
    }

    // Instead of hard delete, deactivate the custom order
    customOrder.isActive = false;
    await customOrder.save();

    sendResponse(res, 200, true, "Custom order deleted successfully", {
      customOrderId: id,
    });
  } catch (error) {
    console.error("Delete custom order error:", error);
    sendResponse(res, 500, false, "Failed to delete custom order", {
      error: error.message,
    });
  }
});

// @desc    Add item to category
// @route   POST /api/custom-orders/:id/categories/:categoryName/items
// @access  Private (Admin only)
const addItemToCategory = asyncHandler(async (req, res) => {
  try {
    const { id, categoryName } = req.params;
    const itemData = req.body;

    const customOrder = await CustomOrder.findById(id);
    if (!customOrder) {
      return sendResponse(res, 404, false, "Custom order not found");
    }

    const category = customOrder.categories.find(
      (cat) => cat.name === categoryName
    );
    if (!category) {
      return sendResponse(res, 404, false, "Category not found");
    }

    // Add item to category
    category.items.push(itemData);
    await customOrder.save();

    sendResponse(res, 200, true, "Item added to category successfully", {
      category: category,
      newItem: category.items[category.items.length - 1],
    });
  } catch (error) {
    console.error("Add item to category error:", error);
    sendResponse(res, 500, false, "Failed to add item to category", {
      error: error.message,
    });
  }
});

// @desc    Add addon
// @route   POST /api/custom-orders/:id/addons
// @access  Private (Admin only)
const addAddon = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const addonData = req.body;

    const customOrder = await CustomOrder.findById(id);
    if (!customOrder) {
      return sendResponse(res, 404, false, "Custom order not found");
    }

    // Add addon
    customOrder.addons.push(addonData);
    await customOrder.save();

    sendResponse(res, 200, true, "Addon added successfully", {
      addons: customOrder.addons,
      newAddon: customOrder.addons[customOrder.addons.length - 1],
    });
  } catch (error) {
    console.error("Add addon error:", error);
    sendResponse(res, 500, false, "Failed to add addon", {
      error: error.message,
    });
  }
});

// =====================================================
// PUBLIC ROUTES (No Authentication Required)
// =====================================================

// @desc    Get custom orders by location (Public)
// @route   GET /api/public/custom-orders/location/:locationId
// @access  Public
const getCustomOrdersByLocationPublic = asyncHandler(async (req, res) => {
  try {
    const { locationId } = req.params;

    const customOrders = await CustomOrder.find({
      locationId,
      isActive: true,
    })
      .populate("locationId", "name city address phone")
      .populate("serviceId", "name description")
      .select("-createdBy") // Don't expose admin info to public
      .sort({ createdAt: -1 });

    sendResponse(res, 200, true, "Custom orders retrieved successfully", {
      customOrders,
      location: customOrders[0]?.locationId || null,
    });
  } catch (error) {
    console.error("Get custom orders by location (public) error:", error);
    sendResponse(res, 500, false, "Failed to retrieve custom orders", {
      error: error.message,
    });
  }
});

// @desc    Get custom order by ID (Public)
// @route   GET /api/public/custom-orders/:id
// @access  Public
const getCustomOrderByIdPublic = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const customOrder = await CustomOrder.findById(id)
      .populate("locationId", "name city address phone email")
      .populate("serviceId", "name description")
      .select("-createdBy"); // Don't expose admin info to public

    if (!customOrder || !customOrder.isActive) {
      return sendResponse(
        res,
        404,
        false,
        "Custom order not found or inactive"
      );
    }

    sendResponse(res, 200, true, "Custom order retrieved successfully", {
      customOrder,
    });
  } catch (error) {
    console.error("Get custom order by ID (public) error:", error);
    sendResponse(res, 500, false, "Failed to retrieve custom order", {
      error: error.message,
    });
  }
});

// @desc    Calculate custom order price (Public)
// @route   POST /api/public/custom-orders/:id/calculate
// @access  Public
const calculateCustomOrderPricePublic = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { selections, peopleCount } = req.body;

    if (!selections || !peopleCount) {
      return sendResponse(
        res,
        400,
        false,
        "Selections and people count are required"
      );
    }

    const customOrder = await CustomOrder.findById(id);
    if (!customOrder || !customOrder.isActive) {
      return sendResponse(
        res,
        404,
        false,
        "Custom order configuration not found or inactive"
      );
    }

    // Validate people count is within limits
    if (
      peopleCount < customOrder.minPeople ||
      peopleCount > customOrder.maxPeople
    ) {
      return sendResponse(
        res,
        400,
        false,
        `Number of people must be between ${customOrder.minPeople} and ${customOrder.maxPeople}`
      );
    }

    // Validate selections using the model method
    const validation = customOrder.validateSelections(selections, peopleCount);
    if (!validation.isValid) {
      return sendResponse(res, 400, false, validation.errors[0], {
        errors: validation.errors,
      });
    }

    // Calculate price using the model method
    const priceCalculation = customOrder.calculatePrice(
      selections,
      peopleCount
    );

    sendResponse(res, 200, true, "Price calculated successfully", {
      pricing: priceCalculation,
      isValid: validation.isValid,
      peopleCount,
    });
  } catch (error) {
    console.error("Calculate custom order price (public) error:", error);
    sendResponse(res, 500, false, "Failed to calculate price", {
      error: error.message,
    });
  }
});

// @desc    Get all available locations with custom orders (Public)
// @route   GET /api/public/custom-orders/locations
// @access  Public
const getLocationsWithCustomOrders = asyncHandler(async (req, res) => {
  try {
    const locations = await CustomOrder.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $group: {
          _id: "$locationId",
          customOrderCount: { $sum: 1 },
          customOrderNames: { $push: "$name" },
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "_id",
          foreignField: "_id",
          as: "location",
        },
      },
      {
        $unwind: "$location",
      },
      {
        $project: {
          _id: "$location._id",
          name: "$location.name",
          city: "$location.city",
          address: "$location.address",
          phone: "$location.phone",
          customOrderCount: 1,
          customOrderNames: 1,
        },
      },
      {
        $sort: { name: 1 },
      },
    ]);

    sendResponse(
      res,
      200,
      true,
      "Locations with custom orders retrieved successfully",
      {
        locations,
        totalLocations: locations.length,
      }
    );
  } catch (error) {
    console.error("Get locations with custom orders error:", error);
    sendResponse(res, 500, false, "Failed to retrieve locations", {
      error: error.message,
    });
  }
});

// @desc    Add fixed addon
// @route   POST /api/custom-orders/:id/addons/fixed
// @access  Private (Admin only)
const addFixedAddon = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const addonData = req.body;

    const customOrder = await CustomOrder.findById(id);
    if (!customOrder) {
      return sendResponse(res, 404, false, "Custom order not found");
    }

    // Initialize addons if not exists
    if (!customOrder.addons) {
      customOrder.addons = {
        enabled: true,
        fixedAddons: [],
        variableAddons: [],
      };
    }

    // Add fixed addon
    customOrder.addons.fixedAddons.push(addonData);
    await customOrder.save();

    sendResponse(res, 200, true, "Fixed addon added successfully", {
      addons: customOrder.addons,
      newAddon:
        customOrder.addons.fixedAddons[
          customOrder.addons.fixedAddons.length - 1
        ],
    });
  } catch (error) {
    console.error("Add fixed addon error:", error);
    sendResponse(res, 500, false, "Failed to add fixed addon", {
      error: error.message,
    });
  }
});

// @desc    Add variable addon
// @route   POST /api/custom-orders/:id/addons/variable
// @access  Private (Admin only)
const addVariableAddon = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const addonData = req.body;

    const customOrder = await CustomOrder.findById(id);
    if (!customOrder) {
      return sendResponse(res, 404, false, "Custom order not found");
    }

    // Initialize addons if not exists
    if (!customOrder.addons) {
      customOrder.addons = {
        enabled: true,
        fixedAddons: [],
        variableAddons: [],
      };
    }

    // Add variable addon
    customOrder.addons.variableAddons.push(addonData);
    await customOrder.save();

    sendResponse(res, 200, true, "Variable addon added successfully", {
      addons: customOrder.addons,
      newAddon:
        customOrder.addons.variableAddons[
          customOrder.addons.variableAddons.length - 1
        ],
    });
  } catch (error) {
    console.error("Add variable addon error:", error);
    sendResponse(res, 500, false, "Failed to add variable addon", {
      error: error.message,
    });
  }
});

module.exports = {
  // Admin routes
  createCustomOrder,
  getAllCustomOrders,
  getCustomOrderById,
  updateCustomOrder,
  deleteCustomOrder,
  addItemToCategory,
  addFixedAddon,
  addVariableAddon,

  // Public routes
  getCustomOrdersByLocationPublic,
  getCustomOrderByIdPublic,
  calculateCustomOrderPricePublic,
  getLocationsWithCustomOrders,
};
