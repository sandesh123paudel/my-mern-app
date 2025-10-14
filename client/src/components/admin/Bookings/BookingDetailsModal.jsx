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
  ChefHat,
  Plus,
  Trash2,
} from "lucide-react";
import bookingService from "../../../services/bookingService";
import toast from "react-hot-toast";
import {
  addAdminAddition,
  removeAdminAddition,
  updateAdminNotes,
} from "../../../services/bookingService";

const BookingDetailsModal = ({
  booking,
  onClose,
  onUpdateStatus,
  onDeleteBooking,
  onPrintBooking,
  onKitchenDocket,
  onRefreshBooking,
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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [showAdditionForm, setShowAdditionForm] = useState(false);
  const [additionForm, setAdditionForm] = useState({ name: "", price: "" });
  const [isAddingItem, setIsAddingItem] = useState(false);

  const [showAdminNotesForm, setShowAdminNotesForm] = useState(false);
  const [adminNotesText, setAdminNotesText] = useState(
    booking.adminNotes || ""
  );
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);

  // Helper functions
  const formatDietaryRequirements = (requirements) => {
    if (!requirements || requirements.length === 0) return "None";
    return requirements.join(", ");
  };

  const formatSpiceLevel = (level) => {
    if (!level || level === "medium") return "Medium";
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  // Format selected items with sophisticated grouping logic
  const formatSelectedItemsAsParagraphs = (
    selectedItems,
    isCustomOrder = false
  ) => {
    if (!selectedItems || selectedItems.length === 0) {
      return "No items selected";
    }

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-AU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    // Group items and their choices
    const processedItems = [];
    const usedItems = new Set();

    selectedItems.forEach((item, index) => {
      if (usedItems.has(index)) return;

      // Check if this is a base item (like "Rice", "Curry", "Crackers")
      const relatedChoices = selectedItems.filter(
        (otherItem, otherIndex) =>
          otherIndex !== index &&
          otherItem.name.startsWith(item.name + " - ") &&
          !usedItems.has(otherIndex)
      );

      if (relatedChoices.length > 0) {
        // This item has choices - group them
        const choiceNames = relatedChoices.map((choice) =>
          choice.name.replace(item.name + " - ", "")
        );

        let description = `${item.name} (${choiceNames.join(", ")})`;

        if (item.quantity && item.quantity > 1) {
          description += ` (${item.quantity}x)`;
        }

        if (isCustomOrder && item.totalPrice && item.totalPrice > 0) {
          description += ` - ${formatCurrency(item.totalPrice)}`;
        }

        processedItems.push(description);

        // Mark related items as used
        relatedChoices.forEach((_, choiceIndex) => {
          const originalIndex = selectedItems.findIndex(
            (original) => original === relatedChoices[choiceIndex]
          );
          usedItems.add(originalIndex);
        });
        usedItems.add(index);
      } else if (!item.name.includes(" - ")) {
        // This is a standalone item (no choices)
        let description = item.name;

        if (item.quantity && item.quantity > 1) {
          description += ` (${item.quantity}x)`;
        }

        if (isCustomOrder && item.totalPrice && item.totalPrice > 0) {
          description += ` - ${formatCurrency(item.totalPrice)}`;
        }

        processedItems.push(description);
        usedItems.add(index);
      }
      // Skip items that are choices (contain " - ") and don't have a parent
    });

    return processedItems.join(", ");
  };

  //Financial Calculations
  const calculateFinancials = () => {
    const discount = booking.couponCode ? booking.couponCode.discount : 0;
    const total = booking.pricing?.total || 0;
    const paid = booking.depositAmount || 0;
    const balance = total - paid - discount;
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
      showPaymentOption: !isCancelled && (!isFullyPaid || !isCompleted),
      canBeCancelled: !isCancelled && !isCompleted && total > 0,
    };
  };

  const financials = calculateFinancials();

  const handleStatusUpdate = async (status) => {
    if (isUpdatingStatus) return; // Prevent multiple clicks

    if (status === "cancelled") {
      setShowCancellationForm(true);
      setPendingStatus(status);
    } else if (status === "confirmed" || status === "completed") {
      setPendingStatus(status);
      setShowStatusForm(true);
    } else {
      // Direct status update
      setIsUpdatingStatus(true);
      try {
        await onUpdateStatus(booking._id, status);
        // The parent will handle refreshing
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update status");
      } finally {
        setIsUpdatingStatus(false);
      }
    }
  };

  // Update handleConfirmStatusUpdate
  const handleConfirmStatusUpdate = async () => {
    if (isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(booking._id, pendingStatus, statusNotes);
      setShowStatusForm(false);
      setStatusNotes("");
      setPendingStatus("");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Update handleConfirmCancellation
  const handleConfirmCancellation = async () => {
    if (isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      await onDeleteBooking(booking._id, cancellationReason);
      setShowCancellationForm(false);
      setCancellationReason("");
      setPendingStatus("");
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // inside BookingDetailsModal.jsx
  const handlePaymentUpdate = async () => {
    try {
      setIsUpdating(true);

      const depositAmount = parseFloat(paymentData.depositAmount) || 0;
      const totalAmount = booking.pricing?.total || 0;

      let finalPaymentStatus = paymentData.paymentStatus;
      let shouldUpdateBookingStatus = false;
      let newBookingStatus = booking.status;

      // Auto-adjust like BookingsList
      if (depositAmount >= totalAmount && totalAmount > 0) {
        finalPaymentStatus = "fully_paid";
      } else if (depositAmount > 0 && depositAmount < totalAmount) {
        finalPaymentStatus = "deposit_paid";
        if (newBookingStatus === "pending") {
          shouldUpdateBookingStatus = true;
          newBookingStatus = "confirmed";
        }
      } else if (depositAmount === 0) {
        finalPaymentStatus = "pending";
      }

      // update payment first
      await bookingService.updatePaymentStatus(booking._id, {
        ...paymentData,
        depositAmount,
        paymentStatus: finalPaymentStatus,
      });

      // auto-update booking status if needed
      if (shouldUpdateBookingStatus && onUpdateStatus) {
        await onUpdateStatus(booking._id, newBookingStatus);
      }

      toast.success("Payment updated successfully");
      setShowPaymentForm(false);

      // refresh booking data in modal
      if (onRefreshBooking) {
        await onRefreshBooking(booking._id);
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed To Update Payment");
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
  const handleUpdateAdminNotes = async () => {
    try {
      setIsUpdatingNotes(true);
      const result = await updateAdminNotes(booking._id, {
        adminNotes: adminNotesText,
      });

      if (result.success) {
        toast.success("Admin notes updated successfully");
        booking.adminNotes = adminNotesText;
        setShowAdminNotesForm(false);
        if (onRefreshBooking) {
          await onRefreshBooking(booking._id);
        }
      } else {
        toast.error(result.error || "Failed to update admin notes");
      }
    } catch (error) {
      console.error("Error updating admin notes:", error);
      toast.error("Failed to update admin notes");
    } finally {
      setIsUpdatingNotes(false);
    }
  };

  const handleAddAdminAddition = async (e) => {
    e.preventDefault();

    if (
      !additionForm.name.trim() ||
      !additionForm.price ||
      additionForm.price <= 0
    ) {
      toast.error("Please provide valid item name and price");
      return;
    }

    setIsAddingItem(true);
    try {
      const result = await addAdminAddition(booking._id, {
        name: additionForm.name.trim(),
        price: parseFloat(additionForm.price),
      });

      if (result.success) {
        toast.success("Item added successfully");
        setAdditionForm({ name: "", price: "" });
        setShowAdditionForm(false);
        if (onRefreshBooking) {
          await onRefreshBooking(booking._id);
        }
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to add item");
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleRemoveAdminAddition = async (additionId) => {
    toast((t) => (
      <div>
        <p>Are you sure you want to remove this item?</p>
        <div className="flex justify-start mt-3">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const result = await removeAdminAddition(
                  booking._id,
                  additionId
                );
                if (result.success) {
                  toast.success("Item removed successfully");
                  if (onRefreshBooking) {
                    await onRefreshBooking(booking._id);
                  }
                } else {
                  toast.error(result.error);
                }
              } catch (error) {
                toast.error("Failed to remove item");
              }
            }}
            className="bg-red-500 text-white px-2 py-1 rounded"
          >
            Remove
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors ml-2"
          >
            Cancel
          </button>
        </div>
      </div>
    ));
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
        <div className="bg-green-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Booking Details</h2>
            <p className="text-green-100">#{booking.bookingReference}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onKitchenDocket && onKitchenDocket(booking)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
            >
              <ChefHat className="w-4 h-4" />
              Kitchen Print
            </button>
            <button
              onClick={() => onPrintBooking && onPrintBooking(booking)}
              className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
            >
              <Printer className="w-4 h-4" />
              Receipt Print
            </button>
            <button
              onClick={onClose}
              className="hover:bg-green-700 p-1 rounded"
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
                {(booking.status || "pending")
                  .replace("_", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Order type:</span>{" "}
                {booking.orderSource?.sourceType === "customOrder"
                  ? "Custom Order"
                  : "Menu Order"}
              </div>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div>Order date: {formatDate(booking.orderDate)}</div>
              <div>Event date: {formatDate(booking.deliveryDate)}</div>
            </div>
          </div>
          {/* Customer Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer information
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
                    <span className="font-medium">Spice level:</span>{" "}
                    {formatSpiceLevel(booking.customerDetails?.spiceLevel)}
                  </div>
                </div>
              </div>
            )}

            {/* Special Instructions */}
            {booking.customerDetails?.specialInstructions && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-600">
                  Special instructions
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
              Service information
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
                  Service type
                </label>
                <p className="text-gray-900">
                  {booking.orderSource?.serviceName || "Not specified"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Delivery
                </label>
                <p className="text-gray-900">
                  {booking.deliveryType || "Pickup"}
                  <br />
                  Time:{" "}
                  {booking.deliveryDate && formatDateTime(booking.deliveryDate)}
                </p>
              </div>
              {booking.venueSelection && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Venue
                  </label>
                  <p className="text-gray-900 bg-blue-100 rounded-full px-3 py-1 text-center text-sm font-medium">
                    {booking.venueSelection.replace(/\b\w/g, (l) =>
                      l.toUpperCase()
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Delivery Address */}
            {booking.deliveryType === "Delivery" && booking.address && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">
                      Delivery address
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
          {/* Selected Items - Sophisticated Display */}
          {booking.selectedItems && booking.selectedItems.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Selected items ({booking.selectedItems.length})
              </h3>

              {/* Full sophisticated paragraph display */}
              <div className="mb-4 p-3 bg-white rounded border">
                <p className="text-gray-900 leading-relaxed">
                  {formatSelectedItemsAsParagraphs(
                    booking.selectedItems,
                    booking.orderSource?.sourceType === "customOrder"
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Add Item Form */}
          {showAdditionForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-3">Add New Item</h4>
              <form onSubmit={handleAddAdminAddition} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={additionForm.name}
                    onChange={(e) =>
                      setAdditionForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Extra Rice, Additional Curry"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={additionForm.price}
                    onChange={(e) =>
                      setAdditionForm((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isAddingItem}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isAddingItem ? "Adding..." : "Add Item"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdditionForm(false);
                      setAdditionForm({ name: "", price: "" });
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <button
            onClick={() => setShowAdditionForm(true)}
            className="bg-orange-600 text-white ml-5 px-4 py-2 rounded-lg hover:bg-orange-700"
          >
            Add Extra Item
          </button>
          {/* Admin Additions Section */}
          {booking.adminAdditions && booking.adminAdditions.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center gap-2">
                <Plus size={18} />
                Added Items ({booking.adminAdditions.length})
              </h3>
              <div className="space-y-2">
                {booking.adminAdditions.map((addition) => (
                  <div
                    key={addition._id}
                    className="flex justify-between items-center bg-white rounded p-3 border border-orange-200"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {addition.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        Added on {formatDate(addition.addedAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-orange-700">
                        {formatPrice(addition.price)}
                      </span>
                      <button
                        onClick={() => handleRemoveAdminAddition(addition._id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Information */}
          {/* Payment Information */}
          {financials.showRevenue && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Show pricing breakdown properly */}
                <div className="bg-white p-3 rounded border">
                  <label className="text-sm font-medium text-gray-600">
                    Original Order
                  </label>
                  <p className="text-xl font-bold text-gray-900">
                    {formatPrice(booking.pricing.subtotal || 0)}
                  </p>
                </div>

                {/* Show base price components if available */}
                {booking.pricing?.basePrice > 0 && (
                  <div className="bg-white p-3 rounded border">
                    <label className="text-sm font-medium text-gray-600">
                      Base Price
                    </label>
                    <p className="text-lg font-semibold text-gray-700">
                      {formatPrice(booking.pricing.basePrice)}
                    </p>
                  </div>
                )}

                {booking.pricing?.modifierPrice !== 0 && (
                  <div className="bg-white p-3 rounded border">
                    <label className="text-sm font-medium text-gray-600">
                      Item Modifications
                    </label>
                    <p className="text-lg font-semibold text-gray-700">
                      {booking.pricing.modifierPrice > 0 ? "+" : ""}
                      {formatPrice(booking.pricing.modifierPrice)}
                    </p>
                  </div>
                )}

                {booking.pricing?.addonsPrice > 0 && (
                  <div className="bg-white p-3 rounded border">
                    <label className="text-sm font-medium text-gray-600">
                      Add-ons
                    </label>
                    <p className="text-lg font-semibold text-gray-700">
                      +{formatPrice(booking.pricing.addonsPrice)}
                    </p>
                  </div>
                )}

                {booking.venueCharge > 0 && (
                  <div className="bg-white p-3 rounded border">
                    <label className="text-sm font-medium text-gray-600">
                      Venue Charge
                    </label>
                    <p className="text-lg font-semibold text-orange-700">
                      +{formatPrice(booking.venueCharge)}
                    </p>
                  </div>
                )}

                {/* Show admin additions if any */}
                {booking.adminAdditions?.length > 0 && (
                  <div className="bg-white p-3 rounded border">
                    <label className="text-sm font-medium text-gray-600">
                      Extra Additions ({booking.adminAdditions.length})
                    </label>
                    <p className="text-lg font-semibold text-blue-700">
                      +{formatPrice(booking.pricing.adminAdditionsPrice || 0)}
                    </p>
                  </div>
                )}

                {/* Calculate and show subtotal before discount */}
                {(() => {
                  const subtotalBeforeDiscount =
                    (booking.pricing.subtotal || 0) +
                    (booking.pricing.adminAdditionsPrice || 0) +
                    (booking.venueCharge || 0);

                  return (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <label className="text-sm font-medium text-blue-800">
                        Subtotal
                      </label>
                      <p className="text-xl font-bold text-blue-900">
                        {formatPrice(subtotalBeforeDiscount)}
                      </p>
                    </div>
                  );
                })()}

                {/* Show coupon discount if applied */}
                {booking.pricing?.couponDiscount > 0 && (
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <label className="text-sm font-medium text-green-600">
                      {booking.pricing?.couponCode
                        ? `Coupon Applied (${booking.pricing.couponCode})`
                        : "Discount Applied"}
                    </label>
                    <p className="text-xl font-bold text-green-700">
                      -{formatPrice(booking.pricing.couponDiscount)}
                    </p>
                  </div>
                )}

                {/* Final Total */}
                <div className="bg-gray-800 p-3 rounded border">
                  <label className="text-sm font-medium text-gray-200">
                    Final Total
                  </label>
                  <p className="text-2xl font-bold text-white">
                    {formatPrice(booking.pricing.total)}
                  </p>
                </div>

                {/* Always show Paid & Balance */}
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
            </div>
          )}

          {/* Admin Notes - Always Visible */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-blue-800">
                Admin Notes
              </h3>
              <button
                onClick={() => setShowAdminNotesForm(!showAdminNotesForm)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                {showAdminNotesForm ? "Cancel" : "Update Notes"}
              </button>
            </div>

            {showAdminNotesForm ? (
              <div className="space-y-3">
                <textarea
                  value={adminNotesText}
                  onChange={(e) => setAdminNotesText(e.target.value)}
                  placeholder="Add or update admin notes..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateAdminNotes}
                    disabled={isUpdatingNotes}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isUpdatingNotes ? "Saving..." : "Save Notes"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAdminNotesForm(false);
                      setAdminNotesText(booking.adminNotes || "");
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-blue-900 min-h-[20px]">
                {booking.adminNotes || "No admin notes added yet."}
              </p>
            )}
          </div>
          {/* Cancellation Information */}
          {booking.status === "cancelled" && booking.cancellationReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Cancellation details
              </h3>
              <p className="text-red-900">{booking.cancellationReason}</p>
            </div>
          )}
          {/* Payment Update Form */}
          {showPaymentForm && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-3">
                Update payment status
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Payment status
                  </label>
                  <select
                    value={paymentData.paymentStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      let newDeposit = paymentData.depositAmount;

                      // when admin chooses "fully_paid" auto-fill total
                      if (newStatus === "fully_paid") {
                        newDeposit = (booking.pricing?.total || 0).toString();
                      }

                      // when admin chooses "pending" reset to 0
                      if (newStatus === "pending") {
                        newDeposit = "0";
                      }

                      // when admin chooses "deposit_paid" keep what’s already paid
                      if (newStatus === "deposit_paid") {
                        newDeposit = (booking.depositAmount || 0).toString();
                      }

                      setPaymentData({
                        ...paymentData,
                        paymentStatus: newStatus,
                        depositAmount: newDeposit,
                      });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    disabled={isUpdating}
                  >
                    <option value="pending">Pending</option>
                    <option value="deposit_paid">Deposit paid</option>
                    <option value="fully_paid">Fully paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Amount paid
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
                <p className="text-sm text-green-700">
                  <span className="font-medium">New balance due:</span>{" "}
                  {formatPrice(calculateCurrentBalance())}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePaymentUpdate}
                  disabled={isUpdating}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isUpdating ? "Updating..." : "Update payment"}
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
          {/* Forms Section */}
          {showStatusForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-3">
                Update status to "
                {pendingStatus
                  .replace("_", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                "
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
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Confirm update
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
              <h4 className="font-medium text-red-800 mb-3">Cancel booking</h4>
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
                  Confirm cancellation
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
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Admin actions
            </h3>
            <div className="flex flex-wrap gap-3">
              {/* Status buttons */}
              {booking.status === "pending" && (
                <button
                  onClick={() => handleStatusUpdate("confirmed")}
                  disabled={isUpdatingStatus}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingStatus ? "Updating..." : "Confirm booking"}
                </button>
              )}

              {booking.status === "confirmed" && (
                <button
                  onClick={() => handleStatusUpdate("preparing")}
                  disabled={isUpdatingStatus}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingStatus ? "Updating..." : "Start preparing"}
                </button>
              )}

              {booking.status === "preparing" && (
                <button
                  onClick={() => handleStatusUpdate("ready")}
                  disabled={isUpdatingStatus}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingStatus ? "Updating..." : "Mark as ready"}
                </button>
              )}

              {(booking.status === "ready" ||
                booking.status === "confirmed") && (
                <button
                  onClick={() => handleStatusUpdate("completed")}
                  disabled={isUpdatingStatus}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingStatus ? "Updating..." : "Mark as completed"}
                </button>
              )}

              {/* Payment management */}
              {financials.showPaymentOption && !financials.isFullyPaid && (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Manage payment
                </button>
              )}
              {financials.isFullyPaid && (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed"
                  disabled
                >
                  Fully Paid
                </button>
              )}

              {/* Cancellation button */}
              {financials.canBeCancelled && (
                <button
                  onClick={() => handleStatusUpdate("cancelled")}
                  disabled={isUpdatingStatus}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingStatus ? "Updating..." : "Cancel booking"}
                </button>
              )}
            </div>
          </div>
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
