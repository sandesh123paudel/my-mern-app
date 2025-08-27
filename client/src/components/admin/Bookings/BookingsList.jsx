import React, { useState, useMemo } from "react";
import {
  Printer,
  MapPin,
  Briefcase,
  ChefHat,
  Users,
  Clock,
  AlertCircle,
  X,
  Eye,
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
  filters = {}, // Default filters to an empty object to prevent errors
}) => {
  const [quickViewBooking, setQuickViewBooking] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentData, setPaymentData] = useState({
    paymentStatus: "pending",
    depositAmount: "",
  });

  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Enhanced sorting logic based on the requirements
  const sortedBookings = useMemo(() => {
    const bookingsArray = [...bookings];
    const sortOrder = filters?.sortOrder || "priority";

    if (sortOrder === "latest") {
      // Latest booking filter: Sort by booking creation date (orderDate), newest first
      return bookingsArray.sort((a, b) => {
        const orderDateA = new Date(a.orderDate);
        const orderDateB = new Date(b.orderDate);
        return orderDateB - orderDateA; // Newest booking first
      });
    }

    if (sortOrder === "event_date_newest") {
      // Sort by event date (deliveryDate), newest events first
      return bookingsArray.sort((a, b) => {
        const deliveryDateA = new Date(a.deliveryDate);
        const deliveryDateB = new Date(b.deliveryDate);
        return deliveryDateB - deliveryDateA; // Newest event first
      });
    }

    if (sortOrder === "event_date_oldest") {
      // Sort by event date (deliveryDate), oldest events first
      return bookingsArray.sort((a, b) => {
        const deliveryDateA = new Date(a.deliveryDate);
        const deliveryDateB = new Date(b.deliveryDate);
        return deliveryDateA - deliveryDateB; // Oldest event first
      });
    }

    if (sortOrder === "priority") {
      return bookingsArray.sort((a, b) => {
        const statusA = a.status || "pending";
        const statusB = b.status || "pending";
        const paymentStatusA = a.paymentStatus || "pending";
        const paymentStatusB = b.paymentStatus || "pending";

        // Helper function to check if booking is fully completed
        const isFullyCompleted = (booking) => {
          const status = booking.status || "pending";
          const paymentStatus = booking.paymentStatus || "pending";
          return status === "completed" && paymentStatus === "fully_paid";
        };

        const isAFullyCompleted = isFullyCompleted(a);
        const isBFullyCompleted = isFullyCompleted(b);

        // 1. Fully completed bookings (status = completed AND payment = fully_paid) go to the bottom
        if (isAFullyCompleted && !isBFullyCompleted) return 1;
        if (!isAFullyCompleted && isBFullyCompleted) return -1;

        // 2. If both are fully completed, sort by delivery date (latest event first)
        if (isAFullyCompleted && isBFullyCompleted) {
          const deliveryDateA = new Date(a.deliveryDate);
          const deliveryDateB = new Date(b.deliveryDate);
          return deliveryDateB - deliveryDateA;
        }

        // 3. For non-fully-completed bookings, prioritize by urgency and recency
        const now = new Date();
        const deliveryDateA = new Date(a.deliveryDate);
        const deliveryDateB = new Date(b.deliveryDate);
        const orderDateA = new Date(a.orderDate);
        const orderDateB = new Date(b.orderDate);

        // Calculate time until delivery
        const timeUntilDeliveryA = deliveryDateA - now;
        const timeUntilDeliveryB = deliveryDateB - now;

        // Check if events are today
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const isATodayEvent =
          deliveryDateA.toDateString() === today.toDateString();
        const isBTodayEvent =
          deliveryDateB.toDateString() === today.toDateString();

        // Check if events are upcoming (within next 48 hours)
        const isAUpcoming =
          timeUntilDeliveryA > 0 && timeUntilDeliveryA <= 48 * 60 * 60 * 1000;
        const isBUpcoming =
          timeUntilDeliveryB > 0 && timeUntilDeliveryB <= 48 * 60 * 60 * 1000;

        // Priority order:
        // 1. Today's events (non-completed) - sorted by latest booking first, then by delivery time
        if (isATodayEvent && !isBTodayEvent) return -1;
        if (!isATodayEvent && isBTodayEvent) return 1;

        if (isATodayEvent && isBTodayEvent) {
          // For today's events, prioritize by latest booking date first
          const bookingTimeDiff = orderDateA - orderDateB;
          if (bookingTimeDiff !== 0) return bookingTimeDiff;
          // If booking dates are same, sort by delivery time (earlier delivery first)
          return deliveryDateA - deliveryDateB;
        }

        // 2. Upcoming events (within 48 hours) - latest bookings first, then by delivery date
        if (isAUpcoming && !isBUpcoming) return -1;
        if (!isAUpcoming && isBUpcoming) return 1;

        if (isAUpcoming && isBUpcoming) {
          // For upcoming events, prioritize latest booking first
          const bookingTimeDiff = orderDateB - orderDateA;
          if (bookingTimeDiff !== 0) return bookingTimeDiff;
          // Then by earliest delivery date
          return deliveryDateA - deliveryDateB;
        }

        // 3. Future events (more than 48 hours away) - latest bookings first
        const bothFuture =
          timeUntilDeliveryA > 48 * 60 * 60 * 1000 &&
          timeUntilDeliveryB > 48 * 60 * 60 * 1000;
        if (bothFuture) {
          // For future events, prioritize latest booking first
          const bookingTimeDiff = orderDateB - orderDateA;
          if (bookingTimeDiff !== 0) return bookingTimeDiff;
          // Then by earliest delivery date
          return deliveryDateA - deliveryDateB;
        }

        // 4. Past events - latest booking first, then by most recent delivery date
        const bothPast = timeUntilDeliveryA < 0 && timeUntilDeliveryB < 0;
        if (bothPast) {
          // For past events, prioritize latest booking first
          const bookingTimeDiff = orderDateB - orderDateA;
          if (bookingTimeDiff !== 0) return bookingTimeDiff;
          // Then by most recent delivery date
          return deliveryDateB - deliveryDateA;
        }

        // 5. Mixed case (one past, one future) - future events first
        if (timeUntilDeliveryA > 0 && timeUntilDeliveryB < 0) return -1;
        if (timeUntilDeliveryA < 0 && timeUntilDeliveryB > 0) return 1;

        // Fallback: sort by latest booking date
        return orderDateB - orderDateA;
      });
    }

    // Return unsorted array if no matching sort order
    return bookingsArray;
  }, [bookings, filters?.sortOrder]);

  const formatDietaryRequirements = (requirements) => {
    if (!requirements || requirements.length === 0) return "None";
    return requirements.join(", ");
  };

  const formatSpiceLevel = (level) => {
    if (!level || level === "medium") return "Medium";
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  // Paginate the sorted bookings
  const currentBookings = sortedBookings.slice(startIndex, endIndex);
  const totalPages = Math.ceil(bookings.length / itemsPerPage);

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

  const getBookingType = (booking) => {
    if (booking.orderSource?.sourceType === "customOrder") {
      return {
        type: "custom",
        label: "Custom Order",
        className: "bg-purple-100 text-purple-800 border-purple-200",
        icon: ChefHat,
      };
    }
    return {
      type: "regular",
      label: "Menu Order",
      className: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Briefcase,
    };
  };

  const getBookingInfo = (booking) => {
    return {
      locationName: booking.orderSource?.locationName || "Unknown Location",
      serviceName: booking.orderSource?.serviceName || "Unknown Service",
      sourceName: booking.orderSource?.sourceName || "Unknown Menu",
      venue: booking?.venueSelection || "",
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

  const openPaymentEdit = (booking) => {
    const financials = calculateFinancials(booking);
    if (!financials.showPaymentOption) return;

    setEditingPayment(booking._id);
    setPaymentData({
      paymentStatus: booking.paymentStatus || "pending",
      depositAmount: (booking.depositAmount || 0).toString(),
    });
  };

  const handlePaymentUpdate = async (bookingId) => {
    try {
      const depositAmount = parseFloat(paymentData.depositAmount) || 0;
      await onPaymentUpdate(bookingId, { ...paymentData, depositAmount });
      setEditingPayment(null);
    } catch (error) {
      console.error("Error updating payment:", error);
    }
  };

  const handlePageChange = (page) => {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAmountChange = (value, booking) => {
    const total = booking.pricing?.total || 0;
    const numericValue = parseFloat(value) || 0;

    setPaymentData({
      ...paymentData,
      depositAmount: numericValue > total ? total.toString() : value,
    });
  };

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

  // Process kitchen requirements for display
  const processKitchenRequirements = (items, peopleCount, isCustomOrder) => {
    if (!items || items.length === 0) return [];

    return items.map((item) => {
      const isAddon = item.category === "addons" || item.type === "addon";
      const quantity = item.quantity || 1;

      return {
        name: item.name,
        category: item.category || "other",
        displayQuantity: isAddon ? `${quantity} units` : `${quantity} portions`,
        forPeople: isAddon ? "addon items" : `for ${peopleCount} people`,
        isVegetarian: item.isVegetarian,
        isVegan: item.isVegan,
        allergens: item.allergens || [],
        price: isCustomOrder ? item.totalPrice : null,
        isAddon,
      };
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* List Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-green-800">
              Bookings List
            </h3>
            <div className="text-sm text-green-600">
              Showing {startIndex + 1}-{Math.min(endIndex, bookings.length)} of{" "}
              {bookings.length} bookings
            </div>
          </div>

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
            const kitchenRequirements = processKitchenRequirements(
              booking.selectedItems,
              booking.peopleCount,
              bookingType.type === "custom"
            );

            return (
              <div
                key={booking._id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
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

                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${bookingType.className}`}
                      >
                        <bookingType.icon className="w-3 h-3" />
                        {bookingType.label}
                      </span>

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
                      {/* Customer Info */}
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">
                          Customer Details
                        </h5>
                        <p className="text-gray-600">
                          {booking.customerDetails?.email || "No email"}
                        </p>
                        <p className="text-gray-600">
                          {booking.customerDetails?.phone || "No phone"}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-600">
                            {booking.peopleCount || 0} guests
                          </span>
                        </div>
                      </div>

                      {/* Event Info */}
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">
                          Event Details
                        </h5>
                        <p className="text-gray-600">
                          {bookingInfo.sourceName}
                        </p>
                        <p className="text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {bookingInfo.locationName}
                        </p>
                        <p className="text-gray-600 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {bookingInfo.serviceName}{" "}
                          <span className="bg-red-300 rounded-3xl px-2">
                            {bookingInfo.venue && `- ${bookingInfo.venue}`}
                          </span>
                        </p>
                        <p className="text-gray-600">
                          {booking.deliveryType || "Not specified"}
                        </p>
                      </div>

                      {/* Kitchen Requirements Summary */}
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">
                          Kitchen Requirements
                        </h5>
                        <div className="flex items-center gap-1">
                          <ChefHat className="w-3 h-3 text-orange-600" />
                          <span className="text-orange-600 font-medium">
                            {kitchenRequirements.length} items to prepare
                          </span>
                        </div>
                        <p className="text-gray-600 text-xs">
                          Event: {formatDateTime(booking.deliveryDate)}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Booked: {formatDate(booking.orderDate)}
                        </p>
                        {kitchenRequirements.length > 0 && (
                          <p className="text-orange-600 text-xs">
                            {
                              kitchenRequirements.filter(
                                (item) => !item.isAddon
                              ).length
                            }{" "}
                            portions +{" "}
                            {
                              kitchenRequirements.filter((item) => item.isAddon)
                                .length
                            }{" "}
                            addons
                          </p>
                        )}
                      </div>

                      {/* Financial Info */}
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">
                          Financial
                        </h5>
                        {financials.showRevenue ? (
                          <>
                            <p className="text-gray-600 font-semibold">
                              {formatPrice(financials.total)}
                            </p>
                            {financials.isFullyPaid ? (
                              <p className="text-green-600 font-medium">
                                Fully Paid: {formatPrice(financials.paid)}
                              </p>
                            ) : (
                              <>
                                <p className="text-gray-600">
                                  Paid: {formatPrice(financials.paid)}
                                </p>
                                <p className="text-orange-600">
                                  Due: {formatPrice(financials.balance)}
                                </p>
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
                          <p className="text-red-600 font-medium">Cancelled</p>
                        )}
                      </div>
                    </div>

                    {/* Dietary Requirements */}
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

                  {/* Action Buttons */}
                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => onBookingClick && onBookingClick(booking)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => setQuickViewBooking(booking)}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Quick View
                    </button>

                    <button
                      onClick={() => onPrintBooking && onPrintBooking(booking)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print
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

                    {financials.showPaymentOption && (
                      <button
                        onClick={() => openPaymentEdit(booking)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                      >
                        Payment
                      </button>
                    )}
                  </div>
                </div>

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

      {/* Quick View Modal */}
      {quickViewBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-orange-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Kitchen Requirements -{" "}
                  {quickViewBooking.customerDetails?.name}
                </h2>
                <p className="text-orange-100">
                  #{quickViewBooking.bookingReference}
                </p>
              </div>
              <button
                onClick={() => setQuickViewBooking(null)}
                className="hover:bg-orange-700 p-1 rounded"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-800 mb-2">
                    Event Summary
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Event Date:</strong>{" "}
                      {formatDateTime(quickViewBooking.deliveryDate)}
                    </p>
                    <p>
                      <strong>Guests:</strong> {quickViewBooking.peopleCount}{" "}
                      people
                    </p>
                    <p>
                      <strong>Service:</strong> {quickViewBooking.deliveryType}
                    </p>
                    <p>
                      <strong>Order Type:</strong>{" "}
                      {getBookingType(quickViewBooking).label}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Preparation Summary
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Total Items:</strong>{" "}
                      {quickViewBooking.selectedItems?.length || 0}
                    </p>
                    <p>
                      <strong>Portions:</strong>{" "}
                      {
                        processKitchenRequirements(
                          quickViewBooking.selectedItems,
                          quickViewBooking.peopleCount,
                          false
                        ).filter((item) => !item.isAddon).length
                      }
                    </p>
                    <p>
                      <strong>Addons:</strong>{" "}
                      {
                        processKitchenRequirements(
                          quickViewBooking.selectedItems,
                          quickViewBooking.peopleCount,
                          false
                        ).filter((item) => item.isAddon).length
                      }
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span
                        className={`px-2 py-1 rounded text-xs ${getStatusColor(
                          quickViewBooking.status
                        )}`}
                      >
                        {quickViewBooking.status?.toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Kitchen Requirements */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-800 mb-4 flex items-center gap-2">
                  <ChefHat className="w-5 h-5" />
                  Kitchen Preparation Requirements
                </h3>

                {processKitchenRequirements(
                  quickViewBooking.selectedItems,
                  quickViewBooking.peopleCount,
                  getBookingType(quickViewBooking).type === "custom"
                ).length === 0 ? (
                  <p className="text-center text-gray-600 py-8">
                    No items to prepare
                  </p>
                ) : (
                  <div className="space-y-3">
                    {processKitchenRequirements(
                      quickViewBooking.selectedItems,
                      quickViewBooking.peopleCount,
                      getBookingType(quickViewBooking).type === "custom"
                    ).map((item, index) => (
                      <div
                        key={index}
                        className="bg-white border border-orange-200 rounded p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-lg">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                                {item.category.toUpperCase()}
                              </span>
                              {item.isVegetarian && (
                                <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                                  VEGETARIAN
                                </span>
                              )}
                              {item.isVegan && (
                                <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                                  VEGAN
                                </span>
                              )}
                            </div>
                            {item.allergens.length > 0 && (
                              <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                                <span className="font-medium">Allergens:</span>{" "}
                                {item.allergens.join(", ")}
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-orange-900">
                              {item.displayQuantity}
                            </div>
                            <div className="text-sm text-orange-700">
                              {item.forPeople}
                            </div>
                            {item.price && (
                              <div className="text-sm text-green-600 font-medium mt-1">
                                {formatPrice(item.price)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Special Instructions */}
              {quickViewBooking.customerDetails?.specialInstructions && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">
                    Special Instructions
                  </h3>
                  <p className="text-yellow-700">
                    {quickViewBooking.customerDetails.specialInstructions}
                  </p>
                </div>
              )}

              {/* Dietary Requirements */}
              {(quickViewBooking.customerDetails?.dietaryRequirements?.length >
                0 ||
                quickViewBooking.customerDetails?.spiceLevel !== "medium") && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Dietary Requirements
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Dietary:</span>{" "}
                      {formatDietaryRequirements(
                        quickViewBooking.customerDetails?.dietaryRequirements
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Spice Level:</span>{" "}
                      {formatSpiceLevel(
                        quickViewBooking.customerDetails?.spiceLevel
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <p>
                    Event Date: {formatDateTime(quickViewBooking.deliveryDate)}{" "}
                    | Guests: {quickViewBooking.peopleCount}
                  </p>
                </div>
                <button
                  onClick={() => setQuickViewBooking(null)}
                  className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
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
