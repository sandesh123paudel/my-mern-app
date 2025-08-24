const mongoose = require("mongoose");

// Schema for individual items in categories
const customItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    pricePerPerson: {
      type: Number,
      required: true,
      min: 0,
    },
    // Dietary info
    isVegetarian: {
      type: Boolean,
      default: false,
    },
    isVegan: {
      type: Boolean,
      default: false,
    },
    allergens: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { 
    _id: true,
    timestamps: true 
  }
);

// Schema for categories
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ["entree", "mains", "desserts", "sides", "beverages"],
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    items: [customItemSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// Enhanced addons system - Fixed addons (price scales with number of people)
const fixedAddonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    pricePerPerson: {
      type: Number,
      required: true,
      min: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    // Dietary info
    isVegetarian: {
      type: Boolean,
      default: false,
    },
    isVegan: {
      type: Boolean,
      default: false,
    },
    allergens: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { 
    _id: true,
    timestamps: true 
  }
);

// Enhanced addons system - Variable addons (customer chooses quantity)
const variableAddonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      default: "piece",
      trim: true,
    },
    minQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxQuantity: {
      type: Number,
      default: 20,
      min: 1,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    defaultQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Dietary info
    isVegetarian: {
      type: Boolean,
      default: false,
    },
    isVegan: {
      type: Boolean,
      default: false,
    },
    allergens: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { 
    _id: true,
    timestamps: true 
  }
);

// Enhanced addons system schema
const addonsSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    // Fixed addons - price scales with number of people
    fixedAddons: [fixedAddonSchema],
    // Variable addons - customer chooses quantity
    variableAddons: [variableAddonSchema],
  },
  { _id: false }
);

