import React, { useState } from "react";
import { Printer } from "lucide-react";
import bookingService from "../../../services/bookingService";
import toast from "react-hot-toast";

const BookingDetailsModal = ({
  booking,
  onClose,
  onUpdateStatus,
  onDeleteBooking,
  onPrintBooking,
  getStatusColor,
  formatPrice,
  formatDate,
  formatDateTime,
  formatTime,
}) => {
  const [statusNotes, setStatusNotes] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [showCancellationForm, setShowCancellationForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");
  const [paymentData, setPaymentData] = useState({
    paymentStatus: booking.paymentStatus || "pending",
    depositAmount: (booking.depositAmount || 0).toString(),
  });
  const [isUpdating, setIsUpdating] = useState(false);
  // Simple function to display dietary requirements
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

  // Check if customer has dietary requirements
  const hasDietaryInfo = () => {
    return (
      (booking.customerDetails?.dietaryRequirements &&
        booking.customerDetails.dietaryRequirements.length > 0) ||
      (booking.customerDetails?.spiceLevel &&
        booking.customerDetails.spiceLevel !== "medium")
    );
  };

  // Calculate financial details
  const calculateFinancials = () => {
    const total = booking.pricing?.total || 0;
    const paid = booking.depositAmount || 0;
    const balance = total - paid;
    const isFullyPaid = balance <= 0 && total > 0;
    const isCancelled = booking.status === "cancelled";
    const isCompleted = booking.status === "completed";

    return {
      total,
      paid,
      balance,
      isFullyPaid,
      isCancelled,
      isCompleted,
      showRevenue: !isCancelled,
      showPaymentOption: !isFullyPaid && !isCancelled && !isCompleted,
      canBeCancelled: !isCancelled && !isCompleted,
    };
  };

  const financials = calculateFinancials();

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
      setIsUpdating(true);
      const depositAmount = parseFloat(paymentData.depositAmount) || 0;

      const result = await bookingService.updatePaymentStatus(booking._id, {
        ...paymentData,
        depositAmount,
      });

      if (result.success) {
        toast.success(result.message || "Payment updated successfully");
        setShowPaymentForm(false);

        // Update the booking object with new payment data
        booking.paymentStatus = paymentData.paymentStatus;
        booking.depositAmount = depositAmount;

        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        toast.error(result.error || "Failed to update payment");
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment");
    } finally {
      setIsUpdating(false);
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

  const calculateCurrentBalance = () => {
    const total = booking.pricing?.total || 0;
    const deposit = parseFloat(paymentData.depositAmount) || 0;
    return Math.max(0, total - deposit);
  };

  const handleAmountChange = (value) => {
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

  return (
    <div className="fixed inset-0 top-[-25px] bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
            <div className="flex items-center gap-2">
              {/* Print Button */}
              <button
                onClick={() => onPrintBooking && onPrintBooking(booking)}
                className="bg-green-700 text-white px-3 py-1 rounded-lg hover:bg-green-800 transition-colors flex items-center gap-2 text-sm"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
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

            {hasDietaryInfo() && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  Dietary Requirements
                </h4>
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <strong>Dietary:</strong>{" "}
                      {formatDietaryRequirements(
                        booking.customerDetails?.dietaryRequirements
                      )}
                    </div>
                    <div>
                      <strong>Spice Level:</strong>{" "}
                      {formatSpiceLevel(booking.customerDetails?.spiceLevel)}
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                  {booking.isCustomOrder && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      CUSTOM ORDER
                    </span>
                  )}
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
                  Event Time
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                  {booking.deliveryDate
                    ? formatTime
                      ? formatTime(booking.deliveryDate)
                      : new Date(booking.deliveryDate).toLocaleTimeString()
                    : "Not specified"}
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
            </div>

            {/* Delivery Details */}
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
                      <strong>Estimated Time:</strong>{" "}
                      {booking.deliveryDate
                        ? formatTime
                          ? formatTime(booking.deliveryDate)
                          : new Date(booking.deliveryDate).toLocaleTimeString()
                        : "Will be confirmed"}
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
              <div className="space-y-3 max-h-60 overflow-y-auto">
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
                      {/* Show item price for custom orders */}
                      {booking.isCustomOrder && item.price && (
                        <div className="ml-2 text-sm font-medium text-gray-900">
                          {formatPrice(item.price)}
                        </div>
                      )}
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
                <p className="text-sm text-red-600 mt-2">
                  <strong>Note:</strong> This booking has been cancelled and
                  revenue is excluded from totals.
                </p>
              </div>
            </div>
          )}

          {/* Payment Information - Only show if not cancelled */}
          {financials.showRevenue && (
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
                  {!booking.isCustomOrder && (
                    <>
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <label className="block text-sm font-medium text-green-700 mb-1">
                          Base Price
                        </label>
                        <p className="text-lg font-semibold text-green-900">
                          {formatPrice
                            ? formatPrice(booking.pricing?.basePrice)
                            : `$${booking.pricing?.basePrice || 0}`}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <label className="block text-sm font-medium text-green-700 mb-1">
                          Addons Price
                        </label>
                        <p className="text-lg font-semibold text-green-900">
                          {formatPrice
                            ? formatPrice(booking.pricing?.addonsPrice)
                            : `$${booking.pricing?.addonsPrice || 0}`}
                        </p>
                      </div>
                    </>
                  )}
                  <div
                    className={`bg-green-100 p-3 rounded border-2 border-green-300 ${
                      booking.isCustomOrder ? "md:col-span-3" : ""
                    }`}
                  >
                    <label className="block text-sm font-medium text-green-700 mb-1">
                      <span className="text-lg font-bold">Total Amount</span>
                    </label>
                    <p className="text-2xl font-bold text-green-800">
                      {formatPrice
                        ? formatPrice(financials.total)
                        : `$${financials.total}`}
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
                        {financials.showPaymentOption && (
                          <button
                            onClick={() => setShowPaymentForm(true)}
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            Update
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Amount Paid
                      </label>
                      <p className="text-lg font-semibold text-green-900 bg-green-50 p-2 rounded border border-green-200">
                        {formatPrice
                          ? formatPrice(financials.paid)
                          : `$${financials.paid}`}
                      </p>
                    </div>

                    {!financials.isFullyPaid && (
                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-1">
                          Balance Due
                        </label>
                        <p className="text-lg font-semibold text-orange-900 bg-orange-50 p-2 rounded border border-orange-200">
                          {formatPrice
                            ? formatPrice(financials.balance)
                            : `$${financials.balance}`}
                        </p>
                      </div>
                    )}
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
                              financials.total > 0
                                ? Math.min(
                                    (financials.paid / financials.total) * 100,
                                    100
                                  )
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>
                          {financials.total > 0
                            ? Math.round(
                                (financials.paid / financials.total) * 100
                              )
                            : 0}
                          % paid
                        </span>
                        <span>
                          {formatPrice
                            ? formatPrice(financials.total)
                            : `$${financials.total}`}
                        </span>
                      </div>
                    </div>

                    {financials.isFullyPaid ? (
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <h5 className="font-medium text-green-800 mb-2">
                          ✅ Payment Complete
                        </h5>
                        <p className="text-sm text-green-700">
                          This booking has been fully paid.
                        </p>
                      </div>
                    ) : financials.isCompleted ? (
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <h5 className="font-medium text-blue-800 mb-2">
                          📋 Booking Completed
                        </h5>
                        <p className="text-sm text-blue-700">
                          This booking is completed. Payment updates are
                          disabled.
                        </p>
                      </div>
                    ) : (
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
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FORMS SECTION */}
          <div className="space-y-4">
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
                <h4 className="font-medium text-red-800 mb-3">
                  Cancel Booking
                </h4>
                <p className="text-sm text-red-700 mb-3">
                  ⚠️ Warning: Cancelling this booking will exclude it from
                  revenue calculations and disable payment options.
                </p>
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
                      disabled={isUpdating}
                    >
                      <option value="pending">Pending</option>
                      <option value="deposit_paid">Deposit Paid</option>
                      <option value="fully_paid">Fully Paid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Amount Paid
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={financials.total}
                      value={paymentData.depositAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="Enter amount"
                      disabled={isUpdating}
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Max:{" "}
                      {formatPrice
                        ? formatPrice(financials.total)
                        : `${financials.total}`}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded border border-blue-200 mb-4">
                  <p className="text-sm text-blue-700">
                    <strong>New Balance Due:</strong>{" "}
                    {formatPrice
                      ? formatPrice(calculateCurrentBalance())
                      : `${calculateCurrentBalance()}`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handlePaymentUpdate}
                    disabled={isUpdating}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? "Updating..." : "Update Payment"}
                  </button>
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    disabled={isUpdating}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Admin Actions - Only show if no forms are open */}
          {!showStatusForm && !showCancellationForm && !showPaymentForm && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-amber-800 mb-4">
                Admin Actions
              </h3>
              <div className="flex flex-wrap gap-3">
                {/* Status progression buttons */}
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

                {/* Payment management - only show if payment is allowed */}
                {financials.showPaymentOption && (
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    💳 Manage Payment
                  </button>
                )}

                {/* Cancellation - only show if booking can be cancelled */}
                {financials.canBeCancelled && (
                  <button
                    onClick={() => handleStatusUpdate("cancelled")}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    ❌ Cancel Booking
                  </button>
                )}

                {/* Additional info for completed/cancelled bookings */}
                {financials.isCompleted && (
                  <div className="w-full mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      ✅ <strong>Booking Completed:</strong> This booking has
                      been successfully completed. Status and payment updates
                      are no longer available.
                    </p>
                  </div>
                )}

                {financials.isCancelled && (
                  <div className="w-full mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      ❌ <strong>Booking Cancelled:</strong> This booking has
                      been cancelled and is excluded from revenue calculations.
                      Status and payment updates are disabled.
                    </p>
                  </div>
                )}
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
              {financials.isCancelled && (
                <p className="text-red-600 font-medium">
                  ⚠️ Revenue excluded from totals due to cancellation
                </p>
              )}
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
