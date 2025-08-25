import React, { useState } from "react";
import {
  Printer,
  MapPin,
  Briefcase,
  ChefHat,
  Users,
  Clock,
  AlertCircle,
} from "lucide-react";

const BookingsList = ({
  bookings,
  pagination,
  currentPage,
  onPageChange,
  onStatusUpdate,
  onPaymentUpdate,
  onBookingClick,
  onPrintBooking,
  formatPrice,
  formatDate,
  formatDateTime,
  selectedLocation,
  selectedService,
}) => {
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentData, setPaymentData] = useState({
    paymentStatus: "pending",
    depositAmount: "",
  });

  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Apply custom sorting to bookings
  const applyCustomSorting = (bookingsArray) => {
    return [...bookingsArray].sort((a, b) => {
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

      if (statusA !== statusB) {
        return statusA - statusB;
      }

      const dateA = new Date(a.deliveryDate);
      const dateB = new Date(b.deliveryDate);
      const now = new Date();

      if (statusA <= 4) {
        if (dateA >= now && dateB >= now) {
          return dateA - dateB;
        } else if (dateA >= now) {
          return -1;
        } else if (dateB >= now) {
          return 1;
        } else {
          return dateB - dateA;
        }
      } else {
        return dateB - dateA;
      }
    });
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

  const currentBookings = applyCustomSorting(
    bookings.slice(startIndex, endIndex)
  );
  const totalPages = Math.ceil(bookings.length / itemsPerPage);

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

  // Enhanced booking type detection
  const getBookingType = (booking) => {
    if (
      booking.isCustomOrder ||
      booking.orderSource?.sourceType === "customOrder"
    ) {
      return {
        type: "custom",
        label: "Custom Order",
        className: "bg-purple-100 text-purple-800 border-purple-200",
        icon: ChefHat,
      };
    }
    return {
      type: "regular",
      label: "Regular Order",
      className: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Briefcase,
    };
  };

  // Get enhanced booking info
  const getBookingInfo = (booking) => {
    return {
      locationName:
        booking.orderSource?.locationName ||
        booking.menu?.locationName ||
        "Unknown Location",
      serviceName:
        booking.orderSource?.serviceName ||
        booking.menu?.serviceName ||
        "Unknown Service",
      sourceName:
        booking.orderSource?.sourceName || booking.menu?.name || "Unknown Menu",
    };
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
    const financials = calculateFinancials(booking);

    if (!financials.showPaymentOption) {
      return;
    }

    setEditingPayment(booking._id);
    setPaymentData({
      paymentStatus: booking.paymentStatus || "pending",
      depositAmount: (booking.depositAmount || 0).toString(),
    });
  };

  const handlePaymentUpdate = async (bookingId) => {
    try {
      const depositAmount = parseFloat(paymentData.depositAmount) || 0;
      await onPaymentUpdate(bookingId, {
        ...paymentData,
        depositAmount,
      });
      setEditingPayment(null);
    } catch (error) {
      console.error("Error updating payment:", error);
    }
  };

  const handlePageChange = (page) => {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrintBooking = (booking) => {
    if (onPrintBooking) {
      onPrintBooking(booking);
    }
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

  // Get upcoming delivery time indicator
  const getDeliveryTimeIndicator = (deliveryDate) => {
    const now = new Date();
    const delivery = new Date(deliveryDate);
    const diffHours = Math.round((delivery - now) / (1000 * 60 * 60));

    if (diffHours < 0) {
      return { text: "Past event", className: "text-gray-500", icon: null };
    } else if (diffHours <= 2) {
      return {
        text: "Due soon!",
        className: "text-red-600",
        icon: AlertCircle,
      };
    } else if (diffHours <= 24) {
      return {
        text: `${diffHours}h remaining`,
        className: "text-orange-600",
        icon: Clock,
      };
    } else if (diffHours <= 48) {
      return { text: "Tomorrow", className: "text-blue-600", icon: Clock };
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Enhanced List Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-green-800">
              📋 Bookings List
            </h3>
            <div className="text-sm text-green-600">
              Showing {startIndex + 1}-{Math.min(endIndex, bookings.length)} of{" "}
              {bookings.length} bookings
            </div>
          </div>

          {/* Context Display */}
          <div className="flex items-center gap-3 text-sm">
            <div className="bg-white px-3 py-1 rounded border border-green-200 flex items-center gap-2">
              <MapPin className="w-3 h-3 text-green-600" />
              <span className="text-green-800">Location filtered</span>
            </div>
            {selectedService && (
              <div className="bg-white px-3 py-1 rounded border border-green-200 flex items-center gap-2">
                <Briefcase className="w-3 h-3 text-green-600" />
                <span className="text-green-800">Service filtered</span>
              </div>
            )}
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
          {currentBookings.map((booking) => {
            const financials = calculateFinancials(booking);
            const bookingType = getBookingType(booking);
            const bookingInfo = getBookingInfo(booking);
            const deliveryIndicator = getDeliveryTimeIndicator(
              booking.deliveryDate
            );

            return (
              <div
                key={booking._id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
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

                      {!financials.isCancelled && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(
                            booking.paymentStatus || "pending"
                          )}`}
                        >
                          {(booking.paymentStatus || "pending")
                            .replace("_", " ")
                            .toUpperCase()}
                        </span>
                      )}

                      {/* Enhanced Booking Type Badge */}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${bookingType.className}`}
                      >
                        <bookingType.icon className="w-3 h-3" />
                        {bookingType.label}
                      </span>

                      {/* Delivery Time Indicator */}
                      {deliveryIndicator && (
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${deliveryIndicator.className}`}
                        >
                          {deliveryIndicator.icon && (
                            <deliveryIndicator.icon className="w-3 h-3" />
                          )}
                          {deliveryIndicator.text}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      {/* Enhanced Customer Info */}
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">
                          Customer Details
                        </h5>
                        <p className="text-gray-600">
                          📧 {booking.customerDetails?.email || "No email"}
                        </p>
                        <p className="text-gray-600">
                          📞 {booking.customerDetails?.phone || "No phone"}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-600">
                            {booking.peopleCount || 0} guests
                          </span>
                        </div>
                      </div>

                      {/* Enhanced Event Info */}
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">
                          Event Details
                        </h5>
                        <p className="text-gray-600">
                          🍽️ {bookingInfo.sourceName}
                        </p>
                        <p className="text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {bookingInfo.locationName}
                        </p>
                        <p className="text-gray-600 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {bookingInfo.serviceName}
                        </p>
                        <p className="text-gray-600">
                          🚚 {booking.deliveryType || "Not specified"}
                        </p>
                      </div>

                      {/* Enhanced Date & Time Info */}
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">
                          Timing
                        </h5>
                        <p className="text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(booking.deliveryDate)}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Booked: {formatDate(booking.orderDate)}
                        </p>
                        {booking.selectedItems &&
                          booking.selectedItems.length > 0 && (
                            <p className="text-gray-600 text-xs flex items-center gap-1 mt-1">
                              <ChefHat className="w-3 h-3" />
                              {booking.selectedItems.length} items
                            </p>
                          )}
                      </div>

                      {/* Enhanced Financial Info */}
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">
                          Financial
                        </h5>

                        {financials.showRevenue ? (
                          <>
                            <p className="text-gray-600 font-semibold">
                              💰 {formatPrice(financials.total)}
                            </p>
                            {financials.isFullyPaid ? (
                              <p className="text-green-600 font-medium">
                                ✅ Fully Paid: {formatPrice(financials.paid)}
                              </p>
                            ) : (
                              <>
                                <p className="text-gray-600">
                                  💳 Paid: {formatPrice(financials.paid)}
                                </p>
                                <p className="text-orange-600">
                                  💸 Due: {formatPrice(financials.balance)}
                                </p>
                                {/* Payment Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                  <div
                                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${
                                        financials.total > 0
                                          ? Math.min(
                                              (financials.paid /
                                                financials.total) *
                                                100,
                                              100
                                            )
                                          : 0
                                      }%`,
                                    }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {financials.total > 0
                                    ? Math.round(
                                        (financials.paid / financials.total) *
                                          100
                                      )
                                    : 0}
                                  % paid
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <p className="text-red-600 font-medium">
                            ❌ Cancelled
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Dietary Requirements Display */}
                    {(booking.customerDetails?.dietaryRequirements?.length >
                      0 ||
                      booking.customerDetails?.spiceLevel !== "medium") && (
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                        <div className="text-sm text-blue-800">
                          <span className="font-medium">Dietary:</span>{" "}
                          {formatDietaryRequirements(
                            booking.customerDetails?.dietaryRequirements
                          )}{" "}
                          |<span className="font-medium"> Spice:</span>{" "}
                          {formatSpiceLevel(
                            booking.customerDetails?.spiceLevel
                          )}
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

                  {/* Enhanced Action Buttons */}
                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => onBookingClick && onBookingClick(booking)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      📋 View Details
                    </button>

                    <button
                      onClick={() => handlePrintBooking(booking)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                      title="Print Receipt"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>

                    <button
                      onClick={() => toggleBookingExpansion(booking._id)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      {expandedBooking === booking._id
                        ? "Hide Details"
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

                    {/* Enhanced Payment button */}
                    {financials.showPaymentOption && (
                      <button
                        onClick={() => openPaymentEdit(booking)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                      >
                        💳 Payment
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details Section */}
                {expandedBooking === booking._id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Enhanced Selected Items Display */}
                      {booking.selectedItems &&
                        booking.selectedItems.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <ChefHat className="w-4 h-4 text-orange-600" />
                              Kitchen Requirements (
                              {booking.selectedItems.length} items)
                            </h5>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {booking.selectedItems.map((item, index) => (
                                <div
                                  key={index}
                                  className="bg-orange-50 border border-orange-200 rounded-lg p-3"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h6 className="font-medium text-sm text-orange-900">
                                        {item.name}
                                      </h6>
                                      {item.description && (
                                        <p className="text-xs text-orange-700 mt-1">
                                          {item.description}
                                        </p>
                                      )}
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded border">
                                          {item.category?.toUpperCase() ||
                                            "OTHER"}
                                        </span>
                                        {item.quantity && item.quantity > 1 && (
                                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded border">
                                            QTY: {item.quantity}
                                          </span>
                                        )}
                                        {item.isVegetarian && (
                                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded border">
                                            🌱 VEG
                                          </span>
                                        )}
                                        {item.isVegan && (
                                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded border">
                                            🌿 VEGAN
                                          </span>
                                        )}
                                      </div>

                                      {/* Kitchen Instructions for this item */}
                                      <div className="mt-2 text-xs text-orange-700">
                                        <span className="font-medium">
                                          For Kitchen:
                                        </span>
                                        {item.quantity && item.quantity > 1
                                          ? ` Prepare ${item.quantity} portions`
                                          : ` Prepare ${booking.peopleCount} portions`}
                                        {item.groupName &&
                                          ` (${item.groupName})`}
                                      </div>

                                      {item.allergens &&
                                        item.allergens.length > 0 && (
                                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                            <p className="text-xs text-red-600">
                                              ⚠️ <strong>Allergens:</strong>{" "}
                                              {item.allergens.join(", ")}
                                            </p>
                                          </div>
                                        )}
                                    </div>

                                    {/* Price info for custom orders */}
                                    {bookingType.type === "custom" &&
                                      (item.totalPrice ||
                                        item.pricePerPerson) && (
                                        <div className="ml-2 text-sm font-medium text-orange-900">
                                          {item.totalPrice
                                            ? formatPrice(item.totalPrice)
                                            : item.pricePerPerson
                                            ? `${formatPrice(
                                                item.pricePerPerson
                                              )}/pp`
                                            : ""}
                                        </div>
                                      )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Address for Delivery */}
                      {booking.deliveryType === "Delivery" &&
                        booking.address && (
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-blue-600" />
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
                            Amount Paid
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={booking.pricing?.total || 0}
                            value={paymentData.depositAmount}
                            onChange={(e) =>
                              handleAmountChange(e.target.value, booking)
                            }
                            onFocus={(e) => e.target.select()}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Enter amount"
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
                                Math.max(
                                  0,
                                  (booking.pricing?.total || 0) -
                                    (parseFloat(paymentData.depositAmount) || 0)
                                )
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
            );
          })}
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
