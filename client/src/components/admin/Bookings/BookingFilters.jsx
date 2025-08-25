import React, { useState, useMemo } from "react";
import { MapPin, Briefcase, Filter, X } from "lucide-react";

const BookingFilters = ({
  filters,
  onFilterChange,
  allBookings,
  totalCount,
  selectedLocation,
  selectedService,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate order type counts based on filtered bookings
  const orderTypeCounts = useMemo(() => {
    const total = allBookings.length;
    const custom = allBookings.filter(
      (booking) => booking.isCustomOrder || booking.orderSource?.sourceType === "customOrder"
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

    allBookings.forEach(booking => {
      const status = booking.status || 'pending';
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
    };

    allBookings.forEach(booking => {
      const deliveryType = booking.deliveryType;
      if (breakdown.hasOwnProperty(deliveryType)) {
        breakdown[deliveryType]++;
      }
    });

    return breakdown;
  }, [allBookings]);

  // Calculate revenue breakdown (excluding cancelled)
  const revenueBreakdown = useMemo(() => {
    const activeBookings = allBookings.filter(b => b.status !== 'cancelled');
    const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.pricing?.total || 0), 0);
    
    const customRevenue = activeBookings
      .filter(b => b.isCustomOrder || b.orderSource?.sourceType === "customOrder")
      .reduce((sum, b) => sum + (b.pricing?.total || 0), 0);
    
    const regularRevenue = totalRevenue - customRevenue;

    return { totalRevenue, customRevenue, regularRevenue };
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
      sortBy: "deliveryDate",
      sortOrder: "asc",
    });
  };

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.deliveryType !== "all" ||
    filters.sourceType !== "all" ||
    filters.search.trim() !== "";

  // Get context info for display
  const getLocationName = () => {
    // This would need to be passed from parent or stored in context
    return selectedLocation ? "Selected Location" : "All Locations";
  };

  const getServiceName = () => {
    return selectedService ? "Selected Service" : "All Services";
  };

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
                Regular: {orderTypeCounts.regular}
              </span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                Custom: {orderTypeCounts.custom}
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                Revenue: {formatPrice(revenueBreakdown.totalRevenue)}
              </span>
            </div>
            
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-800 underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear all filters
              </button>
            )}
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            {isExpanded ? "Hide Filters" : "Show All Filters"}
            <span
              className={`transform transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </button>
        </div>

        {/* Location/Service Context Display */}
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 font-medium">
                Location: {getLocationName()}
              </span>
            </div>
            {selectedService && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  Service: {getServiceName()}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-blue-600 mt-1">
            All data below is filtered by your location/service selection
          </p>
        </div>
      </div>

      {/* Quick Filters (Always Visible) */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Search
            </label>
            <input
              type="text"
              placeholder="Search by name, email, phone, reference..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
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
                Regular Orders ({orderTypeCounts.regular})
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
              <option value="pending">Pending ({statusBreakdown.pending})</option>
              <option value="confirmed">Confirmed ({statusBreakdown.confirmed})</option>
              <option value="preparing">Preparing ({statusBreakdown.preparing})</option>
              <option value="ready">Ready ({statusBreakdown.ready})</option>
              <option value="completed">Completed ({statusBreakdown.completed})</option>
              <option value="cancelled">Cancelled ({statusBreakdown.cancelled})</option>
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
              <option value="all">All Types ({deliveryTypeBreakdown.all})</option>
              <option value="Pickup">Pickup ({deliveryTypeBreakdown.Pickup})</option>
              <option value="Delivery">Delivery ({deliveryTypeBreakdown.Delivery})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Advanced Filters (Expandable) */}
      {isExpanded && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Advanced Filters & Analytics
          </h4>
          
          {/* Sorting Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="deliveryDate">Event Date</option>
                <option value="orderDate">Order Date</option>
                <option value="customerDetails.name">Customer Name</option>
                <option value="pricing.total">Amount</option>
                <option value="peopleCount">Guest Count</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) =>
                  handleFilterChange("sortOrder", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  handleFilterChange("sortBy", "deliveryDate");
                  handleFilterChange("sortOrder", "asc");
                }}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Reset Sort
              </button>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Analytics */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                📊 Status Breakdown
              </h5>
              <div className="space-y-2 text-sm">
                {Object.entries(statusBreakdown)
                  .filter(([status]) => status !== 'all' && statusBreakdown[status] > 0)
                  .map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="capitalize">{status}:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{count}</span>
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(count / statusBreakdown.all) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Revenue Analytics */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                💰 Revenue Breakdown
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Revenue:</span>
                  <span className="font-bold text-green-600">
                    {formatPrice(revenueBreakdown.totalRevenue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Regular Orders:</span>
                  <span className="font-medium text-blue-600">
                    {formatPrice(revenueBreakdown.regularRevenue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Custom Orders:</span>
                  <span className="font-medium text-purple-600">
                    {formatPrice(revenueBreakdown.customRevenue)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                  *Excludes cancelled bookings
                </div>
              </div>
            </div>

            {/* Order Type Analytics */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                📋 Order Types
              </h5>
              <div className="space-y-3 text-sm">
                {/* Regular Orders */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Regular Orders:</span>
                    <span className="font-medium">{orderTypeCounts.regular}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(orderTypeCounts.regular / orderTypeCounts.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {((orderTypeCounts.regular / orderTypeCounts.total) * 100).toFixed(1)}%
                  </div>
                </div>

                {/* Custom Orders */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Custom Orders:</span>
                    <span className="font-medium">{orderTypeCounts.custom}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${(orderTypeCounts.custom / orderTypeCounts.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {((orderTypeCounts.custom / orderTypeCounts.total) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-blue-800">
              Active Filters:
            </span>

            {filters.sourceType !== "all" && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs border border-blue-200 flex items-center gap-1">
                Type: {filters.sourceType === "customOrder" ? "Custom" : "Regular"}
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