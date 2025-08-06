import React from "react";
import { Filter, X } from "lucide-react";

const MenuItemFilters = ({ 
  filters, 
  setFilters, 
  onClearFilters 
}) => {
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }));
  };

  const hasActiveFilters = () => {
    return filters.category || 
           filters.isVegetarian !== undefined || 
           filters.isVegan !== undefined;
  };

  const clearAllFilters = () => {
    setFilters({
      category: undefined,
      isVegetarian: undefined,
      isVegan: undefined
    });
    onClearFilters();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex flex-col lg:flex-row gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option value="entree">Entree</option>
            <option value="mains">Mains</option>
            <option value="desserts">Desserts</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dietary Options
          </label>
          <div className="flex gap-3">
            <select
              value={filters.isVegetarian === undefined ? '' : filters.isVegetarian.toString()}
              onChange={(e) => handleFilterChange('isVegetarian', e.target.value === '' ? undefined : e.target.value === 'true')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Items</option>
              <option value="true">Vegetarian Only</option>
              <option value="false">Non-Vegetarian Only</option>
            </select>
            
            <select
              value={filters.isVegan === undefined ? '' : filters.isVegan.toString()}
              onChange={(e) => handleFilterChange('isVegan', e.target.value === '' ? undefined : e.target.value === 'true')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Items</option>
              <option value="true">Vegan Only</option>
              <option value="false">Non-Vegan Only</option>
            </select>
          </div>
        </div>

        {hasActiveFilters() && (
          <div className="flex items-end">
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <X size={16} />
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h5>
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Category: {filters.category}
              </span>
            )}
            {filters.isVegetarian !== undefined && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                {filters.isVegetarian ? 'Vegetarian Only' : 'Non-Vegetarian Only'}
              </span>
            )}
            {filters.isVegan !== undefined && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                {filters.isVegan ? 'Vegan Only' : 'Non-Vegan Only'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuItemFilters;