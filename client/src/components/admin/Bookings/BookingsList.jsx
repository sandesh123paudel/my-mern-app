import React, { useState } from "react";

// Simple inline BookingDetailsModal component
const BookingDetailsModal = ({
  booking,
  onClose,
  onStatusUpdate,
  onPaymentUpdate,
  formatPrice,
  formatDate,
  formatDateTime,
}) => {
  const [paymentData, setPaymentData] = useState({
    paymentStatus: booking.paymentStatus || "pending",
    depositAmount: booking.depositAmount || 0,
  });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "preparing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ready":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "deposit_paid":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "fully_paid":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handlePaymentUpdate = async () => {
    try {
      setIsUpdating(true);
      await onPaymentUpdate(booking._id, paymentData);
      setShowPaymentForm(false);
      onClose(); // Close modal after successful update
    } catch (error) {
      console.error("Error updating payment:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const calculateBalance = () => {
    const total = booking.pricing?.total || 0;
    const deposit = paymentData.depositAmount || booking.depositAmount || 0;
    return total - deposit;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-green-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">📋 Booking Details</h2>
              <p className="text-green-100 text-sm">
                #{booking.bookingReference || "No Reference"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Update Form */}
          {showPaymentForm && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-3">
                💳 Update Payment Status
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Payment Status
                  </label>
                  <select
                    value={paymentData.paymentStatus}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        paymentStatus: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    disabled={isUpdating}
                  >
                    <option value="pending">Pending</option>
                    <option value="deposit_paid">Deposit Paid</option>
                    <option value="fully_paid">Fully Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Deposit Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={booking.pricing?.total || 0}
                    value={paymentData.depositAmount}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        depositAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="0.00"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded border border-blue-200 mb-4">
                <p className="text-sm text-blue-700">
                  <strong>Balance Due:</strong>{" "}
                  {formatPrice
                    ? formatPrice(calculateBalance())
                    : `${calculateBalance()}`}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePaymentUpdate}
                  disabled={isUpdating}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isUpdating ? "Updating..." : "Update Payment"}
                </button>
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold text-amber-800 mb-4 border-b border-amber-200 pb-2">
              👤 Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Name
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                  {booking.customerDetails?.name || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                  {booking.customerDetails?.email || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Phone
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                  {booking.customerDetails?.phone || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Status
                </label>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                    booking.status || "pending"
                  )}`}
                >
                  {(booking.status || "pending")
                    .replace("_", " ")
                    .toUpperCase()}
                </span>
              </div>
            </div>

            {/* Special Instructions */}
            {booking.customerDetails?.specialInstructions && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-amber-700 mb-2">
                  Special Instructions
                </label>
                <div className="text-gray-900 bg-amber-50 p-3 rounded border border-amber-200">
                  {booking.customerDetails.specialInstructions}
                </div>
              </div>
            )}
          </div>

          {/* Event Information */}
          <div>
            <h3 className="text-lg font-semibold text-amber-800 mb-4 border-b border-amber-200 pb-2">
              🎉 Event Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Menu/Service
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                  {booking.menu?.name || "Not specified"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Location
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                  {booking.menu?.locationName || "Not specified"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Event Date
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                  {formatDate
                    ? formatDate(booking.deliveryDate)
                    : new Date(
                        booking.deliveryDate || Date.now()
                      ).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Guests
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                  👥 {booking.peopleCount || "Not specified"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Service Type
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                  {booking.deliveryType || "Not specified"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Order Date
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                  {formatDateTime
                    ? formatDateTime(booking.orderDate)
                    : new Date(
                        booking.orderDate || Date.now()
                      ).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Delivery Address */}
            {booking.deliveryType === "Delivery" && booking.address && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">
                  🚚 Delivery Address
                </h4>
                <div className="text-sm text-green-700">
                  {booking.address.street && <p>{booking.address.street}</p>}
                  <p>
                    {[
                      booking.address.suburb,
                      booking.address.postcode,
                      booking.address.state,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {booking.address.country && <p>{booking.address.country}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Selected Items */}
          {booking.selectedItems && booking.selectedItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-amber-800 mb-4 border-b border-amber-200 pb-2">
                🍽️ Selected Menu Items
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {booking.selectedItems.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-3 bg-amber-50"
                  >
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {item.description}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2 text-xs">
                      <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded border">
                        {item.category?.toUpperCase()}
                      </span>
                      {item.isVegetarian && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded border">
                          🌱 VEG
                        </span>
                      )}
                      {item.isVegan && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded border">
                          🌿 VEGAN
                        </span>
                      )}
                    </div>
                    {item.allergens && item.allergens.length > 0 && (
                      <p className="text-xs text-red-600 mt-2">
                        ⚠️ Allergens: {item.allergens.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Information */}
          <div className="border-t-2 border-green-200 pt-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4 border-b border-green-200 pb-2">
              💳 Payment Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <label className="block text-sm font-medium text-green-700 mb-1">
                  Base Price
                </label>
                <p className="text-lg font-semibold text-green-900">
                  {formatPrice
                    ? formatPrice(booking.pricing?.basePrice)
                    : `${booking.pricing?.basePrice || 0}`}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <label className="block text-sm font-medium text-green-700 mb-1">
                  Addons
                </label>
                <p className="text-lg font-semibold text-green-900">
                  {formatPrice
                    ? formatPrice(booking.pricing?.addonsPrice)
                    : `${booking.pricing?.addonsPrice || 0}`}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded border-2 border-green-300">
                <label className="block text-sm font-medium text-green-700 mb-1">
                  <span className="font-bold">Total Amount</span>
                </label>
                <p className="text-xl font-bold text-green-800">
                  {formatPrice
                    ? formatPrice(booking.pricing?.total)
                    : `${booking.pricing?.total || 0}`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    Payment Status
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getPaymentStatusColor(
                        booking.paymentStatus || "pending"
                      )}`}
                    >
                      {(booking.paymentStatus || "pending")
                        .replace("_", " ")
                        .toUpperCase()}
                    </span>
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      Update
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    Amount Paid
                  </label>
                  <p className="text-lg font-semibold text-green-900 bg-green-50 p-2 rounded border">
                    {formatPrice
                      ? formatPrice(booking.depositAmount)
                      : `${booking.depositAmount || 0}`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    Balance Due
                  </label>
                  <p className="text-lg font-semibold text-orange-900 bg-orange-50 p-2 rounded border">
                    {formatPrice
                      ? formatPrice(calculateBalance())
                      : `${calculateBalance()}`}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-2">
                  Payment Progress
                </label>
                <div className="bg-gray-200 rounded-full h-4 mb-2">
                  <div
                    className="bg-green-600 h-4 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        booking.pricing?.total > 0
                          ? Math.min(
                              ((booking.depositAmount || 0) /
                                booking.pricing.total) *
                                100,
                              100
                            )
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    {booking.pricing?.total > 0
                      ? Math.round(
                          ((booking.depositAmount || 0) /
                            booking.pricing.total) *
                            100
                        )
                      : 0}
                    % paid
                  </span>
                  <span>
                    {formatPrice
                      ? formatPrice(booking.pricing?.total)
                      : `${booking.pricing?.total || 0}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          {!showPaymentForm && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-amber-800 mb-4">
                Admin Actions
              </h3>
              <div className="flex flex-wrap gap-3">
                {booking.status === "pending" && (
                  <button
                    onClick={() => onStatusUpdate(booking._id, "confirmed")}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    ✅ Confirm
                  </button>
                )}

                {booking.status === "confirmed" && (
                  <button
                    onClick={() => onStatusUpdate(booking._id, "preparing")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    👨‍🍳 Preparing
                  </button>
                )}

                {booking.status === "preparing" && (
                  <button
                    onClick={() => onStatusUpdate(booking._id, "ready")}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    📦 Ready
                  </button>
                )}

                {(booking.status === "ready" ||
                  booking.status === "confirmed") && (
                  <button
                    onClick={() => onStatusUpdate(booking._id, "completed")}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    🎉 Complete
                  </button>
                )}

                {booking.status !== "cancelled" &&
                  booking.status !== "completed" && (
                    <button
                      onClick={() => onStatusUpdate(booking._id, "cancelled")}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      ❌ Cancel
                    </button>
                  )}

                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  💳 Payment
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Booking ID: {booking._id}
            </div>
            <button
              onClick={onClose}
              className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookingsList = ({
  bookings,
  pagination,
  currentPage,
  onPageChange,
  onStatusUpdate,
  onPaymentUpdate,
  formatPrice,
  formatDate,
  formatDateTime,
}) => {
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentStatus: "pending",
    depositAmount: 0,
  });

  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = bookings.slice(startIndex, endIndex);
  const totalPages = Math.ceil(bookings.length / itemsPerPage);

  const openDetailModal = (booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedBooking(null);
    setShowDetailModal(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "preparing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ready":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "deposit_paid":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "fully_paid":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const toggleBookingExpansion = (bookingId) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId);
  };

  const openPaymentEdit = (booking) => {
    setEditingPayment(booking._id);
    setPaymentData({
      paymentStatus: booking.paymentStatus || "pending",
      depositAmount: booking.depositAmount || 0,
    });
  };

  const handlePaymentUpdate = async (bookingId) => {
    try {
      await onPaymentUpdate(bookingId, paymentData);
      setEditingPayment(null);
      // Also refresh the detail modal if it's open
      if (selectedBooking && selectedBooking._id === bookingId) {
        closeDetailModal();
      }
    } catch (error) {
      console.error("Error updating payment:", error);
    }
  };

  const handlePageChange = (page) => {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* List Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-green-800">
            📋 Bookings List
          </h3>
          <div className="text-sm text-green-600">
            Showing {startIndex + 1}-{Math.min(endIndex, bookings.length)} of{" "}
            {bookings.length} bookings
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {currentBookings.length === 0 ? (
        <div className="p-8 text-center text-gray-600">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <p className="text-lg font-medium">No bookings found</p>
          <p className="text-sm mt-2">
            Try adjusting your filters or check back later
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {currentBookings.map((booking) => (
            <div key={booking._id} className="p-6">
              {/* Main Booking Info */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {booking.customerDetails?.name || "No Name"}
                    </h4>
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      #{booking.bookingReference || "No Reference"}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        booking.status || "pending"
                      )}`}
                    >
                      {(booking.status || "pending")
                        .replace("_", " ")
                        .toUpperCase()}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(
                        booking.paymentStatus || "pending"
                      )}`}
                    >
                      {(booking.paymentStatus || "pending")
                        .replace("_", " ")
                        .toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    {/* Customer Info */}
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">
                        Customer
                      </h5>
                      <p className="text-gray-600">
                        📧 {booking.customerDetails?.email || "No email"}
                      </p>
                      <p className="text-gray-600">
                        📞 {booking.customerDetails?.phone || "No phone"}
                      </p>
                    </div>

                    {/* Event Info */}
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">Event</h5>
                      <p className="text-gray-600">
                        🍽️ {booking.menu?.name || "No menu"}
                      </p>
                      <p className="text-gray-600">
                        📍 {booking.menu?.locationName || "No location"}
                      </p>
                      <p className="text-gray-600">
                        🚚 {booking.deliveryType || "Not specified"}
                      </p>
                    </div>

                    {/* Date & Guests */}
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">
                        Details
                      </h5>
                      <p className="text-gray-600">
                        📅 {formatDate(booking.deliveryDate)}
                      </p>
                      <p className="text-gray-600">
                        👥 {booking.peopleCount || 0} guests
                      </p>
                      <p className="text-gray-600 text-xs">
                        Booked: {formatDateTime(booking.orderDate)}
                      </p>
                    </div>

                    {/* Financial */}
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">
                        Financial
                      </h5>
                      <p className="text-gray-600 font-semibold">
                        💰 {formatPrice(booking.pricing?.total)}
                      </p>
                      <p className="text-gray-600">
                        💳 Paid: {formatPrice(booking.depositAmount || 0)}
                      </p>
                      <p className="text-gray-600">
                        💸 Due:{" "}
                        {formatPrice(
                          (booking.pricing?.total || 0) -
                            (booking.depositAmount || 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="ml-4 flex flex-col gap-2">
                  <button
                    onClick={() => openDetailModal(booking)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => toggleBookingExpansion(booking._id)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    {expandedBooking === booking._id
                      ? "Hide Quick View"
                      : "Quick View"}
                  </button>

                  {booking.status !== "cancelled" &&
                    booking.status !== "completed" && (
                      <select
                        value={booking.status || "pending"}
                        onChange={(e) =>
                          onStatusUpdate(booking._id, e.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-green-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="completed">Completed</option>
                      </select>
                    )}

                  <button
                    onClick={() => openPaymentEdit(booking)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    💳 Payment
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedBooking === booking._id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Special Instructions */}
                    {booking.customerDetails?.specialInstructions && (
                      <div className="lg:col-span-2">
                        <h5 className="font-medium text-gray-700 mb-2">
                          Special Instructions
                        </h5>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-sm text-amber-700">
                            {booking.customerDetails.specialInstructions}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Selected Items */}
                    {booking.selectedItems &&
                      booking.selectedItems.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">
                            Selected Items
                          </h5>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {booking.selectedItems.map((item, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 border border-gray-200 rounded p-2"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h6 className="font-medium text-sm">
                                      {item.name}
                                    </h6>
                                    {item.description && (
                                      <p className="text-xs text-gray-600">
                                        {item.description}
                                      </p>
                                    )}
                                    <div className="flex gap-1 mt-1">
                                      <span className="text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded">
                                        {item.category?.toUpperCase()}
                                      </span>
                                      {item.isVegetarian && (
                                        <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded">
                                          🌱 VEG
                                        </span>
                                      )}
                                      {item.isVegan && (
                                        <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded">
                                          🌿 VEGAN
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Address for Delivery */}
                    {booking.deliveryType === "Delivery" && booking.address && (
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">
                          Delivery Address
                        </h5>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-sm text-blue-700">
                            {booking.address.street && (
                              <p>{booking.address.street}</p>
                            )}
                            <p>
                              {[
                                booking.address.suburb,
                                booking.address.postcode,
                                booking.address.state,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                            {booking.address.country && (
                              <p>{booking.address.country}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Admin Notes */}
                    {booking.adminNotes && (
                      <div className="lg:col-span-2">
                        <h5 className="font-medium text-gray-700 mb-2">
                          Admin Notes
                        </h5>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-700">
                            {booking.adminNotes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Edit Form */}
              {editingPayment === booking._id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h5 className="font-medium text-green-800 mb-3">
                      Update Payment Information
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-1">
                          Payment Status
                        </label>
                        <select
                          value={paymentData.paymentStatus}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              paymentStatus: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="deposit_paid">Deposit Paid</option>
                          <option value="fully_paid">Fully Paid</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-1">
                          Deposit Amount
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={booking.pricing?.total || 0}
                          value={paymentData.depositAmount}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              depositAmount: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="0.00"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Max: {formatPrice(booking.pricing?.total)}
                        </p>
                      </div>

                      <div className="flex items-end">
                        <div className="w-full space-y-2">
                          <p className="text-sm text-green-700">
                            <strong>Balance Due:</strong>{" "}
                            {formatPrice(
                              (booking.pricing?.total || 0) -
                                paymentData.depositAmount
                            )}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePaymentUpdate(booking._id)}
                              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => setEditingPayment(null)}
                              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} ({bookings.length} total
              results)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
              >
                Previous
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum =
                  Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;

                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 border rounded-md text-sm ${
                      pageNum === currentPage
                        ? "bg-green-600 text-white border-green-600"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() =>
                  handlePageChange(Math.min(currentPage + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsList;
