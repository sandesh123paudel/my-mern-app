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
// --- NEW: Import react-hot-toast ---
import { toast } from "react-hot-toast";

const MenuSelectionModal = ({ menu, onClose, onProceedToConfirmation }) => {
  // State to track item selections within selection groups.
  const [selections, setSelections] = useState({});
  // State to track the number of people.
  const [peopleCount, setPeopleCount] = useState("");

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
    setPeopleCount(String(menu.minPeople || 1));
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
      // Add addon to selection (no limit check needed for addons)
      newSelections = [...currentSelections, itemId];
    } else {
      // Remove addon from selection
      newSelections = currentSelections.filter((id) => id !== itemId);
    }

    setSelections((prev) => ({
      ...prev,
      [key]: newSelections,
    }));
  };

  // --- UPDATED: Handles item selection with real-time validation ---
  const handleItemSelection = (
    categoryName,
    groupIndex,
    itemId,
    isSelected,
    group // Pass the entire group object for more context
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
      // Handle multiple selections
      if (isSelected) {
        // --- NEW: Real-time check for max selections ---
        if (
          group.maxSelections &&
          currentSelections.length >= group.maxSelections
        ) {
          toast.error(
            `You can only select up to ${group.maxSelections} options for "${group.name}".`
          );
          return; // Prevent adding more items than allowed
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

  // Handlers for people count
  const handlePeopleCountChange = (value) => {
    const numValue = parseInt(value) || 0;
    const minPeople = menu.minPeople || 1;
    const maxPeople = menu.maxPeople || 1000;

    if (value === "" || (numValue >= minPeople && numValue <= maxPeople)) {
      setPeopleCount(value);
    }
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

  // --- UPDATED: Order placement logic with validation ---
  const handlePlaceOrder = () => {
    // --- NEW: Validation Logic ---
    const categoriesToValidate = ["entree", "mains", "desserts"];

    for (const categoryName of categoriesToValidate) {
      const categoryData = menu.categories?.[categoryName];

      if (categoryData?.enabled && categoryData.selectionGroups) {
        for (const [
          groupIndex,
          group,
        ] of categoryData.selectionGroups.entries()) {
          // Check if a required group has at least one selection
          if (group.isRequired) {
            const key = `${categoryName}-${groupIndex}`;
            const selectedItems = selections[key] || [];
            if (selectedItems.length === 0) {
              // Use toast to display the error message
              toast.error(
                `Please make a selection for "${
                  group.name
                }" in the ${categoryName.toLowerCase()} section.`
              );
              return; // Stop the function execution
            }
          }
        }
      }
    }
    // --- End of Validation Logic ---

    const addonData = calculateAddonsPrice();
    const orderDetails = {
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

    // console.log("Order Details:", orderDetails);
    // console.log("Selected Items Details:");
    // getAllSelectedItems().forEach((item, index) => {
    //   console.log(
    //     `${index + 1}. ${item.name} (${item.type}) - Category: ${item.category}`
    //   );
    // });
    // console.log("Selected Add-ons Details:");
    // getSelectedAddons().forEach((addon, index) => {
    //   console.log(
    //     `${index + 1}. ${addon.name} - ${formatPrice(
    //       addon.pricePerPerson
    //     )} per person (Total: ${formatPrice(addon.totalPrice)})`
    //   );
    // });
    // onClose();
    onProceedToConfirmation(orderDetails);
  };

  // Enhanced addon rendering with clearer messaging
  const renderAddonCategory = (categoryData) => {
    if (!categoryData?.enabled) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-primary-brown capitalize">
            Add-ons (Optional)
          </h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
            All Optional
          </span>
        </div>

        {/* Clear messaging about addons being optional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-700">
            <strong>Optional Add-ons:</strong> Select any additional items you'd
            like to include. Each addon will be charged per person and added to
            your total.
          </p>
        </div>

        {categoryData.selectionGroups &&
          categoryData.selectionGroups.length > 0 && (
            <div className="space-y-4">
              {categoryData.selectionGroups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="mb-3">
                    <div className="flex items-start sm:items-center justify-between mb-1 gap-2">
                      <h5 className="font-medium text-primary-brown text-sm flex-1">
                        {group.name}
                      </h5>
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium flex-shrink-0">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Select any add-ons you'd like (completely optional)
                    </p>
                  </div>

                  <div className="space-y-2">
                    {group.items.map((item, itemIndex) => {
                      const isSelected = isItemSelected(
                        "addons",
                        groupIndex,
                        item._id
                      );
                      return (
                        <div
                          key={itemIndex}
                          className={`flex items-start sm:items-center justify-between py-3 cursor-pointer rounded-lg px-3 gap-2 transition-all ${
                            isSelected
                              ? "bg-blue-50 border border-blue-200"
                              : "hover:bg-gray-50 border border-transparent"
                          }`}
                          onClick={() =>
                            handleItemSelection(
                              "addons",
                              groupIndex,
                              item._id,
                              !isSelected,
                              group // Pass the whole group
                            )
                          }
                        >
                          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center mt-0.5 sm:mt-0 flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium text-primary-brown block">
                                {item.name}
                              </span>
                              {item.description && (
                                <span className="text-xs text-gray-600 block mt-1">
                                  {item.description}
                                </span>
                              )}
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                                {item.allergens &&
                                  item.allergens.length > 0 && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                                      <AlertCircle size={8} />
                                      Allergens
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-sm font-semibold text-blue-600">
                              +{formatPrice(item.price)}
                            </span>
                            <span className="text-xs text-gray-500">
                              per person
                            </span>
                            {isSelected && (
                              <span className="text-xs text-blue-600 font-medium mt-1">
                                Total:{" "}
                                {formatPrice(
                                  item.price * (parseInt(peopleCount) || 0)
                                )}
                              </span>
                            )}
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

  // Renders the content for regular categories (entree, mains, desserts)
  const renderCategoryContent = (categoryName, categoryData) => {
    if (!categoryData?.enabled) return null;

    return (
      <div className="mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-primary-brown mb-3 capitalize border-b border-gray-200 pb-2">
          {categoryName}
        </h3>
        {categoryData.includedItems &&
          categoryData.includedItems.length > 0 && (
            <div className="mb-4">
              {categoryData.includedItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start sm:items-center justify-between py-2 border-b border-gray-100 last:border-b-0 gap-2"
                >
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="bg-green-500 rounded-full p-1 flex-shrink-0 mt-0.5 sm:mt-0">
                      <Check size={12} className="text-white" />
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
                  <span className="text-xs text-green-600 font-medium flex-shrink-0">
                    Included
                  </span>
                </div>
              ))}
            </div>
          )}
        {categoryData.selectionGroups &&
          categoryData.selectionGroups.length > 0 && (
            <div className="space-y-4">
              {categoryData.selectionGroups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="mb-3">
                    <div className="flex items-start sm:items-center justify-between mb-1 gap-2">
                      <h5 className="font-medium text-primary-brown text-sm flex-1">
                        {group.name}
                      </h5>
                      {group.isRequired && (
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-medium flex-shrink-0">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {group.selectionType === "single"
                        ? "Choose one option"
                        : `Choose up to ${
                            group.maxSelections || "unlimited"
                          } options`}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item, itemIndex) => {
                      const isSelected = isItemSelected(
                        categoryName,
                        groupIndex,
                        item._id
                      );
                      return (
                        <div
                          key={itemIndex}
                          className="flex items-start sm:items-center justify-between py-2 cursor-pointer hover:bg-gray-50 rounded px-2 gap-2"
                          onClick={() =>
                            // --- UPDATED: Pass the entire group object ---
                            handleItemSelection(
                              categoryName,
                              groupIndex,
                              item._id,
                              !isSelected,
                              group
                            )
                          }
                        >
                          <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="flex items-center mt-0.5 sm:mt-0 flex-shrink-0">
                              {group.selectionType === "single" ? (
                                <input
                                  type="radio"
                                  name={`${categoryName}-${groupIndex}`}
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-4 h-4 text-primary-green focus:ring-primary-green"
                                />
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-4 h-4 text-primary-green focus:ring-primary-green rounded"
                                />
                              )}
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
                                {item.allergens &&
                                  item.allergens.length > 0 && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                                      <AlertCircle size={8} />
                                      Allergens
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                          {item.price > 0 && (
                            <div className="flex flex-col items-end flex-shrink-0">
                              <span className="text-sm font-semibold text-primary-green">
                                +{formatPrice(item.price)}
                              </span>
                              <span className="text-xs text-gray-500">
                                per person
                              </span>
                            </div>
                          )}
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

  // Enhanced price breakdown in the sidebar
  const renderEnhancedPriceBreakdown = () => {
    const addonData = calculateAddonsPrice();

    return (
      <div className="mb-4 pt-3 border-t border-gray-300 bg-white rounded-lg p-3">
        <div className="space-y-2">
          {/* Base package price */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Package ({peopleCount} × {formatPrice(menu.price)}):
            </span>
            <span className="text-gray-900 font-medium">
              {formatPrice(calculateBasePrice())}
            </span>
          </div>

          {/* Individual addon breakdown */}
          {addonData.breakdown.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-gray-500 font-medium mt-2 mb-1">
                Add-ons:
              </div>
              {addonData.breakdown.map((addon, index) => (
                <div key={index} className="flex justify-between text-xs pl-2">
                  <span className="text-gray-600">
                    {addon.name} ({peopleCount} ×{" "}
                    {formatPrice(addon.pricePerPerson)}):
                  </span>
                  <span className="text-blue-600 font-medium">
                    {formatPrice(addon.totalPrice)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm border-t pt-1">
                <span className="text-gray-600">Total Add-ons:</span>
                <span className="text-blue-600 font-medium">
                  {formatPrice(addonData.total)}
                </span>
              </div>
            </div>
          )}

          {/* Final total */}
          <div className="border-t pt-2">
            <div className="flex justify-between text-base sm:text-lg font-semibold">
              <span className="text-primary-brown">Total:</span>
              <span className="text-primary-brown">
                {formatPrice(calculateTotalOrderPrice())}
              </span>
            </div>
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
      {/* === CORRECTED SECTION START === */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white rounded-lg w-full max-w-7xl shadow-2xl flex flex-col min-h-[90vh] sm:min-h-0 lg:max-h-[95vh] lg:overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* === CORRECTED SECTION END === */}
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
          <h2 className="text-lg sm:text-xl font-bold mb-2">{menu.name}</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-white/90 text-sm">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span className="truncate">
                {menu.locationId?.name || "Location"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>
                {menu.minPeople || 1}
                {menu.maxPeople ? `-${menu.maxPeople}` : "+"} people
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row flex-1 lg:max-h-[calc(95vh-120px)]">
          {/* Main content area: now scrolls only on large screens */}
          <div className="flex-1 p-3 sm:p-4 lg:overflow-y-auto">
            {renderCategoryContent("entree", menu.categories?.entree)}
            {renderCategoryContent("mains", menu.categories?.mains)}
            {renderCategoryContent("desserts", menu.categories?.desserts)}
            {renderAddonCategory(menu.categories?.addons)}
          </div>

          {/* Sidebar: structure refined for proper scrolling on large screens */}
          <div className="w-full lg:w-80 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200 flex-shrink-0 flex flex-col">
            <div className="lg:overflow-y-auto flex-1 lg:min-h-0">
              <div className="p-3 sm:p-4">
                <h3 className="text-lg font-bold text-primary-brown mb-4">
                  Confirm Order
                </h3>

                {/* Package Price Display */}
                <div className="text-center mb-4 p-3 bg-white rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-primary-brown">
                    {formatPrice(menu.price || 0)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Package Price Per Person
                  </div>
                </div>

                {/* People Count Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of people
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={decrementPeople}
                      disabled={parseInt(peopleCount) <= (menu.minPeople || 1)}
                      className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-md transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min={menu.minPeople || 1}
                      max={menu.maxPeople || 1000}
                      value={peopleCount}
                      onChange={(e) => handlePeopleCountChange(e.target.value)}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (
                          value === "" ||
                          parseInt(value) < (menu.minPeople || 1)
                        ) {
                          setPeopleCount(String(menu.minPeople || 1));
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-primary-green text-center"
                    />
                    <button
                      onClick={incrementPeople}
                      disabled={
                        parseInt(peopleCount) >= (menu.maxPeople || 1000)
                      }
                      className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-md transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Min: {menu.minPeople || 1}, Max: {menu.maxPeople || 1000}
                  </p>
                </div>

                {/* Selected Items Summary */}
                <div className="mb-4 bg-white rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Selected Items:
                  </h4>
                  <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                    {getAllSelectedItems().length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No items selected yet
                      </p>
                    ) : (
                      getAllSelectedItems().map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center py-1 text-sm"
                        >
                          <div
                            className={`rounded-full p-0.5 mr-2 flex-shrink-0 ${
                              item.type === "addon"
                                ? "bg-blue-500"
                                : "bg-green-500"
                            }`}
                          >
                            <Check size={8} className="text-white" />
                          </div>
                          <span
                            className={`truncate ${
                              item.type === "addon"
                                ? "text-blue-700"
                                : "text-primary-brown"
                            }`}
                          >
                            {item.name} {item.type === "addon" && "(Add-on)"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Selected Add-ons Display */}
                {getSelectedAddons().length > 0 && (
                  <div className="mb-4 bg-blue-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-700 mb-2">
                      Selected Add-ons Summary:
                    </h4>
                    <div className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-200">
                      {getSelectedAddons().map((addon, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-1 text-sm"
                        >
                          <span className="text-blue-700 truncate mr-2">
                            {addon.name}
                          </span>
                          <span className="text-blue-700 font-medium flex-shrink-0">
                            {formatPrice(addon.totalPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enhanced Price Breakdown */}
                <div className="mb-4">{renderEnhancedPriceBreakdown()}</div>

                {/* Note */}
                <div className="mb-4">
                  <p className="text-xs text-red-500 bg-yellow-50 p-2 rounded">
                    * Deposits made are non-refundable when orders are cancelled
                  </p>
                </div>

                {/* Place Order Button */}
                <div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePlaceOrder}
                    disabled={
                      !peopleCount ||
                      parseInt(peopleCount) < (menu.minPeople || 1)
                    }
                    className="w-full bg-red-600 disabled:bg-gray-400 text-white py-3 rounded-md font-semibold hover:bg-red-700 disabled:hover:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={18} color="white" />
                    Place an Order
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MenuSelectionModal;