// Main Custom Order Configuration Schema
const customOrderSchema = new mongoose.Schema(
  {
    // Basic info
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    
    // Location and service
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    
    // People limits
    minPeople: {
      type: Number,
      default: 1,
    },
    maxPeople: {
      type: Number,
      default: 100,
    },
    
    // Categories with items
    categories: [categorySchema],
    
    // Enhanced addons system
    addons: addonsSchema,
    
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Admin tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
customOrderSchema.index({ locationId: 1, serviceId: 1 });
customOrderSchema.index({ isActive: 1 });
customOrderSchema.index({ name: 1, locationId: 1 }, { unique: true });

// Virtual for total items count
customOrderSchema.virtual('totalItems').get(function() {
  return this.categories.reduce((total, category) => {
    return total + (category.items?.length || 0);
  }, 0);
});

// Virtual for total addons count
customOrderSchema.virtual('totalAddons').get(function() {
  const fixedCount = this.addons?.fixedAddons?.filter(addon => addon.isAvailable).length || 0;
  const variableCount = this.addons?.variableAddons?.filter(addon => addon.isAvailable).length || 0;
  return fixedCount + variableCount;
});

// Method to validate selections from customer
customOrderSchema.methods.validateSelections = function(selections, peopleCount) {
  const errors = [];

  // Basic validation
  if (!peopleCount || peopleCount < 1) {
    errors.push("People count must be at least 1");
  }

  if (peopleCount < this.minPeople || peopleCount > this.maxPeople) {
    errors.push(`Number of people must be between ${this.minPeople} and ${this.maxPeople}`);
  }

  if (!selections) {
    errors.push("Selections are required");
    return { isValid: false, errors };
  }

  // Validate category selections
  if (selections.categories) {
    Object.entries(selections.categories).forEach(([categoryName, categorySelections]) => {
      const category = this.categories.find(cat => cat.name === categoryName);
      
      if (!category) {
        errors.push(`Category "${categoryName}" not found`);
        return;
      }

      if (!category.isActive) {
        errors.push(`Category "${categoryName}" is not active`);
        return;
      }

      // Validate each item selection in this category
      categorySelections.forEach((selection, index) => {
        if (!selection.itemId) {
          errors.push(`Item ID is required for selection ${index + 1} in category "${categoryName}"`);
          return;
        }

        const item = category.items.id(selection.itemId);
        if (!item) {
          errors.push(`Item not found in category "${categoryName}"`);
          return;
        }

        if (!item.isAvailable) {
          errors.push(`Item "${item.name}" is not available`);
          return;
        }

        if (selection.quantity && selection.quantity < 1) {
          errors.push(`Quantity must be at least 1 for item "${item.name}"`);
        }
      });
    });
  }

  // Validate addon selections
  if (selections.addons && this.addons?.enabled) {
    // Validate fixed addons
    if (selections.addons.fixed) {
      selections.addons.fixed.forEach((addonId, index) => {
        if (!addonId) {
          errors.push(`Fixed addon ID is required for selection ${index + 1}`);
          return;
        }

        const addon = this.addons.fixedAddons.id(addonId);
        if (!addon) {
          errors.push(`Fixed addon not found`);
          return;
        }

        if (!addon.isAvailable) {
          errors.push(`Fixed addon "${addon.name}" is not available`);
          return;
        }
      });
    }

    // Validate variable addons
    if (selections.addons.variable) {
      Object.entries(selections.addons.variable).forEach(([addonId, quantity]) => {
        const addon = this.addons.variableAddons.id(addonId);
        if (!addon) {
          errors.push(`Variable addon not found`);
          return;
        }

        if (!addon.isAvailable) {
          errors.push(`Variable addon "${addon.name}" is not available`);
          return;
        }

        if (quantity < addon.minQuantity || quantity > addon.maxQuantity) {
          errors.push(`Quantity for "${addon.name}" must be between ${addon.minQuantity} and ${addon.maxQuantity}`);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// Method to calculate price based on selections
customOrderSchema.methods.calculatePrice = function(selections, peopleCount) {
  let itemsPrice = 0;
  let fixedAddonsPrice = 0;
  let variableAddonsPrice = 0;
  const breakdown = [];

  // Calculate category items price (per person)
  if (selections.categories) {
    this.categories.forEach(category => {
      const categorySelections = selections.categories[category.name] || [];
      
      categorySelections.forEach(selection => {
        const item = category.items.id(selection.itemId);
        if (item && item.isAvailable) {
          const quantity = selection.quantity || 1;
          const itemTotal = item.pricePerPerson * peopleCount * quantity;
          itemsPrice += itemTotal;
          
          breakdown.push({
            type: 'item',
            name: item.name,
            category: category.displayName,
            pricePerPerson: item.pricePerPerson,
            quantity: quantity,
            peopleCount: peopleCount,
            totalPrice: itemTotal
          });
        }
      });
    });
  }

  // Calculate addons price
  if (selections.addons && this.addons?.enabled) {
    // Fixed addons (price scales with people count)
    if (selections.addons.fixed && this.addons.fixedAddons) {
      selections.addons.fixed.forEach(addonId => {
        const addon = this.addons.fixedAddons.id(addonId);
        if (addon && addon.isAvailable) {
          const addonTotal = addon.pricePerPerson * peopleCount;
          fixedAddonsPrice += addonTotal;
          
          breakdown.push({
            type: 'fixedAddon',
            name: addon.name,
            pricePerPerson: addon.pricePerPerson,
            peopleCount: peopleCount,
            totalPrice: addonTotal
          });
        }
      });
    }

    // Variable addons (based on quantity selected)
    if (selections.addons.variable && this.addons.variableAddons) {
      Object.entries(selections.addons.variable).forEach(([addonId, quantity]) => {
        const addon = this.addons.variableAddons.id(addonId);
        if (addon && addon.isAvailable && quantity > 0) {
          const addonTotal = addon.pricePerUnit * quantity;
          variableAddonsPrice += addonTotal;
          
          breakdown.push({
            type: 'variableAddon',
            name: addon.name,
            pricePerUnit: addon.pricePerUnit,
            unit: addon.unit,
            quantity: quantity,
            totalPrice: addonTotal
          });
        }
      });
    }
  }

  return {
    basePrice: 0,
    itemsPrice,
    fixedAddonsPrice,
    variableAddonsPrice,
    totalAddonsPrice: fixedAddonsPrice + variableAddonsPrice,
    totalPrice: itemsPrice + fixedAddonsPrice + variableAddonsPrice,
    peopleCount,
    breakdown
  };
};

// Static methods
customOrderSchema.statics.getByLocation = function(locationId) {
  return this.find({ locationId, isActive: true })
    .populate('locationId', 'name city')
    .populate('serviceId', 'name')
    .sort({ createdAt: -1 });
};

// Instance methods
customOrderSchema.methods.addItem = function(categoryName, itemData) {
  const category = this.categories.find(cat => cat.name === categoryName);
  if (!category) {
    throw new Error(`Category ${categoryName} not found`);
  }
  category.items.push(itemData);
  return this.save();
};

customOrderSchema.methods.addFixedAddon = function(addonData) {
  if (!this.addons) {
    this.addons = { enabled: true, fixedAddons: [], variableAddons: [] };
  }
  this.addons.fixedAddons.push(addonData);
  return this.save();
};

customOrderSchema.methods.addVariableAddon = function(addonData) {
  if (!this.addons) {
    this.addons = { enabled: true, fixedAddons: [], variableAddons: [] };
  }
  this.addons.variableAddons.push(addonData);
  return this.save();
};

customOrderSchema.set('toJSON', { virtuals: true });

const CustomOrder = mongoose.model("CustomOrder", customOrderSchema);

module.exports = CustomOrder;