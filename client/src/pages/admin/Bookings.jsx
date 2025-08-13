import React, { useState, useEffect } from "react";
import { InlineLoading } from "../../components/Loading";
import bookingService from "../../services/bookingService";
import toast from "react-hot-toast";
import BookingCalendar from "../../components/admin/Bookings/BookingCalender";
import DayDetailModal from "../../components/admin/Bookings/DayDetailModal";
import BookingsList from "../../components/admin/Bookings/BookingsList";
import BookingFilters from "../../components/admin/Bookings/BookingFilters";
import BookingDetailsModal from "../../components/admin/Bookings/BookingDetailsModal";

const AdminBookings = () => {
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);

  // Bookings state
  const [allBookings, setAllBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [calendarBookings, setCalendarBookings] = useState({});
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Filter state with custom order support
  const [filters, setFilters] = useState({
    status: "all",
    deliveryType: "all",
    locationId: "all",
    serviceId: "all",
    orderType: "all", // new filter for custom/regular orders
    search: "",
    sortBy: "deliveryDate",
    sortOrder: "asc",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Helper function to safely extract ID as string (same as in BookingFilters)
  const extractId = (id) => {
    if (!id) return null;
    if (typeof id === "string") return id;
    if (typeof id === "object" && id._id) return id._id.toString();
    if (typeof id === "object" && id.toString) return id.toString();
    return String(id);
  };

  // Helper functions
  const formatPrice = (price) => {
    if (!price && price !== 0) return "$0.00";
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status color helper
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

  // Fetch all bookings for the current month
  const fetchMonthBookings = async (date = currentDate) => {
    try {
      setLoading(true);

      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const params = {
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
        limit: 1000, // Get all bookings for the month
        sortBy: "deliveryDate",
        sortOrder: "asc",
      };

      const result = await bookingService.getAllBookings(params);

      if (result.success) {
        const bookings = result.data || [];
        setAllBookings(bookings);

        // Group bookings by date for calendar
        const groupedByDate = {};
        bookings.forEach((booking) => {
          const dateKey = new Date(booking.deliveryDate).toDateString();
          if (!groupedByDate[dateKey]) {
            groupedByDate[dateKey] = [];
          }
          groupedByDate[dateKey].push(booking);
        });

        setCalendarBookings(groupedByDate);
        applyFilters(bookings);
      } else {
        toast.error(result.error || "Failed to load bookings");
        setAllBookings([]);
        setCalendarBookings({});
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
      setAllBookings([]);
      setCalendarBookings({});
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to bookings list (not calendar) - FIXED FILTERING LOGIC
  const applyFilters = (bookings = allBookings) => {
    let filtered = [...bookings];

    console.log("🔍 Applying filters:", filters);
    console.log("📊 Total bookings before filtering:", filtered.length);

    // Apply order type filter first
    if (filters.orderType !== "all") {
      if (filters.orderType === "custom") {
        filtered = filtered.filter((booking) => booking.isCustomOrder === true);
      } else if (filters.orderType === "regular") {
        filtered = filtered.filter((booking) => booking.isCustomOrder !== true);
      }
      console.log(
        `🏷️ After order type filter (${filters.orderType}):`,
        filtered.length
      );
    }

    // Apply status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(
        (booking) => booking.status === filters.status
      );
      console.log(
        `📋 After status filter (${filters.status}):`,
        filtered.length
      );
    }

    // Apply delivery type filter
    if (filters.deliveryType !== "all") {
      filtered = filtered.filter(
        (booking) => booking.deliveryType === filters.deliveryType
      );
      console.log(
        `🚚 After delivery type filter (${filters.deliveryType}):`,
        filtered.length
      );
    }

    // Apply location filter - FIXED WITH PROPER ID EXTRACTION
    if (filters.locationId !== "all") {
      const beforeCount = filtered.length;
      filtered = filtered.filter((booking) => {
        const bookingLocationId = extractId(booking.menu?.locationId);
        const matches = bookingLocationId === filters.locationId;

        if (!matches) {
          console.log(`❌ Location mismatch:`, {
            bookingLocationId,
            filterLocationId: filters.locationId,
            bookingLocationName: booking.menu?.locationName,
            bookingReference: booking.bookingReference,
          });
        }

        return matches;
      });
      console.log(
        `📍 After location filter (${filters.locationId}): ${
          filtered.length
        } (removed ${beforeCount - filtered.length})`
      );
    }

    // Apply service filter - FIXED WITH PROPER ID EXTRACTION
    if (filters.serviceId !== "all" && filters.orderType !== "custom") {
      const beforeCount = filtered.length;
      filtered = filtered.filter((booking) => {
        // Skip custom orders (they don't have services)
        if (booking.isCustomOrder) return false;

        const bookingServiceId = extractId(booking.menu?.serviceId);
        const matches = bookingServiceId === filters.serviceId;

        if (!matches) {
          console.log(`❌ Service mismatch:`, {
            bookingServiceId,
            filterServiceId: filters.serviceId,
            bookingServiceName: booking.menu?.serviceName,
            bookingReference: booking.bookingReference,
          });
        }

        return matches;
      });
      console.log(
        `🏢 After service filter (${filters.serviceId}): ${
          filtered.length
        } (removed ${beforeCount - filtered.length})`
      );
    }

    // Apply search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.customerDetails?.name?.toLowerCase().includes(searchTerm) ||
          booking.customerDetails?.email?.toLowerCase().includes(searchTerm) ||
          booking.customerDetails?.phone?.includes(searchTerm) ||
          booking.bookingReference?.toLowerCase().includes(searchTerm) ||
          booking.menu?.name?.toLowerCase().includes(searchTerm) ||
          booking.menu?.locationName?.toLowerCase().includes(searchTerm) ||
          booking.menu?.serviceName?.toLowerCase().includes(searchTerm)
      );
      console.log(
        `🔍 After search filter (${filters.search}):`,
        filtered.length
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[filters.sortBy];
      let bValue = b[filters.sortBy];

      // Handle nested properties
      if (filters.sortBy.includes(".")) {
        const keys = filters.sortBy.split(".");
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }

      // Handle date sorting
      if (filters.sortBy === "deliveryDate" || filters.sortBy === "orderDate") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (filters.sortOrder === "desc") {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    console.log("✅ Final filtered bookings:", filtered.length);

    // Debug: Show sample of filtered bookings
    if (filtered.length > 0) {
      console.log("📝 Sample filtered booking:", {
        reference: filtered[0].bookingReference,
        locationId: extractId(filtered[0].menu?.locationId),
        locationName: filtered[0].menu?.locationName,
        serviceId: extractId(filtered[0].menu?.serviceId),
        serviceName: filtered[0].menu?.serviceName,
      });
    }

    setFilteredBookings(filtered);

    // Update pagination
    const totalItems = filtered.length;
    const itemsPerPage = 10;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    setPagination({
      totalCount: totalItems,
      totalPages: totalPages,
      currentPage: Math.min(currentPage, totalPages || 1),
      limit: itemsPerPage,
    });
  };

  // Handle month navigation
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
    fetchMonthBookings(newDate);
  };

  // Handle day click
  const handleDayClick = (date) => {
    setSelectedDate(date);
    setShowDayModal(true);
  };

  // Handle booking details modal
  const openBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const closeBookingDetails = () => {
    setSelectedBooking(null);
    setShowBookingModal(false);
  };

  // Update booking status
  const updateBookingStatus = async (bookingId, status, notes = "") => {
    try {
      const statusData = { status };
      if (notes) statusData.adminNotes = notes;

      const result = await bookingService.updateBookingStatus(
        bookingId,
        statusData
      );

      if (result.success) {
        toast.success(result.message || "Booking status updated successfully");
        fetchMonthBookings(); // Refresh calendar and list
      } else {
        toast.error(result.error || "Failed to update booking status");
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update booking status");
    }
  };

  // Update payment
  const updatePayment = async (bookingId, paymentData) => {
    try {
      const result = await bookingService.updatePaymentStatus(
        bookingId,
        paymentData
      );

      if (result.success) {
        toast.success(result.message || "Payment updated successfully");
        fetchMonthBookings(); // Refresh calendar and list
        return result;
      } else {
        toast.error(result.error || "Failed to update payment");
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment");
      throw error;
    }
  };

  // Delete/Cancel booking
  const deleteBooking = async (bookingId, reason = "") => {
    try {
      const result = await bookingService.cancelBooking(bookingId, { reason });

      if (result.success) {
        toast.success(result.message || "Booking cancelled successfully");
        fetchMonthBookings(); // Refresh calendar and list
        closeBookingDetails(); // Close modal if open
      } else {
        toast.error(result.error || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    console.log("🔄 Filter changed:", newFilters);
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Calculate summary stats
  const getSummaryStats = () => {
    const total = allBookings.length;
    const custom = allBookings.filter(
      (booking) => booking.isCustomOrder
    ).length;
    const regular = total - custom;
    const totalRevenue = allBookings.reduce(
      (sum, booking) => sum + (booking.pricing?.total || 0),
      0
    );
    const customRevenue = allBookings
      .filter((booking) => booking.isCustomOrder)
      .reduce((sum, booking) => sum + (booking.pricing?.total || 0), 0);

    return { total, custom, regular, totalRevenue, customRevenue };
  };

  const summaryStats = getSummaryStats();

  // Initial load
  useEffect(() => {
    fetchMonthBookings();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    console.log("🔄 Filters changed, reapplying...", filters);
    applyFilters();
  }, [filters, allBookings]);

  if (loading) {
    return <InlineLoading message="Loading bookings..." size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-amber-800">
            Bookings Calendar
          </h1>
          <p className="text-amber-600 mt-1">
            Manage regular menu bookings and custom orders
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-amber-600 space-y-1">
            <div>Total Bookings: {summaryStats.total}</div>
            <div className="flex gap-4 text-xs">
              <span>Regular: {summaryStats.regular}</span>
              <span>Custom: {summaryStats.custom}</span>
            </div>
          </div>
          <button
            onClick={() => fetchMonthBookings()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600">Total Bookings</h3>
          <p className="text-2xl font-bold text-gray-900">
            {summaryStats.total}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
          <h3 className="text-sm font-medium text-blue-600">Regular Orders</h3>
          <p className="text-2xl font-bold text-blue-900">
            {summaryStats.regular}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow-sm border border-purple-200">
          <h3 className="text-sm font-medium text-purple-600">Custom Orders</h3>
          <p className="text-2xl font-bold text-purple-900">
            {summaryStats.custom}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
          <h3 className="text-sm font-medium text-green-600">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-900">
            {formatPrice(summaryStats.totalRevenue)}
          </p>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <BookingCalendar
          currentDate={currentDate}
          calendarBookings={calendarBookings}
          onDayClick={handleDayClick}
          onMonthNavigate={navigateMonth}
          formatPrice={formatPrice}
        />
      </div>

      {/* Filters Section */}
      <BookingFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        allBookings={allBookings}
        totalCount={filteredBookings.length}
      />

      {/* Bookings List Section */}
      <BookingsList
        bookings={filteredBookings}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onStatusUpdate={updateBookingStatus}
        onPaymentUpdate={updatePayment}
        onBookingClick={openBookingDetails}
        formatPrice={formatPrice}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
      />

      {/* Day Detail Modal */}
      {showDayModal && selectedDate && (
        <DayDetailModal
          date={selectedDate}
          bookings={calendarBookings[selectedDate.toDateString()] || []}
          onClose={() => setShowDayModal(false)}
          onStatusUpdate={updateBookingStatus}
          onPaymentUpdate={updatePayment}
          formatPrice={formatPrice}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
        />
      )}

      {/* Booking Details Modal */}
      {showBookingModal && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={closeBookingDetails}
          onUpdateStatus={updateBookingStatus}
          onDeleteBooking={deleteBooking}
          getStatusColor={getStatusColor}
          formatPrice={formatPrice}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
        />
      )}
    </div>
  );
};

export default AdminBookings;
