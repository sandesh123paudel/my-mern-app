import mongoose from "mongoose";
import Menu from "../models/menusModel.js";
import Service from "../models/ServiceModel.js";
import MenuItem from "../models/menuItemModel.js";
import Location from "../models/LocationModel.js";

// @desc    Get all menus with optional filtering and population
// @route   GET /api/menus
// @access  Public
export const getMenus = async (req, res) => {
  try {
    const { locationId, serviceId, isActive } = req.query;

    // Build query object
    const query = {};
    if (locationId) query.locationId = locationId;
    if (serviceId) query.serviceId = serviceId;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const menus = await Menu.find(query)
      .populate("locationId", "name city address")
      .populate("serviceId", "name description")
      .populate("categories.entree.includedItems", "name category price")
      .populate(
        "categories.entree.selectionGroups.items",
        "name category price"
      )
      .populate("categories.mains.includedItems", "name category price")
      .populate("categories.mains.selectionGroups.items", "name category price")
      .populate("categories.desserts.includedItems", "name category price")
      .populate(
        "categories.desserts.selectionGroups.items",
        "name category price"
      )
      .populate(
        "categories.addons.includedItems",
        "name category price description"
      ) // Added addons
      .populate(
        "categories.addons.selectionGroups.items",
        "name category price description"
      ) // Added addons
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Menus fetched successfully",
      count: menus.length,
      data: menus,
    });
  } catch (error) {
    console.error("Error fetching menus:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// @desc    Get a single menu by ID with full population
// @route   GET /api/menus/:id
// @access  Public
export const getMenuById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Menu ID format",
    });
  }

  try {
    const menu = await Menu.findById(id)
      .populate("locationId", "name city address contactInfo")
      .populate("serviceId", "name description")
      .populate(
        "categories.entree.includedItems",
        "name category price description isVegetarian isVegan allergens"
      )
      .populate(
        "categories.entree.selectionGroups.items",
        "name category price description isVegetarian isVegan allergens"
      )
      .populate(
        "categories.mains.includedItems",
        "name category price description isVegetarian isVegan allergens"
      )
      .populate(
        "categories.mains.selectionGroups.items",
        "name category price description isVegetarian isVegan allergens"
      )
      .populate(
        "categories.desserts.includedItems",
        "name category price description isVegetarian isVegan allergens"
      )
      .populate(
        "categories.desserts.selectionGroups.items",
        "name category price description isVegetarian isVegan allergens"
      )
      .populate(
        "categories.addons.includedItems",
        "name category price description isVegetarian isVegan allergens"
      ) // Added addons
      .populate(
        "categories.addons.selectionGroups.items",
        "name category price description isVegetarian isVegan allergens"
      ); // Added addons

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    res.json({
      success: true,
      message: "Menu fetched successfully",
      data: menu,
    });
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// @desc    Create a new menu
// @route   POST /api/menus
// @access  Private/Admin
export const createMenu = async (req, res) => {
  try {
    const { name, serviceId, locationId, categories } = req.body;

    // Validate required fields
    if (!name || !serviceId || !locationId) {
      return res.status(400).json({
        success: false,
        message: "Name, serviceId, and locationId are required fields.",
      });
    }

    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Service ID format",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Location ID format",
      });
    }

    // Check if location and service exist and are active
    const [location, service] = await Promise.all([
      Location.findById(locationId),
      Service.findById(serviceId),
    ]);

    if (!location || !location.isActive) {
      return res.status(400).json({
        success: false,
        message: "Location not found or inactive",
      });
    }

    if (!service || !service.isActive) {
      return res.status(400).json({
        success: false,
        message: "Service not found or inactive",
      });
    }

    // Check if service belongs to the location
    if (service.locationId.toString() !== locationId) {
      return res.status(400).json({
        success: false,
        message: "Service does not belong to the specified location",
      });
    }

    // Check if menu with same name already exists for this service
    const existingMenu = await Menu.findOne({ name, serviceId });
    if (existingMenu) {
      return res.status(400).json({
        success: false,
        message: "A menu with this name already exists for this service",
      });
    }

    // Validate menu items if categories are provided
    if (categories) {
      await validateMenuItems(categories);
    }

    // Create new menu
    const menu = new Menu(req.body);
    const savedMenu = await menu.save();

    // Populate the saved menu before returning
    const populatedMenu = await Menu.findById(savedMenu._id)
      .populate("locationId", "name city")
      .populate("serviceId", "name description");

    res.status(201).json({
      success: true,
      message: "Menu created successfully",
      data: populatedMenu,
    });
  } catch (error) {
    console.error("Error creating menu:", error);

    // Handle specific errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A menu with this name already exists for this service",
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || "Failed to create menu",
    });
  }
};

