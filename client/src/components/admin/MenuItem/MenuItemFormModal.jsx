import React, { useState, useEffect } from "react";
import { Save, X, Plus, Minus } from "lucide-react";
import toast from "react-hot-toast";
import {
  createMenuItem,
  updateMenuItem,
} from "../../../services/menuItemService";

const MenuItemFormModal = ({ isOpen, onClose, menuItem, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    isVegetarian: false,
    isVegan: false,
    allergens: [],
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [allergenInput, setAllergenInput] = useState("");

  // Common allergens for quick selection
  const commonAllergens = [
    "Gluten",
    "Dairy",
    "Eggs",
    "Nuts",
    "Peanuts",
    "Shellfish",
    "Fish",
    "Soy",
    "Sesame",
    "Sulphites",
  ];

  useEffect(() => {
    if (menuItem) {
      setFormData({
        name: menuItem.name || "",
        description: menuItem.description || "",
        price: menuItem.price?.toString() || "",
        category: menuItem.category || "",
        isVegetarian: menuItem.isVegetarian || false,
        isVegan: menuItem.isVegan || false,
        allergens: menuItem.allergens || [],
        isActive: menuItem.isActive ?? true,
      });
    } else {
      resetForm();
    }
  }, [menuItem, isOpen]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      isVegetarian: false,
      isVegan: false,
      allergens: [],
      isActive: true,
    });
    setAllergenInput("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        // If vegan is selected, automatically set vegetarian to true
        ...(name === "isVegan" && checked ? { isVegetarian: true } : {}),
        // If vegetarian is unchecked, automatically uncheck vegan
        ...(name === "isVegetarian" && !checked ? { isVegan: false } : {}),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addAllergen = (allergen) => {
    const allergenToAdd = allergen || allergenInput.trim();
    if (allergenToAdd && !formData.allergens.includes(allergenToAdd)) {
      setFormData((prev) => ({
        ...prev,
        allergens: [...prev.allergens, allergenToAdd],
      }));
      setAllergenInput("");
    }
  };

  const removeAllergen = (allergenToRemove) => {
    setFormData((prev) => ({
      ...prev,
      allergens: prev.allergens.filter(
        (allergen) => allergen !== allergenToRemove
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
      };

      let result;
      if (menuItem) {
        result = await updateMenuItem(menuItem._id, submitData);
      } else {
        result = await createMenuItem(submitData);
      }

      if (result.success) {
        toast.success(
          result.message ||
            `Menu item ${menuItem ? "updated" : "created"} successfully`
        );
        onClose();
        onSuccess();
        resetForm();
      } else {
        toast.error(
          result.error ||
            `Failed to ${menuItem ? "update" : "create"} menu item`
        );
      }
    } catch (error) {
      toast.error(
        `An error occurred while ${
          menuItem ? "updating" : "creating"
        } the menu item`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 -top-[50px] bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {menuItem ? "Edit Menu Item" : "Add New Menu Item"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Item Name *
              </label>
              <input
                type="text"
                name="name"
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Grilled Salmon"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Category *
              </label>
              <select
                name="category"
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select a category</option>
                <option value="entree">Entree</option>
                <option value="mains">Mains</option>
                <option value="desserts">Desserts</option>
                <option value="addons">Addons</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Price (AUD) *
              </label>
              <input
                type="number"
                name="price"
                step="0.01"
                min="0"
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              name="description"
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the menu item..."
            />
          </div>

          {/* Dietary Options */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Dietary Options
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isVegetarian"
                  checked={formData.isVegetarian}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm">Vegetarian</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isVegan"
                  checked={formData.isVegan}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm">Vegan</span>
              </label>
            </div>
          </div>

          {/* Allergens */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Allergens</label>

            {/* Common allergens quick-add */}
            <div className="mb-3">
              <div className="text-xs text-gray-600 mb-2">
                Quick add common allergens:
              </div>
              <div className="flex flex-wrap gap-2">
                {commonAllergens.map((allergen) => (
                  <button
                    key={allergen}
                    type="button"
                    onClick={() => addAllergen(allergen)}
                    disabled={formData.allergens.includes(allergen)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      formData.allergens.includes(allergen)
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    }`}
                  >
                    {allergen}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom allergen input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={allergenInput}
                onChange={(e) => setAllergenInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addAllergen())
                }
                className="flex-1 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Add custom allergen..."
              />
              <button
                type="button"
                onClick={() => addAllergen()}
                className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Current allergens */}
            {formData.allergens.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.allergens.map((allergen, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded"
                  >
                    {allergen}
                    <button
                      type="button"
                      onClick={() => removeAllergen(allergen)}
                      className="text-orange-600 hover:text-orange-800"
                    >
                      <Minus size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Active Status */}
          <div className="mb-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Active (visible to customers)</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              {loading ? "Saving..." : menuItem ? "Update Item" : "Create Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuItemFormModal;
