import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { InlineLoading } from "../../components/Loading";
import bookingService from "../../services/bookingService";
import toast from "react-hot-toast";
import BookingDetailsModal from "../../components/admin/Bookings/BookingDetailsModal";
// import AddBookingModal from "./AddBookingModal";

const AdminBookings = () => {
  const { token } = useContext(AppContext);
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("orderDate");
  const [sortOrder, setSortOrder] = useState("desc");

  // Helper function to format price
  const formatPrice = (price) => {
    if (!price && price !== 0) return "$0.00";
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2
    }).format(price);
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to format datetime
  const formatDateTime = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const delayedFetch = setTimeout(() => {
      fetchBookings();
    }, searchTerm ? 500 : 0); // Add debounce for search

    return () => clearTimeout(delayedFetch);
  }, [currentPage, filter, dateFilter, locationFilter, deliveryTypeFilter, sortBy, sortOrder]);

  // Separate useEffect for search to avoid excessive re-renders
  useEffect(() => {
    if (searchTerm) {
      const delayedFetch = setTimeout(() => {
        setCurrentPage(1);
        fetchBookings();
      }, 500);
      return () => clearTimeout(delayedFetch);
    } else {
      fetchBookings();
    }
  }, [searchTerm]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: 10,
        sortBy,
        sortOrder
      };

      // Add filters
      if (filter !== "all") {
        params.status = filter;
      }

      if (locationFilter !== "all") {
        params.locationId = locationFilter;
      }

      if (deliveryTypeFilter !== "all") {
        params.deliveryType = deliveryTypeFilter;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      // Add date filter
      if (dateFilter !== "all") {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        
        switch (dateFilter) {
          case "today":
            params.startDate = startOfDay.toISOString();
            params.endDate = new Date(today.setHours(23, 59, 59, 999)).toISOString();
            break;
          case "week":
            const weekStart = new Date(startOfDay);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            params.startDate = weekStart.toISOString();
            params.endDate = weekEnd.toISOString();
            break;
          case "month":
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
            params.startDate = monthStart.toISOString();
            params.endDate = monthEnd.toISOString();
            break;
        }
      }

      const result = await bookingService.getAllBookings(params, token);
      
      if (result.success) {
        setBookings(result.data || []);
        setPagination(result.pagination || {});
      } else {
        toast.error(result.error || "Failed to load bookings");
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status, notes = "") => {
    try {
      const statusData = { status };
      if (notes) statusData.adminNotes = notes;

      const result = await bookingService.updateBookingStatus(bookingId, statusData, token);
      
      if (result.success) {
        toast.success(result.message || "Booking status updated successfully");
        fetchBookings();
        setShowModal(false);
      } else {
        toast.error(result.error || "Failed to update booking status");
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update booking status");
    }
  };

  const deleteBooking = async (bookingId, reason = "") => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const cancellationData = {
        reason: reason || "Cancelled by admin"
      };

      const result = await bookingService.cancelBooking(bookingId, cancellationData, token);
      
      if (result.success) {
        toast.success(result.message || "Booking cancelled successfully");
        fetchBookings();
        setShowModal(false);
      } else {
        toast.error(result.error || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
    }
  };

  const handleAddBooking = async (bookingData) => {
    try {
      const result = await bookingService.createBooking(bookingData);
      
      if (result.success) {
        toast.success(result.message || "Booking created successfully");
        setShowAddModal(false);
        fetchBookings();
      } else {
        toast.error(result.error || "Failed to create booking");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to create booking");
    }
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

  const getStatusCounts = () => {
    return {
      all: bookings.length,
      pending: bookings.filter(b => b.status === "pending").length,
      confirmed: bookings.filter(b => b.status === "confirmed").length,
      preparing: bookings.filter(b => b.status === "preparing").length,
      ready: bookings.filter(b => b.status === "ready").length,
      completed: bookings.filter(b => b.status === "completed").length,
      cancelled: bookings.filter(b => b.status === "cancelled").length
    };
  };

  const statusCounts = getStatusCounts();

  // Get unique locations for filter (using both locationId and locationName)
  const uniqueLocations = React.useMemo(() => {
    const locationMap = new Map();
    bookings.forEach(booking => {
      if (booking.menu?.locationId && booking.menu?.locationName) {
        locationMap.set(booking.menu.locationId, {
          id: booking.menu.locationId,
          name: booking.menu.locationName
        });
      }
    });
    return Array.from(locationMap.values());
  }, [bookings]);

  if (loading && currentPage === 1) {
    return <InlineLoading message="Loading bookings..." size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-amber-800">
            Bookings Management
          </h1>
          <p className="text-amber-600 mt-1">
            Manage customer bookings and track orders
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-amber-600">
            Total: {pagination.totalCount || bookings.length} bookings
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
          >
            + Add Booking
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{statusCounts.all}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-amber-500">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-800">{statusCounts.pending}</div>
            <div className="text-sm text-amber-600">Pending</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-800">{statusCounts.confirmed}</div>
            <div className="text-sm text-green-600">Confirmed</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-800">{statusCounts.preparing}</div>
            <div className="text-sm text-blue-600">Preparing</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-emerald-500">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-800">{statusCounts.completed}</div>
            <div className="text-sm text-emerald-600">Completed</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-800">{statusCounts.cancelled}</div>
            <div className="text-sm text-red-600">Cancelled</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Status
            </label>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Service Type
            </label>
            <select
              value={deliveryTypeFilter}
              onChange={(e) => {
                setDeliveryTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="all">All Services</option>
              <option value="Pickup">Pickup</option>
              <option value="Delivery">Delivery</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Location
            </label>
            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="all">All Locations</option>
              {uniqueLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Date Filter
            </label>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Sort By
            </label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="orderDate-desc">Newest First</option>
              <option value="orderDate-asc">Oldest First</option>
              <option value="deliveryDate-asc">Event Date (Earliest)</option>
              <option value="deliveryDate-desc">Event Date (Latest)</option>
              <option value="customerDetails.name-asc">Customer Name (A-Z)</option>
              <option value="customerDetails.name-desc">Customer Name (Z-A)</option>
              <option value="pricing.total-desc">Amount (High to Low)</option>
              <option value="pricing.total-asc">Amount (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
          <h2 className="text-lg font-semibold text-green-800">
            Bookings ({pagination.totalCount || bookings.length})
          </h2>
        </div>

        {bookings.length === 0 ? (
          <div className="p-8 text-center text-amber-600">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-lg font-medium">No bookings found</p>
            <p className="text-sm mt-2">
              {searchTerm || filter !== "all" || dateFilter !== "all" || locationFilter !== "all" || deliveryTypeFilter !== "all"
                ? "Try adjusting your filters"
                : "Bookings will appear here when customers make reservations"}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <div
                  key={booking._id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-amber-800 text-lg">
                          {booking.customerDetails?.name || "No Name"}
                        </h3>
                        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          #{booking.bookingReference || "No Reference"}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            booking.status || "pending"
                          )}`}
                        >
                          {(booking.status || "pending").replace("_", " ").toUpperCase()}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(
                            booking.paymentStatus || "pending"
                          )}`}
                        >
                          {(booking.paymentStatus || "pending").replace("_", " ").toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        {/* Customer Info */}
                        <div className="space-y-1">
                          <h4 className="font-medium text-amber-700">Customer</h4>
                          <p className="text-gray-600">
                            📧 {booking.customerDetails?.email || "No email"}
                          </p>
                          <p className="text-gray-600">
                            📞 {booking.customerDetails?.phone || "No phone"}
                          </p>
                        </div>

                        {/* Event Details */}
                        <div className="space-y-1">
                          <h4 className="font-medium text-amber-700">Event Details</h4>
                          <p className="text-gray-600">
                            🍽️ {booking.menu?.name || "No menu specified"}
                          </p>
                          <p className="text-gray-600">
                            📍 {booking.menu?.locationName || "No location"}
                          </p>
                          <p className="text-gray-600">
                            🚚 {booking.deliveryType || "Not specified"}
                          </p>
                        </div>

                        {/* Date & Guests */}
                        <div className="space-y-1">
                          <h4 className="font-medium text-amber-700">Schedule</h4>
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

                        {/* Pricing */}
                        <div className="space-y-1">
                          <h4 className="font-medium text-amber-700">Pricing</h4>
                          <p className="text-gray-600">
                            💰 Total: <span className="font-semibold">{formatPrice(booking.pricing?.total)}</span>
                          </p>
                          {booking.pricing?.basePrice && (
                            <p className="text-gray-600 text-xs">
                              Base: {formatPrice(booking.pricing.basePrice)}
                            </p>
                          )}
                          {booking.pricing?.addonsPrice && booking.pricing.addonsPrice > 0 && (
                            <p className="text-gray-600 text-xs">
                              Addons: {formatPrice(booking.pricing.addonsPrice)}
                            </p>
                          )}
                          {booking.depositAmount > 0 && (
                            <p className="text-gray-600 text-xs">
                              Deposit: {formatPrice(booking.depositAmount)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Special Instructions */}
                      {booking.customerDetails?.specialInstructions && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <h4 className="font-medium text-amber-700 text-sm mb-1">Special Instructions:</h4>
                          <p className="text-sm text-amber-600">
                            {booking.customerDetails.specialInstructions}
                          </p>
                        </div>
                      )}

                      {/* Admin Notes */}
                      {booking.adminNotes && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-medium text-blue-700 text-sm mb-1">Admin Notes:</h4>
                          <p className="text-sm text-blue-600">
                            {booking.adminNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowModal(true);
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                      >
                        View Details
                      </button>
                      
                      {booking.status !== "cancelled" && booking.status !== "completed" && (
                        <select
                          value={booking.status || "pending"}
                          onChange={(e) => updateBookingStatus(booking._id, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="completed">Completed</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{" "}
                  {pagination.totalCount} bookings
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={pagination.currentPage === 1 || loading}
                    className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(
                      pagination.totalPages - 4,
                      pagination.currentPage - 2
                    )) + i;
                    
                    if (pageNum > pagination.totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={loading}
                        className={`px-3 py-2 border rounded-md text-sm ${
                          pageNum === pagination.currentPage
                            ? "bg-green-600 text-white border-green-600"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                    disabled={pagination.currentPage === pagination.totalPages || loading}
                    className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showModal && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setShowModal(false)}
          onUpdateStatus={updateBookingStatus}
          onDeleteBooking={deleteBooking}
          getStatusColor={getStatusColor}
          formatPrice={formatPrice}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
        />
      )}

      {showAddModal && (
        <AddBookingModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddBooking}
        />
      )}
    </div>
  );
};

export default AdminBookings;