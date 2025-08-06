import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";

const MenuItems = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");

  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "entree",
    isVegetarian: false,
    isVegan: false,
    allergens: [],
    image: "",
    isActive: true,
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    setMenuItems([
      {
        _id: "1",
        name: "Furandana",
        description: "Traditional Nepali appetizer",
        category: "entree",
        price: 12,
        isVegetarian: true,
        isVegan: false,
        allergens: ["gluten"],
        isActive: true,
      },
      {
        _id: "2",
        name: "Aaloo Mix Achar",
        description: "Spicy potato pickle",
        category: "entree",
        price: 10,
        isVegetarian: true,
        isVegan: true,
        allergens: [],
        isActive: true,
      },
      {
        _id: "3",
        name: "Chicken Chhoila",
        description: "Grilled chicken with spices",
        category: "entree",
        price: 14,
        isVegetarian: false,
        isVegan: false,
        allergens: [],
        isActive: true,
      },
      {
        _id: "4",
        name: "Roast",
        description: "Marinated roasted chicken",
        category: "entree",
        price: 16,
        isVegetarian: false,
        isVegan: false,
        allergens: [],
        isActive: true,
      },
      {
        _id: "5",
        name: "Lollipop",
        description: "Chicken drumettes",
        category: "entree",
        price: 15,
        isVegetarian: false,
        isVegan: false,
        allergens: [],
        isActive: true,
      },
    ]);
  }, []);

  const resetForm = () => {
    setItemForm({
      name: "",
      description: "",
      price: "",
      category: "entree",
      isVegetarian: false,
      isVegan: false,
      allergens: [],
      image: "",
      isActive: true,
    });
  };

  const handleSaveItem = () => {
    if (editingItem) {
      setMenuItems((prev) =>
        prev.map((item) =>
          item._id === editingItem._id
            ? { ...item, ...itemForm, _id: editingItem._id }
            : item
        )
      );
    } else {
      const newItem = {
        ...itemForm,
        _id: Date.now().toString(),
        price: parseFloat(itemForm.price),
      };
      setMenuItems((prev) => [...prev, newItem]);
    }
    setShowItemForm(false);
    setEditingItem(null);
    resetForm();
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      ...item,
      allergens: item.allergens.join(", "),
    });
    setShowItemForm(true);
  };

  const handleDeleteItem = (itemId) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      setMenuItems((prev) => prev.filter((item) => item._id !== itemId));
    }
  };

  const filteredItems =
    filterCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === filterCategory);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Menu Items Management
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage individual menu items that can be used in menus
          </p>
        </div>
        <button
          onClick={() => setShowItemForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Plus size={20} />
          Add Menu Item
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Filter by Category:
          </label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="entree">Entree</option>
            <option value="mains">Mains</option>
            <option value="desserts">Desserts</option>
          </select>
          <span className="text-sm text-gray-500">
            {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item._id}
            className="bg-white rounded-lg shadow-md p-4 border"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    item.category === "entree"
                      ? "bg-orange-100 text-orange-800"
                      : item.category === "mains"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {item.category}
                </span>
              </div>
              <div className="flex gap-1">
                {item.isVegetarian && (
                  <span
                    className="inline-block w-4 h-4 bg-green-500 rounded-full"
                    title="Vegetarian"
                  ></span>
                )}
                {item.isVegan && (
                  <span
                    className="inline-block w-4 h-4 bg-green-700 rounded-full"
                    title="Vegan"
                  ></span>
                )}
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {item.description}
            </p>

            <div className="flex justify-between items-center mb-3">
              <span className="text-xl font-bold text-green-600">
                ${item.price}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  item.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {item.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            {item.allergens && item.allergens.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500">Allergens:</p>
                <div className="flex flex-wrap gap-1">
                  {item.allergens.map((allergen, index) => (
                    <span
                      key={index}
                      className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs"
                    >
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleEditItem(item)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={() => handleDeleteItem(item._id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Item Modal */}
      {showItemForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">
                {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
              </h2>
              <button
                onClick={() => {
                  setShowItemForm(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={itemForm.name}
                    onChange={(e) =>
                      setItemForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Chicken Momo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={itemForm.category}
                    onChange={(e) =>
                      setItemForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="entree">Entree</option>
                    <option value="mains">Mains</option>
                    <option value="desserts">Desserts</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) =>
                    setItemForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Brief description of the dish..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemForm.price}
                    onChange={(e) =>
                      setItemForm((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="12.99"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergens
                </label>
                <input
                  type="text"
                  value={
                    Array.isArray(itemForm.allergens)
                      ? itemForm.allergens.join(", ")
                      : itemForm.allergens
                  }
                  onChange={(e) =>
                    setItemForm((prev) => ({
                      ...prev,
                      allergens: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="gluten, dairy, nuts (comma separated)"
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={itemForm.isVegetarian}
                    onChange={(e) =>
                      setItemForm((prev) => ({
                        ...prev,
                        isVegetarian: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Vegetarian</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={itemForm.isVegan}
                    onChange={(e) =>
                      setItemForm((prev) => ({
                        ...prev,
                        isVegan: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Vegan</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={itemForm.isActive}
                    onChange={(e) =>
                      setItemForm((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowItemForm(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
              >
                <Save size={20} />
                {editingItem ? "Update Item" : "Create Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuItems;
