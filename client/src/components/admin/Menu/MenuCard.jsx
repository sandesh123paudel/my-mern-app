import React from "react";
import { Edit, Trash2, MapPin, Users, CheckCircle2, Settings } from "lucide-react";

const MenuCard = ({ menu, onEdit, onDelete }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(price);
  };

  const getEnabledCategories = () => {
    const categories = [];
    if (menu.categories?.entree?.enabled) categories.push('Entree');
    if (menu.categories?.mains?.enabled) categories.push('Mains');
    if (menu.categories?.desserts?.enabled) categories.push('Desserts');
    if (menu.categories?.addons?.enabled) categories.push('Addons'); // Added addons
    return categories;
  };

  const getTotalSelectionGroups = () => {
    let total = 0;
    if (menu.categories?.entree?.selectionGroups) {
      total += menu.categories.entree.selectionGroups.length;
    }
    if (menu.categories?.mains?.selectionGroups) {
      total += menu.categories.mains.selectionGroups.length;
    }
    if (menu.categories?.desserts?.selectionGroups) {
      total += menu.categories.desserts.selectionGroups.length;
    }
    if (menu.categories?.addons?.selectionGroups) { // Added addons
      total += menu.categories.addons.selectionGroups.length;
    }
    return total;
  };

  const getTotalIncludedItems = () => {
    let total = 0;
    if (menu.categories?.entree?.includedItems) {
      total += menu.categories.entree.includedItems.length;
    }
    if (menu.categories?.mains?.includedItems) {
      total += menu.categories.mains.includedItems.length;
    }
    if (menu.categories?.desserts?.includedItems) {
      total += menu.categories.desserts.includedItems.length;
    }
    if (menu.categories?.addons?.includedItems) { // Added addons
      total += menu.categories.addons.includedItems.length;
    }
    return total;
  };

  const enabledCategories = getEnabledCategories();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {menu.name}
            </h3>
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
                {menu.locationId?.name || 'Unknown Location'} - {menu.locationId?.city || ''}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Settings size={14} className="text-gray-400" />
              <span>{menu.serviceId?.name || 'Unknown Service'}</span>
            </div>
          </div>
          
          {/* Price and People Info */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-green-600">
                {formatPrice(menu.price)}
              </span>
              <span className="text-xs text-gray-500">per person</span>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users size={14} className="text-gray-400" />
              <span>
                {menu.minPeople || 1}
                {menu.maxPeople ? `-${menu.maxPeople}` : '+'} people
              </span>
            </div>
          </div>
          
          {/* Categories and Configuration */}
          <div className="space-y-3 mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Categories:</h4>
              <div className="flex flex-wrap gap-1">
                {enabledCategories.length > 0 ? (
                  enabledCategories.map((category) => (
                    <span
                      key={category}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {category}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">No categories enabled</span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle2 size={14} className="text-green-500" />
                <span className="text-gray-600">
                  {getTotalIncludedItems()} included items
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Settings size={14} className="text-blue-500" />
                <span className="text-gray-600">
                  {getTotalSelectionGroups()} selection groups
                </span>
              </div>
            </div>
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
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition-colors"
        >
          <Edit size={16} />
          Edit Menu
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