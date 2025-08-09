import React, { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "react-hot-toast";
import { createBooking } from "../../services/bookingService"; // Import the booking service

// Helper function to format currency
const formatPrice = (price) => {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(price);
};

const OrderConfirmationModal = ({ orderData, onClose, onBack }) => {
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

  useEffect(() => {
    // Add the "no-scroll" class to the body when the modal is mounted
    document.body.classList.add("no-scroll");

    // Clean up the effect by removing the class when the modal is unmounted
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, []);

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
      // Prepare booking data for API
      console.log("Order data structure:", orderData);
      console.log("Menu object:", orderData.menu);
      console.log("Menu ID from orderData:", orderData.menuId);

      const bookingData = {
        menu: {
          menuId: orderData.menuId,
          name: orderData.menu.name,
          price: orderData.menu.price,
        },
        customerDetails: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          specialInstructions: formData.description || "",
        },
        peopleCount: orderData.peopleCount,
        deliveryType: formData.deliveryType,
        deliveryDate: formData.deliveryDate,
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
        selectedItems: orderData.selectedItems || [],
        pricing: {
          basePrice: orderData.pricing.basePrice,
          addonsPrice: orderData.pricing.addonsPrice || 0,
          total: orderData.pricing.total,
        },
      };

      console.log("Submitting booking data:", bookingData);

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
              {/* Basic Details */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User size={18} />
                  Contact Information
                </h3>
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