// @desc    Update an existing menu
// @route   PUT /api/menus/:id
// @access  Private/Admin
export const updateMenu = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Menu ID format",
    });
  }

  try {
    // Check if menu exists
    const existingMenu = await Menu.findById(id);
    if (!existingMenu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    // If updating serviceId or locationId, validate them
    if (req.body.serviceId || req.body.locationId) {
      const serviceId = req.body.serviceId || existingMenu.serviceId;
      const locationId = req.body.locationId || existingMenu.locationId;

      if (
        !mongoose.Types.ObjectId.isValid(serviceId) ||
        !mongoose.Types.ObjectId.isValid(locationId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid Service ID or Location ID format",
        });
      }

      const [location, service] = await Promise.all([
        Location.findById(locationId),
        Service.findById(serviceId),
      ]);

      if (!location || !location.isActive) {
        return res.status(400).json({
          success: false,
          message: "Location not found or inactive",
        });
      }

      if (!service || !service.isActive) {
        return res.status(400).json({
          success: false,
          message: "Service not found or inactive",
        });
      }

      // Check if service belongs to the location
      if (service.locationId.toString() !== locationId.toString()) {
        return res.status(400).json({
          success: false,
          message: "Service does not belong to the specified location",
        });
      }
    }

    // Validate menu items if categories are being updated
    if (req.body.categories) {
      await validateMenuItems(req.body.categories);
    }

    // Update menu
    const updatedMenu = await Menu.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("locationId", "name city")
      .populate("serviceId", "name description");

    res.json({
      success: true,
      message: "Menu updated successfully",
      data: updatedMenu,
    });
  } catch (error) {
    console.error("Error updating menu:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A menu with this name already exists for this service",
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || "Failed to update menu",
    });
  }
};

// @desc    Delete a menu (soft delete by setting isActive to false)
// @route   DELETE /api/menus/:id
// @access  Private/Admin
export const deleteMenu = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Menu ID format",
    });
  }

  try {
    const menu = await Menu.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    res.json({
      success: true,
      message: "Menu deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting menu:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Get menus by service ID
// @route   GET /api/menus/service/:serviceId
// @access  Public
export const getMenusByService = async (req, res) => {
  const { serviceId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Service ID format",
    });
  }

  try {
    const menus = await Menu.find({ serviceId, isActive: true })
      .populate("locationId", "name city")
      .populate("serviceId", "name description")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: `Menus for service fetched successfully`,
      count: menus.length,
      data: menus,
    });
  } catch (error) {
    console.error("Error fetching menus by service:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Get menus by location ID
// @route   GET /api/menus/location/:locationId
// @access  Public
export const getMenusByLocation = async (req, res) => {
  const { locationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(locationId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Location ID format",
    });
  }

  try {
    const menus = await Menu.find({ locationId, isActive: true })
      .populate("locationId", "name city")
      .populate("serviceId", "name description")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: `Menus for location fetched successfully`,
      count: menus.length,
      data: menus,
    });
  } catch (error) {
    console.error("Error fetching menus by location:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// Helper function to validate menu items and addons in categories
const validateMenuItems = async (categories) => {
  const allItemIds = [];

  // Collect all item IDs from all categories (including addons)
  Object.values(categories).forEach((category) => {
    if (category.includedItems) {
      allItemIds.push(...category.includedItems);
    }
    if (category.selectionGroups) {
      category.selectionGroups.forEach((group) => {
        if (group.items) {
          allItemIds.push(...group.items);
        }
      });
    }
  });

  // Remove duplicates
  const uniqueItemIds = [...new Set(allItemIds)];

  // Validate all ObjectIds
  for (const itemId of uniqueItemIds) {
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      throw new Error(`Invalid MenuItem ID: ${itemId}`);
    }
  }

  // Check if all menu items exist and are active
  if (uniqueItemIds.length > 0) {
    const menuItems = await MenuItem.find({
      _id: { $in: uniqueItemIds },
      isActive: true,
    });

    if (menuItems.length !== uniqueItemIds.length) {
      const foundIds = menuItems.map((item) => item._id.toString());
      const missingIds = uniqueItemIds.filter(
        (id) => !foundIds.includes(id.toString())
      );
      throw new Error(
        `Menu items not found or inactive: ${missingIds.join(", ")}`
      );
    }

    // Validate category consistency (items should match their assigned category)
    Object.entries(categories).forEach(([categoryName, categoryData]) => {
      const categoryItems = [];

      if (categoryData.includedItems) {
        categoryItems.push(...categoryData.includedItems);
      }

      if (categoryData.selectionGroups) {
        categoryData.selectionGroups.forEach((group) => {
          if (group.items) {
            categoryItems.push(...group.items);
          }
        });
      }

      categoryItems.forEach((itemId) => {
        const menuItem = menuItems.find(
          (item) => item._id.toString() === itemId.toString()
        );
        if (menuItem && menuItem.category !== categoryName) {
          throw new Error(
            `Menu item "${menuItem.name}" belongs to "${menuItem.category}" category, not "${categoryName}"`
          );
        }
      });
    });
  }
};
