import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Leaf,
  AlertCircle,
  ShoppingCart,
  X,
  Plus,
  Minus,
} from "lucide-react";

// This function processes all menus to get a unique, consolidated list of items
const getAllItems = (menus) => {
  const categories = {
    entree: { includedItems: [], selectionGroups: [] },
    mains: { includedItems: [], selectionGroups: [] },
    desserts: { includedItems: [], selectionGroups: [] },
    addons: { includedItems: [], selectionGroups: [] },
  };

  const itemMap = new Map();

  menus.forEach((menu) => {
    Object.entries(menu.categories || {}).forEach(
      ([categoryName, categoryData]) => {
        if (categoryData?.enabled) {
          // Collect included items
          (categoryData.includedItems || []).forEach((item) => {
            if (!itemMap.has(item._id)) {
              itemMap.set(item._id, { ...item, category: categoryName });
              categories[categoryName].includedItems.push(item);
            }
          });

          // Collect items from selection groups
          (categoryData.selectionGroups || []).forEach((group) => {
            (group.items || []).forEach((item) => {
              if (!itemMap.has(item._id)) {
                itemMap.set(item._id, {
                  ...item,
                  category: categoryName,
                  groupName: group.name,
                });
                // For custom order, we can treat all selections as a single group per category
                const singleGroup = categories[categoryName].selectionGroups[0];
                if (!singleGroup) {
                  categories[categoryName].selectionGroups.push({
                    name: `Available ${categoryName}`,
                    selectionType: "multiple",
                    items: [item],
                  });
                } else {
                  singleGroup.items.push(item);
                }
              }
            });
          });
        }
      }
    );
  });

  return categories;
};

