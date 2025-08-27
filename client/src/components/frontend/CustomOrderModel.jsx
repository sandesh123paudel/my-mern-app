import React, { useState, useEffect, useCallback } from "react";
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
  Users,
  MapPin,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getCustomOrdersByLocation } from "../../services/customOrderServices";

const CustomOrderModal = ({
  onClose,
  onProceedToConfirmation,
  selectedLocationId,
}) => {
  const [selections, setSelections] = useState({
    categories: {},
    addons: [],
  });
  const [peopleCount, setPeopleCount] = useState("15");
  const [loading, setLoading] = useState(true);
  const [customOrders, setCustomOrders] = useState([]);
  const [selectedCustomOrderId, setSelectedCustomOrderId] = useState("");
  const [selectedCustomOrder, setSelectedCustomOrder] = useState(null);

  // Load custom orders for the selected location
  useEffect(() => {
    const loadCustomOrders = async () => {
      if (!selectedLocationId) {
        setCustomOrders([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await getCustomOrdersByLocation(selectedLocationId);
        if (result.success && result.data) {
          setCustomOrders(result.data);
          // Auto-select first custom order if available
          if (result.data.length > 0) {
            setSelectedCustomOrderId(result.data[0]._id);
            setSelectedCustomOrder(result.data[0]);
          }
        } else {
          setCustomOrders([]);
          toast.error("No custom orders available for this location");
        }
      } catch (error) {
        console.error("Error loading custom orders:", error);
        toast.error("Failed to load custom orders");
        setCustomOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadCustomOrders();
  }, [selectedLocationId]);

  // Handle custom order selection change
  const handleCustomOrderChange = (customOrderId) => {
    const customOrder = customOrders.find((co) => co._id === customOrderId);
    setSelectedCustomOrderId(customOrderId);
    setSelectedCustomOrder(customOrder);
    // Reset selections when changing custom order
    setSelections({
      categories: {},
      addons: [],
    });
    // Reset people count to minimum
    if (customOrder) {
      setPeopleCount(String(customOrder.minPeople || 15));
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(price);
  };

  // Handle category item selection
  const handleCategoryItemSelection = (categoryName, itemId, isSelected) => {
    setSelections((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryName]: isSelected
          ? [...(prev.categories[categoryName] || []), { itemId, quantity: 1 }]
          : (prev.categories[categoryName] || []).filter(
              (sel) => sel.itemId !== itemId
            ),
      },
    }));
  };

  // Handle addon selection
  const handleAddonSelection = (addonId, quantity) => {
    setSelections((prev) => ({
      ...prev,
      addons:
        quantity > 0
          ? [
              ...prev.addons.filter((addon) => addon.addonId !== addonId),
              { addonId, quantity },
            ]
          : prev.addons.filter((addon) => addon.addonId !== addonId),
    }));
  };

  // Check if item is selected
  const isItemSelected = (categoryName, itemId) => {
    return (selections.categories[categoryName] || []).some(
      (sel) => sel.itemId === itemId
    );
  };

  // Get addon quantity
  const getAddonQuantity = (addonId) => {
    const addon = selections.addons.find((a) => a.addonId === addonId);
    return addon ? addon.quantity : 0;
  };

  // People count handlers
  const incrementPeople = () => {
    const current = parseInt(peopleCount) || 0;
    const maxPeople = selectedCustomOrder?.maxPeople || 1000;
    if (current < maxPeople) {
      setPeopleCount(String(current + 1));
    }
  };

  const decrementPeople = () => {
    const current = parseInt(peopleCount) || 0;
    const minPeople = selectedCustomOrder?.minPeople || 15;
    if (current > minPeople) {
      setPeopleCount(String(current - 1));
    }
  };

  const handlePeopleCountChange = (value) => {
    setPeopleCount(value);
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!selectedCustomOrder) return 0;

    let totalPrice = 0;
    const numPeople = parseInt(peopleCount) || 0;

    // Calculate category items price
    Object.entries(selections.categories).forEach(
      ([categoryName, categorySelections]) => {
        const category = selectedCustomOrder.categories.find(
          (cat) => cat.name === categoryName
        );
        if (category) {
          categorySelections.forEach((selection) => {
            const item = category.items.find(
              (item) => item._id === selection.itemId
            );
            if (item) {
              totalPrice +=
                item.pricePerPerson * numPeople * (selection.quantity || 1);
            }
          });
        }
      }
    );

    // Calculate addons price
    if (selectedCustomOrder.addons?.enabled) {
      // Fixed addons
      if (selectedCustomOrder.addons.fixedAddons) {
        selections.addons.forEach((addonSelection) => {
          const addon = selectedCustomOrder.addons.fixedAddons.find(
            (a) => a._id === addonSelection.addonId
          );
          if (addon) {
            totalPrice +=
              addon.pricePerPerson * numPeople * addonSelection.quantity;
          }
        });
      }

      // Variable addons
      if (selectedCustomOrder.addons.variableAddons) {
        selections.addons.forEach((addonSelection) => {
          const addon = selectedCustomOrder.addons.variableAddons.find(
            (a) => a._id === addonSelection.addonId
          );
          if (addon) {
            totalPrice += addon.pricePerUnit * addonSelection.quantity;
          }
        });
      }
    }

    return totalPrice;
  };

  // Get all selected items for display
  const getAllSelectedItems = () => {
    const allSelected = [];

    if (!selectedCustomOrder) return allSelected;

    // Add category items
    Object.entries(selections.categories).forEach(
      ([categoryName, categorySelections]) => {
        const category = selectedCustomOrder.categories.find(
          (cat) => cat.name === categoryName
        );
        if (category) {
          categorySelections.forEach((selection) => {
            const item = category.items.find(
              (item) => item._id === selection.itemId
            );
            if (item) {
              allSelected.push({
                ...item,
                itemId: item._id,
                type: "selected",
                category: categoryName,
                quantity: selection.quantity || 1,
                totalPrice:
                  item.pricePerPerson *
                  parseInt(peopleCount) *
                  (selection.quantity || 1),
              });
            }
          });
        }
      }
    );

    // Add addons
    if (selectedCustomOrder.addons?.enabled) {
      selections.addons.forEach((addonSelection) => {
        // Check fixed addons
        if (selectedCustomOrder.addons.fixedAddons) {
          const addon = selectedCustomOrder.addons.fixedAddons.find(
            (a) => a._id === addonSelection.addonId
          );
          if (addon) {
            allSelected.push({
              ...addon,
              addonId: addon._id,
              type: "fixedAddon",
              category: "addons",
              quantity: addonSelection.quantity,
              totalPrice:
                addon.pricePerPerson *
                parseInt(peopleCount) *
                addonSelection.quantity,
            });
          }
        }

        // Check variable addons
        if (selectedCustomOrder.addons.variableAddons) {
          const addon = selectedCustomOrder.addons.variableAddons.find(
            (a) => a._id === addonSelection.addonId
          );
          if (addon) {
            allSelected.push({
              ...addon,
              addonId: addon._id,
              type: "variableAddon",
              category: "addons",
              quantity: addonSelection.quantity,
              totalPrice: addon.pricePerUnit * addonSelection.quantity,
            });
          }
        }
      });
    }

    return allSelected;
  };

  // Get category selection counts
  const getCategorySelectionCounts = () => {
    const counts = {
      entree: 0,
      mains: 0,
      total: 0,
    };

    Object.entries(selections.categories).forEach(
      ([categoryName, categorySelections]) => {
        const count = categorySelections.length;
        counts.total += count;

        if (categoryName === "entree") {
          counts.entree = count;
        } else if (categoryName === "mains") {
          counts.mains = count;
        }
      }
    );

    return counts;
  };

  // Validate custom order with specific requirements
  const validateCustomOrder = () => {
    const errors = [];
    const numPeople = parseInt(peopleCount) || 0;

    if (!selectedCustomOrder) {
      errors.push("Please select a custom order configuration");
      return errors;
    }

    if (!peopleCount || peopleCount === "") {
      errors.push("Please enter the number of people");
    } else if (numPeople < selectedCustomOrder.minPeople) {
      errors.push(`Minimum ${selectedCustomOrder.minPeople} people required`);
    } else if (numPeople > selectedCustomOrder.maxPeople) {
      errors.push(`Maximum ${selectedCustomOrder.maxPeople} people allowed`);
    }

    // Get selection counts
    const counts = getCategorySelectionCounts();

    // **NEW VALIDATION REQUIREMENTS**

    // Check minimum items from Entrée (at least 2)
    if (counts.entree < 2) {
      errors.push(
        `Please select at least 2 items from Entrée (currently selected: ${counts.entree})`
      );
    }

    // Check minimum items from Main (at least 3)
    if (counts.mains < 3) {
      errors.push(
        `Please select at least 3 items from Main Courses (currently selected: ${counts.mains})`
      );
    }

    // Check total minimum items (at least 6)
    if (counts.total < 6) {
      errors.push(
        `Please select at least 6 items total to complete your custom order (currently selected: ${counts.total})`
      );
    }

    // **ADDON VALIDATION - OPTIONAL BUT WITH MINIMUM QUANTITIES IF CHOSEN**
    if (selectedCustomOrder.addons?.enabled) {
      // Validate fixed addons - only if user has selected any quantity
      if (selectedCustomOrder.addons.fixedAddons) {
        selectedCustomOrder.addons.fixedAddons.forEach((addon) => {
          const currentQuantity = getAddonQuantity(addon._id);
          // Only validate if user has selected this addon (quantity > 0)
          if (
            currentQuantity > 0 &&
            addon.minQuantity &&
            addon.minQuantity > 0
          ) {
            if (currentQuantity < addon.minQuantity) {
              errors.push(
                `"${addon.name}" requires minimum ${addon.minQuantity} selections (currently: ${currentQuantity})`
              );
            }
          }
        });
      }

      // Validate variable addons - only if user has selected any quantity
      if (selectedCustomOrder.addons.variableAddons) {
        selectedCustomOrder.addons.variableAddons.forEach((addon) => {
          const currentQuantity = getAddonQuantity(addon._id);
          // Only validate if user has selected this addon (quantity > 0)
          if (
            currentQuantity > 0 &&
            addon.minQuantity &&
            addon.minQuantity > 0
          ) {
            if (currentQuantity < addon.minQuantity) {
              errors.push(
                `"${addon.name}" requires minimum ${addon.minQuantity} ${
                  addon.unit || "pieces"
                } (currently: ${currentQuantity})`
              );
            }
          }
        });
      }
    }

    return errors;
  };

  const handlePlaceOrder = () => {
    const validationErrors = validateCustomOrder();

    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    const orderDetails = {
      customOrderId: selectedCustomOrder._id,
      menu: {
        name: `Custom Order - ${selectedCustomOrder.name}`,
        basePrice: 0, // Custom orders don't have base price
        locationId: selectedLocationId,
        locationName: selectedCustomOrder.locationId?.name || "",
        serviceId:
          selectedCustomOrder.serviceId?._id || selectedCustomOrder.serviceId,
        serviceName: selectedCustomOrder.serviceId?.name || "",
      },
      fullMenu: selectedCustomOrder,
      peopleCount: parseInt(peopleCount),
      selections: selections,
      selectedItems: getAllSelectedItems(),
      pricing: {
        basePrice: 0,
        itemsPrice: calculateTotalPrice(),
        addonsPrice: 0, // Already included in itemsPrice for simplicity
        total: calculateTotalPrice(),
      },
      isCustomOrder: true,
    };


    onProceedToConfirmation(orderDetails);
  };

  // Render dietary info badges
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

  // Render categories
  const renderCategories = () => {
    if (
      !selectedCustomOrder?.categories ||
      selectedCustomOrder.categories.length === 0
    ) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No categories available for this custom order</p>
        </div>
      );
    }

    return selectedCustomOrder.categories.map((category, categoryIndex) => {
      if (!category.isActive || !category.items || category.items.length === 0)
        return null;

      return (
        <div key={categoryIndex} className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 capitalize mb-4 border-b border-gray-200 pb-2">
            {category.displayName || category.name}
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({category.items.filter((item) => item.isAvailable).length} items
              available)
            </span>
          </h3>

          {category.description && (
            <p className="text-sm text-gray-600 mb-4">{category.description}</p>
          )}

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="space-y-3">
              {category.items
                .filter((item) => item.isAvailable)
                .map((item, itemIndex) => {
                  const isSelected = isItemSelected(category.name, item._id);
                  return (
                    <div
                      key={itemIndex}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() =>
                        handleCategoryItemSelection(
                          category.name,
                          item._id,
                          !isSelected
                        )
                      }
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 text-green-600 rounded mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-wrap">
                              <h5 className="font-medium text-gray-900">
                                {item.name}
                              </h5>
                              {renderInlineDietaryInfo(item)}
                            </div>
                            <span className="font-semibold text-gray-800">
                              {formatPrice(item.pricePerPerson)}
                            </span>
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
        </div>
      );
    });
  };

  // Render addons
  const renderAddons = () => {
    if (!selectedCustomOrder?.addons?.enabled) return null;

    const hasFixedAddons =
      selectedCustomOrder.addons.fixedAddons &&
      selectedCustomOrder.addons.fixedAddons.length > 0;
    const hasVariableAddons =
      selectedCustomOrder.addons.variableAddons &&
      selectedCustomOrder.addons.variableAddons.length > 0;

    if (!hasFixedAddons && !hasVariableAddons) return null;

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
          Add-ons (Optional)
        </h3>

        {/* Fixed Addons */}
        {hasFixedAddons && (
          <div className="mb-6">
            <h4 className="font-medium text-blue-800 mb-3 bg-blue-50 p-2 rounded">
              Fixed Add-ons (Price per person)
            </h4>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="space-y-3">
                {selectedCustomOrder.addons.fixedAddons
                  .filter((addon) => addon.isAvailable)
                  .map((addon, addonIndex) => {
                    const quantity = getAddonQuantity(addon._id);
                    const isSelected = quantity > 0;
                    return (
                      <div
                        key={addonIndex}
                        className={`p-3 rounded-lg border transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                handleAddonSelection(
                                  addon._id,
                                  isSelected ? 0 : 1
                                )
                              }
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <div>
                              <h5 className="font-medium text-gray-900">
                                {addon.name}
                              </h5>
                              {addon.description && (
                                <p className="text-sm text-gray-600">
                                  {addon.description}
                                </p>
                              )}
                              {renderInlineDietaryInfo(addon)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-blue-700">
                              {formatPrice(addon.pricePerPerson)}
                            </div>
                            <div className="text-xs text-gray-500">
                              per person
                            </div>
                            {isSelected && (
                              <div className="text-sm text-blue-600 font-medium">
                                Total:{" "}
                                {formatPrice(
                                  addon.pricePerPerson * parseInt(peopleCount)
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Variable Addons */}
        {hasVariableAddons && (
          <div className="mb-6">
            <h4 className="font-medium text-green-800 mb-3 bg-green-50 p-2 rounded">
              Variable Add-ons (Choose quantity)
            </h4>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="space-y-4">
                {selectedCustomOrder.addons.variableAddons
                  .filter((addon) => addon.isAvailable)
                  .map((addon, addonIndex) => {
                    const quantity = getAddonQuantity(addon._id);
                    const hasMinRequirement =
                      addon.minQuantity && addon.minQuantity > 0;
                    const isSelected = quantity > 0;
                    const meetsMinRequirement =
                      !isSelected ||
                      !hasMinRequirement ||
                      quantity >= addon.minQuantity;

                    return (
                      <div
                        key={addonIndex}
                        className={`border rounded-lg p-4 ${
                          hasMinRequirement && !meetsMinRequirement
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium text-gray-900">
                                {addon.name}
                              </h5>
                              {hasMinRequirement && (
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                                  Min: {addon.minQuantity}
                                </span>
                              )}
                            </div>
                            {addon.description && (
                              <p className="text-sm text-gray-600">
                                {addon.description}
                              </p>
                            )}
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-sm text-green-700 font-medium">
                                {formatPrice(addon.pricePerUnit)} per{" "}
                                {addon.unit || "piece"}
                              </span>
                              {renderInlineDietaryInfo(addon)}
                            </div>

                            {/* Minimum Requirement Warning - Only show if addon is selected */}
                            {hasMinRequirement &&
                              isSelected &&
                              !meetsMinRequirement && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                  <AlertCircle size={12} />
                                  Minimum {addon.minQuantity}{" "}
                                  {addon.unit || "pieces"} required (optional
                                  addon)
                                </p>
                              )}

                            {/* Optional addon indicator */}
                            {hasMinRequirement && !isSelected && (
                              <p className="text-xs text-gray-500 mt-1">
                                Optional addon - Min {addon.minQuantity} if
                                selected
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-700">
                              {formatPrice(addon.pricePerUnit * quantity)}
                            </div>
                            <div className="text-xs text-gray-500">total</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              handleAddonSelection(
                                addon._id,
                                Math.max(0, quantity - 1)
                              )
                            }
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                            disabled={quantity <= 0}
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={addon.maxQuantity || 20}
                            value={quantity}
                            onChange={(e) =>
                              handleAddonSelection(
                                addon._id,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className={`w-16 px-2 py-1 text-center border rounded focus:outline-none focus:ring-2 ${
                              hasMinRequirement && !meetsMinRequirement
                                ? "border-red-300 focus:ring-red-500"
                                : "border-gray-300 focus:ring-green-500"
                            }`}
                          />
                          <button
                            onClick={() =>
                              handleAddonSelection(
                                addon._id,
                                Math.min(addon.maxQuantity || 20, quantity + 1)
                              )
                            }
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                            disabled={quantity >= (addon.maxQuantity || 20)}
                          >
                            <Plus size={14} />
                          </button>
                          <div className="text-sm text-gray-600">
                            <span>{addon.unit || "pieces"}</span>
                            <br />
                            <span className="text-xs">
                              {hasMinRequirement &&
                                `Min: ${addon.minQuantity} | `}
                              Max: {addon.maxQuantity || 20}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render price breakdown
  const renderPriceBreakdown = () => {
    const selectedItems = getAllSelectedItems();
    const totalPrice = calculateTotalPrice();

    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>

        <div className="space-y-2 text-sm">
          {selectedItems.length > 0 ? (
            <>
              <div className="max-h-32 overflow-y-auto space-y-1 mb-2">
                {selectedItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-gray-600 truncate mr-2">
                      {item.name}
                      {item.type === "fixedAddon" &&
                        ` (×${peopleCount} people)`}
                      {item.type === "variableAddon" &&
                        ` (×${item.quantity} ${item.unit || "pieces"})`}
                      {item.type === "selected" && ` (×${peopleCount} people)`}
                    </span>
                    <span className="font-medium">
                      {formatPrice(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Total for {peopleCount} people:
                  </span>
                  <span className="font-medium">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <span className="text-gray-500 text-sm">No items selected</span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t">
            <span className="font-medium text-gray-900">Grand Total:</span>
            <span className="font-bold text-lg text-gray-900">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading custom orders...</p>
        </div>
      </motion.div>
    );
  }

  if (!selectedLocationId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="bg-white rounded-lg p-8 text-center max-w-md w-full">
          <AlertCircle size={48} className="mx-auto mb-4 text-orange-500" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Location Required
          </h3>
          <p className="text-gray-600 mb-4">
            Please select a location first to view custom order options.
          </p>
          <button
            onClick={onClose}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
          >
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  if (customOrders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="bg-white rounded-lg p-8 text-center max-w-md w-full">
          <ShoppingCart size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Custom Orders Available
          </h3>
          <p className="text-gray-600 mb-4">
            There are no custom order configurations available for the selected
            location.
          </p>
          <button
            onClick={onClose}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
          >
            Close
          </button>
        </div>
      </motion.div>
    );
  }

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
        <div className="bg-primary-green text-white p-3 sm:p-4 rounded-t-xl flex-shrink-0">
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
          <h2 className="text-lg sm:text-xl font-bold mb-2">
            Create Your Custom Order
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-white/90 text-sm">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>
                {selectedCustomOrder?.locationId?.name || "Selected Location"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{peopleCount} people</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 p-3 sm:p-6 lg:overflow-y-auto">
            {/* Custom Order Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Custom Order Configuration *
              </label>
              <select
                value={selectedCustomOrderId}
                onChange={(e) => handleCustomOrderChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select a custom order...</option>
                {customOrders.map((customOrder) => (
                  <option key={customOrder._id} value={customOrder._id}>
                    {customOrder.name} -{" "}
                    {customOrder.serviceId?.name || "Service"}
                  </option>
                ))}
              </select>
              {selectedCustomOrder && (
                <div>
                  <p className="text-sm text-blue-800">
                    <strong>{selectedCustomOrder.name}:</strong>{" "}
                    {selectedCustomOrder.description ||
                      "Custom order configuration"}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    People: {selectedCustomOrder.minPeople}-
                    {selectedCustomOrder.maxPeople} | Service:{" "}
                    {selectedCustomOrder.serviceId?.name || "Unknown"}
                  </p>
                </div>
              )}
            </div>

            {selectedCustomOrder ? (
              <>
                {renderCategories()}
                {renderAddons()}
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">
                    <ShoppingCart size={48} className="mx-auto" />
                  </div>
                  <p className="text-gray-600">
                    Please select a custom order configuration to view available
                    items
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-3 sm:p-6 lg:overflow-y-auto flex-shrink-0">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Order Details
            </h3>

            {/* Custom Order Info */}
            <div className="text-center mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xl sm:text-2xl font-bold text-green-700">
                {selectedCustomOrder
                  ? selectedCustomOrder.name
                  : "Custom Order"}
              </div>
              <div className="text-sm text-green-600">
                Build your own selection
              </div>
              {selectedCustomOrder && (
                <div className="text-xs text-gray-600 mt-1">
                  {selectedCustomOrder.locationId?.name} -{" "}
                  {selectedCustomOrder.serviceId?.name}
                </div>
              )}
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
                  disabled={
                    !selectedCustomOrder ||
                    parseInt(peopleCount) <=
                      (selectedCustomOrder?.minPeople || 15)
                  }
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min={selectedCustomOrder?.minPeople || 15}
                  max={selectedCustomOrder?.maxPeople || 1000}
                  value={peopleCount}
                  onChange={(e) => handlePeopleCountChange(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center"
                  placeholder="Enter number"
                />
                <button
                  onClick={incrementPeople}
                  className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  disabled={
                    !selectedCustomOrder ||
                    parseInt(peopleCount) >=
                      (selectedCustomOrder?.maxPeople || 1000)
                  }
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedCustomOrder
                  ? `Min: ${selectedCustomOrder.minPeople} | Max: ${selectedCustomOrder.maxPeople}`
                  : "Select a configuration first"}
              </p>
            </div>

            {/* Selection Progress Indicator */}
            <div className="mb-4 bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Selection Progress:
              </h4>

              {selectedCustomOrder && (
                <div className="space-y-2">
                  {/* Entrée Progress */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      Entrée (min: 2)
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          getCategorySelectionCounts().entree >= 2
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {getCategorySelectionCounts().entree}/2
                      </div>
                      {getCategorySelectionCounts().entree >= 2 && (
                        <Check size={12} className="text-green-500" />
                      )}
                    </div>
                  </div>

                  {/* Mains Progress */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      Main Courses (min: 3)
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          getCategorySelectionCounts().mains >= 3
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {getCategorySelectionCounts().mains}/3
                      </div>
                      {getCategorySelectionCounts().mains >= 3 && (
                        <Check size={12} className="text-green-500" />
                      )}
                    </div>
                  </div>

                  {/* Total Progress */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs font-medium text-gray-700">
                      Total Items (min: 6)
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          getCategorySelectionCounts().total >= 6
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {getCategorySelectionCounts().total}/6
                      </div>
                      {getCategorySelectionCounts().total >= 6 && (
                        <Check size={12} className="text-green-500" />
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          getCategorySelectionCounts().total >= 6
                            ? "bg-green-500"
                            : "bg-orange-400"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (getCategorySelectionCounts().total / 6) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Requirements Status */}
                  <div className="mt-2">
                    {getCategorySelectionCounts().total < 6 ? (
                      <p className="text-xs text-red-600">
                        {getCategorySelectionCounts().entree < 2 &&
                          "Need more Entrée items. "}
                        {getCategorySelectionCounts().mains < 3 &&
                          "Need more Main Course items. "}
                        {getCategorySelectionCounts().total < 6 &&
                          `${
                            6 - getCategorySelectionCounts().total
                          } more items needed.`}
                      </p>
                    ) : (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <Check size={12} />
                        Minimum requirements met!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Selected Items Summary */}
            <div className="mb-4 bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Selected Items ({getAllSelectedItems().length}):
              </h4>
              <div className="max-h-32 overflow-y-auto">
                {getAllSelectedItems().length === 0 ? (
                  <p className="text-sm text-gray-500">No items selected yet</p>
                ) : (
                  getAllSelectedItems().map((item, index) => (
                    <div key={index} className="flex items-center py-1 text-sm">
                      <div className="rounded-full p-0.5 mr-2 flex-shrink-0 bg-green-500">
                        <Check size={8} className="text-white" />
                      </div>
                      <span className="truncate text-gray-700 flex-1">
                        {item.name}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatPrice(
                          item.type === "selected"
                            ? item.pricePerPerson
                            : item.type === "fixedAddon"
                            ? item.pricePerPerson
                            : item.pricePerUnit
                        )}
                      </span>
                      {(item.type === "fixedAddon" ||
                        item.type === "variableAddon") && (
                        <span className="text-xs text-blue-500 ml-1">
                          (addon)
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="mb-4 sm:mb-6">{renderPriceBreakdown()}</div>

            {/* Note */}
            <div className="mb-4 sm:mb-6">
              <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                * Custom orders may require additional preparation time and
                deposits are non-refundable when cancelled
              </p>
            </div>

            {/* Continue Button */}
            <motion.button
              whileHover={{
                scale:
                  !selectedCustomOrder || getCategorySelectionCounts().total < 6
                    ? 1
                    : 1.02,
              }}
              whileTap={{
                scale:
                  !selectedCustomOrder || getCategorySelectionCounts().total < 6
                    ? 1
                    : 0.98,
              }}
              onClick={handlePlaceOrder}
              disabled={
                !selectedCustomOrder ||
                getCategorySelectionCounts().total < 6 ||
                getCategorySelectionCounts().entree < 2 ||
                getCategorySelectionCounts().mains < 3
              }
              className="w-full bg-red-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:hover:bg-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              {getCategorySelectionCounts().total < 6
                ? `Select ${6 - getCategorySelectionCounts().total} More Items`
                : "Continue to Order Details"}
            </motion.button>

            {/* Validation Helper Text */}
            {selectedCustomOrder && getCategorySelectionCounts().total < 6 && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <strong>Requirements:</strong>
                <ul className="mt-1 space-y-1">
                  {getCategorySelectionCounts().entree < 2 && (
                    <li>
                      • {2 - getCategorySelectionCounts().entree} more Entrée
                      item
                      {2 - getCategorySelectionCounts().entree !== 1 ? "s" : ""}
                    </li>
                  )}
                  {getCategorySelectionCounts().mains < 3 && (
                    <li>
                      • {3 - getCategorySelectionCounts().mains} more Main
                      Course item
                      {3 - getCategorySelectionCounts().mains !== 1 ? "s" : ""}
                    </li>
                  )}
                  {getCategorySelectionCounts().total < 6 && (
                    <li>
                      • {6 - getCategorySelectionCounts().total} more item
                      {6 - getCategorySelectionCounts().total !== 1
                        ? "s"
                        : ""}{" "}
                      total
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CustomOrderModal;
