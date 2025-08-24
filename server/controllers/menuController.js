const mongoose = require("mongoose");
const Menu = require("../models/menusModel.js");
const Service = require("../models/serviceModel.js");
const Location = require("../models/locationModel.js");

// @desc    Get all menus with optional filtering and population
// @route   GET /api/menus
// @access  Public
const getMenus = async (req, res) => {
  try {
    const { locationId, serviceId, isActive, packageType } = req.query;

    // Build query object
    const query = {};
    if (locationId) query.locationId = locationId;
    if (serviceId) query.serviceId = serviceId;
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (packageType) query.packageType = packageType;

    const menus = await Menu.find(query)
      .populate("locationId", "name city address")
      .populate("serviceId", "name description")
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
const getMenuById = async (req, res) => {
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
      .populate("serviceId", "name description");

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
const createMenu = async (req, res) => {
  try {
    const { name, serviceId, locationId, packageType, categories, simpleItems, addons } = req.body;

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

    // Validate package structure based on type
    const validationErrors = validatePackageStructure(packageType, categories, simpleItems);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Package validation failed: ${validationErrors.join(', ')}`,
      });
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
const updateMenu = async (req, res) => {
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

    // Validate updated package structure
    const packageType = req.body.packageType || existingMenu.packageType;
    const validationErrors = validatePackageStructure(
      packageType, 
      req.body.categories || existingMenu.categories, 
      req.body.simpleItems || existingMenu.simpleItems
    );
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Package validation failed: ${validationErrors.join(', ')}`,
      });
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

// @desc    Delete a menu
// @route   DELETE /api/menus/:id
// @access  Private/Admin
const deleteMenu = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Menu ID format",
    });
  }

  try {
    const deletedMenu = await Menu.findByIdAndDelete(id);

    if (!deletedMenu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    res.json({
      success: true,
      message: "Menu deleted successfully",
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
const getMenusByService = async (req, res) => {
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
const getMenusByLocation = async (req, res) => {
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

// @desc    Calculate menu price based on selections
// @route   POST /api/menus/:id/calculate-price
// @access  Public
const calculateMenuPrice = async (req, res) => {
  const { id } = req.params;
  const { selections, peopleCount } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Menu ID format",
    });
  }

  if (!peopleCount || peopleCount < 1) {
    return res.status(400).json({
      success: false,
      message: "Valid people count is required",
    });
  }

  try {
    const menu = await Menu.findById(id);
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    // Validate people count against menu limits
    if (peopleCount < menu.minPeople || peopleCount > menu.maxPeople) {
      return res.status(400).json({
        success: false,
        message: `People count must be between ${menu.minPeople} and ${menu.maxPeople || 'unlimited'}`,
      });
    }

    // Calculate price based on package structure
    const priceCalculation = calculatePackagePrice(menu, selections, peopleCount);

    res.json({
      success: true,
      message: "Price calculated successfully",
      data: priceCalculation,
    });
  } catch (error) {
    console.error("Error calculating menu price:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// Helper function to validate package structure
const validatePackageStructure = (packageType, categories, simpleItems) => {
  const errors = [];

  if (packageType === 'categorized') {
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      errors.push('Categorized packages must have at least one category');
    } else {
      // Validate each category
      categories.forEach((category, index) => {
        if (!category.name || category.name.trim() === '') {
          errors.push(`Category ${index + 1} must have a name`);
        }
        
        if (category.enabled) {
          // Check if category has any content
          const hasIncludedItems = category.includedItems && category.includedItems.length > 0;
          const hasSelectionGroups = category.selectionGroups && category.selectionGroups.length > 0;
          
          if (!hasIncludedItems && !hasSelectionGroups) {
            errors.push(`Enabled category "${category.name}" must have at least one included item or selection group`);
          }
          
          // Validate selection groups
          if (category.selectionGroups) {
            category.selectionGroups.forEach((group, groupIndex) => {
              if (!group.name || group.name.trim() === '') {
                errors.push(`Selection group ${groupIndex + 1} in category "${category.name}" must have a name`);
              }
              if (!group.items || group.items.length === 0) {
                errors.push(`Selection group "${group.name}" must have at least one item`);
              }
            });
          }
        }
      });
    }
  } else if (packageType === 'simple') {
    if (!simpleItems || !Array.isArray(simpleItems) || simpleItems.length === 0) {
      errors.push('Simple packages must have at least one item');
    } else {
      // Validate simple items
      simpleItems.forEach((item, index) => {
        if (!item.name || item.name.trim() === '') {
          errors.push(`Simple item ${index + 1} must have a name`);
        }
      });
    }
  }

  return errors;
};

// Helper function to calculate package price
const calculatePackagePrice = (menu, selections, peopleCount) => {
  let totalPrice = menu.basePrice || 0;
  let priceBreakdown = {
    basePrice: menu.basePrice || 0,
    itemModifiers: 0,
    optionModifiers: 0,
    choiceModifiers: 0,
    fixedAddons: 0,
    variableAddons: 0,
  };

  if (menu.packageType === 'simple') {
    // Calculate simple package price
    if (selections.simpleItems) {
      menu.simpleItems.forEach((item, index) => {
        const itemSelection = selections.simpleItems[index];
        if (itemSelection) {
          // Add item price modifier
          if (item.priceModifier) {
            totalPrice += item.priceModifier;
            priceBreakdown.itemModifiers += item.priceModifier;
          }
          
          // Add choice price modifiers
          if (item.hasChoices && item.choices && itemSelection.choices) {
            itemSelection.choices.forEach(choiceIndex => {
              const choice = item.choices[choiceIndex];
              if (choice && choice.priceModifier) {
                totalPrice += choice.priceModifier;
                priceBreakdown.choiceModifiers += choice.priceModifier;
              }
            });
          }
          
          // Add option price modifiers
          if (item.options && itemSelection.options) {
            itemSelection.options.forEach(optionIndex => {
              const option = item.options[optionIndex];
              if (option && option.priceModifier) {
                totalPrice += option.priceModifier;
                priceBreakdown.optionModifiers += option.priceModifier;
              }
            });
          }
        }
      });
    }
  } else if (menu.packageType === 'categorized') {
    // Calculate categorized package price
    if (selections.categories) {
      menu.categories.forEach(category => {
        if (category.enabled && selections.categories[category.name]) {
          const categorySelection = selections.categories[category.name];
          
          // Add selection group item price modifiers
          if (category.selectionGroups) {
            category.selectionGroups.forEach(group => {
              if (categorySelection[group.name]) {
                const groupSelections = categorySelection[group.name];
                groupSelections.forEach(itemIndex => {
                  const item = group.items[itemIndex];
                  if (item && item.priceModifier) {
                    totalPrice += item.priceModifier;
                    priceBreakdown.itemModifiers += item.priceModifier;
                  }
                });
              }
            });
          }
        }
      });
    }
  }

  // Calculate addon prices
  let addonPrice = 0;
  if (menu.addons && menu.addons.enabled && selections.addons) {
    // Fixed addons (scale with people count)
    if (selections.addons.fixed) {
      selections.addons.fixed.forEach(addonIndex => {
        const addon = menu.addons.fixedAddons[addonIndex];
        if (addon && addon.pricePerPerson) {
          const addonTotal = addon.pricePerPerson * peopleCount;
          addonPrice += addonTotal;
          priceBreakdown.fixedAddons += addonTotal;
        }
      });
    }
    
    // Variable addons (based on quantity selected)
    if (selections.addons.variable) {
      Object.entries(selections.addons.variable).forEach(([addonIndex, quantity]) => {
        const addon = menu.addons.variableAddons[parseInt(addonIndex)];
        if (addon && addon.pricePerUnit && quantity > 0) {
          const addonTotal = addon.pricePerUnit * quantity;
          addonPrice += addonTotal;
          priceBreakdown.variableAddons += addonTotal;
        }
      });
    }
  }

  return {
    basePrice: menu.basePrice || 0,
    baseTotalPrice: (menu.basePrice || 0) * peopleCount,
    priceModifiers: totalPrice - (menu.basePrice || 0),
    addonPrice: addonPrice,
    grandTotal: (totalPrice * peopleCount) + addonPrice,
    perPersonPrice: totalPrice,
    peopleCount: peopleCount,
    breakdown: priceBreakdown
  };
};

module.exports = {
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
  getMenusByService,
  getMenusByLocation,
  calculateMenuPrice,
};
