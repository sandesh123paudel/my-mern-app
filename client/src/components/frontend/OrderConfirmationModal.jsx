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
import { getServices } from "../../services/serviceServices";
import { getInquiries } from "../../services/inquiryService"; // Import inquiry service
import { AppContext } from "../../context/AppContext"; // Import the context

// Helper function to format currency
const formatPrice = (price) => {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(price);
};

const OrderConfirmationModal = ({ orderData, onClose, onBack }) => {
  // Get user data from context
  const { userData, isLoggedIn, isAdmin } = useContext(AppContext);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    description: "",
    deliveryType: "Pickup",
    deliveryDate: "",
    street: "",
    suburb: "",
    postcode: "",
    state: "",
    country: "Australia",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(
    orderData?.menu?.locationId || ""
  );
  const [selectedService, setSelectedService] = useState(
    orderData?.menu?.serviceId || ""
  );

  // Inquiry auto-fill states
  const [inquiries, setInquiries] = useState([]);
  const [showInquiryDropdown, setShowInquiryDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);

  // Simple dietary requirements state
  const [hasDietaryRequirements, setHasDietaryRequirements] = useState(
    orderData?.hasDietaryRequirements ||
      (orderData?.dietaryRequirements &&
        orderData.dietaryRequirements.length > 0) ||
      false
  );
  const [dietaryRequirements, setDietaryRequirements] = useState(
    orderData?.dietaryRequirements || []
  );
  const [spiceLevel, setSpiceLevel] = useState(
    orderData?.spiceLevel || "medium"
  );

  useEffect(() => {
    const loadData = async () => {
      // Add the "no-scroll" class to the body when the modal is mounted
      document.body.classList.add("no-scroll");

      // Load inquiries for admin users
      if (isAdmin) {
        await loadInquiries();
      }

      // Load locations and services for custom orders
      if (orderData?.isCustomOrder) {
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
    };

    loadData();

    // Clean up the effect by removing the class when the modal is unmounted
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [orderData, isAdmin]); // Updated dependencies

  // Load inquiries for admin
  const loadInquiries = async () => {
    if (!isAdmin) return;

    setIsLoadingInquiries(true);
    try {
      const result = await getInquiries({ limit: 100 }); // Get recent 100 inquiries
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
    if (!searchTerm) return inquiries.slice(0, 10); // Show first 10 if no search

    return inquiries
      .filter(
        (inquiry) =>
          inquiry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inquiry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(inquiry.contact || "").includes(searchTerm) // Convert phone to string
      )
      .slice(0, 10);
  }, [inquiries, searchTerm]);

  // Auto-fill from selected inquiry
  const fillFromInquiry = (inquiry) => {
    setFormData((prev) => ({
      ...prev,
      name: inquiry.name || "",
      email: inquiry.email || "",
      phone: String(inquiry.contact || ""), // Convert phone to string
    }));
    setShowInquiryDropdown(false);
    setSearchTerm("");
    toast.success(`Contact details filled from ${inquiry.name}'s inquiry!`);
  };

  // Get filtered services based on selected location
  const getFilteredServices = () => {
    if (!selectedLocation) return [];
    return services.filter(
      (service) =>
        (service.locationId?._id || service.locationId) === selectedLocation
    );
  };

  // Handle location change
  const handleLocationChange = (locationId) => {
    setSelectedLocation(locationId);
    // Reset service selection when location changes
    setSelectedService("");
  };

  // Handle dietary requirements toggle
  const handleDietaryToggle = (hasRequirements) => {
    setHasDietaryRequirements(hasRequirements);
    if (!hasRequirements) {
      // Reset dietary requirements when user selects "No"
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

  // Group selected items by category using useMemo for efficiency
  const groupedItems = useMemo(() => {
    if (!orderData?.selectedItems) return {};

    return orderData.selectedItems.reduce((acc, item) => {
      const category = item.category || "other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  }, [orderData.selectedItems]);

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

        {/* Initial Question */}
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

        {/* Show dietary options only if user selected "Yes" */}
        {hasDietaryRequirements && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Dietary Requirements */}
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

            {/* Spice Level */}
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

            {/* Summary */}
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
      </div>
    );
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
    if (!formData.deliveryDate) {
      errors.push("Please select a delivery/pickup date and time");
    } else {
      const deliveryDate = new Date(formData.deliveryDate);
      const now = new Date();

      if (deliveryDate <= now) {
        errors.push("Delivery date must be in the future");
      }

      // Check if it's Monday (0 = Sunday, 1 = Monday)
      if (deliveryDate.getDay() === 1) {
        errors.push("Delivery and pickup are not available on Mondays");
      }
    }

    // Custom order specific validation
    if (orderData?.isCustomOrder) {
      if (!selectedLocation) {
        errors.push("Please select a location");
      }
      if (!selectedService) {
        errors.push("Please select a service type");
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

    setIsSubmitting(true);

    try {
      console.log("=== ORDER SUBMISSION DEBUG ===");
      console.log("Original orderData:", JSON.stringify(orderData, null, 2));
      console.log("Is custom order:", orderData?.isCustomOrder);
      console.log("Selected location:", selectedLocation);
      console.log("Selected service:", selectedService);

      // Prepare final order data
      let finalOrderData = { ...orderData };

      if (orderData?.isCustomOrder) {
        const selectedLocationObj = locations.find(
          (loc) => loc._id === selectedLocation
        );
        const selectedServiceObj = services.find(
          (service) => service._id === selectedService
        );

        // Update the menu info with selected location and service
        finalOrderData.menu = {
          ...orderData.menu,
          menuId: null, // Ensure null for custom orders
          locationId: selectedLocation,
          locationName: selectedLocationObj?.name || "Selected Location",
          serviceId: selectedService,
          serviceName: selectedServiceObj?.name || "Selected Service",
        };

        console.log("Updated menu info for custom order:", finalOrderData.menu);
      }

      // Construct booking data with proper structure
      const bookingData = {
        // Menu information
        menu: {
          menuId:
            finalOrderData?.menuId || finalOrderData?.menu?.menuId || null,
          name: finalOrderData?.menu?.name || "Order",
          price: finalOrderData?.menu?.price || 0,
          locationId: finalOrderData?.menu?.locationId,
          locationName: finalOrderData?.menu?.locationName,
          serviceId: finalOrderData?.menu?.serviceId,
          serviceName: finalOrderData?.menu?.serviceName,
        },

        // Customer details with dietary requirements
        customerDetails: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          specialInstructions: formData.description || "",
          // Include dietary requirements in simple format
          dietaryRequirements: hasDietaryRequirements
            ? dietaryRequirements
            : [],
          spiceLevel: hasDietaryRequirements ? spiceLevel : "medium",
        },

        // Order details
        peopleCount: finalOrderData?.peopleCount || 1,
        deliveryType: formData.deliveryType,
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

        // Items and pricing
        selectedItems: finalOrderData?.selectedItems || [],
        pricing: {
          basePrice: finalOrderData?.pricing?.basePrice || 0,
          addonsPrice: finalOrderData?.pricing?.addonsPrice || 0,
          total: finalOrderData?.pricing?.total || 0,
        },

        // Custom order flag
        isCustomOrder: finalOrderData?.isCustomOrder || false,
      };

      console.log(
        "Final booking data being submitted:",
        JSON.stringify(bookingData, null, 2)
      );

      // Call the booking service
      const result = await createBooking(bookingData);

      if (result.success) {
        toast.success(result.message || "Order submitted successfully!");

        // Show booking reference to user
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
  const categoryOrder = ["entree", "mains", "desserts", "addons", "other"];

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
        <div className="bg-green-600 text-white p-3 sm:p-4 rounded-t-xl flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onBack || onClose}
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
                  {formatPrice(pricePerPerson)} per person
                </div>
              </div>

              {/* Menu Details */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Base Package:</span>
                    <span className="font-medium">
                      {formatPrice(orderData?.pricing?.basePrice || 0)}
                    </span>
                  </div>
                  {orderData?.pricing?.addonsPrice > 0 && (
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Add-ons:</span>
                      <span className="font-medium text-blue-600">
                        {formatPrice(orderData?.pricing?.addonsPrice || 0)}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-1 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Items */}
            <div className="max-h-64 lg:max-h-96 overflow-y-auto">
              <h4 className="font-medium text-gray-900 mb-3">
                Your Selections
              </h4>
              <div className="space-y-3">
                {categoryOrder.map(
                  (category) =>
                    groupedItems[category] && (
                      <div key={category} className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-medium text-sm text-gray-800 capitalize border-b border-gray-200 pb-1 mb-2">
                          {category}
                        </h5>
                        <div className="space-y-1">
                          {groupedItems[category].map((item, index) => (
                            <div
                              key={index}
                              className="flex items-start text-sm"
                            >
                              <div
                                className={`rounded-full p-0.5 mr-2 mt-0.5 flex-shrink-0 ${
                                  item.type === "addon"
                                    ? "bg-blue-500"
                                    : "bg-green-500"
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
                                {item.type === "addon" && (
                                  <span className="text-xs text-blue-600">
                                    +{formatPrice(item.pricePerPerson || 0)} per
                                    person
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 p-3 sm:p-4 lg:overflow-y-auto">
            <div className="space-y-6">
              {/* Custom Order Location & Service Selection */}
              {orderData?.isCustomOrder && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <MapPin size={18} />
                    Location & Service Selection
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Location Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location *
                      </label>
                      <div className="relative">
                        <MapPin
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <select
                          value={selectedLocation}
                          onChange={(e) => handleLocationChange(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white text-sm"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Type *
                      </label>
                      <div className="relative">
                        <Briefcase
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <select
                          value={selectedService}
                          onChange={(e) => setSelectedService(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white text-sm"
                          disabled={!selectedLocation}
                          required
                        >
                          <option value="">
                            {!selectedLocation
                              ? "Select location first"
                              : "Select a service"}
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
                          Please select a location first to see available
                          services
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Custom Order:</strong> Please select the location
                      and service type for your custom menu selection.
                    </p>
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
                  Delivery Information
                </h3>

                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Note:</strong> Pickup and Delivery are not available
                    on Mondays.
                  </p>
                </div>

                {/* Delivery Type Selection */}
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

                {/* Date and Time */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.deliveryType} Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                {/* Delivery Address (conditional) */}
                {formData.deliveryType === "Delivery" && (
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
                          <option value="New Zealand">New Zealand</option>
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
