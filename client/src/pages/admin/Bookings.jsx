import React, { useState, useEffect } from "react";
import { InlineLoading } from "../../components/Loading";
import bookingService from "../../services/bookingService";
import { getLocations } from "../../services/locationServices";
import { getServices } from "../../services/serviceServices";
import toast from "react-hot-toast";
import BookingCalendar from "../../components/admin/Bookings/BookingCalender";
import DayDetailModal from "../../components/admin/Bookings/DayDetailModal";
import BookingsList from "../../components/admin/Bookings/BookingsList";
import BookingFilters from "../../components/admin/Bookings/BookingFilters";
import BookingDetailsModal from "../../components/admin/Bookings/BookingDetailsModal";
import BookingPrintModal from "../../components/admin/Bookings/BookingPrintModal";
import BookingExportComponent from "../../components/admin/Bookings/BookingExport";
import KitchenDocketPrintModal from "../../components/admin/Bookings/KitchenDocket";
import {
  Printer,
  Download,
  FileText,
  ChefHat,
  TrendingUp,
  MapPin,
  Briefcase,
  Calendar,
  Users,
} from "lucide-react";

const AdminBookings = () => {
  // Location and Service Selection State
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);

  // Bookings state
  const [allBookings, setAllBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [calendarBookings, setCalendarBookings] = useState({});
  const [loading, setLoading] = useState(false);

  const [showKitchenDocket, setShowKitchenDocket] = useState(null);

  // Modal state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    status: "all",
    deliveryType: "all",
    sourceType: "all",
    search: "",
    sortBy: "deliveryDate",
    sortOrder: "priority", // Default to priority sorting
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

  

  // Load locations and services on component mount
  useEffect(() => {
    const loadLocationsAndServices = async () => {
      try {
        setLoadingLocations(true);

        const [locationsResult, servicesResult] = await Promise.all([
          getLocations(),
          getServices(),
        ]);

        if (locationsResult.success) {
          const activeLocations = locationsResult.data.filter(
            (loc) => loc.isActive
          );
          setLocations(activeLocations);
        } else {
          console.error("❌ Failed to load locations:", locationsResult.error);
          toast.error("Failed to load locations");
        }

        if (servicesResult.success) {
          const activeServices = servicesResult.data.filter(
            (service) => service.isActive
          );
          setServices(activeServices);
        } else {
          console.error("❌ Failed to load services:", servicesResult.error);
          toast.error("Failed to load services");
        }
      } catch (error) {
        console.error("Error loading locations and services:", error);
        toast.error("Failed to load initial data");
      } finally {
        setLoadingLocations(false);
      }
    };

    loadLocationsAndServices();
  }, []);

  // Get services filtered by selected location
  const getFilteredServices = () => {
    if (!selectedLocation) return [];
    return services.filter(
      (service) =>
        (service.locationId?._id || service.locationId) === selectedLocation
    );
  };

  // Handle location change
  const handleLocationChange = (locationId) => {
    setSelectedLocation(locationId);
    setSelectedService(""); // Reset service selection
    setDataReady(false);

    // Clear existing data
    setAllBookings([]);
    setCalendarBookings({});
    setBookingStats(null);
    setUniqueDishesData(null);
  };

  // Handle service change
  const handleServiceChange = (serviceId) => {
    setSelectedService(serviceId);
    setDataReady(true); // Ready to load data
  };

  // Fetch bookings for selected location and service
  const fetchBookingsData = async (date = currentDate) => {
    if (!selectedLocation) {
      console.warn("⚠️ No location selected, skipping data fetch");
      return;
    }

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
        locationId: selectedLocation,
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
        limit: 1000,
        sortBy: "deliveryDate",
        sortOrder: "asc",
      };

      // Add service filter if selected
      if (selectedService) {
        params.serviceId = selectedService;
      }

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

        // Fetch stats
        await fetchBookingStats(date);
      } else {
        console.error("❌ Failed to load bookings:", result.error);
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

  // Fetch booking stats
  const fetchBookingStats = async (date = currentDate) => {
    if (!selectedLocation) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const statsParams = {
        locationId: selectedLocation,
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
        date: today,
      };

      const uniqueDishesParams = {
        date: today,
        locationId: selectedLocation,
      };

      // Add service filters if selected
      if (selectedService) {
        statsParams.serviceId = selectedService;
        uniqueDishesParams.serviceId = selectedService;
      }

      const [statsResult, uniqueDishesResult] = await Promise.all([
        bookingService.getBookingStats(statsParams),
        bookingService.getUniqueDishesCount(uniqueDishesParams),
      ]);

      if (statsResult.success) {
        setBookingStats(statsResult.data);
      }

      if (uniqueDishesResult.success) {
        setUniqueDishesData(uniqueDishesResult.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleKitchenDocket = (booking) => {
    setShowKitchenDocket(booking);
  };

  // Load data when location/service selection is ready
  useEffect(() => {
    if (dataReady && selectedLocation) {
      fetchBookingsData();
    }
  }, [dataReady, selectedLocation, selectedService]);

  // Enhanced apply filters function with sorting integration
  // Enhanced apply filters function with date range filtering
  const applyFilters = (bookings = allBookings) => {
    let filtered = [...bookings];

    // Apply date range filter first
    if (filters.dateRange && filters.dateRange !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const oneMonthFromNow = new Date(today);
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

      filtered = filtered.filter((booking) => {
        const deliveryDate = new Date(booking.deliveryDate);
        const deliveryDay = new Date(
          deliveryDate.getFullYear(),
          deliveryDate.getMonth(),
          deliveryDate.getDate()
        );

        switch (filters.dateRange) {
          case "today":
            return deliveryDay.getTime() === today.getTime();
          case "tomorrow":
            return deliveryDay.getTime() === tomorrow.getTime();
          case "next_7_days":
            return deliveryDate >= today && deliveryDate <= sevenDaysFromNow;
          case "next_30_days":
            return deliveryDate >= today && deliveryDate <= oneMonthFromNow;
          case "past":
            return deliveryDate < today;
          case "future":
            return deliveryDate > oneMonthFromNow;
          default:
            return true;
        }
      });
    }

    // Apply source type filter
    if (filters.sourceType !== "all") {
      if (filters.sourceType === "customOrder") {
        filtered = filtered.filter(
          (booking) =>
            booking.isCustomOrder === true ||
            booking.orderSource?.sourceType === "customOrder"
        );
      } else if (filters.sourceType === "menu") {
        filtered = filtered.filter(
          (booking) =>
            booking.isCustomOrder !== true &&
            booking.orderSource?.sourceType !== "customOrder"
        );
      }
    }

    // Apply other filters
    if (filters.status !== "all") {
      filtered = filtered.filter(
        (booking) => booking.status === filters.status
      );
    }

    if (filters.deliveryType !== "all") {
      filtered = filtered.filter(
        (booking) => booking.deliveryType === filters.deliveryType
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
          (booking.orderSource?.sourceName || booking.menu?.name)
            ?.toLowerCase()
            .includes(searchTerm)
      );
    }

    // Apply sorting using the enhanced sorting function
    const sorted = applySorting(filtered, filters.sortOrder);
    setFilteredBookings(sorted);

    // Update pagination
    const totalItems = sorted.length;
    const itemsPerPage = 10;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    setPagination({
      totalCount: totalItems,
      totalPages: totalPages,
      currentPage: Math.min(currentPage, totalPages || 1),
      limit: itemsPerPage,
    });
  };

  // Enhanced sorting function with improved priority logic
  const applySorting = (bookings, sortOrder = "priority") => {
    const bookingsArray = [...bookings];

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

        // Helper function to check if booking is cancelled
        const isCancelled = (booking) => {
          return (booking.status || "pending") === "cancelled";
        };

        const isAFullyCompleted = isFullyCompleted(a);
        const isBFullyCompleted = isFullyCompleted(b);
        const isACancelled = isCancelled(a);
        const isBCancelled = isCancelled(b);

        // 1. Cancelled bookings go to the very bottom
        if (isACancelled && !isBCancelled) return 1;
        if (!isACancelled && isBCancelled) return -1;

        // 2. Both cancelled - sort by most recent delivery date
        if (isACancelled && isBCancelled) {
          const deliveryDateA = new Date(a.deliveryDate);
          const deliveryDateB = new Date(b.deliveryDate);
          return deliveryDateB - deliveryDateA;
        }

        // 3. Fully completed bookings go to bottom (but above cancelled)
        if (isAFullyCompleted && !isBFullyCompleted) return 1;
        if (!isAFullyCompleted && isBFullyCompleted) return -1;

        // 4. Both fully completed - sort by most recent delivery date
        if (isAFullyCompleted && isBFullyCompleted) {
          const deliveryDateA = new Date(a.deliveryDate);
          const deliveryDateB = new Date(b.deliveryDate);
          return deliveryDateB - deliveryDateA;
        }

        // 5. For active bookings, prioritize by urgency and timing
        const now = new Date();
        const deliveryDateA = new Date(a.deliveryDate);
        const deliveryDateB = new Date(b.deliveryDate);
        const orderDateA = new Date(a.orderDate);
        const orderDateB = new Date(b.orderDate);

        // Calculate time until delivery
        const timeUntilDeliveryA = deliveryDateA - now;
        const timeUntilDeliveryB = deliveryDateB - now;

        // Check if events are overdue (past due)
        const isAOverdue = timeUntilDeliveryA < 0;
        const isBOverdue = timeUntilDeliveryB < 0;

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

        // Priority order for active bookings:

        // 1. Today's events - earliest delivery time first
        if (isATodayEvent && !isBTodayEvent) return -1;
        if (!isATodayEvent && isBTodayEvent) return 1;

        if (isATodayEvent && isBTodayEvent) {
          // For today's events, sort by delivery time (earliest first)
          return deliveryDateA - deliveryDateB;
        }

        // 2. Upcoming events (within 48 hours) - earliest delivery first
        if (isAUpcoming && !isBUpcoming) return -1;
        if (!isAUpcoming && isBUpcoming) return 1;

        if (isAUpcoming && isBUpcoming) {
          // For upcoming events, sort by earliest delivery time
          return deliveryDateA - deliveryDateB;
        }

        // 3. Future events (more than 48 hours away) - earliest delivery first
        const bothFuture =
          timeUntilDeliveryA > 48 * 60 * 60 * 1000 &&
          timeUntilDeliveryB > 48 * 60 * 60 * 1000;
        if (bothFuture) {
          // For future events, sort by earliest delivery date
          return deliveryDateA - deliveryDateB;
        }

        // 4. Past/overdue events - send to back but keep most recent first
        if (isAOverdue && !isBOverdue) return 1;
        if (!isAOverdue && isBOverdue) return -1;

        if (isAOverdue && isBOverdue) {
          // For past events, show most recent delivery first
          return deliveryDateB - deliveryDateA;
        }

        // 5. Mixed cases - prioritize future events
        if (timeUntilDeliveryA > 0 && timeUntilDeliveryB < 0) return -1;
        if (timeUntilDeliveryA < 0 && timeUntilDeliveryB > 0) return 1;

        // Fallback: sort by delivery date (earliest first for future, latest first for past)
        if (timeUntilDeliveryA >= 0 && timeUntilDeliveryB >= 0) {
          return deliveryDateA - deliveryDateB; // Future: earliest first
        } else {
          return deliveryDateB - deliveryDateA; // Past: latest first
        }
      });
    }

    // Return unsorted array if no matching sort order
    return bookingsArray;
  };

  // Handle month navigation
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
    if (dataReady && selectedLocation) {
      fetchBookingsData(newDate);
    }
  };

  // Handle day click
  const handleDayClick = async (date) => {
    setSelectedDate(date);

    const dateStr = date.toISOString().split("T")[0];
    try {
      const params = {
        date: dateStr,
        locationId: selectedLocation,
      };

      if (selectedService) {
        params.serviceId = selectedService;
      }

      const uniqueDishesResult = await bookingService.getUniqueDishesCount(
        params
      );

      let enhancedData = { date };

      if (uniqueDishesResult.success) {
        enhancedData.uniqueDishesData = uniqueDishesResult.data;
      }

      setSelectedDate(enhancedData);
    } catch (error) {
      console.error("Error fetching kitchen data for date:", error);
      setSelectedDate({ date });
    }

    setShowDayModal(true);
  };

  // Other handlers remain the same...
  const openBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const closeBookingDetails = () => {
    setSelectedBooking(null);
    setShowBookingModal(false);
  };

  const handlePrintBooking = (booking) => {
    setSelectedBooking(booking);
    setShowPrintModal(true);
  };

  const closePrintModal = () => {
    setSelectedBooking(null);
    setShowPrintModal(false);
  };

  // Update functions
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
        fetchBookingsData();
      } else {
        toast.error(result.error || "Failed to update booking status");
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update booking status");
    }
  };

  const updatePayment = async (bookingId, paymentData) => {
    try {
      const result = await bookingService.updatePaymentStatus(
        bookingId,
        paymentData
      );

      if (result.success) {
        toast.success(result.message || "Payment updated successfully");
        fetchBookingsData();
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

  const deleteBooking = async (bookingId, reason = "") => {
    try {
      const result = await bookingService.cancelBooking(bookingId, { reason });

      if (result.success) {
        toast.success(result.message || "Booking cancelled successfully");
        fetchBookingsData();
        closeBookingDetails();
      } else {
        toast.error(result.error || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Calculate summary stats
  const getSummaryStats = () => {
    const total = allBookings.length;
    const custom = allBookings.filter(
      (booking) =>
        booking.isCustomOrder ||
        booking.orderSource?.sourceType === "customOrder"
    ).length;
    const regular = total - custom;

    const activeBookings = allBookings.filter(
      (booking) => booking.status !== "cancelled"
    );
    const totalRevenue = activeBookings.reduce(
      (sum, booking) => sum + (booking.pricing?.total || 0),
      0
    );

    return { total, custom, regular, totalRevenue };
  };

  const summaryStats = getSummaryStats();

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [filters, allBookings]);

  // Show loading screen while locations are loading
  if (loadingLocations) {
    return (
      <InlineLoading message="Loading locations and services..." size="large" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookings Dashboard</h1>
          <p className="mt-1">
            Select location and service to view bookings and kitchen
            requirements
          </p>
        </div>
        <div className="flex items-center gap-4">
          {dataReady && (
            <>
              <div className="text-sm text-amber-600 space-y-1">
                <div>Total Bookings: {summaryStats.total}</div>
                <div className="flex gap-4 text-xs">
                  <span>Regular: {summaryStats.regular}</span>
                  <span>Custom: {summaryStats.custom}</span>
                </div>
              </div>

              <button
                onClick={() => setShowExportPanel(!showExportPanel)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </>
          )}

          <button
            onClick={() => {
              if (dataReady && selectedLocation) {
                fetchBookingsData();
              }
            }}
            disabled={!dataReady}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Location and Service Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Select Location and Service
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <select
                value={selectedLocation}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                required
              >
                <option value="">Select a location</option>
                {locations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {location.name} - {location.city}
                  </option>
                ))}
              </select>
            </div>
            {!selectedLocation && (
              <p className="text-sm text-gray-500 mt-1">
                Please select a location to continue
              </p>
            )}
          </div>

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Type <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <Briefcase
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <select
                value={selectedService}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                disabled={!selectedLocation}
              >
                <option value="">All Services</option>
                {getFilteredServices().map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
            {!selectedLocation ? (
              <p className="text-sm text-gray-500 mt-1">
                Select location first to see available services
              </p>
            ) : getFilteredServices().length === 0 ? (
              <p className="text-sm text-orange-600 mt-1">
                No services available for this location
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to show all services for this location
              </p>
            )}
          </div>
        </div>

        {/* Selection Status */}
        {selectedLocation && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">
                Selected:{" "}
                {locations.find((l) => l._id === selectedLocation)?.name}
                {selectedService && (
                  <span>
                    {" "}
                    -{" "}
                    {
                      getFilteredServices().find(
                        (s) => s._id === selectedService
                      )?.name
                    }
                  </span>
                )}
              </span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              {selectedService
                ? "Showing bookings for specific service"
                : "Showing all bookings for this location"}
            </p>
          </div>
        )}
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

      {/* Show rest of the dashboard only if location is selected */}
      {!selectedLocation ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            Select a Location to Continue
          </h3>
          <p className="text-gray-500">
            Please select a location from the dropdown above to view bookings,
            calendar, and kitchen requirements.
          </p>
        </div>
      ) : !dataReady ? (
        <div className="bg-blue-50 rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            Ready to Load Data
          </h3>
          <p className="text-blue-600">
            Location selected. Click "Refresh" or select a service to load
            bookings data.
          </p>
        </div>
      ) : loading ? (
        <InlineLoading message="Loading bookings data..." size="large" />
      ) : (
        <>
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600">
                Total Bookings
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {summaryStats.total}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
              <h3 className="text-sm font-medium text-blue-600">
                Regular Orders
              </h3>
              <p className="text-2xl font-bold text-blue-900">
                {summaryStats.regular}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg shadow-sm border border-purple-200">
              <h3 className="text-sm font-medium text-purple-600">
                Custom Orders
              </h3>
              <p className="text-2xl font-bold text-purple-900">
                {summaryStats.custom}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
              <h3 className="text-sm font-medium text-green-600">
                Active Revenue
              </h3>
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
            selectedLocation={selectedLocation}
            selectedService={selectedService}
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
            onKitchenDocket={handleKitchenDocket}
            formatPrice={formatPrice}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            selectedLocation={selectedLocation}
            selectedService={selectedService}
            filters={filters}
          />

          {/* Day Detail Modal */}
          {showDayModal && selectedDate && (
            <DayDetailModal
              date={selectedDate.date || selectedDate}
              bookings={
                calendarBookings[
                  (selectedDate.date || selectedDate).toDateString()
                ] || []
              }
              uniqueDishesData={selectedDate.uniqueDishesData}
              selectedLocation={selectedLocation}
              selectedService={selectedService}
              onClose={() => setShowDayModal(false)}
              onStatusUpdate={updateBookingStatus}
              onPaymentUpdate={updatePayment}
              onPrintBooking={handlePrintBooking}
              onKitchenDocket={handleKitchenDocket}
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

          {/* Kitchen Docket Modal */}
          {showKitchenDocket && (
            <KitchenDocketPrintModal
              booking={showKitchenDocket}
              onClose={() => setShowKitchenDocket(null)}
              formatDateTime={formatDateTime}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AdminBookings;
