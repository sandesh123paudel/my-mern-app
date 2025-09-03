const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    description: String,
    basePrice: {
      type: Number,
      required: true,
      default: 0,
    },
    minPeople: {
      type: Number,
      default: 1,
    },
    maxPeople: {
      type: Number,
      default: 1000,
    },
    // Package type determines structure
    packageType: {
      type: String,
      enum: ["categorized", "simple"],
      default: "categorized",
    },
    // Dynamic categories for categorized packages
    categories: [
      {
        name: {
          type: String,
          required: true,
        },
        enabled: {
          type: Boolean,
          default: true,
        },
        // Items always included in this category
        includedItems: [
          {
            name: {
              type: String,
              required: true,
            },
            priceModifier: {
              type: Number,
              default: 0,
            },
            // Options for this specific item
            options: [
              {
                name: {
                  type: String,
                  required: true,
                },
                priceModifier: {
                  type: Number,
                  default: 0,
                },
              },
            ],
          },
        ],
        // Customer selection groups
        selectionGroups: [
          {
            name: {
              type: String,
              required: true,
            },
            items: [
              {
                name: {
                  type: String,
                  required: true,
                },
                priceModifier: {
                  type: Number,
                  default: 0,
                },
                // Options for this specific item
                options: [
                  {
                    name: {
                      type: String,
                      required: true,
                    },
                    priceModifier: {
                      type: Number,
                      default: 0,
                    },
                  },
                ],
              },
            ],
            selectionType: {
              type: String,
              enum: ["single", "multiple"],
              default: "single",
            },
            minSelections: {
              type: Number,
              default: 1,
            },
            maxSelections: {
              type: Number,
              default: 1,
            },
            isRequired: {
              type: Boolean,
              default: true,
            },
          },
        ],
      },
    ],
    // Simple items for simple packages
    simpleItems: [
      {
        name: {
          type: String,
          required: true,
        },
        priceModifier: {
          type: Number,
          default: 0,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        // Whether this item has customer choices
        hasChoices: {
          type: Boolean,
          default: false,
        },
        selectionType: {
          type: String,
          enum: ["single", "multiple"],
          default: "single",
        },
        // Customer choices for this item (like rice selection)
        choices: [
          {
            name: {
              type: String,
              required: true,
            },
            priceModifier: {
              type: Number,
              default: 0,
            },
          },
        ],
        // Additional options (like spicy, large portion)
        options: [
          {
            name: {
              type: String,
              required: true,
            },
            priceModifier: {
              type: Number,
              default: 0,
            },
          },
        ],
      },
    ],
    // Enhanced addons system
    addons: {
      enabled: {
        type: Boolean,
        default: false,
      },
      // Fixed addons - price scales with number of people
      fixedAddons: [
        {
          name: {
            type: String,
            required: true,
          },
          pricePerPerson: {
            type: Number,
            required: true,
          },
          isDefault: {
            type: Boolean,
            default: false,
          },
        },
      ],
      // Variable addons - customer chooses quantity
      variableAddons: [
        {
          name: {
            type: String,
            required: true,
          },
          pricePerUnit: {
            type: Number,
            required: true,
          },
          unit: {
            type: String,
            default: "piece",
          },
          minQuantity: {
            type: Number,
            default: 0,
          },
          maxQuantity: {
            type: Number,
            default: 20,
          },
          isDefault: {
            type: Boolean,
            default: false,
          },
          defaultQuantity: {
            type: Number,
            default: 0,
          },
        },
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique menu names per service
menuSchema.index({ name: 1, serviceId: 1 }, { unique: true });

// Virtual to calculate package summary
menuSchema.virtual("packageSummary").get(function () {
  let summary = {
    totalItems: 0,
    totalCategories: 0,
    hasAddons: this.addons?.enabled || false,
    addonCount: 0,
  };

  if (this.packageType === "simple") {
    summary.totalItems = this.simpleItems?.length || 0;
  } else if (this.packageType === "categorized") {
    summary.totalCategories =
      this.categories?.filter((cat) => cat.enabled).length || 0;
    summary.totalItems =
      this.categories?.reduce((total, category) => {
        if (category.enabled) {
          const includedCount = category.includedItems?.length || 0;
          const selectionGroupItems =
            category.selectionGroups?.reduce((count, group) => {
              return count + (group.items?.length || 0);
            }, 0) || 0;
          return total + includedCount + selectionGroupItems;
        }
        return total;
      }, 0) || 0;
  }

  if (this.addons?.enabled) {
    summary.addonCount =
      (this.addons.fixedAddons?.length || 0) +
      (this.addons.variableAddons?.length || 0);
  }

  return summary;
});

// Method to validate package configuration
menuSchema.methods.validatePackage = function () {
  const errors = [];

  if (this.packageType === "categorized") {
    if (!this.categories || this.categories.length === 0) {
      errors.push("Categorized packages must have at least one category");
    } else {
      // Validate each category
      this.categories.forEach((category, index) => {
        if (!category.name || category.name.trim() === "") {
          errors.push(`Category ${index + 1} must have a name`);
        }

        if (category.enabled) {
          const hasIncludedItems =
            category.includedItems && category.includedItems.length > 0;
          const hasSelectionGroups =
            category.selectionGroups && category.selectionGroups.length > 0;

          if (!hasIncludedItems && !hasSelectionGroups) {
            errors.push(
              `Enabled category "${category.name}" must have at least one included item or selection group`
            );
          }

          // Validate selection groups
          if (category.selectionGroups) {
            category.selectionGroups.forEach((group, groupIndex) => {
              if (!group.name || group.name.trim() === "") {
                errors.push(
                  `Selection group ${groupIndex + 1} in category "${
                    category.name
                  }" must have a name`
                );
              }
              if (!group.items || group.items.length === 0) {
                errors.push(
                  `Selection group "${group.name}" must have at least one item`
                );
              }
            });
          }
        }
      });
    }
  } else if (this.packageType === "simple") {
    if (!this.simpleItems || this.simpleItems.length === 0) {
      errors.push("Simple packages must have at least one item");
    } else {
      // Validate simple items
      this.simpleItems.forEach((item, index) => {
        if (!item.name || item.name.trim() === "") {
          errors.push(`Simple item ${index + 1} must have a name`);
        }
      });
    }
  }

  if (this.minPeople > this.maxPeople) {
    errors.push("Minimum people cannot be greater than maximum people");
  }

  return errors;
};

// Method to calculate package price based on selections
menuSchema.methods.calculatePrice = function (selections, peopleCount) {
  let totalPrice = this.basePrice || 0;
  let priceBreakdown = {
    basePrice: this.basePrice || 0,
    itemModifiers: 0,
    optionModifiers: 0,
    choiceModifiers: 0,
    fixedAddons: 0,
    variableAddons: 0,
  };

  if (this.packageType === "simple") {
    // Calculate simple package price
    if (selections.simpleItems && this.simpleItems) {
      this.simpleItems.forEach((item, index) => {
        const itemSelection = selections.simpleItems[index];
        if (itemSelection) {
          // Add item price modifier
          if (item.priceModifier) {
            totalPrice += item.priceModifier;
            priceBreakdown.itemModifiers += item.priceModifier;
          }

          // Add choice price modifiers (for items with customer choices)
          if (item.hasChoices && item.choices && itemSelection.choices) {
            itemSelection.choices.forEach((choiceIndex) => {
              const choice = item.choices[choiceIndex];
              if (choice && choice.priceModifier) {
                totalPrice += choice.priceModifier;
                priceBreakdown.choiceModifiers += choice.priceModifier;
              }
            });
          }

          // Add option price modifiers (additional options like spicy)
          if (item.options && itemSelection.options) {
            itemSelection.options.forEach((optionIndex) => {
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
  } else if (this.packageType === "categorized") {
    // Calculate categorized package price
    if (selections.categories && this.categories) {
      this.categories.forEach((category) => {
        if (category.enabled && selections.categories[category.name]) {
          const categorySelection = selections.categories[category.name];

          // Add selection group item price modifiers
          if (category.selectionGroups) {
            category.selectionGroups.forEach((group) => {
              if (categorySelection[group.name]) {
                const groupSelections = categorySelection[group.name];
                groupSelections.forEach((itemIndex) => {
                  const item = group.items[itemIndex];
                  if (item) {
                    // Add item price modifier
                    if (item.priceModifier) {
                      totalPrice += item.priceModifier;
                      priceBreakdown.itemModifiers += item.priceModifier;
                    }

                    // Add option price modifiers for this item
                    if (
                      item.options &&
                      categorySelection[
                        `${group.name}_item_${itemIndex}_options`
                      ]
                    ) {
                      const itemOptions =
                        categorySelection[
                          `${group.name}_item_${itemIndex}_options`
                        ];
                      itemOptions.forEach((optionIndex) => {
                        const option = item.options[optionIndex];
                        if (option && option.priceModifier) {
                          totalPrice += option.priceModifier;
                          priceBreakdown.optionModifiers +=
                            option.priceModifier;
                        }
                      });
                    }
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
  if (this.addons && this.addons.enabled && selections.addons) {
    // Fixed addons (scale with people count)
    if (selections.addons.fixed && this.addons.fixedAddons) {
      selections.addons.fixed.forEach((addonIndex) => {
        const addon = this.addons.fixedAddons[addonIndex];
        if (addon && addon.pricePerPerson) {
          const addonTotal = addon.pricePerPerson * peopleCount;
          addonPrice += addonTotal;
          priceBreakdown.fixedAddons += addonTotal;
        }
      });
    }

    // Variable addons (based on quantity selected)
    if (selections.addons.variable && this.addons.variableAddons) {
      Object.entries(selections.addons.variable).forEach(
        ([addonIndex, quantity]) => {
          const addon = this.addons.variableAddons[parseInt(addonIndex)];
          if (addon && addon.pricePerUnit && quantity > 0) {
            const addonTotal = addon.pricePerUnit * quantity;
            addonPrice += addonTotal;
            priceBreakdown.variableAddons += addonTotal;
          }
        }
      );
    }
  }

  return {
    basePrice: this.basePrice || 0,
    baseTotalPrice: (this.basePrice || 0) * peopleCount,
    priceModifiers: totalPrice - (this.basePrice || 0),
    addonPrice: addonPrice,
    grandTotal: totalPrice * peopleCount + addonPrice,
    perPersonPrice: totalPrice,
    peopleCount: peopleCount,
    breakdown: priceBreakdown,
  };
};

const Menu = mongoose.models.Menu || mongoose.model("Menu", menuSchema);

module.exports = Menu;
