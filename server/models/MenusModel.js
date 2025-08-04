import mongoose from "mongoose";

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
    price: {
      type: Number,
      required: true,
    },
    minPeople: {
      type: Number,
      default: 1,
    },
    maxPeople: Number,
    categories: {
      entree: {
        enabled: {
          type: Boolean,
          default: false,
        },
        // Pre-selected items (always included)
        includedItems: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MenuItem",
          },
        ],
        // Selection groups for customer choice
        selectionGroups: [
          {
            name: String, // e.g., "Choose your protein"
            items: [
              {
                type: mongoose.Schema.Types.ObjectId,
                ref: "MenuItem",
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
      mains: {
        enabled: {
          type: Boolean,
          default: false,
        },
        includedItems: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MenuItem",
          },
        ],
        selectionGroups: [
          {
            name: String,
            items: [
              {
                type: mongoose.Schema.Types.ObjectId,
                ref: "MenuItem",
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
      desserts: {
        enabled: {
          type: Boolean,
          default: false,
        },
        includedItems: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MenuItem",
          },
        ],
        selectionGroups: [
          {
            name: String,
            items: [
              {
                type: mongoose.Schema.Types.ObjectId,
                ref: "MenuItem",
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
const Menu = mongoose.model("Menu", menuSchema);
export default Menu;
