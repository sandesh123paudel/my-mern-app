import React from "react";
import { Edit, Trash2, Leaf, AlertCircle } from "lucide-react";

const MenuItemCard = ({ menuItem, onEdit, onDelete }) => {
  const getCategoryColor = (category) => {
    switch (category) {
      case "entree":
        return "bg-green-100 text-green-800 border-green-200";
      case "mains":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "desserts":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {menuItem.name}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                menuItem.category
              )}`}
            >
              {menuItem.category}
            </span>
          </div>
          
          {menuItem.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {menuItem.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg font-bold text-green-600">
              {formatPrice(menuItem.price)}
            </span>
            
            <div className="flex items-center gap-2">
              {menuItem.isVegan && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  <Leaf size={12} />
                  Vegan
                </span>
              )}
              {menuItem.isVegetarian && !menuItem.isVegan && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                  <Leaf size={12} />
                  Vegetarian
                </span>
              )}
            </div>
          </div>
          
          {menuItem.allergens && menuItem.allergens.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-1">
                <AlertCircle size={14} className="text-orange-500" />
                <span className="text-xs font-medium text-orange-700">Allergens:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {menuItem.allergens.map((allergen, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded"
                  >
                    {allergen}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            Created: {new Date(menuItem.createdAt).toLocaleDateString()}
            {menuItem.updatedAt !== menuItem.createdAt && (
              <span className="ml-2">
                • Updated: {new Date(menuItem.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="ml-4">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              menuItem.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {menuItem.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <button
          onClick={() => onEdit(menuItem)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition-colors"
        >
          <Edit size={16} />
          Edit
        </button>
        <button
          onClick={() => onDelete(menuItem._id)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition-colors"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
};

export default MenuItemCard;