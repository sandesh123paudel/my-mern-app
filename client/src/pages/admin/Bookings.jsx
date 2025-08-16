import React, { useState, useEffect } from "react";
import { InlineLoading } from "../../components/Loading";
import bookingService from "../../services/bookingService";
import toast from "react-hot-toast";
import BookingCalendar from "../../components/admin/Bookings/BookingCalender";
import DayDetailModal from "../../components/admin/Bookings/DayDetailModal";
import BookingsList from "../../components/admin/Bookings/BookingsList";
import BookingFilters from "../../components/admin/Bookings/BookingFilters";
import BookingDetailsModal from "../../components/admin/Bookings/BookingDetailsModal";
import BookingPrintModal from "../../components/admin/Bookings/BookingPrintModal";
import BookingExportComponent from "../../components/admin/Bookings/BookingExport";
import { Printer, Download, FileText } from "lucide-react";

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
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);

  // Filter state with custom order support
  const [filters, setFilters] = useState({
    status: "all",
    deliveryType: "all",
    locationId: "all",
    serviceId: "all",
    orderType: "all",
    search: "",
    sortBy: "deliveryDate",
    sortOrder: "asc",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Helper function to safely extract ID as string
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
        limit: 1000,
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

  // Apply filters to bookings list (not calendar)
  const applyFilters = (bookings = allBookings) => {
    let filtered = [...bookings];

    // Apply order type filter first
    if (filters.orderType !== "all") {
      if (filters.orderType === "custom") {
        filtered = filtered.filter((booking) => booking.isCustomOrder === true);
      } else if (filters.orderType === "regular") {
        filtered = filtered.filter((booking) => booking.isCustomOrder !== true);
      }
    }

    // Apply status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(
        (booking) => booking.status === filters.status
      );
    }

    // Apply delivery type filter
    if (filters.deliveryType !== "all") {
      filtered = filtered.filter(
        (booking) => booking.deliveryType === filters.deliveryType
      );
    }

    // Apply location filter
    if (filters.locationId !== "all") {
      filtered = filtered.filter((booking) => {
        const bookingLocationId = extractId(booking.menu?.locationId);
        return bookingLocationId === filters.locationId;
      });
    }

    // Apply service filter
    if (filters.serviceId !== "all" && filters.orderType !== "custom") {
      filtered = filtered.filter((booking) => {
        if (booking.isCustomOrder) return false;
        const bookingServiceId = extractId(booking.menu?.serviceId);
        return bookingServiceId === filters.serviceId;
      });
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
    }

    // Apply custom sorting - priority-based with time considerations
    filtered.sort((a, b) => {
      // Define status priority (lower number = higher priority)
      const getStatusPriority = (status) => {
        switch (status) {
          case "pending": return 1;
          case "confirmed": return 2;
          case "preparing": return 3;
          case "ready": return 4;
          case "completed": return 5;
          case "cancelled": return 6;
          default: return 7;
        }
      };

      const statusA = getStatusPriority(a.status || "pending");
      const statusB = getStatusPriority(b.status || "pending");

      // First sort by status priority
      if (statusA !== statusB) {
        return statusA - statusB;
      }

      // Within same status, sort by delivery date
      const dateA = new Date(a.deliveryDate);
      const dateB = new Date(b.deliveryDate);
      const now = new Date();

      // For active bookings (pending through ready) - upcoming dates first
      if (statusA <= 4) {
        if (dateA >= now && dateB >= now) {
          return dateA - dateB; // Upcoming dates: earliest first
        } else if (dateA >= now) {
          return -1; // A is upcoming, B is past
        } else if (dateB >= now) {
          return 1; // B is upcoming, A is past
        } else {
          return dateB - dateA; // Both past: most recent first
        }
      } else {
        // For completed/cancelled - most recent first
        return dateB - dateA;
      }
    });

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

  // Handle print functionality
  const handlePrintBooking = (booking) => {
    setSelectedBooking(booking);
    setShowPrintModal(true);
  };

  const closePrintModal = () => {
    setSelectedBooking(null);
    setShowPrintModal(false);
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
        fetchMonthBookings();
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
        fetchMonthBookings();
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
        fetchMonthBookings();
        closeBookingDetails();
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
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Calculate summary stats - FIXED to exclude cancelled bookings from revenue
  const getSummaryStats = () => {
    const total = allBookings.length;
    const custom = allBookings.filter(
      (booking) => booking.isCustomOrder
    ).length;
    const regular = total - custom;
    
    // Only include revenue from non-cancelled bookings
    const activeBookings = allBookings.filter(booking => booking.status !== "cancelled");
    const totalRevenue = activeBookings.reduce(
      (sum, booking) => sum + (booking.pricing?.total || 0),
      0
    );
    const customRevenue = activeBookings
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
          
          {/* Export Button */}
          <button
            onClick={() => setShowExportPanel(!showExportPanel)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
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
          <h3 className="text-sm font-medium text-green-600">Active Revenue</h3>
          <p className="text-2xl font-bold text-green-900">
            {formatPrice(summaryStats.totalRevenue)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            (Excludes cancelled bookings)
          </p>
        </div>
      </div>

      {/* Export Panel */}
      {showExportPanel && (
        <BookingExportComponent
          filters={filters}
          allBookings={allBookings}
          filteredBookings={filteredBookings}
          formatPrice={formatPrice}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
        />
      )}

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
        onPrintBooking={handlePrintBooking}
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
          onPrintBooking={handlePrintBooking}
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
          onPrintBooking={handlePrintBooking}
          getStatusColor={getStatusColor}
          formatPrice={formatPrice}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
        />
      )}

      {/* Print Modal */}
      {showPrintModal && selectedBooking && (
        <BookingPrintModal
          booking={selectedBooking}
          onClose={closePrintModal}
          formatPrice={formatPrice}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
        />
      )}
    </div>
  );
};

export default AdminBookings;