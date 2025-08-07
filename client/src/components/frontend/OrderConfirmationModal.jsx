import React, { useState, useMemo } from "react"; //_!_--_!_
import { motion } from "framer-motion";
import { X, Check, ShoppingCart, Truck, Box } from "lucide-react";

// Helper function to format currency
const formatPrice = (price) => {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(price);
};

const OrderConfirmationModal = ({ orderData, onClose }) => {
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

  // --- NEW: Group selected items by category using useMemo for efficiency ---
  const groupedItems = useMemo(() => {
    if (!orderData?.selectedItems) return {};

    return orderData.selectedItems.reduce((acc, item) => {
      const category = item.category || "other"; // Assign a default category if none exists
      // Initialize the category array if it doesn't exist
      if (!acc[category]) {
        acc[category] = [];
      }
      // Add the item to its category
      acc[category].push(item);
      return acc;
    }, {});
  }, [orderData.selectedItems]);
  // --- END OF NEW LOGIC ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    const finalOrderDetails = {
      ...orderData,
      customerDetails: formData,
    };
    console.log("FINAL ORDER SUBMITTED:", finalOrderDetails);
    alert("Order submitted successfully! Check the console for details.");
    onClose();
  };

  const totalPrice = orderData.pricing.total;
  const pricePerPerson =
    orderData.peopleCount > 0 ? totalPrice / orderData.peopleCount : 0;

  // Define the order of categories for display
  const categoryOrder = ["entree", "mains", "desserts", "addons", "other"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 50 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-gray-50 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-primary-brown">
            Confirm Your Order Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto">
          {/* Left Side: Order Summary */}
          <div className="w-full md:w-1/3 bg-white p-6 border-r border-gray-200">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600">Total Price</p>
              <p className="text-3xl font-bold text-primary-brown">
                {formatPrice(totalPrice)}
              </p>
              <p className="text-sm font-medium text-gray-500">
                ({formatPrice(pricePerPerson)} / person)
              </p>
            </div>

            {/* --- UPDATED: Display grouped items --- */}
            <div>
              <h3 className="font-semibold text-primary-brown mb-3">
                Your Selections
              </h3>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
                {categoryOrder.map(
                  (category) =>
                    groupedItems[category] && (
                      <div key={category}>
                        <h4 className="font-semibold text-sm text-gray-800 capitalize border-b pb-1 mb-2">
                          {category}
                        </h4>
                        <div className="space-y-2">
                          {groupedItems[category].map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center text-sm pl-2"
                            >
                              <Check
                                size={14}
                                className="text-green-600 mr-2 flex-shrink-0"
                              />
                              <span className="text-gray-700">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
            {/* --- END OF UPDATED SECTION --- */}
          </div>

          {/* Right Side: Form */}
          <form
            onSubmit={handleFinalSubmit}
            className="w-full md:w-2/3 p-6 space-y-6 overflow-y-auto"
          >
            {/* ... Form content remains the same ... */}
            <div>
              <h3 className="font-semibold text-primary-brown mb-3">
                Basic Details
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Enter Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter Phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
                <textarea
                  name="description"
                  placeholder="Enter Description (optional)"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input-field min-h-[80px]"
                ></textarea>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-primary-brown mb-3">
                Delivery Details
              </h3>
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-md mb-3">
                Pickup and Delivery not available on Mondays.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <label
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${
                    formData.deliveryType === "Pickup"
                      ? "border-primary-green bg-green-50"
                      : "border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryType"
                    value="Pickup"
                    checked={formData.deliveryType === "Pickup"}
                    onChange={handleInputChange}
                    className="form-radio text-primary-green"
                  />
                  <Box size={18} /> Pickup
                </label>
                <label
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${
                    formData.deliveryType === "Delivery"
                      ? "border-primary-green bg-green-50"
                      : "border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryType"
                    value="Delivery"
                    checked={formData.deliveryType === "Delivery"}
                    onChange={handleInputChange}
                    className="form-radio text-primary-green"
                  />
                  <Truck size={18} /> Delivery
                </label>
              </div>

              <input
                type="datetime-local"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleInputChange}
                className="input-field mb-3"
                required
              />

              {formData.deliveryType === "Delivery" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <input
                    type="text"
                    name="street"
                    placeholder="Enter Street"
                    value={formData.street}
                    onChange={handleInputChange}
                    className="input-field sm:col-span-2"
                    required
                  />
                  <input
                    type="text"
                    name="suburb"
                    placeholder="Enter Suburb"
                    value={formData.suburb}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                  <input
                    type="text"
                    name="postcode"
                    placeholder="Enter Postcode"
                    value={formData.postcode}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="Enter State"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="input-field sm:col-span-2"
                  >
                    <option>Australia</option>
                    <option>New Zealand</option>
                  </select>
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 text-white py-3 rounded-md font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              Submit Order
            </button>
          </form>
        </div>
      </motion.div>
      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          transition: ring 0.2s, border-color 0.2s;
        }
        .input-field:focus {
          outline: none;
          ring: 2px;
          ring-color: #10b981; /* primary-green */
          border-color: #10b981; /* primary-green */
        }
        .form-radio:checked {
          background-color: #059669; /* A darker green */
        }
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #9ca3af #f3f4f6;
        }
      `}</style>
    </motion.div>
  );
};

export default OrderConfirmationModal;
