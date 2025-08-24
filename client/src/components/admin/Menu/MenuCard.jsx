import React from "react";
import {
  Edit,
  Trash2,
  MapPin,
  Users,
  CheckCircle2,
  Settings,
  Package,
  List,
} from "lucide-react";

const MenuCard = ({ menu, onEdit, onDelete }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(price);
  };

  const getPackageTypeInfo = () => {
    if (menu.packageType === "simple") {
      return {
        type: "Simple Package",
        icon: <List size={14} className="text-purple-500" />,
        color: "purple",
      };
    } else {
      return {
        type: "Categorized Package",
        icon: <Package size={14} className="text-primary-green" />,
        color: "blue",
      };
    }
  };

  const getEnabledCategories = () => {
    if (menu.packageType === "simple") {
      return menu.simpleItems?.length > 0 ? ["Simple Items"] : [];
    }

    const categories = [];
    if (menu.categories && Array.isArray(menu.categories)) {
      menu.categories.forEach((category) => {
        if (category.enabled) {
          categories.push(category.name);
        }
      });
    }
    return categories;
  };

  const getTotalSelectionGroups = () => {
    if (menu.packageType === "simple") {
      return 0; // Simple packages don't have selection groups
    }

    let total = 0;
    if (menu.categories && Array.isArray(menu.categories)) {
      menu.categories.forEach((category) => {
        if (category.enabled && category.selectionGroups) {
          total += category.selectionGroups.length;
        }
      });
    }
    return total;
  };

  const getTotalIncludedItems = () => {
    if (menu.packageType === "simple") {
      return menu.simpleItems?.length || 0;
    }

    let total = 0;
    if (menu.categories && Array.isArray(menu.categories)) {
      menu.categories.forEach((category) => {
        if (category.enabled && category.includedItems) {
          total += category.includedItems.length;
        }
      });
    }
    return total;
  };

  const getAddonsInfo = () => {
    if (!menu.addons || !menu.addons.enabled) {
      return { hasAddons: false, fixedCount: 0, variableCount: 0 };
    }

    const fixedCount = menu.addons.fixedAddons?.length || 0;
    const variableCount = menu.addons.variableAddons?.length || 0;
    const selectionGroupsCount = menu.addons.selectionGroups?.length || 0;

    return {
      hasAddons: true,
      fixedCount,
      variableCount,
      selectionGroupsCount,
      totalCount: fixedCount + variableCount + selectionGroupsCount,
    };
  };

  const packageTypeInfo = getPackageTypeInfo();
  const enabledCategories = getEnabledCategories();
  const addonsInfo = getAddonsInfo();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-800">{menu.name}</h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                menu.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {menu.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Package Type */}
          <div className="flex items-center gap-2 mb-2">
            {packageTypeInfo.icon}
            <span
              className={`text-sm font-medium text-${packageTypeInfo.color}-600`}
            >
              {packageTypeInfo.type}
            </span>
          </div>

          {menu.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {menu.description}
            </p>
          )}

          {/* Location and Service Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={14} className="text-gray-400" />
              <span>
                {menu.locationId?.name || "Unknown Location"} -{" "}
                {menu.locationId?.city || ""}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Settings size={14} className="text-gray-400" />
              <span>{menu.serviceId?.name || "Unknown Service"}</span>
            </div>
          </div>

          {/* Price and People Info */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-green-600">
                {formatPrice(menu.basePrice || menu.price)}
              </span>
              <span className="text-xs text-gray-500">per person</span>
            </div>

            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users size={14} className="text-gray-400" />
              <span>
                {menu.minPeople || 1}
                {menu.maxPeople && menu.maxPeople !== 1000
                  ? `-${menu.maxPeople}`
                  : "+"}{" "}
                people
              </span>
            </div>
          </div>

          {/* Categories and Configuration */}
          <div className="space-y-3 mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {menu.packageType === "simple" ? "Items:" : "Categories:"}
              </h4>
              <div className="flex flex-wrap gap-1">
                {enabledCategories.length > 0 ? (
                  enabledCategories.map((category, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary-green text-primary-brown text-xs rounded"
                    >
                      {category}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">
                    {menu.packageType === "simple"
                      ? "No items configured"
                      : "No categories enabled"}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle2 size={14} className="text-green-500" />
                <span className="text-gray-600">
                  {getTotalIncludedItems()}{" "}
                  {menu.packageType === "simple" ? "items" : "included items"}
                </span>
              </div>
              {menu.packageType !== "simple" && (
                <div className="flex items-center gap-1">
                  <Settings size={14} className="text-primary-green" />
                  <span className="text-gray-600">
                    {getTotalSelectionGroups()} selection groups
                  </span>
                </div>
              )}
            </div>

            {/* Addons Info */}
            {addonsInfo.hasAddons && (
              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  Add-ons Available:
                </h4>
                <div className="flex flex-wrap gap-1 text-xs">
                  {addonsInfo.fixedCount > 0 && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
                      {addonsInfo.fixedCount} Fixed
                    </span>
                  )}
                  {addonsInfo.variableCount > 0 && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                      {addonsInfo.variableCount} Variable
                    </span>
                  )}
                  {addonsInfo.selectionGroupsCount > 0 && (
                    <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded">
                      {addonsInfo.selectionGroupsCount} Groups
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500">
            Created: {new Date(menu.createdAt).toLocaleDateString()}
            {menu.updatedAt !== menu.createdAt && (
              <span className="ml-2">
                • Updated: {new Date(menu.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <button
          onClick={() => onEdit(menu)}
          className="flex-1 bg-primary-green hover:bg-primary-green text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition-colors"
        >
          <Edit size={16} />
          Edit Package
        </button>
        <button
          onClick={() => onDelete(menu._id)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition-colors"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
};

export default MenuCard;
