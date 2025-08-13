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
  Users,
  MapPin,
  Briefcase,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getLocations } from "../../services/locationServices";
import { getServices } from "../../services/serviceServices";

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

const CustomOrderModal = ({ menus, onClose, onProceedToConfirmation }) => {
  const [selections, setSelections] = useState({});
  const [peopleCount, setPeopleCount] = useState("15");
  const [itemsByCategory, setItemsByCategory] = useState({});
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Add the "no-scroll" class to the body
        document.body.classList.add("no-scroll");

        // Load locations and services
        const [locationsResult, servicesResult] = await Promise.all([
          getLocations(),
          getServices(),
        ]);

        if (locationsResult.success) {
          const activeLocations = locationsResult.data.filter(loc => loc.isActive);
          setLocations(activeLocations);
          // Auto-select first location if only one available
          if (activeLocations.length === 1) {
            setSelectedLocation(activeLocations[0]._id);
          }
        }

        if (servicesResult.success) {
          const activeServices = servicesResult.data.filter(service => service.isActive);
          setServices(activeServices);
        }

        // Process menus to get a list of all available items
        setItemsByCategory(getAllItems(menus));
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error loading locations and services");
      } finally {
        setLoading(false);
      }
    };

    loadData();

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
            itemId: item._id,
            type: "selected",
            category: categoryName,
          });
        }
      });
    });

    return allSelected;
  };

  // Get filtered services based on selected location
  const getFilteredServices = () => {
    if (!selectedLocation) return [];
    return services.filter(service => 
      (service.locationId?._id || service.locationId) === selectedLocation
    );
  };

  // Handle location change
  const handleLocationChange = (locationId) => {
    setSelectedLocation(locationId);
    // Reset service selection when location changes
    setSelectedService("");
  };

  // People count handlers
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
    setPeopleCount(value);
  };

  // Validation
  const validateCustomOrder = () => {
    const errors = [];

    if (!peopleCount || parseInt(peopleCount) < 15) {
      errors.push("Please enter a min number of people");
    }

    if (!selectedLocation) {
      errors.push("Please select a location");
    }

    if (!selectedService) {
      errors.push("Please select a service type");
    }

    if (getAllSelectedItems().length === 0) {
      errors.push("Please select at least one item for your custom order");
    }

    return errors;
  };

  const handlePlaceOrder = () => {
    const validationErrors = validateCustomOrder();

    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    // Get selected location and service details
    const selectedLocationObj = locations.find(loc => loc._id === selectedLocation);
    const selectedServiceObj = services.find(service => service._id === selectedService);

    console.log("Selected location ID:", selectedLocation);
    console.log("Selected location object:", selectedLocationObj);
    console.log("Selected service ID:", selectedService);
    console.log("Selected service object:", selectedServiceObj);

    // Create order details in the same format as menu selection
    const orderDetails = {
      menuId: null, // No menu ID for custom orders
      menu: {
        menuId: null, // Explicitly set to null for custom orders
        name: "Custom Order",
        price: 0, // Custom orders are based on individual item prices
        locationId: selectedLocation,
        locationName: selectedLocationObj?.name || "Selected Location",
        serviceId: selectedService,
        serviceName: selectedServiceObj?.name || "Selected Service",
      },
      peopleCount: parseInt(peopleCount),
      selectedItems: getAllSelectedItems(),
      pricing: {
        basePrice: 0,
        addonsPrice: calculateTotalPrice(),
        total: calculateTotalPrice(),
      },
      selectedAddons: [], // Custom orders don't have traditional addons
      selections: selections,
      isCustomOrder: true, // Flag to identify custom orders
    };

    console.log("Custom Order Details being sent:", JSON.stringify(orderDetails, null, 2));
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

    if (selectableItems.length === 0) {
      return null;
    }

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 capitalize mb-4 border-b border-gray-200 pb-2">
          {categoryName === "addons" ? "Add-ons" : categoryName}
        </h3>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-3">
            Available {categoryName === "addons" ? "Add-ons" : categoryName}
          </h4>

          <p className="text-sm text-gray-600 mb-4">
            Select any items you'd like from our {categoryName} collection
          </p>

          <div className="space-y-3">
            {selectableItems.map((item, itemIndex) => {
              const isSelected = isItemSelected(categoryName, item._id);
              return (
                <div
                  key={itemIndex}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() =>
                    handleItemSelection(categoryName, item._id, !isSelected)
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
                          {formatPrice(item.price)}
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
  };

  // Price breakdown for sidebar
  const renderPriceBreakdown = () => {
    const selectedItems = getAllSelectedItems();
    const numPeople = parseInt(peopleCount) || 0;
    const totalPrice = calculateTotalPrice();

    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>

        <div className="space-y-2 text-sm">
          {selectedItems.length > 0 ? (
            <>
              {/* Individual items breakdown */}
              <div className="max-h-32 overflow-y-auto space-y-1 mb-2">
                {selectedItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-gray-600 truncate mr-2">
                      {item.name} (×{peopleCount})
                    </span>
                    <span className="font-medium">
                      {formatPrice(item.price * numPeople)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Subtotal ({peopleCount} people):
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
            <span className="font-medium text-gray-900">Total:</span>
            <span className="font-bold text-lg text-gray-900">
              {formatPrice(totalPrice)}
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
          <h2 className="text-lg sm:text-xl font-bold mb-2">
            Create Your Custom Menu
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-white/90 text-sm">
            <div className="flex items-center gap-1">
              <span className="font-medium">Build Your Perfect Meal</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{peopleCount} people</span>
            </div>
            {selectedLocation && (
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                <span>{locations.find(loc => loc._id === selectedLocation)?.name || "Location"}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 p-3 sm:p-6 lg:overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">
                    <ShoppingCart size={48} className="mx-auto" />
                  </div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Location and Service Selection */}
                <div className="mb-8 bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Select Location & Service
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Location Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <select
                          value={selectedLocation}
                          onChange={(e) => handleLocationChange(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
                          required
                        >
                          <option value="">Select a location</option>
                          {locations.map((location) => (
                            <option key={location._id} value={location._id}>
                              {location.name} - {location.city}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Service Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Type *
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <select
                          value={selectedService}
                          onChange={(e) => setSelectedService(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
                          disabled={!selectedLocation}
                          required
                        >
                          <option value="">
                            {!selectedLocation ? "Select location first" : "Select a service"}
                          </option>
                          {getFilteredServices().map((service) => (
                            <option key={service._id} value={service._id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {!selectedLocation && (
                        <p className="text-xs text-gray-500 mt-1">
                          Please select a location first to see available services
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu Items - Only show if location and service are selected */}
                {selectedLocation && selectedService ? (
                  <>
                    {Object.keys(itemsByCategory).length === 0 ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <div className="text-gray-400 mb-2">
                            <ShoppingCart size={48} className="mx-auto" />
                          </div>
                          <p className="text-gray-600">No menu items available...</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {renderCategoryContent("entree", itemsByCategory?.entree)}
                        {renderCategoryContent("mains", itemsByCategory?.mains)}
                        {renderCategoryContent("desserts", itemsByCategory?.desserts)}
                        {renderCategoryContent("addons", itemsByCategory?.addons)}
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="text-green-500 mb-4">
                        <MapPin size={48} className="mx-auto" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Select Location & Service
                      </h3>
                      <p className="text-gray-600">
                        Please select a location and service type to view available menu items
                      </p>
                    </div>
                  </div>
                )}
              </>
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
                Custom Menu
              </div>
              <div className="text-sm text-green-600">
                Build your own selection
              </div>
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
                  disabled={parseInt(peopleCount) <= 1}
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min="15"
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
              <p className="text-xs text-gray-500 mt-1">Minimum: 15 person</p>
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
                        {formatPrice(item.price)}
                      </span>
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
                scale: getAllSelectedItems().length === 0 || !selectedLocation || !selectedService ? 1 : 1.02,
              }}
              whileTap={{
                scale: getAllSelectedItems().length === 0 || !selectedLocation || !selectedService ? 1 : 0.98,
              }}
              onClick={handlePlaceOrder}
              disabled={getAllSelectedItems().length === 0 || !selectedLocation || !selectedService}
              className="w-full bg-red-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:hover:bg-gray-400 transition-colors flex items-center justify-center gap-2"
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

export default CustomOrderModal;