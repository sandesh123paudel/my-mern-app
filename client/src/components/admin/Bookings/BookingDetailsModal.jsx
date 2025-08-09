import { useState } from "react";

const BookingDetailsModal = ({
  booking,
  onClose,
  onUpdateStatus,
  onDeleteBooking,
  getStatusColor,
  formatPrice,
  formatDate,
  formatDateTime,
}) => {
  const [statusNotes, setStatusNotes] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [showCancellationForm, setShowCancellationForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");
  const [paymentData, setPaymentData] = useState({
    paymentStatus: booking.paymentStatus || "pending",
    depositAmount: booking.depositAmount || 0,
  });

  const handleStatusUpdate = (status) => {
    if (status === "cancelled") {
      setShowCancellationForm(true);
      setPendingStatus(status);
    } else if (status === "confirmed" || status === "completed") {
      setPendingStatus(status);
      setShowStatusForm(true);
    } else {
      onUpdateStatus(booking._id, status);
    }
  };

  const handleConfirmStatusUpdate = () => {
    onUpdateStatus(booking._id, pendingStatus, statusNotes);
    setShowStatusForm(false);
    setStatusNotes("");
    setPendingStatus("");
  };

  const handleConfirmCancellation = () => {
    onDeleteBooking(booking._id, cancellationReason);
    setShowCancellationForm(false);
    setCancellationReason("");
    setPendingStatus("");
  };

  const handlePaymentUpdate = async () => {
    try {
      // You'll need to implement this function in your booking service
      // await bookingService.updatePaymentStatus(booking._id, paymentData, token);
      console.log("Payment update:", paymentData);
      setShowPaymentForm(false);
      // Refresh the booking data or close modal
    } catch (error) {
      console.error("Error updating payment:", error);
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

  const calculateBalance = () => {
    const total = booking.pricing?.total || 0;
    const deposit = booking.depositAmount || 0;
    return total - deposit;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-green-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Booking Details</h2>
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
          {/* Status Update Forms */}
          {showStatusForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-3">
                Update Status to "
                {pendingStatus.replace("_", " ").toUpperCase()}"
              </h4>
              <textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add admin notes (optional)"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleConfirmStatusUpdate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Confirm Update
                </button>
                <button
                  onClick={() => {
                    setShowStatusForm(false);
                    setStatusNotes("");
                    setPendingStatus("");
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showCancellationForm && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-3">Cancel Booking</h4>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Reason for cancellation (required)"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20"
                required
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleConfirmCancellation}
                  disabled={!cancellationReason.trim()}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Cancellation
                </button>
                <button
                  onClick={() => {
                    setShowCancellationForm(false);
                    setCancellationReason("");
                    setPendingStatus("");
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Payment Update Form */}
          {showPaymentForm && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-3">
                Update Payment Status
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
                    value={paymentData.depositAmount}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        depositAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePaymentUpdate}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Update Payment
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
              Customer Information
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
                  Current Status
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
              Event Information
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
                  Number of Guests
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                  {booking.peopleCount || "Not specified"}
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

            {/* Service Details based on type */}
            {booking.deliveryType === "Pickup" && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">
                  📦 Pickup Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>
                      <strong>Pickup Location:</strong>{" "}
                      {booking.menu?.locationName || "TBD"}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {formatDate ? formatDate(booking.deliveryDate) : "TBD"}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Estimated Time:</strong> Please call location for
                      timing
                    </p>
                    <p>
                      <strong>Contact:</strong> Please check location details
                    </p>
                  </div>
                </div>
              </div>
            )}

            {booking.deliveryType === "Delivery" && booking.address && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">
                  🚚 Delivery Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>
                      <strong>Delivery Date:</strong>{" "}
                      {formatDate ? formatDate(booking.deliveryDate) : "TBD"}
                    </p>
                    <p>
                      <strong>Estimated Time:</strong> Will be confirmed
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Delivery Address:</strong>
                    </p>
                    <div className="ml-4 text-gray-700">
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
              </div>
            )}
          </div>

          {/* Selected Items */}
          {booking.selectedItems && booking.selectedItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-amber-800 mb-4 border-b border-amber-200 pb-2">
                Selected Menu Items
              </h3>
              <div className="space-y-3">
                {booking.selectedItems.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-3 bg-amber-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {item.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2 text-xs">
                          <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-200">
                            {item.category?.toUpperCase()}
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200">
                            {item.type?.toUpperCase()}
                          </span>
                          {item.isVegetarian && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">
                              🌱 VEGETARIAN
                            </span>
                          )}
                          {item.isVegan && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">
                              🌿 VEGAN
                            </span>
                          )}
                        </div>
                        {item.allergens && item.allergens.length > 0 && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-xs text-red-600">
                              ⚠️ <strong>Allergens:</strong>{" "}
                              {item.allergens.join(", ")}
                            </p>
                          </div>
                        )}
                        {item.groupName && (
                          <p className="text-xs text-gray-500 mt-1">
                            <strong>From:</strong> {item.groupName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> All selected items are included in the
                  total package price shown below.
                </p>
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {booking.adminNotes && (
            <div>
              <h3 className="text-lg font-semibold text-amber-800 mb-4 border-b border-amber-200 pb-2">
                Admin Notes
              </h3>
              <div className="text-gray-900 bg-blue-50 p-4 rounded border border-blue-200">
                {booking.adminNotes}
              </div>
            </div>
          )}

          {/* Cancellation Information */}
          {booking.status === "cancelled" && booking.cancellationReason && (
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-4 border-b border-red-200 pb-2">
                Cancellation Details
              </h3>
              <div className="text-gray-900 bg-red-50 p-4 rounded border border-red-200">
                <p>
                  <strong>Reason:</strong> {booking.cancellationReason}
                </p>
              </div>
            </div>
          )}

          {/* Payment Information - Moved to bottom */}
          <div className="border-t-2 border-green-200 pt-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4 border-b border-green-200 pb-2">
              💳 Payment & Financial Information
            </h3>

            {/* Pricing Breakdown */}
            <div className="mb-6">
              <h4 className="font-medium text-green-700 mb-3">
                Pricing Breakdown
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    Addons Price
                  </label>
                  <p className="text-lg font-semibold text-green-900">
                    {formatPrice
                      ? formatPrice(booking.pricing?.addonsPrice)
                      : `${booking.pricing?.addonsPrice || 0}`}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded border-2 border-green-300">
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    <span className="text-lg font-bold">Total Amount</span>
                  </label>
                  <p className="text-2xl font-bold text-green-800">
                    {formatPrice
                      ? formatPrice(booking.pricing?.total)
                      : `${booking.pricing?.total || 0}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Status and Actions */}
            <div>
              <h4 className="font-medium text-green-700 mb-3">
                Payment Status & Management
              </h4>
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
                      Amount Paid (Deposit)
                    </label>
                    <p className="text-lg font-semibold text-green-900 bg-green-50 p-2 rounded border border-green-200">
                      {formatPrice
                        ? formatPrice(booking.depositAmount)
                        : `${booking.depositAmount || 0}`}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">
                      Balance Due
                    </label>
                    <p className="text-lg font-semibold text-orange-900 bg-orange-50 p-2 rounded border border-orange-200">
                      {formatPrice
                        ? formatPrice(calculateBalance())
                        : `${calculateBalance()}`}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
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

                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <h5 className="font-medium text-blue-800 mb-2">
                      Payment Notes
                    </h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Deposit required to confirm booking</li>
                      <li>• Balance due before event date</li>
                      <li>• Multiple payment methods accepted</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          {!showStatusForm && !showCancellationForm && !showPaymentForm && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-amber-800 mb-4">
                Admin Actions
              </h3>
              <div className="flex flex-wrap gap-3">
                {booking.status === "pending" && (
                  <button
                    onClick={() => handleStatusUpdate("confirmed")}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    ✅ Confirm Booking
                  </button>
                )}

                {booking.status === "confirmed" && (
                  <button
                    onClick={() => handleStatusUpdate("preparing")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    👨‍🍳 Start Preparing
                  </button>
                )}

                {booking.status === "preparing" && (
                  <button
                    onClick={() => handleStatusUpdate("ready")}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    📦 Mark as Ready
                  </button>
                )}

                {(booking.status === "ready" ||
                  booking.status === "confirmed") && (
                  <button
                    onClick={() => handleStatusUpdate("completed")}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    🎉 Mark as Completed
                  </button>
                )}

                {booking.status !== "cancelled" &&
                  booking.status !== "completed" && (
                    <button
                      onClick={() => handleStatusUpdate("cancelled")}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      ❌ Cancel Booking
                    </button>
                  )}

                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  💳 Manage Payment
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <p>Booking ID: {booking._id}</p>
              <p>
                Last updated:{" "}
                {formatDateTime
                  ? formatDateTime(booking.updatedAt)
                  : new Date(booking.updatedAt || Date.now()).toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;
