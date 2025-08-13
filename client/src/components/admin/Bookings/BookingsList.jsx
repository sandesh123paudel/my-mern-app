import React, { useState } from "react";

const BookingsList = ({
  bookings,
  pagination,
  currentPage,
  onPageChange,
  onStatusUpdate,
  onPaymentUpdate,
  onBookingClick, // Add this prop for opening detailed modal
  formatPrice,
  formatDate,
  formatDateTime,
}) => {
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentData, setPaymentData] = useState({
    paymentStatus: "pending",
    depositAmount: 0,
  });

  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = bookings.slice(startIndex, endIndex);
  const totalPages = Math.ceil(bookings.length / itemsPerPage);

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
                        🏷️ {booking.menu?.serviceName || "No service"}
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
                  {/* Main action button - opens detailed modal */}
                  <button
                    onClick={() => onBookingClick && onBookingClick(booking)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    📋 View Details
                  </button>

                  <button
                    onClick={() => toggleBookingExpansion(booking._id)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    {expandedBooking === booking._id
                      ? "Hide Quick View"
                      : "Quick View"}
                  </button>

                  {/* Quick status update */}
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