import React, { useState } from "react";
import { Printer, X, Users, DollarSign, ChefHat, Search } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentData, setPaymentData] = useState({
    paymentStatus: "pending",
    depositAmount: "",
  });
  // NEW: State to control visibility of the kitchen view
  const [showKitchen, setShowKitchen] = useState(false);

  // NEW: Define a priority for booking statuses for sorting
  const statusPriority = {
    'preparing': 1,
    'ready': 2,
    'confirmed': 3,
    'pending': 4,
    'completed': 5,
    'cancelled': 6,
  };

  // Aggregated items by name across all active bookings
  const getAggregatedItems = () => {
    const activeBookings = bookings.filter(booking => booking.status !== "cancelled");
    const itemsMap = new Map();

    activeBookings.forEach(booking => {
      if (booking.selectedItems && Array.isArray(booking.selectedItems)) {
        booking.selectedItems.forEach(item => {
          const itemName = item.name?.toLowerCase().trim();
          if (!itemName) return;

          const isAddon = item.category === 'addons' || item.type === 'addon';
          const itemQuantity = item.quantity || 1;

          if (itemsMap.has(itemName)) {
            const existing = itemsMap.get(itemName);
            existing.totalQuantity += itemQuantity;
            existing.totalPeople += booking.peopleCount || 0;
            existing.bookings.push({
              bookingRef: booking.bookingReference,
              customerName: booking.customerDetails?.name,
              peopleCount: booking.peopleCount,
              quantity: itemQuantity,
              orderType: booking.orderSource?.sourceType === "customOrder" ? "Custom" : "Menu",
              isAddon: isAddon
            });
            // NEW: Update the highest priority status for this aggregated item
            if (statusPriority[booking.status] < statusPriority[existing.highestPriorityStatus]) {
              existing.highestPriorityStatus = booking.status;
            }
          } else {
            itemsMap.set(itemName, {
              name: item.name,
              category: item.category || 'other',
              totalQuantity: itemQuantity,
              totalPeople: booking.peopleCount || 0,
              isVegetarian: item.isVegetarian || false,
              isVegan: item.isVegan || false,
              allergens: item.allergens || [],
              isAddon: isAddon,
              // NEW: Add highest priority status
              highestPriorityStatus: booking.status,
              bookings: [{
                bookingRef: booking.bookingReference,
                customerName: booking.customerDetails?.name,
                peopleCount: booking.peopleCount,
                quantity: itemQuantity,
                orderType: booking.orderSource?.sourceType === "customOrder" ? "Custom" : "Menu",
                isAddon: isAddon
              }]
            });
          }
        });
      }
    });

    // UPDATED: Sort by highest priority status first, then by total quantity
    return Array.from(itemsMap.values()).sort((a, b) => {
      const statusCompare = statusPriority[a.highestPriorityStatus] - statusPriority[b.highestPriorityStatus];
      if (statusCompare !== 0) return statusCompare;
      return b.totalQuantity - a.totalQuantity;
    });
  };

  // Filter items based on search term
  const getFilteredItems = () => {
    const aggregatedItems = getAggregatedItems();
    if (!searchTerm.trim()) return aggregatedItems;

    return aggregatedItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Calculate day summary
  const getDaySummary = () => {
    const activeBookings = bookings.filter(booking => booking.status !== "cancelled");

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

    const statusCounts = {};
    bookings.forEach(booking => {
      const status = booking.status || "pending";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return {
      totalPeople,
      totalRevenue,
      totalPaid,
      totalBookings: bookings.length,
      activeBookings: activeBookings.length,
      statusCounts,
    };
  };

  const summary = getDaySummary();
  const filteredItems = getFilteredItems();

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200";
      case "confirmed": return "bg-green-100 text-green-800 border-green-200";
      case "preparing": return "bg-blue-100 text-blue-800 border-blue-200";
      case "ready": return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case "mains": return "bg-orange-100 text-orange-800";
      case "entree": return "bg-green-100 text-green-800";
      case "desserts": return "bg-pink-100 text-pink-800";
      case "sides": return "bg-blue-100 text-blue-800";
      case "addons": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{formatDate(date.toISOString())}</h2>
            <p className="text-blue-100">
              {summary.totalBookings} events ({summary.activeBookings} active)
            </p>
          </div>
          <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Day Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Guests
              </h3>
              <p className="text-2xl font-bold text-blue-900">{summary.totalPeople}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Revenue
              </h3>
              <p className="text-2xl font-bold text-green-900">{formatPrice(summary.totalRevenue)}</p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-2">Amount Paid</h3>
              <p className="text-2xl font-bold text-orange-900">{formatPrice(summary.totalPaid)}</p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-purple-800 mb-2">Events</h3>
                <p className="text-2xl font-bold text-purple-900">{summary.totalBookings}</p>
              </div>
              {/* NEW: Checkbox to toggle the kitchen view */}
              <div className="mt-2 text-sm text-purple-700 flex items-center gap-2">
                <input
                  id="show-kitchen"
                  type="checkbox"
                  checked={showKitchen}
                  onChange={(e) => setShowKitchen(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-purple-600 rounded"
                />
                <label htmlFor="show-kitchen" className="cursor-pointer">Show Kitchen View</label>
              </div>
            </div>
          </div>

          {/* Status Overview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Status Overview</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.statusCounts).map(([status, count]) => (
                <span
                  key={status}
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}
                >
                  {status.replace("_", " ").toUpperCase()}: {count}
                </span>
              ))}
            </div>
          </div>
          
          {/* UPDATED: Conditionally render the kitchen requirements section */}
          {showKitchen && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-orange-800 flex items-center gap-2">
                  <ChefHat className="w-5 h-5" />
                  Kitchen Preparation Requirements
                </h3>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {filteredItems.length === 0 ? (
                <p className="text-center text-gray-600 py-8">
                  {searchTerm ? "No items found matching your search." : "No items to prepare."}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredItems.map((item, index) => (
                    <div key={index} className="bg-white border border-orange-200 rounded p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-lg">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(item.category)}`}>
                              {item.category?.toUpperCase() || 'OTHER'}
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
                          {item.allergens && item.allergens.length > 0 && (
                            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                              <span className="font-medium">Allergens:</span> {item.allergens.join(", ")}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-900">
                            {item.isAddon ? `${item.totalQuantity} units` : `${item.totalQuantity} portions`}
                          </div>
                          <div className="text-sm text-orange-700">
                            {item.isAddon ? 'addon items' : `for ${item.totalPeople} people`}
                          </div>
                          <div className="text-sm text-orange-600">
                            {item.bookings.length} order{item.bookings.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      {/* Booking Details for this Item */}
                      <div className="border-t border-orange-200 pt-3 mt-3">
                        <h5 className="font-medium text-orange-800 mb-2">Order Details:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {item.bookings.map((booking, bookingIndex) => (
                            <div key={bookingIndex} className="bg-orange-50 p-2 rounded text-sm">
                              <div className="font-medium">{booking.customerName}</div>
                              <div className="text-orange-700">
                                {booking.isAddon 
                                  ? `${booking.quantity} units • ${booking.peopleCount} people • ${booking.orderType}`
                                  : `${booking.quantity} portions • ${booking.peopleCount} people • ${booking.orderType}`
                                }
                              </div>
                              <div className="text-xs text-orange-600">#{booking.bookingRef}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Kitchen Summary */}
              {filteredItems.length > 0 && (
                <div className="mt-4 p-4 bg-orange-100 border border-orange-300 rounded">
                  <h4 className="font-medium text-orange-900 mb-2">Kitchen Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-semibold text-orange-900">
                        {filteredItems.reduce((sum, item) => sum + item.totalQuantity, 0)}
                      </div>
                      <div className="text-orange-700">Total Portions</div>
                    </div>
                    <div>
                      <div className="font-semibold text-orange-900">{filteredItems.length}</div>
                      <div className="text-orange-700">Unique Dishes</div>
                    </div>
                    <div>
                      <div className="font-semibold text-orange-900">
                        {filteredItems.reduce((sum, item) => sum + item.bookings.length, 0)}
                      </div>
                      <div className="text-orange-700">Total Orders</div>
                    </div>
                    <div>
                      <div className="font-semibold text-orange-900">
                        {new Set(filteredItems.flatMap(item => 
                          item.bookings.map(b => b.bookingRef)
                        )).size}
                      </div>
                      <div className="text-orange-700">Unique Bookings</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Individual Bookings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
              Individual Bookings
            </h3>
            <div className="space-y-4">
              {bookings.map((booking) => (
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
                          {(booking.status || "pending").replace("_", " ").toUpperCase()}
                        </span>
                        {booking.orderSource?.sourceType === "customOrder" && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            CUSTOM ORDER
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">{booking.customerDetails?.email || "No email"}</p>
                          <p className="text-gray-600">{booking.customerDetails?.phone || "No phone"}</p>
                        </div>

                        <div>
                          <p className="text-gray-600">{booking.orderSource?.sourceName || "No service"}</p>
                          <p className="text-gray-600">{booking.orderSource?.locationName || "No location"}</p>
                          <p className="text-gray-600">{booking.deliveryType || "Not specified"}</p>
                        </div>

                        <div>
                          <p className="text-gray-600">{booking.peopleCount || 0} guests</p>
                          {booking.status !== "cancelled" ? (
                            <>
                              <p className="text-gray-600 font-semibold">
                                {formatPrice(booking.pricing?.total || 0)}
                              </p>
                              <p className="text-green-600">
                                Paid: {formatPrice(booking.depositAmount || 0)}
                              </p>
                            </>
                          ) : (
                            <p className="text-red-600 font-medium">Cancelled</p>
                          )}
                        </div>
                      </div>

                      {booking.customerDetails?.specialInstructions && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-sm text-yellow-700">
                            <span className="font-medium">Instructions:</span>{" "}
                            {booking.customerDetails.specialInstructions}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => onPrintBooking && onPrintBooking(booking)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        Print
                      </button>

                      {booking.status !== "cancelled" && booking.status !== "completed" && (
                        <select
                          value={booking.status || "pending"}
                          onChange={(e) => onStatusUpdate(booking._id, e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-green-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="completed">Completed</option>
                        </select>
                      )}

                      {booking.status !== "cancelled" && booking.status !== "completed" && (
                        <button
                          onClick={() => onStatusUpdate(booking._id, "cancelled", "Cancelled from day view")}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
                      onChange={(e) => setPaymentData({
                        ...paymentData,
                        depositAmount: e.target.value
                      })}
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
                      <span className="font-medium">Total Amount:</span>{" "}
                      {formatPrice(selectedBooking.pricing?.total)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Balance Due:</span>{" "}
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
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              <p>
                Total for {formatDate(date.toISOString())}: {summary.totalBookings} events, {summary.totalPeople} guests, {formatPrice(summary.totalRevenue)} revenue
              </p>
              <p className="text-xs text-gray-500 mt-1">Revenue excludes cancelled bookings</p>
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

export default DayDetailModal;