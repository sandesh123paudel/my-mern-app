import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  MapPin,
  Check,
  Leaf,
  AlertCircle,
  ShoppingCart,
  X,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "react-hot-toast";

const MenuSelectionModal = ({ menu, onClose, onProceedToConfirmation }) => {
  // State to track item selections within selection groups.
  const [selections, setSelections] = useState({});
  // State to track the number of people.
  const [peopleCount, setPeopleCount] = useState("");
  // State to track validation errors
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    // Add the "no-scroll" class to the body when the modal is mounted
    document.body.classList.add("no-scroll");

    // Clean up the effect by removing the class when the modal is unmounted
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, []);

  useEffect(() => {
    // Set the initial people count based on the menu's minimum.
    const initialCount = menu.minPeople || 1;
    setPeopleCount(String(initialCount));
  }, [menu.minPeople]);

  // Helper function to format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(price);
  };

  // Enhanced addon selection handler
  const handleAddonSelection = (groupIndex, itemId, isSelected) => {
    const key = `addons-${groupIndex}`;
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

  // Simplified item selection handler
  const handleItemSelection = (
    categoryName,
    groupIndex,
    itemId,
    isSelected,
    group
  ) => {
    // Special handling for addons
    if (categoryName === "addons") {
      handleAddonSelection(groupIndex, itemId, isSelected);
      return;
    }

    const key = `${categoryName}-${groupIndex}`;
    const currentSelections = selections[key] || [];

    let newSelections;
    if (group.selectionType === "single") {
      newSelections = isSelected ? [itemId] : [];
    } else {
      if (isSelected) {
        if (
          group.maxSelections &&
          currentSelections.length >= group.maxSelections
        ) {
          toast.error(
            `You can only select up to ${group.maxSelections} options for "${group.name}".`
          );
          return;
        }
        newSelections = [...currentSelections, itemId];
      } else {
        newSelections = currentSelections.filter((id) => id !== itemId);
      }
    }

    setSelections((prev) => ({
      ...prev,
      [key]: newSelections,
    }));
  };

  // Checks if an item is currently selected in a specific selection group.
  const isItemSelected = (categoryName, groupIndex, itemId) => {
    const key = `${categoryName}-${groupIndex}`;
    return (selections[key] || []).includes(itemId);
  };

  // Calculates the base package price (menu price * people count)
  const calculateBasePrice = () => {
    const numPeople = parseInt(peopleCount) || 0;
    return (menu.price || 0) * numPeople;
  };

  // Enhanced addon price calculation with detailed breakdown
  const calculateAddonsPrice = () => {
    const numPeople = parseInt(peopleCount) || 0;
    let addonsPrice = 0;
    const addonBreakdown = [];

    const addonsCategory = menu.categories?.addons;
    if (addonsCategory?.enabled && addonsCategory?.selectionGroups) {
      addonsCategory.selectionGroups.forEach((group, groupIndex) => {
        const key = `addons-${groupIndex}`;
        const selectedAddonIds = selections[key] || [];

        selectedAddonIds.forEach((addonId) => {
          const addonItem = group.items.find((item) => item._id === addonId);
          if (addonItem) {
            const itemTotal = addonItem.price * numPeople;
            addonsPrice += itemTotal;
            addonBreakdown.push({
              name: addonItem.name,
              pricePerPerson: addonItem.price,
              totalPrice: itemTotal,
              groupName: group.name,
            });
          }
        });
      });
    }

    return { total: addonsPrice, breakdown: addonBreakdown };
  };

  // Calculates the total price of the order
  const calculateTotalOrderPrice = () => {
    const addonData = calculateAddonsPrice();
    return calculateBasePrice() + addonData.total;
  };

  // Get selected addons for display purposes
  const getSelectedAddons = () => {
    const selectedAddons = [];
    const addonsCategory = menu.categories?.addons;

    if (addonsCategory?.enabled && addonsCategory?.selectionGroups) {
      addonsCategory.selectionGroups.forEach((group, groupIndex) => {
        const key = `addons-${groupIndex}`;
        const selectedAddonIds = selections[key] || [];

        selectedAddonIds.forEach((addonId) => {
          const addonItem = group.items.find((item) => item._id === addonId);
          if (addonItem) {
            selectedAddons.push({
              ...addonItem,
              groupName: group.name,
              pricePerPerson: addonItem.price,
              totalPrice: addonItem.price * (parseInt(peopleCount) || 0),
            });
          }
        });
      });
    }

    return selectedAddons;
  };

  // Gathers all selected items (included and user-selected) for the final order summary.
  const getAllSelectedItems = () => {
    const allSelected = [];
    Object.entries(menu.categories || {}).forEach(
      ([categoryName, categoryData]) => {
        // Add included items from all categories
        if (categoryData?.enabled && categoryData.includedItems) {
          categoryData.includedItems.forEach((item) => {
            allSelected.push({
              ...item,
              type: "included",
              category: categoryName,
            });
          });
        }
        // Add selected items from selection groups
        if (categoryData?.enabled && categoryData.selectionGroups) {
          categoryData.selectionGroups.forEach((group, groupIndex) => {
            const key = `${categoryName}-${groupIndex}`;
            const selectedItems = selections[key] || [];
            selectedItems.forEach((itemId) => {
              const item = group.items.find((item) => item._id === itemId);
              if (item) {
                allSelected.push({
                  ...item,
                  type: categoryName === "addons" ? "addon" : "selected",
                  category: categoryName,
                  groupName: group.name,
                });
              }
            });
          });
        }
      }
    );
    return allSelected;
  };

  // Simplified people count handlers
  const handlePeopleCountChange = (value) => {
    // Allow any input while typing
    setPeopleCount(value);
  };

  const incrementPeople = () => {
    const current = parseInt(peopleCount) || 0;
    const maxPeople = menu.maxPeople || 1000;
    if (current < maxPeople) {
      setPeopleCount(String(current + 1));
    }
  };

  const decrementPeople = () => {
    const current = parseInt(peopleCount) || 0;
    const minPeople = menu.minPeople || 1;
    if (current > minPeople) {
      setPeopleCount(String(current - 1));
    }
  };

  // Validation only on form submission
  const validateOrderOnSubmit = () => {
    const errors = [];
    const numPeople = parseInt(peopleCount) || 0;
    const minPeople = menu.minPeople || 1;
    const maxPeople = menu.maxPeople || 1000;

    // Validate people count
    if (!peopleCount || peopleCount === "") {
      errors.push("Please enter the number of people");
    } else if (numPeople < minPeople) {
      errors.push(`Minimum ${minPeople} people required for this menu`);
    } else if (numPeople > maxPeople) {
      errors.push(`Maximum ${maxPeople} people allowed for this menu`);
    }

    // Validate required selections
    const categoriesToValidate = ["entree", "mains", "desserts"];

    for (const categoryName of categoriesToValidate) {
      const categoryData = menu.categories?.[categoryName];

      if (categoryData?.enabled && categoryData.selectionGroups) {
        for (const [
          groupIndex,
          group,
        ] of categoryData.selectionGroups.entries()) {
          if (group.isRequired) {
            const key = `${categoryName}-${groupIndex}`;
            const selectedItems = selections[key] || [];
            if (selectedItems.length === 0) {
              errors.push(
                `Please make a selection for "${group.name}" in ${categoryName}`
              );
            }
          }
        }
      }
    }

    return errors;
  };

  // Enhanced order placement logic with comprehensive validation
  const handlePlaceOrder = () => {
    const validationErrors = validateOrderOnSubmit();

    if (validationErrors.length > 0) {
      // Show first error only using toast
      toast.error(validationErrors[0]);
      return;
    }

    const addonData = calculateAddonsPrice();
    const orderDetails = {
      menuId: menu._id, // Add the actual menu ID here
      menu: {
        name: menu.name,
        price: menu.price,
        locationId: menu.locationId,
      },
      peopleCount: parseInt(peopleCount),
      selectedItems: getAllSelectedItems(),
      pricing: {
        basePrice: calculateBasePrice(),
        addonsPrice: addonData.total,
        total: calculateTotalOrderPrice(),
      },
      selectedAddons: getSelectedAddons(),
      selections: selections,
    };

    onProceedToConfirmation(orderDetails);
  };

  // Render dietary info badges inline
  const renderInlineDietaryInfo = (item) => {
    const badges = [];

    if (item.isVegan) {
      badges.push(
        <span
          key="vegan"
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded ml-2"
        >
          <Leaf size={8} />V
        </span>
      );
    } else if (item.isVegetarian) {
      badges.push(
        <span
          key="vegetarian"
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded ml-2"
        >
          <Leaf size={8} />
          Veg
        </span>
      );
    }

    if (item.allergens && item.allergens.length > 0) {
      badges.push(
        <span
          key="allergens"
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded ml-2"
        >
          <AlertCircle size={8} />
          {item.allergens.join(", ")}
        </span>
      );
    }

    return badges;
  };

  // Simplified addon rendering
  const renderAddonCategory = (categoryData) => {
    if (!categoryData?.enabled) return null;

    return (
      <div className="mb-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Add-ons (Optional)
          </h3>
          <p className="text-sm text-gray-600">
            Select any additional items you'd like to include with your order.
          </p>
        </div>

        {categoryData.selectionGroups &&
          categoryData.selectionGroups.length > 0 && (
            <div className="space-y-4">
              {categoryData.selectionGroups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <h4 className="font-medium text-gray-900 mb-3">
                    {group.name}
                  </h4>

                  <div className="space-y-3">
                    {group.items.map((item, itemIndex) => {
                      const isSelected = isItemSelected(
                        "addons",
                        groupIndex,
                        item._id
                      );
                      return (
                        <div
                          key={itemIndex}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() =>
                            handleItemSelection(
                              "addons",
                              groupIndex,
                              item._id,
                              !isSelected,
                              group
                            )
                          }
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 text-blue-600 rounded mt-0.5"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center flex-wrap">
                                    <h5 className="font-medium text-gray-900">
                                      {item.name}
                                    </h5>
                                    {renderInlineDietaryInfo(item)}
                                  </div>
                                  <div className="text-right">
                                    <div className="text-blue-600 font-semibold">
                                      +{formatPrice(item.price)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      per person
                                    </div>
                                  </div>
                                </div>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    );
  };

  // Simplified category rendering
  const renderCategoryContent = (categoryName, categoryData) => {
    if (!categoryData?.enabled) return null;

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 capitalize mb-4 border-b border-gray-200 pb-2">
          {categoryName}
        </h3>

        {/* Included Items */}
        {categoryData.includedItems &&
          categoryData.includedItems.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Included with your package:
              </h4>
              <div className="grid gap-2">
                {categoryData.includedItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="bg-green-500 rounded-full p-1 mt-0.5">
                      <Check size={12} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{item.name}</h5>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </p>
                      )}
                      {renderInlineDietaryInfo(item)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Selection Groups */}
        {categoryData.selectionGroups &&
          categoryData.selectionGroups.length > 0 && (
            <div className="space-y-6">
              {categoryData.selectionGroups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{group.name}</h4>
                    {group.isRequired && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                        Required
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    {group.selectionType === "single"
                      ? "Choose one option"
                      : `Choose up to ${
                          group.maxSelections || "unlimited"
                        } options`}
                  </p>

                  <div className="space-y-3">
                    {group.items.map((item, itemIndex) => {
                      const isSelected = isItemSelected(
                        categoryName,
                        groupIndex,
                        item._id
                      );
                      return (
                        <div
                          key={itemIndex}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() =>
                            handleItemSelection(
                              categoryName,
                              groupIndex,
                              item._id,
                              !isSelected,
                              group
                            )
                          }
                        >
                          <div className="flex items-start gap-3">
                            {group.selectionType === "single" ? (
                              <input
                                type="radio"
                                name={`${categoryName}-${groupIndex}`}
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 text-green-600 mt-0.5"
                              />
                            ) : (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 text-green-600 rounded mt-0.5"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center flex-wrap">
                                  <h5 className="font-medium text-gray-900">
                                    {item.name}
                                  </h5>
                                  {renderInlineDietaryInfo(item)}
                                </div>
                              </div>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    );
  };

  // Simplified price breakdown
  const renderPriceBreakdown = () => {
    const addonData = calculateAddonsPrice();

    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">
              Package ({peopleCount} × {formatPrice(menu.price)}):
            </span>
            <span className="font-medium">
              {formatPrice(calculateBasePrice())}
            </span>
          </div>

          {addonData.breakdown.length > 0 && (
            <>
              {addonData.breakdown.map((addon, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    {addon.name} ({peopleCount} ×{" "}
                    {formatPrice(addon.pricePerPerson)}):
                  </span>
                  <span className="text-blue-600 font-medium">
                    {formatPrice(addon.totalPrice)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-600">Add-ons Total:</span>
                <span className="text-blue-600 font-medium">
                  {formatPrice(addonData.total)}
                </span>
              </div>
            </>
          )}

          <div className="flex justify-between pt-2 border-t">
            <span className="font-medium text-gray-900">Total:</span>
            <span className="font-bold text-lg text-gray-900">
              {formatPrice(calculateTotalOrderPrice())}
            </span>
          </div>
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
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-50 rounded-xl w-full max-w-6xl shadow-2xl flex flex-col min-h-[90vh] sm:min-h-0 lg:max-h-[95vh] lg:overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-green-600 text-white p-3 sm:p-4 rounded-t-xl flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-sm hidden sm:inline">Back</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/90 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <h2 className="text-lg sm:text-xl font-bold mb-2">{menu.name}</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-white/90 text-sm">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span className="truncate">
                {menu.locationId?.name || "Location"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>
                {menu.minPeople || 1}-{menu.maxPeople || 1000} people
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 p-3 sm:p-6 lg:overflow-y-auto">
            {renderCategoryContent("entree", menu.categories?.entree)}
            {renderCategoryContent("mains", menu.categories?.mains)}
            {renderCategoryContent("desserts", menu.categories?.desserts)}
            {renderAddonCategory(menu.categories?.addons)}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-3 sm:p-6 lg:overflow-y-auto flex-shrink-0">
            '
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Order Details
            </h3>
            {/* Package Price */}
            <div className="text-center mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xl sm:text-2xl font-bold text-green-700">
                {formatPrice(menu.price || 0)}
              </div>
              <div className="text-sm text-green-600">per person</div>
            </div>
            {/* People Count */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of People *
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={decrementPeople}
                  className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min={menu.minPeople || 1}
                  max={menu.maxPeople || 1000}
                  value={peopleCount}
                  onChange={(e) => handlePeopleCountChange(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center"
                  placeholder="Enter number"
                />
                <button
                  onClick={incrementPeople}
                  className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Min: {menu.minPeople || 1}, Max: {menu.maxPeople || 1000}
              </p>
            </div>
            {/* Price Breakdown */}
            <div className="mb-4 sm:mb-6">{renderPriceBreakdown()}</div>
            {/* Note */}
            <div className="mb-4 sm:mb-6">
              <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                * Deposits made are non-refundable when orders are cancelled
              </p>
            </div>
            {/* Place Order Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePlaceOrder}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              Continue to Order Details
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MenuSelectionModal;
