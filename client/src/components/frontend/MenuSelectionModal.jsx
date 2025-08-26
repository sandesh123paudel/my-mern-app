import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  MapPin,
  Check,
  ShoppingCart,
  X,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "react-hot-toast";

const MenuSelectionModal = ({ menu, onClose, onProceedToConfirmation }) => {
  const [selections, setSelections] = useState({});
  const [peopleCount, setPeopleCount] = useState("");
  // Add these state variables after your existing useState declarations
  const [isFunction, setIsFunction] = useState(false);
  const [serviceVenueOptions, setServiceVenueOptions] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState("");
  const [venueCharge, setVenueCharge] = useState(0);

  useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, []);

  useEffect(() => {
    const initialCount = menu.minPeople || 1;
    setPeopleCount(String(initialCount));
  }, [menu.minPeople]);
  useEffect(() => {
    const checkIfFunctionService = async () => {
      if (menu.serviceId) {
        try {
          // You'll need to import getServiceById from your service
          const { getServiceById } = await import(
            "../../services/serviceServices"
          );
          const serviceResult = await getServiceById(
            menu.serviceId._id || menu.serviceId
          );

          if (serviceResult.success && serviceResult.data.service.isFunction) {
            setIsFunction(true);
            setServiceVenueOptions(serviceResult.data.service.venueOptions);
          }
        } catch (error) {
          console.error("Error checking service details:", error);
        }
      }
    };

    checkIfFunctionService();
  }, [menu.serviceId]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(price);
  };

  // Simple item selection handlers
  const handleSimpleItemSelection = (itemIndex, type, value) => {
    const key = `simple-${itemIndex}`;
    setSelections((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [type]: value,
      },
    }));
  };

  const handleSimpleItemChoiceSelection = (
    itemIndex,
    choiceIndex,
    isSelected
  ) => {
    const item = menu.simpleItems[itemIndex];
    const key = `simple-${itemIndex}`;
    const currentSelection = selections[key] || {};
    const currentChoices = currentSelection.choices || [];

    let newChoices;
    if (item.selectionType === "single") {
      newChoices = isSelected ? [choiceIndex] : [];
    } else {
      if (isSelected) {
        newChoices = [...currentChoices, choiceIndex];
      } else {
        newChoices = currentChoices.filter((idx) => idx !== choiceIndex);
      }
    }

    handleSimpleItemSelection(itemIndex, "choices", newChoices);
  };

  const handleSimpleItemOptionSelection = (
    itemIndex,
    optionIndex,
    isSelected
  ) => {
    const key = `simple-${itemIndex}`;
    const currentSelection = selections[key] || {};
    const currentOptions = currentSelection.options || [];

    let newOptions;
    if (isSelected) {
      newOptions = [...currentOptions, optionIndex];
    } else {
      newOptions = currentOptions.filter((idx) => idx !== optionIndex);
    }

    handleSimpleItemSelection(itemIndex, "options", newOptions);
  };

  // Category item selection handler
  const handleCategoryItemSelection = (
    categoryIndex,
    groupIndex,
    itemIndex,
    isSelected,
    group
  ) => {
    const key = `category-${categoryIndex}-group-${groupIndex}`;
    const currentSelections = selections[key] || [];

    let newSelections;
    if (group.selectionType === "single") {
      newSelections = isSelected ? [itemIndex] : [];
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
        newSelections = [...currentSelections, itemIndex];
      } else {
        newSelections = currentSelections.filter((idx) => idx !== itemIndex);
      }
    }

    setSelections((prev) => ({
      ...prev,
      [key]: newSelections,
    }));
  };

  // Addon selection handler
  const handleAddonSelection = (type, addonIndex, value) => {
    const key = `addons-${type}`;
    if (type === "fixed") {
      const currentSelections = selections[key] || [];
      let newSelections;
      if (currentSelections.includes(addonIndex)) {
        newSelections = currentSelections.filter((idx) => idx !== addonIndex);
      } else {
        newSelections = [...currentSelections, addonIndex];
      }
      setSelections((prev) => ({
        ...prev,
        [key]: newSelections,
      }));
    } else if (type === "variable") {
      setSelections((prev) => ({
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          [addonIndex]: value,
        },
      }));
    }
  };

  // Check if selections are made
  const isSimpleItemChoiceSelected = (itemIndex, choiceIndex) => {
    const key = `simple-${itemIndex}`;
    const selection = selections[key];
    return selection?.choices?.includes(choiceIndex) || false;
  };

  const isSimpleItemOptionSelected = (itemIndex, optionIndex) => {
    const key = `simple-${itemIndex}`;
    const selection = selections[key];
    return selection?.options?.includes(optionIndex) || false;
  };

  const isCategoryItemSelected = (categoryIndex, groupIndex, itemIndex) => {
    const key = `category-${categoryIndex}-group-${groupIndex}`;
    return (selections[key] || []).includes(itemIndex);
  };

  const isFixedAddonSelected = (addonIndex) => {
    return (selections["addons-fixed"] || []).includes(addonIndex);
  };

  const getVariableAddonQuantity = (addonIndex) => {
    return selections["addons-variable"]?.[addonIndex] || 0;
  };

  // People count handlers
  const handlePeopleCountChange = (value) => {
    setPeopleCount(value);
    if (
      selectedVenue &&
      serviceVenueOptions &&
      serviceVenueOptions[selectedVenue]
    ) {
      const newCharge = calculateVenueCharge(
        serviceVenueOptions[selectedVenue],
        parseInt(value) || 0
      );
      setVenueCharge(newCharge);
    }
  };

  const incrementPeople = () => {
    const current = parseInt(peopleCount) || 0;
    const maxPeople = menu.maxPeople || 1000;
    if (current < maxPeople) {
      setPeopleCount(String(current + 1));
      if (
        selectedVenue &&
        serviceVenueOptions &&
        serviceVenueOptions[selectedVenue]
      ) {
        const newCharge = calculateVenueCharge(
          serviceVenueOptions[selectedVenue],
          newCount
        );
        setVenueCharge(newCharge);
      }
    }
  };

  const decrementPeople = () => {
    const current = parseInt(peopleCount) || 0;
    const minPeople = menu.minPeople || 1;
    if (current > minPeople) {
      setPeopleCount(String(current - 1));
      if (
        selectedVenue &&
        serviceVenueOptions &&
        serviceVenueOptions[selectedVenue]
      ) {
        const newCharge = calculateVenueCharge(
          serviceVenueOptions[selectedVenue],
          newCount
        );
        setVenueCharge(newCharge);
      }
    }
  };

  // Calculate prices
  const calculateBasePrice = () => {
    const numPeople = parseInt(peopleCount) || 0;
    return (menu.basePrice || menu.price || 0) * numPeople;
  };

  const calculateItemModifiers = () => {
    let modifierPrice = 0;
    const numPeople = parseInt(peopleCount) || 0;

    if (menu.packageType === "simple" && menu.simpleItems) {
      menu.simpleItems.forEach((item, itemIndex) => {
        const itemSelection = selections[`simple-${itemIndex}`];

        // Add item price modifier
        if (item.priceModifier) {
          modifierPrice += item.priceModifier * numPeople;
        }

        // Add choice modifiers
        if (item.hasChoices && item.choices && itemSelection?.choices) {
          itemSelection.choices.forEach((choiceIndex) => {
            const choice = item.choices[choiceIndex];
            if (choice?.priceModifier) {
              modifierPrice += choice.priceModifier * numPeople;
            }
          });
        }

        // Add option modifiers
        if (item.options && itemSelection?.options) {
          itemSelection.options.forEach((optionIndex) => {
            const option = item.options[optionIndex];
            if (option?.priceModifier) {
              modifierPrice += option.priceModifier * numPeople;
            }
          });
        }
      });
    } else if (menu.packageType === "categorized" && menu.categories) {
      menu.categories.forEach((category, categoryIndex) => {
        if (category.enabled && category.selectionGroups) {
          category.selectionGroups.forEach((group, groupIndex) => {
            const key = `category-${categoryIndex}-group-${groupIndex}`;
            const selectedItems = selections[key] || [];

            selectedItems.forEach((itemIndex) => {
              const item = group.items[itemIndex];
              if (item?.priceModifier) {
                modifierPrice += item.priceModifier * numPeople;
              }
            });
          });
        }
      });
    }

    return modifierPrice;
  };

  const calculateAddonsPrice = () => {
    let addonsPrice = 0;
    const numPeople = parseInt(peopleCount) || 0;
    const addonBreakdown = [];

    if (menu.addons?.enabled) {
      // Fixed addons
      if (menu.addons.fixedAddons && selections["addons-fixed"]) {
        selections["addons-fixed"].forEach((addonIndex) => {
          const addon = menu.addons.fixedAddons[addonIndex];
          if (addon) {
            const itemTotal = addon.pricePerPerson * numPeople;
            addonsPrice += itemTotal;
            addonBreakdown.push({
              name: addon.name,
              type: "fixed",
              pricePerPerson: addon.pricePerPerson,
              totalPrice: itemTotal,
            });
          }
        });
      }

      // Variable addons
      if (menu.addons.variableAddons && selections["addons-variable"]) {
        Object.entries(selections["addons-variable"]).forEach(
          ([addonIndex, quantity]) => {
            const addon = menu.addons.variableAddons[parseInt(addonIndex)];
            if (addon && quantity > 0) {
              const itemTotal = addon.pricePerUnit * quantity;
              addonsPrice += itemTotal;
              addonBreakdown.push({
                name: addon.name,
                type: "variable",
                pricePerUnit: addon.pricePerUnit,
                quantity: quantity,
                unit: addon.unit || "piece",
                totalPrice: itemTotal,
              });
            }
          }
        );
      }
    }

    return { total: addonsPrice, breakdown: addonBreakdown };
  };

  const calculateTotalPrice = () => {
    const basePrice = calculateBasePrice();
    const modifierPrice = calculateItemModifiers();
    const addonData = calculateAddonsPrice();
    return basePrice + modifierPrice + addonData.total + (venueCharge || 0);
  };

  // Validation
  const validateOrder = () => {
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
    if (isFunction) {
      if (!selectedVenue) {
        errors.push("Please select a venue for your function");
      } else {
        // Validate people count against venue capacity
        const venueOption = getSelectedVenueOption();
        if (venueOption) {
          if (numPeople < venueOption.minPeople) {
            errors.push(
              `Selected venue requires minimum ${venueOption.minPeople} people`
            );
          }
          if (numPeople > venueOption.maxPeople) {
            errors.push(
              `Selected venue allows maximum ${venueOption.maxPeople} people`
            );
          }
        }
      }
    }

    // **NEW: Validate required selections for simple packages**
    if (menu.packageType === "simple" && menu.simpleItems) {
      menu.simpleItems.forEach((item, itemIndex) => {
        // We assume if an item has choices, a selection is required.
        // You could also add an "isRequired" flag to your data model for more control.
        if (item.hasChoices && item.choices && item.choices.length > 0) {
          const key = `simple-${itemIndex}`;
          const selection = selections[key];
          if (!selection?.choices || selection.choices.length === 0) {
            errors.push(`Please make a selection for "${item.name}"`);
          }
        }
      });
    }

    // Validate required selections for categorized packages
    if (menu.packageType === "categorized" && menu.categories) {
      menu.categories.forEach((category, categoryIndex) => {
        if (category.enabled && category.selectionGroups) {
          category.selectionGroups.forEach((group, groupIndex) => {
            if (group.isRequired) {
              const key = `category-${categoryIndex}-group-${groupIndex}`;
              const selectedItems = selections[key] || [];
              if (selectedItems.length === 0) {
                errors.push(
                  `Please make a selection for "${group.name}" in ${category.name}`
                );
              }
            }
          });
        }
      });
    }

    return errors;
  };

  const handlePlaceOrder = () => {
    const validationErrors = validateOrder();

    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    const orderDetails = {
      menuId: menu._id,
      menu: {
        name: menu.name,
        basePrice: menu.basePrice || menu.price,
        packageType: menu.packageType,
        locationId: menu.locationId,
        serviceId: menu.serviceId, // Make sure this is included
      },
      fullMenu: menu,
      peopleCount: parseInt(peopleCount),
      selections: selections,
      pricing: {
        basePrice: calculateBasePrice(),
        modifierPrice: calculateItemModifiers(),
        addonsPrice: calculateAddonsPrice().total,
        venueCharge: venueCharge || 0, // Add venue charge
        total: calculateTotalPrice(),
      },
      addonBreakdown: calculateAddonsPrice().breakdown,
      // Add venue selection data
      isFunction: isFunction,
      venueSelection: selectedVenue,
      venueCharge: venueCharge,
    };

    onProceedToConfirmation(orderDetails);
  };

  // Add these helper functions before your render functions
  const getSelectedVenueOption = () => {
    if (!selectedVenue || !serviceVenueOptions) return null;
    return serviceVenueOptions[selectedVenue];
  };

  const calculateVenueCharge = (venue, peopleCount) => {
    if (!venue) return 0;

    if (venue.chargeThreshold && peopleCount < venue.chargeThreshold) {
      return venue.venueCharge || 0;
    }

    return 0;
  };

  const handleVenueSelection = (venueKey) => {
    setSelectedVenue(venueKey);

    if (serviceVenueOptions && serviceVenueOptions[venueKey]) {
      const charge = calculateVenueCharge(
        serviceVenueOptions[venueKey],
        parseInt(peopleCount) || 0
      );
      setVenueCharge(charge);
    }
  };

  // Render simple items
  const renderSimpleItems = () => {
    if (!menu.simpleItems || menu.simpleItems.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
          Package Items
        </h3>

        <div className="space-y-4">
          {menu.simpleItems.map((item, itemIndex) => (
            <div
              key={itemIndex}
              className="border border-gray-300 rounded-lg p-4 bg-white"
            >
              <div className="mb-3">
                <h4 className="font-medium text-gray-900 text-base">
                  {item.name}
                  {item.priceModifier !== 0 && (
                    <span className="ml-2 text-primary-green font-medium">
                      {item.priceModifier > 0 ? "+" : ""}
                      {formatPrice(item.priceModifier)}
                    </span>
                  )}
                </h4>
                {item.quantity && item.quantity > 1 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Quantity: {item.quantity}
                  </p>
                )}
              </div>

              {/* Customer Choices */}
              {item.hasChoices && item.choices && item.choices.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3">
                    {item.selectionType === "single"
                      ? "Choose one option:"
                      : "Choose options:"}
                  </h5>
                  <div className="space-y-2">
                    {item.choices.map((choice, choiceIndex) => {
                      const isSelected = isSimpleItemChoiceSelected(
                        itemIndex,
                        choiceIndex
                      );
                      return (
                        <label
                          key={choiceIndex}
                          className="flex items-center p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type={
                              item.selectionType === "single"
                                ? "radio"
                                : "checkbox"
                            }
                            name={`simple-${itemIndex}-choices`}
                            checked={isSelected}
                            onChange={() =>
                              handleSimpleItemChoiceSelection(
                                itemIndex,
                                choiceIndex,
                                !isSelected
                              )
                            }
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <span className="font-medium">{choice.name}</span>
                            {choice.priceModifier !== 0 && (
                              <span className="ml-2 text-primary-green font-medium">
                                {choice.priceModifier > 0 ? "+" : ""}
                                {formatPrice(choice.priceModifier)}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Additional Options */}
              {item.options && item.options.length > 0 && (
                <div className="p-3 bg-primary-green border border-primary-green rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3">
                    Additional Options:
                  </h5>
                  <div className="space-y-2">
                    {item.options.map((option, optionIndex) => {
                      const isSelected = isSimpleItemOptionSelected(
                        itemIndex,
                        optionIndex
                      );
                      return (
                        <label
                          key={optionIndex}
                          className="flex items-center p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              handleSimpleItemOptionSelection(
                                itemIndex,
                                optionIndex,
                                !isSelected
                              )
                            }
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <span className="font-medium">{option.name}</span>
                            {option.priceModifier !== 0 && (
                              <span className="ml-2 text-green-600 font-medium">
                                {option.priceModifier > 0 ? "+" : ""}
                                {formatPrice(option.priceModifier)}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render categorized content
  const renderCategorizedContent = () => {
    if (!menu.categories || menu.categories.length === 0) return null;

    return (
      <div className="space-y-6">
        {menu.categories.map((category, categoryIndex) => {
          if (!category.enabled) return null;

          return (
            <div key={categoryIndex} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 capitalize mb-4 border-b pb-2">
                {category.name}
              </h3>

              {/* Included Items */}
              {category.includedItems && category.includedItems.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Included with your package:
                  </h4>
                  <div className="space-y-2">
                    {category.includedItems.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <Check size={16} className="text-green-600 mr-3" />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">
                            {item.name}
                          </span>
                          {item.priceModifier !== 0 && (
                            <span className="ml-2 text-green-600 font-medium">
                              {item.priceModifier > 0 ? "+" : ""}
                              {formatPrice(item.priceModifier)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selection Groups */}
              {category.selectionGroups &&
                category.selectionGroups.length > 0 && (
                  <div className="space-y-4">
                    {category.selectionGroups.map((group, groupIndex) => (
                      <div
                        key={groupIndex}
                        className="border border-gray-300 rounded-lg p-4 bg-white"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">
                            {group.name}
                          </h4>
                          {group.isRequired && (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                              Required
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          {group.selectionType === "single"
                            ? "Choose one option:"
                            : `Choose up to ${
                                group.maxSelections || "unlimited"
                              } options:`}
                        </p>

                        <div className="space-y-2">
                          {group.items.map((item, itemIndex) => {
                            const isSelected = isCategoryItemSelected(
                              categoryIndex,
                              groupIndex,
                              itemIndex
                            );
                            return (
                              <label
                                key={itemIndex}
                                className="flex items-center p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                              >
                                <input
                                  type={
                                    group.selectionType === "single"
                                      ? "radio"
                                      : "checkbox"
                                  }
                                  name={`category-${categoryIndex}-group-${groupIndex}`}
                                  checked={isSelected}
                                  onChange={() =>
                                    handleCategoryItemSelection(
                                      categoryIndex,
                                      groupIndex,
                                      itemIndex,
                                      !isSelected,
                                      group
                                    )
                                  }
                                  className="mr-3"
                                />
                                <div className="flex-1">
                                  <span className="font-medium">
                                    {item.name}
                                  </span>
                                  {item.priceModifier !== 0 && (
                                    <span className="ml-2 text-green-600 font-medium">
                                      {item.priceModifier > 0 ? "+" : ""}
                                      {formatPrice(item.priceModifier)}
                                    </span>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render addons
  const renderAddons = () => {
    if (!menu.addons?.enabled) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
          Add-ons (Optional)
        </h3>

        {/* Fixed Addons */}
        {menu.addons.fixedAddons && menu.addons.fixedAddons.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-3">
              Fixed Add-ons (price per person):
            </h4>
            <div className="space-y-2">
              {menu.addons.fixedAddons.map((addon, addonIndex) => {
                const isSelected = isFixedAddonSelected(addonIndex);
                return (
                  <label
                    key={addonIndex}
                    className="flex items-center justify-between p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          handleAddonSelection("fixed", addonIndex)
                        }
                        className="mr-3"
                      />
                      <div>
                        <span className="font-medium">{addon.name}</span>
                        <div className="text-sm text-gray-600">
                          {formatPrice(addon.pricePerPerson)} per person
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-orange-600">
                        {formatPrice(
                          addon.pricePerPerson * (parseInt(peopleCount) || 0)
                        )}
                      </div>
                      <div className="text-xs text-gray-500">total</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Variable Addons */}
        {menu.addons.variableAddons &&
          menu.addons.variableAddons.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-3">
                Variable Add-ons (choose quantity):
              </h4>
              <div className="space-y-3">
                {menu.addons.variableAddons.map((addon, addonIndex) => {
                  const quantity = getVariableAddonQuantity(addonIndex);
                  return (
                    <div
                      key={addonIndex}
                      className="border border-gray-300 rounded-lg p-3 bg-white"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-medium">{addon.name}</h5>
                          <p className="text-sm text-gray-600">
                            {formatPrice(addon.pricePerUnit)} per{" "}
                            {addon.unit || "piece"}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-purple-600">
                            {formatPrice(addon.pricePerUnit * quantity)}
                          </div>
                          <div className="text-xs text-gray-500">total</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            handleAddonSelection(
                              "variable",
                              addonIndex,
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
                              "variable",
                              addonIndex,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-16 px-2 py-1 text-center border border-gray-300 rounded"
                        />
                        <button
                          onClick={() =>
                            handleAddonSelection(
                              "variable",
                              addonIndex,
                              Math.min(addon.maxQuantity || 20, quantity + 1)
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                          disabled={quantity >= (addon.maxQuantity || 20)}
                        >
                          <Plus size={14} />
                        </button>
                        <span className="text-sm text-gray-600">
                          {addon.unit || "pieces"} (max:{" "}
                          {addon.maxQuantity || 20})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
      </div>
    );
  };

  // Render price breakdown

  const renderPriceBreakdown = () => {
    const basePrice = calculateBasePrice();
    const modifierPrice = calculateItemModifiers();
    const addonData = calculateAddonsPrice();
    const totalPrice = calculateTotalPrice();

    return (
      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">
              Base Package ({peopleCount || 0} people):
            </span>
            <span className="font-medium">{formatPrice(basePrice)}</span>
          </div>

          {modifierPrice > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Item modifications:</span>
              <span className="text-primary-green font-medium">
                {formatPrice(modifierPrice)}
              </span>
            </div>
          )}

          {/* Add venue charge display */}
          {isFunction && venueCharge > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Venue charge:</span>
              <span className="text-orange-600 font-medium">
                {formatPrice(venueCharge)}
              </span>
            </div>
          )}

          {/* ... rest of existing addon breakdown code ... */}

          <div className="flex justify-between pt-2 border-t font-medium">
            <span className="text-gray-900">Grand Total:</span>
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (
      selectedVenue &&
      serviceVenueOptions &&
      serviceVenueOptions[selectedVenue]
    ) {
      const newCharge = calculateVenueCharge(
        serviceVenueOptions[selectedVenue],
        parseInt(peopleCount) || 0
      );
      setVenueCharge(newCharge);
    }
  }, [peopleCount, selectedVenue, serviceVenueOptions]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-100 rounded-lg w-full max-w-6xl shadow-lg flex flex-col min-h-[90vh] lg:max-h-[95vh] lg:overflow-hidden">
        {/* Header */}
        <div className="bg-primary-green text-white p-4 rounded-t-lg flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-white hover:text-gray-200"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
          <h2 className="text-xl font-bold mb-2">{menu.name}</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-white text-sm">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>{menu.locationId?.name || "Location"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>
                Min {menu.minPeople || 1}{" "}
                {menu.maxPeople ? `- Max ${menu.maxPeople}` : ""} People
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-grow lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-hidden">
          {/* Left Column: Selections */}
          <div className="lg:col-span-2 p-4 lg:p-6 lg:overflow-y-auto">
            {menu.packageType === "categorized"
              ? renderCategorizedContent()
              : renderSimpleItems()}
            {renderAddons()}
          </div>

          {/* Right Column: Order Summary (Sticky) */}
          <div className="lg:col-span-1 p-4 lg:p-6 bg-gray-50 flex-shrink-0 lg:overflow-y-auto">
            <div className="sticky top-0">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Order Details
              </h3>

              {/* Package Price */}
              <div className="text-center mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {formatPrice(menu.basePrice || menu.price || 0)}
                </div>
                <div className="text-sm text-green-600">per person</div>
              </div>

              {/* People Count */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of People *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={decrementPeople}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                    disabled={parseInt(peopleCount) <= (menu.minPeople || 1)}
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min={menu.minPeople || 1}
                    max={menu.maxPeople || 1000}
                    value={peopleCount}
                    onChange={(e) => handlePeopleCountChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-primary-green"
                    placeholder="Enter number"
                  />
                  <button
                    onClick={incrementPeople}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                    disabled={parseInt(peopleCount) >= (menu.maxPeople || 1000)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Min: {menu.minPeople || 1}
                  {menu.maxPeople &&
                    menu.maxPeople !== 1000 &&
                    ` | Max: ${menu.maxPeople}`}
                </p>
              </div>

              {/* Add this after the people count section in the right column */}
              {isFunction && serviceVenueOptions && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Venue *
                  </label>

                  <div className="space-y-2">
                    {Object.entries(serviceVenueOptions).map(
                      ([venueKey, venue]) => {
                        if (!venue.available) return null;

                        const numPeople = parseInt(peopleCount) || 0;
                        const isValidForPeopleCount =
                          numPeople >= venue.minPeople &&
                          numPeople <= venue.maxPeople;
                        const willHaveCharge =
                          venue.chargeThreshold &&
                          numPeople < venue.chargeThreshold &&
                          numPeople > 0;

                        const venueLabels = {
                          both: "Both Venues (Indoor + Outdoor)",
                          indoor: "Indoor Only",
                          outdoor: "Outdoor Only",
                        };

                        return (
                          <label
                            key={venueKey}
                            className={`block p-3 border rounded cursor-pointer transition-all ${
                              selectedVenue === venueKey
                                ? "border-green-500 bg-green-50"
                                : isValidForPeopleCount
                                ? "border-gray-300 hover:border-gray-400"
                                : "border-red-300 bg-red-50 cursor-not-allowed"
                            }`}
                          >
                            <input
                              type="radio"
                              name="venue"
                              value={venueKey}
                              checked={selectedVenue === venueKey}
                              onChange={() => {
                                if (isValidForPeopleCount) {
                                  handleVenueSelection(venueKey);
                                }
                              }}
                              disabled={!isValidForPeopleCount}
                              className="sr-only"
                            />

                            <div className="flex items-center justify-between">
                              <div>
                                <div
                                  className={`font-medium ${
                                    isValidForPeopleCount
                                      ? "text-gray-900"
                                      : "text-red-600"
                                  }`}
                                >
                                  {venueLabels[venueKey]}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {venue.minPeople}-{venue.maxPeople} people
                                </div>
                                {!isValidForPeopleCount && (
                                  <div className="text-xs text-red-600">
                                    Your group size doesn't meet requirements
                                  </div>
                                )}
                              </div>

                              {willHaveCharge && isValidForPeopleCount && (
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-orange-600">
                                    +{formatPrice(venue.venueCharge)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    venue charge
                                  </div>
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      }
                    )}
                  </div>

                  {selectedVenue && (
                    <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                      {venueCharge > 0
                        ? `Venue charge of ${formatPrice(
                            venueCharge
                          )} applies for groups under ${
                            getSelectedVenueOption()?.chargeThreshold
                          } people`
                        : getSelectedVenueOption()?.chargeThreshold
                        ? `No venue charge for groups of ${
                            getSelectedVenueOption()?.chargeThreshold
                          }+ people`
                        : "No additional venue charge"}
                    </div>
                  )}
                </div>
              )}

              {/* Price Breakdown */}
              <div className="mb-4">{renderPriceBreakdown()}</div>

              {/* Note */}
              <div className="mb-4">
                <div className="text-xs text-red-600 bg-red-50 p-3 rounded border border-red-200">
                  * Deposits made are non-refundable when orders are cancelled
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                className="w-full bg-red-600 text-white py-3 px-4 rounded font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} />
                Continue to Order Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuSelectionModal;
