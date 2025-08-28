import React, { useMemo } from "react";
import { MapPin, Briefcase, Filter, X, Calendar } from "lucide-react";

const BookingFilters = ({
  filters,
  onFilterChange,
  allBookings,
  totalCount,
  selectedLocation,
  selectedService,
}) => {
  // Calculate order type counts
  const orderTypeCounts = useMemo(() => {
    const total = allBookings.length;
    const custom = allBookings.filter(
      (booking) => booking.orderSource?.sourceType === "customOrder"
    ).length;
    const regular = total - custom;

    return { total, custom, regular };
  }, [allBookings]);

  // Calculate status breakdown
  const statusBreakdown = useMemo(() => {
    const breakdown = {
      all: allBookings.length,
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };

    allBookings.forEach((booking) => {
      const status = booking.status || "pending";
      if (breakdown.hasOwnProperty(status)) {
        breakdown[status]++;
      }
    });

    return breakdown;
  }, [allBookings]);

  // Calculate delivery type breakdown
  const deliveryTypeBreakdown = useMemo(() => {
    const breakdown = {
      all: allBookings.length,
      Pickup: 0,
      Delivery: 0,
      Event: 0,
    };

    allBookings.forEach((booking) => {
      const deliveryType = booking.deliveryType;
      if (breakdown.hasOwnProperty(deliveryType)) {
        breakdown[deliveryType]++;
      }
    });

    return breakdown;
  }, [allBookings]);

  // Calculate date range breakdown
  const dateRangeBreakdown = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const oneMonthFromNow = new Date(today);
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    const breakdown = {
      all: allBookings.length,
      today: 0,
      tomorrow: 0,
      next_7_days: 0,
      next_30_days: 0,
      past: 0,
      future: 0,
    };

    allBookings.forEach((booking) => {
      const deliveryDate = new Date(booking.deliveryDate);
      const deliveryDay = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate());
      
      if (deliveryDay.getTime() === today.getTime()) {
        breakdown.today++;
      } else if (deliveryDay.getTime() === tomorrow.getTime()) {
        breakdown.tomorrow++;
      } else if (deliveryDay >= today && deliveryDay <= sevenDaysFromNow) {
        breakdown.next_7_days++;
      } else if (deliveryDate >= today && deliveryDate <= oneMonthFromNow) {
        breakdown.next_30_days++;
      } else if (deliveryDate < today) {
        breakdown.past++;
      } else {
        breakdown.future++;
      }
    });

    return breakdown;
  }, [allBookings]);

  // Calculate revenue (excluding cancelled)
  const totalRevenue = useMemo(() => {
    const activeBookings = allBookings.filter((b) => b.status !== "cancelled");
    return activeBookings.reduce((sum, b) => sum + (b.pricing?.total || 0), 0);
  }, [allBookings]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFilterChange({
      status: "all",
      deliveryType: "all",
      sourceType: "all",
      search: "",
      dateRange: "today", // Keep today as default
      sortBy: "deliveryDate",
      sortOrder: "priority",
    });
  };

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.deliveryType !== "all" ||
    filters.sourceType !== "all" ||
    filters.search.trim() !== "" ||
    (filters.dateRange && filters.dateRange !== "today");

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Filter Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Filter Bookings
              </h3>
            </div>

            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {totalCount} results
            </span>

            <div className="flex gap-2 text-xs">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Menu: {orderTypeCounts.regular}
              </span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                Custom: {orderTypeCounts.custom}
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                Revenue: {formatPrice(totalRevenue)}
              </span>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-800 underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Location/Service Context */}
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 font-medium">
                Location filtered
              </span>
            </div>
            {selectedService && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  Service filtered
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Filters */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Name, email, phone, reference..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date Range
            </label>
            <select
              value={filters.dateRange || "today"}
              onChange={(e) => handleFilterChange("dateRange", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Dates ({dateRangeBreakdown.all})</option>
              <option value="today">Today ({dateRangeBreakdown.today})</option>
              <option value="tomorrow">Tomorrow ({dateRangeBreakdown.tomorrow})</option>
              <option value="next_7_days">Next 7 Days ({dateRangeBreakdown.next_7_days})</option>
              <option value="next_30_days">Next 30 Days ({dateRangeBreakdown.next_30_days})</option>
              <option value="past">Past Events ({dateRangeBreakdown.past})</option>
              <option value="future">Future Events ({dateRangeBreakdown.future})</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Type
            </label>
            <select
              value={filters.sourceType || "all"}
              onChange={(e) => handleFilterChange("sourceType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Orders ({orderTypeCounts.total})</option>
              <option value="menu">
                Menu Orders ({orderTypeCounts.regular})
              </option>
              <option value="customOrder">
                Custom Orders ({orderTypeCounts.custom})
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Status ({statusBreakdown.all})</option>
              <option value="pending">
                Pending ({statusBreakdown.pending})
              </option>
              <option value="confirmed">
                Confirmed ({statusBreakdown.confirmed})
              </option>
              <option value="preparing">
                Preparing ({statusBreakdown.preparing})
              </option>
              <option value="ready">Ready ({statusBreakdown.ready})</option>
              <option value="completed">
                Completed ({statusBreakdown.completed})
              </option>
              <option value="cancelled">
                Cancelled ({statusBreakdown.cancelled})
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Type
            </label>
            <select
              value={filters.deliveryType}
              onChange={(e) =>
                handleFilterChange("deliveryType", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">
                All Types ({deliveryTypeBreakdown.all})
              </option>
              <option value="Pickup">
                Pickup ({deliveryTypeBreakdown.Pickup})
              </option>
              <option value="Delivery">
                Delivery ({deliveryTypeBreakdown.Delivery})
              </option>
              <option value="Event">
                Event ({deliveryTypeBreakdown.Event})
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort Order
            </label>
            <select
              value={filters.sortOrder || "priority"}
              onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="priority">Smart Priority (Upcoming First)</option>
              <option value="latest">Latest Bookings First</option>
              <option value="event_date_newest">Newest Events First</option>
              <option value="event_date_oldest">Oldest Events First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-blue-800">
              Active Filters:
            </span>

            {filters.dateRange && filters.dateRange !== "today" && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs border border-blue-200 flex items-center gap-1">
                Date: {filters.dateRange.replace("_", " ")}
                <button
                  onClick={() => handleFilterChange("dateRange", "today")}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.sourceType !== "all" && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs border border-blue-200 flex items-center gap-1">
                Type: {filters.sourceType === "customOrder" ? "Custom" : "Menu"}
                <button
                  onClick={() => handleFilterChange("sourceType", "all")}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.status !== "all" && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs border border-blue-200 flex items-center gap-1">
                Status: {filters.status}
                <button
                  onClick={() => handleFilterChange("status", "all")}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.deliveryType !== "all" && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs border border-blue-200 flex items-center gap-1">
                Service: {filters.deliveryType}
                <button
                  onClick={() => handleFilterChange("deliveryType", "all")}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.search.trim() && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs border border-blue-200 flex items-center gap-1">
                Search: "{filters.search}"
                <button
                  onClick={() => handleFilterChange("search", "")}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingFilters;