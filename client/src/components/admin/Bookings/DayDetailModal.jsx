import React, { useState } from "react";
import { Printer } from "lucide-react";

const DayDetailModal = ({
  date,
  bookings,
  onClose,
  onStatusUpdate,
  onPaymentUpdate,
  onPrintBooking,
  formatPrice,
  formatDate,
  formatDateTime,
}) => {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentStatus: "pending",
    depositAmount: "",
  });

  // Helper function to calculate financial details
  const calculateFinancials = (booking) => {
    const total = booking.pricing?.total || 0;
    const paid = booking.depositAmount || 0;
    const balance = total - paid;
    const isFullyPaid = balance <= 0 && total > 0;
    const isCancelled = booking.status === "cancelled";

    return {
      total,
      paid,
      balance,
      isFullyPaid,
      isCancelled,
      showRevenue: !isCancelled,
      showPaymentOption: !isFullyPaid && !isCancelled,
    };
  };

  // Calculate day summary with proper financial logic
  const getDaySummary = () => {
    const activeBookings = bookings.filter(
      (booking) => booking.status !== "cancelled"
    );

    const totalPeople = activeBookings.reduce(
      (sum, booking) => sum + (booking.peopleCount || 0),
      0
    );
    const totalRevenue = activeBookings.reduce(
      (sum, booking) => sum + (booking.pricing?.total || 0),
      0
    );
    const totalPaid = activeBookings.reduce(
      (sum, booking) => sum + (booking.depositAmount || 0),
      0
    );

    // Aggregate menu items from active bookings only
    const menuItems = {};
    activeBookings.forEach((booking) => {
      if (booking.selectedItems) {
        booking.selectedItems.forEach((item) => {
          if (menuItems[item.name]) {
            menuItems[item.name] += 1;
          } else {
            menuItems[item.name] = 1;
          }
        });
      }
    });

    // Status breakdown for all bookings
    const statusCounts = {};
    bookings.forEach((booking) => {
      const status = booking.status || "pending";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return {
      totalPeople,
      totalRevenue,
      totalPaid,
      totalBookings: bookings.length,
      activeBookings: activeBookings.length,
      menuItems,
      statusCounts,
    };
  };
  const formatDietaryRequirements = (requirements) => {
    if (!requirements || requirements.length === 0) {
      return "None";
    }
    return requirements.join(", ");
  };

  const formatSpiceLevel = (level) => {
    if (!level || level === "medium") return "Medium";
    return level.charAt(0).toUpperCase() + level.slice(1);
  };
  // Apply custom sorting to bookings
  const applySortedBookings = (bookingsArray) => {
    return [...bookingsArray].sort((a, b) => {
      // Define status priority (lower number = higher priority)
      const getStatusPriority = (status) => {
        switch (status) {
          case "pending":
            return 1;
          case "confirmed":
            return 2;
          case "preparing":
            return 3;
          case "ready":
            return 4;
          case "completed":
            return 5;
          case "cancelled":
            return 6;
          default:
            return 7;
        }
      };

      const statusA = getStatusPriority(a.status || "pending");
      const statusB = getStatusPriority(b.status || "pending");

      // First sort by status priority
      if (statusA !== statusB) {
        return statusA - statusB;
      }

      // Within same status, sort by delivery time (earlier times first for active, recent first for completed/cancelled)
      const dateA = new Date(a.deliveryDate);
      const dateB = new Date(b.deliveryDate);

      // For active bookings (pending through ready) - earlier times first
      if (statusA <= 4) {
        return dateA - dateB;
      } else {
        // For completed/cancelled - most recent first
        return dateB - dateA;
      }
    });
  };

  const sortedBookings = applySortedBookings(bookings);
  const summary = getDaySummary();

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

  const handlePaymentUpdate = async (bookingId) => {
    try {
      const depositAmount = parseFloat(paymentData.depositAmount) || 0;
      await onPaymentUpdate(bookingId, {
        ...paymentData,
        depositAmount,
      });
      setShowPaymentForm(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error updating payment:", error);
    }
  };

  const openPaymentForm = (booking) => {
    const financials = calculateFinancials(booking);

    // Don't open if payment not allowed
    if (!financials.showPaymentOption) {
      return;
    }

    setSelectedBooking(booking);
    setPaymentData({
      paymentStatus: booking.paymentStatus || "pending",
      depositAmount: (booking.depositAmount || 0).toString(),
    });
    setShowPaymentForm(true);
  };

  const handleAmountChange = (value, booking) => {
    const total = booking.pricing?.total || 0;
    const numericValue = parseFloat(value) || 0;

    if (numericValue > total) {
      setPaymentData({
        ...paymentData,
        depositAmount: total.toString(),
      });
    } else {
      setPaymentData({
        ...paymentData,
        depositAmount: value,
      });
    }
  };

  const handlePrintBooking = (booking) => {
    if (onPrintBooking) {
      onPrintBooking(booking);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-green-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                📅 {formatDate(date.toISOString())}
              </h2>
              <p className="text-green-100">
                {summary.totalBookings} events scheduled (
                {summary.activeBookings} active)
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
          {/* Day Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">
                👥 Total Guests
              </h3>
              <p className="text-2xl font-bold text-blue-900">
                {summary.totalPeople}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                (Active bookings only)
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">
                💰 Total Revenue
              </h3>
              <p className="text-2xl font-bold text-green-900">
                {formatPrice(summary.totalRevenue)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                (Excludes cancelled)
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-800 mb-2">
                💳 Amount Paid
              </h3>
              <p className="text-2xl font-bold text-amber-900">
                {formatPrice(summary.totalPaid)}
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">📋 Events</h3>
              <p className="text-2xl font-bold text-purple-900">
                {summary.totalBookings}
              </p>
            </div>
          </div>

          {/* Menu Items Summary */}
          {Object.keys(summary.menuItems).length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-800 mb-3">
                🍽️ Menu Items Summary (Active Bookings)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(summary.menuItems).map(([item, count]) => (
                  <div
                    key={item}
                    className="bg-white p-2 rounded border border-amber-200"
                  >
                    <span className="font-medium">{item}</span>
                    <span className="text-amber-600 ml-2">
                      ({count} orders)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Overview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              📊 Status Overview
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.statusCounts).map(([status, count]) => (
                <span
                  key={status}
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                    status
                  )}`}
                >
                  {status.replace("_", " ").toUpperCase()}: {count}
                </span>
              ))}
            </div>
          </div>

          {/* Individual Bookings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
              📋 Individual Bookings
            </h3>
            <div className="space-y-4">
              {sortedBookings.map((booking) => {
                const financials = calculateFinancials(booking);

                return (
                  <div
                    key={booking._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {booking.customerDetails?.name || "No Name"}
                          </h4>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              booking.status || "pending"
                            )}`}
                          >
                            {(booking.status || "pending")
                              .replace("_", " ")
                              .toUpperCase()}
                          </span>
                          {booking.isCustomOrder && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                              CUSTOM ORDER
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">
                              📧 {booking.customerDetails?.email || "No email"}
                            </p>
                            <p className="text-gray-600">
                              📞 {booking.customerDetails?.phone || "No phone"}
                            </p>
                          </div>

                          <div>
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

                          <div>
                            <p className="text-gray-600">
                              👥 {booking.peopleCount || 0} guests
                            </p>
                            {financials.showRevenue ? (
                              <>
                                <p className="text-gray-600 font-semibold">
                                  💰 {formatPrice(financials.total)}
                                </p>
                                {financials.isFullyPaid ? (
                                  <p className="text-green-600 font-medium">
                                    ✅ Fully Paid:{" "}
                                    {formatPrice(financials.paid)}
                                  </p>
                                ) : (
                                  <p className="text-orange-600">
                                    💳 Paid: {formatPrice(financials.paid)}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-red-600 font-medium">
                                ❌ Cancelled
                              </p>
                            )}
                          </div>
                        </div>

                        {booking.customerDetails?.dietaryRequirements && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-700 mb-2">
                              Dietary Requirements
                            </h4>
                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-sm">
                                <div>
                                  <strong>Dietary:</strong>{" "}
                                  {formatDietaryRequirements(
                                    booking.customerDetails?.dietaryRequirements
                                  )}
                                </div>
                                <div>
                                  <strong>Spice Level:</strong>{" "}
                                  {formatSpiceLevel(
                                    booking.customerDetails?.spiceLevel
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Special Instructions */}
                        {booking.customerDetails?.specialInstructions && (
                          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                            <p className="text-sm text-amber-700">
                              <strong>Special Instructions:</strong>{" "}
                              {booking.customerDetails.specialInstructions}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="ml-4 flex flex-col gap-2">
                        {/* Print Button */}
                        <button
                          onClick={() => handlePrintBooking(booking)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 flex items-center gap-1"
                          title="Print Receipt"
                        >
                          <Printer className="w-3 h-3" />
                          Print
                        </button>

                        {/* Status Update - Don't show for completed or cancelled */}
                        {booking.status !== "cancelled" &&
                          booking.status !== "completed" && (
                            <select
                              value={booking.status || "pending"}
                              onChange={(e) =>
                                onStatusUpdate(booking._id, e.target.value)
                              }
                              className="px-3 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-green-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready">Ready</option>
                              <option value="completed">Completed</option>
                            </select>
                          )}

                        {/* Payment Update - only show if allowed */}
                        {financials.showPaymentOption && (
                          <button
                            onClick={() => openPaymentForm(booking)}
                            className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700"
                          >
                            💳 Payment
                          </button>
                        )}

                        {/* Cancel button - only show for bookings that aren't completed or cancelled */}
                        {booking.status !== "cancelled" &&
                          booking.status !== "completed" && (
                            <button
                              onClick={() =>
                                onStatusUpdate(
                                  booking._id,
                                  "cancelled",
                                  "Cancelled from day view"
                                )
                              }
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                            >
                              ❌ Cancel
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Update Form */}
          {showPaymentForm && selectedBooking && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">
                  Update Payment - {selectedBooking.customerDetails?.name}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    >
                      <option value="pending">Pending</option>
                      <option value="deposit_paid">Deposit Paid</option>
                      <option value="fully_paid">Fully Paid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount Paid
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={selectedBooking.pricing?.total || 0}
                      value={paymentData.depositAmount}
                      onChange={(e) =>
                        handleAmountChange(e.target.value, selectedBooking)
                      }
                      onFocus={(e) => e.target.select()}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="Enter amount"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Max: {formatPrice(selectedBooking.pricing?.total)}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">
                      <strong>Total Amount:</strong>{" "}
                      {formatPrice(selectedBooking.pricing?.total)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Balance Due:</strong>{" "}
                      {formatPrice(
                        Math.max(
                          0,
                          (selectedBooking.pricing?.total || 0) -
                            (parseFloat(paymentData.depositAmount) || 0)
                        )
                      )}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePaymentUpdate(selectedBooking._id)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                    >
                      Update Payment
                    </button>
                    <button
                      onClick={() => {
                        setShowPaymentForm(false);
                        setSelectedBooking(null);
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <p>
                Total for {formatDate(date.toISOString())}:{" "}
                {summary.totalBookings} events, {summary.totalPeople} guests,{" "}
                {formatPrice(summary.totalRevenue)} revenue
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Revenue excludes cancelled bookings
              </p>
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

export default DayDetailModal;
