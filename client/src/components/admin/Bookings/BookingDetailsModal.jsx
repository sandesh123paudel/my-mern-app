import React, { useState } from "react";
import {
  Printer,
  X,
  User,
  Calendar,
  MapPin,
  Package,
  CreditCard,
  FileText,
} from "lucide-react";
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

  // Helper functions
  const formatDietaryRequirements = (requirements) => {
    if (!requirements || requirements.length === 0) return "None";
    return requirements.join(", ");
  };

  const formatSpiceLevel = (level) => {
    if (!level || level === "medium") return "Medium";
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

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
    <div className="fixed inset-0 top-[-50px] bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-primary-green text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Booking Details</h2>
            <p className="text-white">#{booking.bookingReference}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintBooking && onPrintBooking(booking)}
              className="bg-primary-green hover:bg-primary-brown hover:text-white px-3 py-1 rounded text-sm flex items-center gap-1"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="hover:bg-primary-green p-1 rounded"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Order Type */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                  booking.status || "pending"
                )}`}
              >
                {(booking.status || "pending").replace("_", " ").toUpperCase()}
              </span>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Order Type:</span>{" "}
                {booking.orderSource?.sourceType === "customOrder"
                  ? "Custom Order"
                  : "Menu Order"}
              </div>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div>Order Date: {formatDate(booking.orderDate)}</div>
              <div>Event Date: {formatDate(booking.deliveryDate)}</div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Name
                </label>
                <p className="text-gray-900">
                  {booking.customerDetails?.name || "Not provided"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Email
                </label>
                <p className="text-gray-900">
                  {booking.customerDetails?.email || "Not provided"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Phone
                </label>
                <p className="text-gray-900">
                  {booking.customerDetails?.phone || "Not provided"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Guests
                </label>
                <p className="text-gray-900">
                  {booking.peopleCount || 0} people
                </p>
              </div>
            </div>

            {/* Dietary Information */}
            {(booking.customerDetails?.dietaryRequirements?.length > 0 ||
              booking.customerDetails?.spiceLevel !== "medium") && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Dietary:</span>{" "}
                    {formatDietaryRequirements(
                      booking.customerDetails?.dietaryRequirements
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Spice Level:</span>{" "}
                    {formatSpiceLevel(booking.customerDetails?.spiceLevel)}
                  </div>
                </div>
              </div>
            )}

            {/* Special Instructions */}
            {booking.customerDetails?.specialInstructions && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-600">
                  Special Instructions
                </label>
                <p className="text-gray-900 bg-yellow-50 p-3 rounded border border-yellow-200 mt-1">
                  {booking.customerDetails.specialInstructions}
                </p>
              </div>
            )}
          </div>

          {/* Service Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Service Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Service
                </label>
                <p className="text-gray-900">
                  {booking.orderSource?.sourceName || "Not specified"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Location
                </label>
                <p className="text-gray-900">
                  {booking.orderSource?.locationName || "Not specified"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Service Type
                </label>
                <p className="text-gray-900">
                  {booking.orderSource?.serviceName || "Not specified"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Delivery Type
                </label>
                <p className="text-gray-900">
                  {booking.deliveryType || "Pickup"}
                </p>
              </div>
            </div>

            {/* Delivery Address */}
            {booking.deliveryType === "Delivery" && booking.address && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">
                      Delivery Address
                    </p>
                    <div className="text-sm text-gray-700">
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
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Selected Items ({booking.selectedItems.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {booking.selectedItems.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white border rounded p-3 flex justify-between items-start"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {item.category?.toUpperCase()}
                        </span>
                        <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                          Qty: {item.quantity || 1}
                        </span>
                        {item.isVegetarian && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Vegetarian
                          </span>
                        )}
                        {item.isVegan && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Vegan
                          </span>
                        )}
                      </div>
                      {item.allergens && item.allergens.length > 0 && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                          <span className="font-medium">Allergens:</span>{" "}
                          {item.allergens.join(", ")}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      <p className="font-medium text-gray-900">
                        {formatPrice(item.totalPrice)}
                      </p>
                      {item.groupName && (
                        <p className="text-xs text-gray-500">
                          {item.groupName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Information */}
          {financials.showRevenue && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-3 rounded border">
                  <label className="text-sm font-medium text-gray-600">
                    Total Amount
                  </label>
                  <p className="text-xl font-bold text-gray-900">
                    {formatPrice(financials.total)}
                  </p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <label className="text-sm font-medium text-gray-600">
                    Amount Paid
                  </label>
                  <p className="text-xl font-bold text-green-600">
                    {formatPrice(financials.paid)}
                  </p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <label className="text-sm font-medium text-gray-600">
                    Balance Due
                  </label>
                  <p className="text-xl font-bold text-orange-600">
                    {formatPrice(financials.balance)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">
                    Payment Status:
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getPaymentStatusColor(
                      booking.paymentStatus || "pending"
                    )}`}
                  >
                    {(booking.paymentStatus || "pending")
                      .replace("_", " ")
                      .toUpperCase()}
                  </span>
                </div>
                {financials.showPaymentOption && (
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="text-primary-green hover:text-blue-800 text-sm underline"
                  >
                    Update Payment
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {booking.adminNotes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Admin Notes
              </h3>
              <p className="text-blue-900">{booking.adminNotes}</p>
            </div>
          )}

          {/* Cancellation Information */}
          {booking.status === "cancelled" && booking.cancellationReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Cancellation Details
              </h3>
              <p className="text-red-900">{booking.cancellationReason}</p>
            </div>
          )}

          {/* Forms Section */}
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
                  className="bg-primary-green text-white px-4 py-2 rounded-lg hover:bg-primary-green"
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
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded border border-blue-200 mb-4">
                <p className="text-sm text-primary-green">
                  <span className="font-medium">New Balance Due:</span>{" "}
                  {formatPrice(calculateCurrentBalance())}
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
                  disabled={isUpdating}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Admin Actions */}
          {!showStatusForm && !showCancellationForm && !showPaymentForm && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Admin Actions
              </h3>
              <div className="flex flex-wrap gap-3">
                {/* Status progression buttons */}
                {booking.status === "pending" && (
                  <button
                    onClick={() => handleStatusUpdate("confirmed")}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Confirm Booking
                  </button>
                )}

                {booking.status === "confirmed" && (
                  <button
                    onClick={() => handleStatusUpdate("preparing")}
                    className="bg-primary-green text-white px-4 py-2 rounded-lg hover:bg-primary-green"
                  >
                    Start Preparing
                  </button>
                )}

                {booking.status === "preparing" && (
                  <button
                    onClick={() => handleStatusUpdate("ready")}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    Mark as Ready
                  </button>
                )}

                {(booking.status === "ready" ||
                  booking.status === "confirmed") && (
                  <button
                    onClick={() => handleStatusUpdate("completed")}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                  >
                    Mark as Completed
                  </button>
                )}

                {/* Payment management */}
                {financials.showPaymentOption && (
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Manage Payment
                  </button>
                )}

                {/* Cancellation */}
                {financials.canBeCancelled && (
                  <button
                    onClick={() => handleStatusUpdate("cancelled")}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              <p>Booking ID: {booking._id}</p>
              <p>Last updated: {formatDateTime(booking.updatedAt)}</p>
            </div>
            <button
              onClick={onClose}
              className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400"
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
