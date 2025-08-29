import React, { useState, useMemo, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import {
  X,
  Check,
  ShoppingCart,
  Truck,
  Box,
  ArrowLeft,
  MapPin,
  Users,
  Calendar,
  Phone,
  Mail,
  User,
  Home,
  Leaf,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { createBooking } from "../../services/bookingService";
import { getLocations } from "../../services/locationServices";
import { getServices, getServiceById } from "../../services/serviceServices";
import { getInquiries } from "../../services/inquiryService";
import { AppContext } from "../../context/AppContext";

// Helper function to format currency
const formatPrice = (price) => {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(price);
};

const OrderConfirmationModal = ({ orderData, onClose }) => {
  // Get user data from context
  const { userData, isLoggedIn, isAdmin } = useContext(AppContext);

  // Update your initial formData state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    description: "",
    deliveryType: orderData?.isFunction ? "Event" : "Pickup", // Set to Event for functions
    deliveryDate: "",
    street: "",
    suburb: "",
    postcode: "",
    state: "",
    country: "Australia",
  });
  const [isFunction, setIsFunction] = useState(false);
  const [availableVenues, setAvailableVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState("");
  const [venueCharge, setVenueCharge] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);

  // Inquiry auto-fill states
  const [inquiries, setInquiries] = useState([]);
  const [showInquiryDropdown, setShowInquiryDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);

  // Simple dietary requirements state
  const [hasDietaryRequirements, setHasDietaryRequirements] = useState(false);
  const [dietaryRequirements, setDietaryRequirements] = useState([]);
  const [spiceLevel, setSpiceLevel] = useState("medium");

  useEffect(() => {
    const loadData = async () => {
      document.body.classList.add("no-scroll");

      if (isAdmin) {
        await loadInquiries();
      }

      if (orderData?.isCustomOrder) {
        // We still load locations and services for potential display purposes
        // but don't use them for selection since they're already chosen
        try {
          const [locationsResult, servicesResult] = await Promise.all([
            getLocations(),
            getServices(),
          ]);

          if (locationsResult.success) {
            const activeLocations = locationsResult.data.filter(
              (loc) => loc.isActive
            );
            setLocations(activeLocations);
          }

          if (servicesResult.success) {
            const activeServices = servicesResult.data.filter(
              (service) => service.isActive
            );
            setServices(activeServices);
          }
        } catch (error) {
          console.error("Error loading locations and services:", error);
        }
      }
      // Check if this is a function service booking
      if (orderData?.menu?.serviceId) {
        try {
          // Extract the actual service ID (could be object or string)
          const serviceId =
            orderData.menu.serviceId._id || orderData.menu.serviceId;

          const serviceResult = await getServiceById(serviceId);
          if (serviceResult.success && serviceResult.data.service.isFunction) {
            setIsFunction(true);

            // Get venue data from the order (passed from MenuSelectionModal)
            if (
              orderData.venueSelection &&
              orderData.venueCharge !== undefined
            ) {
              setSelectedVenue(orderData.venueSelection);
              setVenueCharge(orderData.venueCharge);
            }

            // Set available venues for display
            const venues = [];
            const venueOptions = serviceResult.data.service.venueOptions || {};

            if (venueOptions.both?.available) {
              venues.push({
                key: "both",
                label: "Both Venues (Indoor + Outdoor)",
                minPeople: venueOptions.both.minPeople,
                maxPeople: venueOptions.both.maxPeople,
                charge: venueOptions.both.venueCharge,
              });
            }

            if (venueOptions.indoor?.available) {
              venues.push({
                key: "indoor",
                label: "Indoor Only",
                minPeople: venueOptions.indoor.minPeople,
                maxPeople: venueOptions.indoor.maxPeople,
                charge: venueOptions.indoor.venueCharge,
              });
            }

            if (venueOptions.outdoor?.available) {
              venues.push({
                key: "outdoor",
                label: "Outdoor Only",
                minPeople: venueOptions.outdoor.minPeople,
                maxPeople: venueOptions.outdoor.maxPeople,
                charge: venueOptions.outdoor.venueCharge,
                chargeThreshold: venueOptions.outdoor.chargeThreshold,
              });
            }

            setAvailableVenues(venues);
          }
        } catch (error) {
          console.error("Error checking service details:", error);
        }
      }
    };

    loadData();

    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [orderData, isAdmin]);

  // Load inquiries for admin
  const loadInquiries = async () => {
    if (!isAdmin) return;

    setIsLoadingInquiries(true);
    try {
      const result = await getInquiries({ limit: 100 });
      if (result.success) {
        setInquiries(result.data || []);
      } else {
        console.error("Failed to load inquiries:", result.error);
      }
    } catch (error) {
      console.error("Error loading inquiries:", error);
    } finally {
      setIsLoadingInquiries(false);
    }
  };

  // Filter inquiries based on search term
  const filteredInquiries = useMemo(() => {
    if (!searchTerm) return inquiries.slice(0, 10);

    return inquiries
      .filter(
        (inquiry) =>
          inquiry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inquiry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(inquiry.contact || "").includes(searchTerm)
      )
      .slice(0, 10);
  }, [inquiries, searchTerm]);

  // Auto-fill from selected inquiry
  const fillFromInquiry = (inquiry) => {
    setFormData((prev) => ({
      ...prev,
      name: inquiry.name || "",
      email: inquiry.email || "",
      phone: String(inquiry.contact || ""),
    }));
    setShowInquiryDropdown(false);
    setSearchTerm("");
    toast.success(`Contact details filled from ${inquiry.name}'s inquiry!`);
  };

  // Handle dietary requirements toggle
  const handleDietaryToggle = (hasRequirements) => {
    setHasDietaryRequirements(hasRequirements);
    if (!hasRequirements) {
      setDietaryRequirements([]);
      setSpiceLevel("medium");
    }
  };

  // Handle dietary requirement selection
  const handleDietaryRequirementToggle = (requirement) => {
    setDietaryRequirements((prev) =>
      prev.includes(requirement)
        ? prev.filter((req) => req !== requirement)
        : [...prev, requirement]
    );
  };

  const checkSelectedVenueAvailability = async () => {
    if (!isFunction || !selectedVenue || !formData.deliveryDate) {
      return true; // Skip check if not applicable
    }

    try {
      const result = await checkVenueAvailability({
        locationId:
          orderData?.menu?.locationId?._id || orderData?.menu?.locationId,
        serviceId:
          orderData?.menu?.serviceId?._id || orderData?.menu?.serviceId,
        date: formData.deliveryDate,
        venueType: selectedVenue,
      });

      if (!result) {
        return true; // Allow booking if check fails
      }

      if (result.success && result.data && !result.data.isAvailable) {
        const conflicts = result.data.conflictingBookings || [];
        const conflictMessage =
          conflicts.length > 0
            ? `The ${
                selectedVenue === "both"
                  ? "venues are"
                  : `${selectedVenue} venue is`
              } already booked on this date. Conflicting booking: ${
                conflicts[0].bookingReference
              }`
            : `The ${
                selectedVenue === "both"
                  ? "venues are"
                  : `${selectedVenue} venue is`
              } not available on this date.`;

        toast.error(conflictMessage);
        return false;
      }

      return true; // Available or check couldn't be performed
    } catch (error) {
      console.error("Error checking venue availability:", error);
      // For now, allow booking if availability check fails
      return true;
    }
  };

  // Helper function to convert custom order selections to items
  const convertCustomOrderSelectionsToItems = (orderData) => {
    const items = [];
    const { selections, fullMenu, peopleCount } = orderData;

    if (!fullMenu || !selections) {
      return items;
    }

    // Process category selections
    if (selections.categories) {
      Object.entries(selections.categories).forEach(
        ([categoryName, categorySelections]) => {
          const category = fullMenu.categories?.find(
            (cat) => cat.name === categoryName
          );

          if (category && categorySelections) {
            categorySelections.forEach((selection) => {
              const item = category.items?.find(
                (item) => item._id === selection.itemId
              );

              if (item) {
                const totalPrice =
                  (item.pricePerPerson || 0) *
                  peopleCount *
                  (selection.quantity || 1);

                items.push({
                  name: item.name,
                  description: item.description || "",
                  category:
                    categoryName === "entree"
                      ? "entree"
                      : categoryName === "mains"
                      ? "mains"
                      : categoryName === "dessert" ||
                        categoryName === "desserts"
                      ? "desserts"
                      : categoryName.toLowerCase(),
                  type: "selected",
                  pricePerPerson: item.pricePerPerson || 0,
                  totalPrice: totalPrice,
                  quantity: selection.quantity || 1,
                  isVegan: item.isVegan || false,
                  isVegetarian: item.isVegetarian || false,
                  allergens: item.allergens || [],
                });
              }
            });
          }
        }
      );
    }

    // Process addons
    if (selections.addons && fullMenu.addons?.enabled) {
      selections.addons.forEach((addonSelection) => {
        // Check fixed addons
        if (fullMenu.addons.fixedAddons) {
          const addon = fullMenu.addons.fixedAddons.find(
            (a) => a._id === addonSelection.addonId
          );
          if (addon) {
            const totalPrice =
              (addon.pricePerPerson || 0) *
              peopleCount *
              addonSelection.quantity;

            items.push({
              name: addon.name,
              description: addon.description || "",
              category: "addons",
              type: "addon",
              pricePerPerson: addon.pricePerPerson || 0,
              totalPrice: totalPrice,
              quantity: addonSelection.quantity,
              isVegan: addon.isVegan || false,
              isVegetarian: addon.isVegetarian || false,
              allergens: addon.allergens || [],
            });
          }
        }

        // Check variable addons
        if (fullMenu.addons.variableAddons) {
          const addon = fullMenu.addons.variableAddons.find(
            (a) => a._id === addonSelection.addonId
          );
          if (addon) {
            const totalPrice =
              (addon.pricePerUnit || 0) * addonSelection.quantity;

            items.push({
              name: `${addon.name} (${addonSelection.quantity} ${
                addon.unit || "pieces"
              })`,
              description: addon.description || "",
              category: "addons",
              type: "addon",
              pricePerUnit: addon.pricePerUnit || 0,
              totalPrice: totalPrice,
              quantity: addonSelection.quantity,
              isVegan: addon.isVegan || false,
              isVegetarian: addon.isVegetarian || false,
              allergens: addon.allergens || [],
            });
          }
        }
      });
    }

    return items;
  };

  // Helper function to convert menu order selections to items
  const convertMenuOrderSelectionsToItems = (orderData) => {
    const items = [];
    const { selections, fullMenu } = orderData;

    if (!fullMenu || !selections) {
      return items;
    }

    // Handle simple package items
    if (fullMenu.packageType === "simple" && fullMenu.simpleItems) {
      fullMenu.simpleItems.forEach((item, itemIndex) => {
        const itemSelection = selections[`simple-${itemIndex}`];

        // Create a display name that includes selected choices
        let displayName = item.name;
        let totalPriceModifier = item.priceModifier || 0;

        // If item has choices and user made selections, show the selected choice instead
        if (item.hasChoices && itemSelection?.choices && item.choices) {
          const selectedChoices = itemSelection.choices
            .map((choiceIndex) => {
              const choice = item.choices[choiceIndex];
              if (choice) {
                totalPriceModifier += choice.priceModifier || 0;
                return choice.name;
              }
              return null;
            })
            .filter(Boolean);

          if (selectedChoices.length > 0) {
            displayName = selectedChoices.join(", ");
          }
        }

        // Add selected options to the display name and price
        const selectedOptions = [];
        if (itemSelection?.options && item.options) {
          itemSelection.options.forEach((optionIndex) => {
            const option = item.options[optionIndex];
            if (option) {
              selectedOptions.push(option.name);
              totalPriceModifier += option.priceModifier || 0;
            }
          });
        }

        // Append options to display name if any
        if (selectedOptions.length > 0) {
          displayName += ` (${selectedOptions.join(", ")})`;
        }

        // Add single consolidated item
        items.push({
          name: displayName,
          description: item.description || "",
          category: "package",
          type: "package",
          priceModifier: totalPriceModifier,
          quantity: item.quantity || 1,
          isVegan: item.isVegan || false,
          isVegetarian: item.isVegetarian || false,
          allergens: item.allergens || [],
        });
      });
    }

    // Handle categorized package items (unchanged)
    if (fullMenu.packageType === "categorized" && fullMenu.categories) {
      fullMenu.categories.forEach((category, categoryIndex) => {
        if (!category.enabled) return;

        // Add included items
        if (category.includedItems) {
          category.includedItems.forEach((item) => {
            items.push({
              name: item.name,
              description: item.description || "",
              category: category.name.toLowerCase(),
              type: "included",
              priceModifier: item.priceModifier || 0,
              isVegan: item.isVegan || false,
              isVegetarian: item.isVegetarian || false,
              allergens: item.allergens || [],
            });
          });
        }

        // Add selected items from selection groups
        if (category.selectionGroups) {
          category.selectionGroups.forEach((group, groupIndex) => {
            const key = `category-${categoryIndex}-group-${groupIndex}`;
            const selectedItems = selections[key] || [];

            selectedItems.forEach((itemIndex) => {
              const item = group.items[itemIndex];
              if (item) {
                items.push({
                  name: item.name,
                  description: item.description || "",
                  category: category.name.toLowerCase(),
                  type: "selected",
                  priceModifier: item.priceModifier || 0,
                  isVegan: item.isVegan || false,
                  isVegetarian: item.isVegetarian || false,
                  allergens: item.allergens || [],
                });
              }
            });
          });
        }
      });
    }

    // Handle menu addons (unchanged)
    if (fullMenu.addons?.enabled) {
      // Fixed addons
      if (selections["addons-fixed"] && fullMenu.addons.fixedAddons) {
        selections["addons-fixed"].forEach((addonIndex) => {
          const addon = fullMenu.addons.fixedAddons[addonIndex];
          if (addon) {
            items.push({
              name: addon.name,
              description: addon.description || "",
              category: "addons",
              type: "addon",
              pricePerPerson: addon.pricePerPerson,
              isVegan: addon.isVegan || false,
              isVegetarian: addon.isVegetarian || false,
              allergens: addon.allergens || [],
            });
          }
        });
      }

      // Variable addons
      if (selections["addons-variable"] && fullMenu.addons.variableAddons) {
        Object.entries(selections["addons-variable"]).forEach(
          ([addonIndex, quantity]) => {
            const addon = fullMenu.addons.variableAddons[parseInt(addonIndex)];
            if (addon && quantity > 0) {
              items.push({
                name: `${addon.name} (${quantity} ${addon.unit || "pieces"})`,
                description: addon.description || "",
                category: "addons",
                type: "addon",
                quantity: quantity,
                pricePerUnit: addon.pricePerUnit,
                totalPrice: addon.pricePerUnit * quantity,
                isVegan: addon.isVegan || false,
                isVegetarian: addon.isVegetarian || false,
                allergens: addon.allergens || [],
              });
            }
          }
        );
      }
    }

    return items;
  };

  // Convert menu selections to selectedItems format for display
  const convertSelectionsToItems = useMemo(() => {
    const items = [];

    if (!orderData) {
      return items;
    }

    const isCustomOrder = orderData.isCustomOrder || false;

    if (isCustomOrder) {
      // Handle Custom Order Items - Use selectedItems array directly from CustomOrderModal
      if (orderData.selectedItems && orderData.selectedItems.length > 0) {
        // Custom order modal already provides selectedItems in the right format
        return orderData.selectedItems.map((item) => ({
          name: item.name,
          description: item.description || "",
          category: item.category || "other",
          type:
            item.type === "fixedAddon" || item.type === "variableAddon"
              ? "addon"
              : item.type || "selected",
          pricePerPerson: item.pricePerPerson || 0,
          pricePerUnit: item.pricePerUnit || 0,
          totalPrice: item.totalPrice || 0,
          quantity: item.quantity || 1,
          isVegan: item.isVegan || false,
          isVegetarian: item.isVegetarian || false,
          allergens: item.allergens || [],
        }));
      } else {
        // Fallback: Convert from selections if selectedItems is not available
        return convertCustomOrderSelectionsToItems(orderData);
      }
    } else {
      // Handle Menu Order Items - Convert from selections
      return convertMenuOrderSelectionsToItems(orderData);
    }
  }, [orderData]);

  // Group selected items by category
  const groupedItems = useMemo(() => {
    return convertSelectionsToItems.reduce((acc, item) => {
      const category = item.category || "other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  }, [convertSelectionsToItems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  // Simple Dietary Requirements Component
  const renderDietaryRequirements = () => {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          🍽️ Dietary Requirements
        </h3>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Do you have any dietary requirements or spice preferences?
          </p>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="hasDietary"
                checked={hasDietaryRequirements === true}
                onChange={() => handleDietaryToggle(true)}
                className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="hasDietary"
                checked={hasDietaryRequirements === false}
                onChange={() => handleDietaryToggle(false)}
                className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        {hasDietaryRequirements && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select your dietary requirements:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { value: "vegetarian", label: "🌱 Vegetarian" },
                  { value: "vegan", label: "🌿 Vegan" },
                  { value: "gluten-free", label: "🚫 Gluten-Free" },
                  { value: "halal-friendly", label: "☪️ Halal-Friendly" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={dietaryRequirements.includes(option.value)}
                      onChange={() =>
                        handleDietaryRequirementToggle(option.value)
                      }
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spice Level Preference:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "mild", label: "🌶️ Mild" },
                  { value: "medium", label: "🌶️🌶️ Medium" },
                  { value: "hot", label: "🌶️🌶️🌶️ Hot" },
                  { value: "extra-hot", label: "🌶️🌶️🌶️🌶️ Extra Hot" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="spiceLevel"
                      value={option.value}
                      checked={spiceLevel === option.value}
                      onChange={(e) => setSpiceLevel(e.target.value)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {(dietaryRequirements.length > 0 || spiceLevel !== "medium") && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="font-medium text-green-800 mb-1">
                  Your Preferences:
                </h4>
                <div className="text-sm text-green-700">
                  {dietaryRequirements.length > 0 && (
                    <p>
                      <strong>Dietary:</strong> {dietaryRequirements.join(", ")}
                    </p>
                  )}
                  <p>
                    <strong>Spice Level:</strong> {spiceLevel}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
        {/* Venue Information - Only for function services */}
        {isFunction && selectedVenue && (
          <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              🏢 Selected Venue
            </h3>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-green-800">
                  {selectedVenue === "both" && "Both Venues (Indoor + Outdoor)"}
                  {selectedVenue === "indoor" && "Indoor Only"}
                  {selectedVenue === "outdoor" && "Outdoor Only"}
                </div>
                {venueCharge > 0 && (
                  <div className="text-orange-600 font-semibold">
                    +{formatPrice(venueCharge)} venue charge
                  </div>
                )}
              </div>

              <div className="text-sm text-green-700">
                <p>Group Size: {orderData?.peopleCount} people</p>
                {selectedVenue === "outdoor" && venueCharge > 0 && (
                  <p className="text-orange-700 mt-1">
                    Venue charge applies for groups under 35 people
                  </p>
                )}
                {selectedVenue === "outdoor" &&
                  venueCharge === 0 &&
                  orderData?.peopleCount >= 35 && (
                    <p className="mt-1">
                      No venue charge for groups of 35+ people
                    </p>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const validateDeliveryTime = (dateTimeString) => {
    if (!dateTimeString) return false;

    const selectedDate = new Date(dateTimeString);
    const now = new Date();

    if (selectedDate <= now) return false;

    const hours = selectedDate.getHours();
    return hours >= 11 && hours < 20;
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.name.trim()) {
      errors.push("Name is required");
    }
    if (!formData.email.trim()) {
      errors.push("Email is required");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push("Please enter a valid email");
    }
    if (!formData.phone.trim()) {
      errors.push("Phone number is required");
    }
    if (isFunction && !selectedVenue) {
      errors.push("Please select a venue for your function");
    }

    if (!formData.deliveryDate) {
      errors.push("Please select a delivery/pickup date and time");
    } else {
      const deliveryDate = new Date(formData.deliveryDate);
      const now = new Date();

      if (deliveryDate <= now) {
        errors.push("Delivery date must be in the future");
      }

      const hours = deliveryDate.getHours();
      if (hours < 11 || hours >= 20) {
        errors.push("Please select a time between 11 AM and 8 PM");
      }
    }

    if (orderData?.isCustomOrder) {
      if (!orderData?.menu?.locationId && !orderData?.locationId) {
        errors.push("Location information is missing");
      }
      if (!orderData?.menu?.serviceId && !orderData?.serviceId) {
        errors.push("Service information is missing");
      }
    }

    if (formData.deliveryType === "Delivery") {
      if (!formData.street.trim()) {
        errors.push("Street address is required for delivery");
      }
      if (!formData.suburb.trim()) {
        errors.push("Suburb is required for delivery");
      }
      if (!formData.postcode.trim()) {
        errors.push("Postcode is required for delivery");
      }
      if (!formData.state.trim()) {
        errors.push("State is required for delivery");
      }
    }

    return errors;
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }
    // if (isFunction) {
    //   try {
    //     const isAvailable = await checkSelectedVenueAvailability();
    //     if (!isAvailable) {
    //       return; // Stop submission if venue is not available
    //     }
    //   } catch (error) {
    //     console.error("Venue availability check error:", error);
    //     toast.error("Could not verify venue availability");
    //     return;
    //   }
    // }

    setIsSubmitting(true);

    try {
      // Prepare the booking data in the format expected by the backend
      const bookingData = {
        // Menu information
        menu: {
          menuId: orderData?.menuId || orderData?.menu?.menuId || null,
          name: orderData?.menu?.name || "Order",
          basePrice: orderData?.menu?.basePrice || orderData?.menu?.price || 0,
          locationId: orderData?.isCustomOrder
            ? orderData?.menu?.locationId || orderData?.locationId
            : orderData?.menu?.locationId || orderData?.menu?.locationId?._id,
          locationName: orderData?.isCustomOrder
            ? orderData?.menu?.locationName || orderData?.locationName
            : orderData?.menu?.locationId?.name ||
              orderData?.menu?.locationName,
          serviceId: orderData?.isCustomOrder
            ? orderData?.menu?.serviceId || orderData?.serviceId
            : orderData?.menu?.serviceId || orderData?.menu?.serviceId?._id,
          serviceName: orderData?.isCustomOrder
            ? orderData?.menu?.serviceName || orderData?.serviceName
            : orderData?.menu?.serviceId?.name || orderData?.menu?.serviceName,
        },

        // Customer details with dietary requirements
        customerDetails: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          specialInstructions: formData.description || "",
          dietaryRequirements: hasDietaryRequirements
            ? dietaryRequirements
            : [],
          spiceLevel: hasDietaryRequirements ? spiceLevel : "medium",
        },

        venueSelection: isFunction ? selectedVenue : undefined,
        venueCharge: isFunction ? venueCharge : 0,
        isFunction: isFunction,

        // Order details
        peopleCount: orderData?.peopleCount || 1,
        deliveryType: isFunction ? "Event" : formData.deliveryType,

        deliveryDate: formData.deliveryDate,

        // Address (conditional)
        address:
          formData.deliveryType === "Delivery"
            ? {
                street: formData.street,
                suburb: formData.suburb,
                postcode: formData.postcode,
                state: formData.state,
                country: formData.country,
              }
            : undefined,

        // Selected items - use convertSelectionsToItems which is already properly formatted
        // Fix any invalid type values before sending
        selectedItems: convertSelectionsToItems.map((item) => ({
          ...item,
          type:
            item.type === "fixedAddon" || item.type === "variableAddon"
              ? "addon"
              : item.type,
        })),

        // Menu selections (keep original format for reference if available)
        menuSelections: orderData?.selections || {},

        // Pricing
        pricing: {
          basePrice: orderData?.pricing?.basePrice || 0,
          modifierPrice: orderData?.pricing?.modifierPrice || 0,
          itemsPrice: orderData?.pricing?.itemsPrice || 0,
          addonsPrice: orderData?.pricing?.addonsPrice || 0,
          total: orderData?.pricing?.total || 0,
        },

        // Custom order flag
        isCustomOrder: orderData?.isCustomOrder || false,
      };

      const result = await createBooking(bookingData);
      if (!result) {
        console.error("createBooking returned undefined");
        toast.error("Failed to submit order. Please try again.");
        return;
      }
      if (result.success) {
        toast.success(result.message || "Order submitted successfully!");

        if (result.data?.bookingReference) {
          toast.success(
            `Your booking reference is: ${result.data.bookingReference}`,
            {
              duration: 8000,
            }
          );
        }

        onClose();
      } else {
        console.error("Booking creation failed:", result.error);
        toast.error(
          result.error || "Failed to submit order. Please try again."
        );
      }
    } catch (error) {
      console.error("Order submission error:", error);
      toast.error("Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPrice = orderData?.pricing?.total || 0;
  const pricePerPerson =
    orderData?.peopleCount > 0 ? totalPrice / orderData.peopleCount : 0;

  // Define the order of categories for display
  const categoryOrder = [
    "package",
    "choices",
    "options",
    "entree",
    "mains",
    "desserts",
    "addons",
    "other",
  ];
  const total = orderData?.pricing?.total || 0;
  const realTotal = total + (venueCharge || 0);

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
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
            Confirm Your Order
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-white/90 text-sm">
            <div className="flex items-center gap-1">
              <span className="font-medium">{orderData?.menu?.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{orderData?.peopleCount} people</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>
                {orderData?.menu?.locationId?.name ||
                  orderData?.menu?.locationName ||
                  "Location"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
          {/* Order Summary Sidebar */}
          <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 p-3 sm:p-4 lg:overflow-y-auto flex-shrink-0">
            <div className="mb-4">
              <h3 className="font-bold text-gray-900 mb-3">Order Summary</h3>

              {/* Total Price Display */}

              <div className="text-center mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xl sm:text-2xl font-bold text-green-700">
                  {formatPrice(totalPrice)}
                </div>
                <div className="text-sm text-green-600">
                  {formatPrice(totalPrice / (orderData?.peopleCount || 1))} per
                  person per person
                </div>
              </div>

              {/* Pricing Breakdown */}
              {/* Update the pricing breakdown in the sidebar */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  {/* Base Package */}
                  {!orderData?.isCustomOrder && (
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Base Package:</span>
                      <span className="font-medium">
                        {formatPrice(orderData?.pricing?.basePrice || 0)}
                      </span>
                    </div>
                  )}

                  {/* Custom Order Items or Menu Modifications */}
                  {(orderData?.pricing?.modifierPrice > 0 ||
                    orderData?.pricing?.itemsPrice > 0) && (
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">
                        {orderData?.isCustomOrder
                          ? "Selected Items:"
                          : "Modifications:"}
                      </span>
                      <span className="font-medium text-primary-green">
                        {formatPrice(
                          (orderData?.pricing?.modifierPrice || 0) +
                            (orderData?.pricing?.itemsPrice || 0)
                        )}
                      </span>
                    </div>
                  )}

                  {/* Add-ons */}
                  {orderData?.pricing?.addonsPrice > 0 && (
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Add-ons:</span>
                      <span className="font-medium text-blue-600">
                        {formatPrice(orderData?.pricing?.addonsPrice || 0)}
                      </span>
                    </div>
                  )}
                  {/* Venue Charge - Already included in total */}
                  {/* Venue Charge - Remove "(included)" text */}
                  {isFunction && venueCharge > 0 && (
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Venue Charge:</span>
                      <span className="font-medium text-orange-600">
                        {formatPrice(venueCharge)}
                      </span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="border-t pt-1 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>{formatPrice(realTotal)}</span>
                    </div>
                    <div className="text-xs text-gray-500 text-right mt-1">
                      {formatPrice(realTotal / (orderData?.peopleCount || 1))}{" "}
                      per person
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Items */}
            <div className=" overflow-y-auto">
              <h4 className="font-medium text-gray-900 mb-3">
                Your Selections
              </h4>
              <div className="space-y-3">
                {convertSelectionsToItems.length === 0 ? (
                  <div className="text-center py-4">
                    <span className="text-gray-500 text-sm">
                      No items selected
                    </span>
                  </div>
                ) : (
                  categoryOrder.map(
                    (category) =>
                      groupedItems[category] && (
                        <div
                          key={category}
                          className="bg-gray-50 rounded-lg p-3"
                        >
                          <h5 className="font-medium text-sm text-gray-800 capitalize border-b border-gray-200 pb-1 mb-2">
                            {category}
                          </h5>
                          <div className="space-y-1">
                            {groupedItems[category].map((item, index) => (
                              <div
                                key={index}
                                className="flex items-start text-xs"
                              >
                                <div
                                  className={`rounded-full p-0.5 mr-2 mt-0.5 flex-shrink-0 ${
                                    item.type === "addon"
                                      ? "bg-blue-500"
                                      : item.type === "included"
                                      ? "bg-green-500"
                                      : "bg-primary-green"
                                  }`}
                                >
                                  <Check size={8} className="text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center flex-wrap">
                                    <span
                                      className={`${
                                        item.type === "addon"
                                          ? "text-blue-700"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {item.name}
                                    </span>
                                    {renderInlineDietaryInfo(item)}
                                  </div>

                                  {/* Conditionally render price info */}
                                  {!orderData?.isCustomOrder && (
                                    <div className="text-xs mt-1">
                                      {/* For custom order items with pricePerPerson */}
                                      {item.pricePerPerson > 0 && (
                                        <span className="text-blue-600 block">
                                          {formatPrice(item.pricePerPerson)} per
                                          person
                                          {item.quantity > 1 &&
                                            ` × ${item.quantity}`}
                                          {item.totalPrice && (
                                            <span className="font-medium ml-1">
                                              = {formatPrice(item.totalPrice)}
                                            </span>
                                          )}
                                        </span>
                                      )}

                                      {/* For variable addons with pricePerUnit */}
                                      {item.pricePerUnit > 0 && (
                                        <span className="text-blue-600 block">
                                          {formatPrice(item.pricePerUnit)} per
                                          unit
                                          {item.quantity &&
                                            ` × ${item.quantity}`}
                                          {item.totalPrice && (
                                            <span className="font-medium ml-1">
                                              = {formatPrice(item.totalPrice)}
                                            </span>
                                          )}
                                        </span>
                                      )}

                                      {/* For menu items with priceModifier */}
                                      {item.priceModifier !== undefined &&
                                        item.priceModifier !== 0 && (
                                          <span className="text-primary-green block">
                                            {item.priceModifier > 0 ? "+" : ""}
                                            {formatPrice(
                                              item.priceModifier
                                            )}{" "}
                                            per person
                                          </span>
                                        )}

                                      {/* For items with totalPrice but no per-person or per-unit pricing */}
                                      {item.totalPrice > 0 &&
                                        !item.pricePerPerson &&
                                        !item.pricePerUnit &&
                                        !item.priceModifier && (
                                          <span className="text-green-600 block font-medium">
                                            {formatPrice(item.totalPrice)} total
                                          </span>
                                        )}

                                      {/* Show quantity if it's more than 1 and not already shown */}
                                      {item.quantity > 1 &&
                                        !item.pricePerPerson &&
                                        !item.pricePerUnit && (
                                          <span className="text-gray-500 block">
                                            Quantity: {item.quantity}
                                          </span>
                                        )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                  )
                )}
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 p-3 sm:p-4 lg:overflow-y-auto">
            <div className="space-y-6">
              {/* Custom Order Location & Service Information */}
              {orderData?.isCustomOrder && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <MapPin size={18} />
                    Selected Location & Service
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Location Information */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                        <MapPin
                          className="text-blue-600 flex-shrink-0"
                          size={16}
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {orderData?.menu?.locationName ||
                              orderData?.locationName ||
                              "Selected Location"}
                          </div>
                          {orderData?.menu?.locationId?.city && (
                            <div className="text-sm text-gray-600">
                              {orderData.menu.locationId.city}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Service Information */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Type
                      </label>
                      <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                        <Briefcase
                          className="text-blue-600 flex-shrink-0"
                          size={16}
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {orderData?.menu?.serviceName ||
                              orderData?.serviceName ||
                              "Selected Service"}
                          </div>
                          {orderData?.menu?.serviceDescription && (
                            <div className="text-sm text-gray-600">
                              {orderData.menu.serviceDescription}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dietary Requirements Section */}
              {renderDietaryRequirements()}

              {/* Basic Details */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User size={18} />
                    Contact Information
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* Auto-fill from inquiry button - only for admin */}
                    {isAdmin && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setShowInquiryDropdown(!showInquiryDropdown)
                          }
                          className="text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Users size={14} />
                          Fill from Inquiry
                        </button>

                        {/* Inquiry Dropdown */}
                        {showInquiryDropdown && (
                          <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <div className="p-3 border-b border-gray-200">
                              <input
                                type="text"
                                placeholder="Search inquiries by name, email, or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              {isLoadingInquiries ? (
                                <div className="p-4 text-center text-gray-500">
                                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent mx-auto mb-2"></div>
                                  Loading inquiries...
                                </div>
                              ) : filteredInquiries.length > 0 ? (
                                filteredInquiries.map((inquiry) => (
                                  <button
                                    key={inquiry._id}
                                    type="button"
                                    onClick={() => fillFromInquiry(inquiry)}
                                    className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                  >
                                    <div className="font-medium text-gray-900">
                                      {inquiry.name}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {inquiry.email}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {String(inquiry.contact || "")}
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="p-4 text-center text-gray-500">
                                  {searchTerm
                                    ? "No inquiries match your search"
                                    : "No inquiries found"}
                                </div>
                              )}
                            </div>
                            <div className="p-2 border-t border-gray-200">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowInquiryDropdown(false);
                                  setSearchTerm("");
                                }}
                                className="text-sm text-gray-600 hover:text-gray-800"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Show user info if logged in */}
                {isLoggedIn && userData && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Logged in as:</strong>{" "}
                      {userData.name ||
                        `${userData.firstName || ""} ${
                          userData.lastName || ""
                        }`.trim() ||
                        userData.email}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Your contact information can be auto-filled from your
                      profile
                    </p>
                  </div>
                )}

                {/* Admin inquiry helper info */}
                {isAdmin && (
                  <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-800">
                      <strong>Admin Feature:</strong> You can auto-fill customer
                      contact details from existing inquiries using the "Fill
                      from Inquiry" button above.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Any special requirements or notes for your order"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar size={18} />
                  {isFunction ? "Event Information" : "Delivery Information"}
                </h3>

                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong>{" "}
                    {isFunction ? "Event" : "Pickup and Delivery"} times are
                    between 11 AM and 8 PM.
                  </p>
                </div>

                {/* Delivery Type Selection */}
                {!isFunction && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div
                      onClick={() =>
                        handleInputChange({
                          target: { name: "deliveryType", value: "Pickup" },
                        })
                      }
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                        formData.deliveryType === "Pickup"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <Box size={20} />
                      <span className="font-medium">Pickup</span>
                    </div>
                    <div
                      onClick={() =>
                        handleInputChange({
                          target: { name: "deliveryType", value: "Delivery" },
                        })
                      }
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                        formData.deliveryType === "Delivery"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <Truck size={20} />
                      <span className="font-medium">Delivery</span>
                    </div>
                  </div>
                )}

                {/* Date and Time */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFunction ? "Event" : formData.deliveryType} Date & Time *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Available times: 11 AM - 8 PM (7 days a week)
                  </p>
                  <input
                    type="datetime-local"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={(e) => {
                      if (validateDeliveryTime(e.target.value)) {
                        handleInputChange(e);
                      } else {
                        toast.error(
                          "Please select a time between 11 AM and 8 PM"
                        );
                      }
                    }}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                {/* Delivery Address (conditional) */}
                {!isFunction && formData.deliveryType === "Delivery" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Home size={16} />
                      Delivery Address
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          name="street"
                          value={formData.street}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter street address"
                          required={formData.deliveryType === "Delivery"}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Suburb *
                        </label>
                        <input
                          type="text"
                          name="suburb"
                          value={formData.suburb}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter suburb"
                          required={formData.deliveryType === "Delivery"}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Postcode *
                        </label>
                        <input
                          type="text"
                          name="postcode"
                          value={formData.postcode}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter postcode"
                          required={formData.deliveryType === "Delivery"}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter state"
                          required={formData.deliveryType === "Delivery"}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="Australia">Australia</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Important Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Deposits made are non-refundable
                  when orders are cancelled. Please review your order carefully
                  before submitting.
                </p>
              </div>

              {/* Submit Button */}
              <motion.button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                className="w-full bg-red-600 disabled:bg-gray-400 text-white py-4 rounded-lg font-semibold hover:bg-red-700 disabled:hover:bg-gray-400 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Submitting Order...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    Submit Order
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OrderConfirmationModal;
