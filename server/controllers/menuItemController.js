import mongoose from "mongoose";
import Menu from "../models/menusModel.js";
import MenuItem from "../models/menuItemModel.js";

// @desc    Get all menu items with optional filtering
// @route   GET /api/menu-items?category=entree&isVegetarian=true
// @access  Public
export const getMenuItems = async (req, res) => {
  try {
    const { category, isVegetarian, isVegan } = req.query;

    // Start with a filter to only get active items
    const filter = {};

    // Add to the filter object if query params exist
    if (category) filter.category = category;
    if (isVegetarian) filter.isVegetarian = isVegetarian === "true";
    if (isVegan) filter.isVegan = isVegan === "true";

    const menuItems = await MenuItem.find(filter).sort({
      category: 1,
      name: 1,
    });

    res.json({
      success: true,
      message: "Menu items fetched successfully",
      count: menuItems.length,
      data: menuItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// @desc    Get a single menu item by ID
// @route   GET /api/menu-items/:id
// @access  Public
export const getMenuItemById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Menu Item ID format" });
  }

  try {
    const menuItem = await MenuItem.findById(id);

    if (!menuItem) {
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });
    }

    res.json({
      success: true,
      message: "Menu item fetched successfully",
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// @desc    Create a new menu item (or reactivate an existing one)
// @route   POST /api/menu-items
// @access  Private/Admin
export const createMenuItem = async (req, res) => {
  try {
    const { name } = req.body;

    // Check if a menu item with this name already exists (active or inactive)
    const existingItem = await MenuItem.findOne({ name });

    if (existingItem) {
      if (existingItem.isActive) {
        return res.status(400).json({
          success: false,
          message: "An active menu item with this name already exists.",
        });
      } else {
        // If it's inactive, reactivate it and update its data
        Object.assign(existingItem, req.body, { isActive: true });
        const reactivatedItem = await existingItem.save();
        return res.status(200).json({
          success: true,
          message:
            "Existing inactive menu item has been reactivated and updated.",
          data: reactivatedItem,
        });
      }
    }

    // If no item exists, create a new one
    const menuItem = new MenuItem(req.body);
    const savedMenuItem = await menuItem.save();

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      data: savedMenuItem,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update a menu item
// @route   PUT /api/menu-items/:id
// @access  Private/Admin
export const updateMenuItem = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Menu Item ID format" });
  }

  try {
    const menuItem = await MenuItem.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!menuItem) {
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });
    }

    res.json({
      success: true,
      message: "Menu item updated successfully",
      data: menuItem,
    });
  } catch (error) {
    // Handle potential duplicate key error on update
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A menu item with this name already exists.",
      });
    }
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Permanently delete a menu item after checking for usage
// @route   DELETE /api/menu-items/:id
// @access  Private/Admin
export const deleteMenuItem = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Menu Item ID format" });
  }

  try {
    // Step 1: Check if the menu item is being used in any Menu
    const menuItemInUse = await Menu.findOne({
      $or: [
        { "categories.entree.includedItems": id },
        { "categories.entree.selectionGroups.items": id },
        { "categories.mains.includedItems": id },
        { "categories.mains.selectionGroups.items": id },
        { "categories.desserts.includedItems": id },
        { "categories.desserts.selectionGroups.items": id },
      ],
    });

    // Step 2: If it's in use, prevent deletion
    if (menuItemInUse) {
      return res.status(400).json({
        success: false,
        message: `This menu item is being used in the '${menuItemInUse.name}' menu and cannot be deleted.`,
      });
    }

    // Step 3: If not in use, proceed with permanent deletion
    const deletedItem = await MenuItem.findByIdAndDelete(id);

    if (!deletedItem) {
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });
    }

    res.json({
      success: true,
      message: "Menu item permanently deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};
