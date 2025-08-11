import React, { useState, useEffect, useContext } from "react";
import { InlineLoading } from "../../components/Loading";
import bookingService from "../../services/bookingService";
import toast from "react-hot-toast";
import BookingCalendar from "../../components/admin/Bookings/BookingCalender";
import DayDetailModal from "../../components/admin/Bookings/DayDetailModal";
import BookingsList from "../../components/admin/Bookings/BookingsList";
import BookingFilters from "../../components/admin/Bookings/BookingFilters";

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

  // Filter state
  const [filters, setFilters] = useState({
    status: "all",
    deliveryType: "all",
    locationId: "all",
    serviceId: "all",
    search: "",
    sortBy: "deliveryDate",
    sortOrder: "asc",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

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

  // Apply filters to bookings list (not calendar)
  const applyFilters = (bookings = allBookings) => {
    let filtered = [...bookings];

    console.log("Applying filters:", filters);
    console.log("Total bookings before filtering:", filtered.length);

    // Apply status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(
        (booking) => booking.status === filters.status
      );
      console.log(`After status filter (${filters.status}):`, filtered.length);
    }

    // Apply delivery type filter
    if (filters.deliveryType !== "all") {
      filtered = filtered.filter(
        (booking) => booking.deliveryType === filters.deliveryType
      );
      console.log(
        `After delivery type filter (${filters.deliveryType}):`,
        filtered.length
      );
    }

    // Apply location filter - Fixed logic
    if (filters.locationId !== "all") {
      const beforeCount = filtered.length;
      filtered = filtered.filter((booking) => {
        const matches = booking.menu?.locationId === filters.locationId;
        if (!matches) {
          console.log("Location mismatch:", {
            bookingLocationId: booking.menu?.locationId,
            filterLocationId: filters.locationId,
            bookingLocationName: booking.menu?.locationName,
          });
        }
        return matches;
      });
      console.log(
        `After location filter (${filters.locationId}): ${
          filtered.length
        } (removed ${beforeCount - filtered.length})`
      );
    }

    // Apply service filter
    if (filters.serviceId !== "all") {
      const beforeCount = filtered.length;
      filtered = filtered.filter((booking) => {
        if (!booking.menu?.name) return false;

        const menuName = booking.menu.name.toLowerCase();

        // Match based on service category
        if (filters.serviceId === "catering") {
          return (
            menuName.includes("catering") ||
            menuName.includes("corporate") ||
            menuName.includes("lunch")
          );
        } else if (filters.serviceId === "function") {
          return (
            menuName.includes("function") ||
            menuName.includes("event") ||
            menuName.includes("party")
          );
        } else if (filters.serviceId === "wedding") {
          return menuName.includes("wedding");
        } else {
          // Direct service ID or menu name match
          return (
            booking.menu.serviceId === filters.serviceId ||
            booking.menu.name === filters.serviceId
          );
        }
      });
      console.log(
        `After service filter (${filters.serviceId}):`,
        filtered.length
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
          booking.menu?.locationName?.toLowerCase().includes(searchTerm)
      );
      console.log(`After search filter (${filters.search}):`, filtered.length);
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

    console.log("Final filtered bookings:", filtered.length);
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

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

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
            Manage bookings with calendar view and detailed scheduling
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-amber-600">
            Total Bookings: {allBookings.length}
          </div>
          <button
            onClick={() => fetchMonthBookings()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            🔄 Refresh
          </button>
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
    </div>
  );
};

export default AdminBookings;
