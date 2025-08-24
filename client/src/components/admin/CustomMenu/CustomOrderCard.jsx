import React from "react";
import { Edit, Trash2, Users, List, Package, Plus } from "lucide-react";

const CustomOrderCard = ({ customOrder, onEdit, onDelete }) => {
  const {
    _id,
    name,
    description,
    minPeople,
    maxPeople,
    categories = [],
    addons = {},
    isActive,
    serviceId,
  } = customOrder;

  // Calculate statistics
  const totalCategories = categories.length;
  const totalItems = categories.reduce(
    (total, cat) => total + (cat.items?.length || 0),
    0
  );

  // Enhanced addon statistics
  const fixedAddonsCount = addons?.fixedAddons?.length || 0;
  const variableAddonsCount = addons?.variableAddons?.length || 0;
  const totalAddons = fixedAddonsCount + variableAddonsCount;
  const addonsEnabled = addons?.enabled || false;

  return (
    <div
      className={`bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
        isActive
          ? "border-green-200 hover:border-green-300"
          : "border-red-200 hover:border-red-300"
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 rounded-t-lg ${isActive ? "bg-green-50" : "bg-red-50"}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3
              className="text-lg font-semibold text-gray-900 truncate"
              title={name}
            >
              {name}
            </h3>
            {description && (
              <p
                className="text-sm text-gray-600 mt-1 line-clamp-2"
                title={description}
              >
                {description}
              </p>
            )}
          </div>
          <div
            className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
              isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Service */}
        <div className="flex items-center gap-2 text-sm">
          <Package size={16} className="text-gray-400" />
          <span className="text-gray-600">
            {serviceId?.name || "Unknown Service"}
          </span>
        </div>

        {/* People Range */}
        <div className="flex items-center gap-2">
          <Users size={16} className="text-blue-600" />
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {minPeople}-{maxPeople} people
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <List size={16} />
            Menu Items
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-purple-600">
                {totalCategories}
              </div>
              <div className="text-xs text-gray-500">Categories</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">
                {totalItems}
              </div>
              <div className="text-xs text-gray-500">Items</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {totalAddons}
              </div>
              <div className="text-xs text-gray-500">Addons</div>
            </div>
          </div>
        </div>

        {/* Categories Preview */}
        {categories.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3">
            <h5 className="text-sm font-medium text-blue-700 mb-2">
              Categories
            </h5>
            <div className="flex flex-wrap gap-1">
              {categories.slice(0, 4).map((category, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                >
                  {category.displayName || category.name} (
                  {category.items?.length || 0})
                </span>
              ))}
              {categories.length > 4 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  +{categories.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 pt-0">
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(customOrder)}
            className="flex-1 bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Edit size={16} />
            Edit Menu
          </button>
          <button
            onClick={() => onDelete(_id)}
            className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            title="Delete Custom Order"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomOrderCard;