const CustomOrderModal = ({ menus, onClose }) => {
  const [selections, setSelections] = useState({});
  const [peopleCount, setPeopleCount] = useState("1");
  const [itemsByCategory, setItemsByCategory] = useState({});

  useEffect(() => {
    // Add the "no-scroll" class to the body
    document.body.classList.add("no-scroll");

    // Process menus to get a list of all available items
    setItemsByCategory(getAllItems(menus));

    // Clean up the effect by removing the class when the modal is unmounted
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [menus]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(price);
  };

  const handleItemSelection = (categoryName, itemId, isSelected) => {
    const key = categoryName;
    const currentSelections = selections[key] || [];

    let newSelections;
    if (isSelected) {
      newSelections = [...currentSelections, itemId];
    } else {
      newSelections = currentSelections.filter((id) => id !== itemId);
    }

    setSelections((prev) => ({
      ...prev,
      [key]: newSelections,
    }));
  };

  const isItemSelected = (categoryName, itemId) => {
    const key = categoryName;
    return (selections[key] || []).includes(itemId);
  };

  const calculateTotalPrice = () => {
    const numPeople = parseInt(peopleCount) || 0;
    const allItems = getAllSelectedItems();
    const subtotal = allItems.reduce((acc, item) => acc + item.price, 0);
    return subtotal * numPeople;
  };

  const getAllSelectedItems = () => {
    const allSelected = [];
    Object.entries(selections).forEach(([categoryName, selectedIds]) => {
      const categoryData = itemsByCategory[categoryName];
      if (!categoryData) return;

      const allCategoryItems = [
        ...(categoryData.includedItems || []),
        ...(categoryData.selectionGroups?.[0]?.items || []),
      ];

      selectedIds.forEach((itemId) => {
        const item = allCategoryItems.find((item) => item._id === itemId);
        if (item) {
          allSelected.push({
            ...item,
            type: "custom_selected",
            category: categoryName,
          });
        }
      });
    });

    return allSelected;
  };

  const incrementPeople = () => {
    const current = parseInt(peopleCount) || 0;
    setPeopleCount(String(current + 1));
  };

  const decrementPeople = () => {
    const current = parseInt(peopleCount) || 0;
    if (current > 1) {
      setPeopleCount(String(current - 1));
    }
  };

  const handlePeopleCountChange = (value) => {
    const numValue = parseInt(value) || 0;
    if (value === "" || numValue >= 1) {
      setPeopleCount(value);
    }
  };

  const handlePlaceOrder = () => {
    const orderDetails = {
      menuName: "Custom Order",
      peopleCount: parseInt(peopleCount),
      selectedItems: getAllSelectedItems(),
      subtotal: calculateTotalPrice(),
      selections: selections,
    };
    console.log("Custom Order Details:", orderDetails);
    onClose();
  };

  const renderCategoryContent = (categoryName, categoryData) => {
    if (
      !categoryData ||
      (!categoryData.includedItems.length &&
        !categoryData.selectionGroups.length)
    ) {
      return null;
    }

    // Combine all selectable items from the category for the custom menu
    const selectableItems = [
      ...categoryData.includedItems,
      ...(categoryData.selectionGroups?.[0]?.items || []),
    ];

    return (
      <div className="mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-primary-brown mb-3 capitalize border-b border-gray-200 pb-2">
          {categoryName === "addons" ? "Add-ons" : categoryName}
        </h3>
        <div className="space-y-2">
          {selectableItems.map((item, itemIndex) => {
            const isSelected = isItemSelected(categoryName, item._id);
            return (
              <div
                key={itemIndex}
                className="flex items-start sm:items-center justify-between py-2 cursor-pointer hover:bg-gray-50 rounded px-2 gap-2"
                onClick={() =>
                  handleItemSelection(categoryName, item._id, !isSelected)
                }
              >
                <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="flex items-center mt-0.5 sm:mt-0 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-primary-green focus:ring-primary-green rounded"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-primary-brown block">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                      {item.isVegan && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                          <Leaf size={8} />V
                        </span>
                      )}
                      {item.isVegetarian && !item.isVegan && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                          <Leaf size={8} />
                          Veg
                        </span>
                      )}
                      {item.allergens && item.allergens.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                          <AlertCircle size={8} />
                          Allergens
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-primary-green flex-shrink-0">
                  {formatPrice(item.price)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white rounded-lg w-full max-w-7xl shadow-2xl flex flex-col min-h-[90vh] sm:min-h-0 sm:max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-primary-green text-white p-3 sm:p-4 flex-shrink-0 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-sm hidden sm:inline">Back</span>
            </motion.button>
            <button
              onClick={onClose}
              className="text-white/90 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <h2 className="text-lg sm:text-xl font-bold mb-2">
            Create Your Custom Menu
          </h2>
          <p className="text-sm">
            Select from all available items to build your perfect meal.
          </p>
        </div>
        <div className="flex flex-col xl:flex-row flex-1 overflow-hidden">
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
            {renderCategoryContent("entree", itemsByCategory?.entree)}
            {renderCategoryContent("mains", itemsByCategory?.mains)}
            {renderCategoryContent("desserts", itemsByCategory?.desserts)}
            {renderCategoryContent("addons", itemsByCategory?.addons)}
          </div>
          <div className="w-full xl:w-80 bg-gray-50 border-t xl:border-t-0 xl:border-l border-gray-200 p-3 sm:p-4 flex-shrink-0">
            <h3 className="text-lg font-bold text-primary-brown mb-4">
              Your Order Summary
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of people
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={decrementPeople}
                  disabled={parseInt(peopleCount) <= 1}
                  className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-md transition-colors"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min="1"
                  value={peopleCount}
                  onChange={(e) => handlePeopleCountChange(e.target.value)}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value === "" || parseInt(value) < 1) {
                      setPeopleCount("1");
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-primary-green text-center"
                />
                <button
                  onClick={incrementPeople}
                  className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="mb-4 max-h-32 sm:max-h-40 overflow-y-auto bg-white rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Selected Items:
              </h4>
              {getAllSelectedItems().length === 0 ? (
                <p className="text-sm text-gray-500">No items selected yet</p>
              ) : (
                getAllSelectedItems().map((item, index) => (
                  <div key={index} className="flex items-center py-1 text-sm">
                    <div className="bg-green-500 rounded-full p-0.5 mr-2 flex-shrink-0">
                      <Check size={8} className="text-white" />
                    </div>
                    <span className="text-primary-brown truncate">
                      {item.name}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="mb-4 pt-3 border-t border-gray-300 bg-white rounded-lg p-3">
              <div className="text-base sm:text-lg font-semibold text-primary-brown">
                Total Price: {formatPrice(calculateTotalPrice())}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePlaceOrder}
              disabled={getAllSelectedItems().length === 0}
              className="w-full bg-red-600 disabled:bg-gray-400 text-white py-3 rounded-md font-semibold hover:bg-red-700 disabled:hover:bg-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              Place Custom Order
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CustomOrderModal;
