import React, { useState, useMemo } from "react";

const BookingFilters = ({
  filters,
  onFilterChange,
  allBookings,
  totalCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper function to safely extract ID as string
  const extractId = (id) => {
    if (!id) return null;
    if (typeof id === "string") return id;
    if (typeof id === "object" && id._id) return id._id.toString();
    if (typeof id === "object" && id.toString) return id.toString();
    return String(id);
  };

  // Get unique locations with proper ID extraction
  const uniqueLocations = useMemo(() => {
    const locationMap = new Map();
    allBookings.forEach((booking) => {
      if (booking.menu?.locationId && booking.menu?.locationName) {
        const locationId = extractId(booking.menu.locationId);
        const locationName = booking.menu.locationName.trim();

        if (locationId && !locationMap.has(locationId)) {
          locationMap.set(locationId, {
            id: locationId,
            name: locationName,
          });
        }
      }
    });

    // Convert to array and sort by name
    return Array.from(locationMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [allBookings]);

  // Get unique services with proper ID extraction
  const uniqueServices = useMemo(() => {
    const serviceMap = new Map();
    allBookings
      .filter((booking) => !booking.isCustomOrder)
      .forEach((booking) => {
        if (booking.menu?.serviceId && booking.menu?.serviceName) {
          const serviceId = extractId(booking.menu.serviceId);
          const serviceName = booking.menu.serviceName.trim();
          const locationId = extractId(booking.menu.locationId);

          if (serviceId && !serviceMap.has(serviceId)) {
            serviceMap.set(serviceId, {
              id: serviceId,
              name: serviceName,
              locationId: locationId,
            });
          }
        }
      });

    return Array.from(serviceMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [allBookings]);

  // Get services for selected location
  const servicesForLocation = useMemo(() => {
    if (filters.locationId === "all") {
      return uniqueServices;
    }

    return uniqueServices.filter(
      (service) => service.locationId === filters.locationId
    );
  }, [uniqueServices, filters.locationId]);

  // Calculate order type counts
  const orderTypeCounts = useMemo(() => {
    const total = allBookings.length;
    const custom = allBookings.filter(
      (booking) => booking.isCustomOrder
    ).length;
    const regular = total - custom;

    return { total, custom, regular };
  }, [allBookings]);

  // Calculate booking counts for each location with proper ID extraction
  const locationBookingCounts = useMemo(() => {
    const counts = {};
    allBookings.forEach((booking) => {
      const locationId = extractId(booking.menu?.locationId);
      if (locationId) {
        counts[locationId] = (counts[locationId] || 0) + 1;
      }
    });
    return counts;
  }, [allBookings]);

  // Calculate booking counts for each service with proper ID extraction
  const serviceBookingCounts = useMemo(() => {
    const counts = {};
    const filteredBookings = allBookings.filter((booking) => {
      const locationId = extractId(booking.menu?.locationId);
      const locationMatch =
        filters.locationId === "all" || locationId === filters.locationId;
      const notCustom = !booking.isCustomOrder;
      return locationMatch && notCustom;
    });

    filteredBookings.forEach((booking) => {
      const serviceId = extractId(booking.menu?.serviceId);
      if (serviceId) {
        counts[serviceId] = (counts[serviceId] || 0) + 1;
      }
    });

    return counts;
  }, [allBookings, filters.locationId]);

  const handleFilterChange = (key, value) => {
    if (key === "locationId") {
      onFilterChange({ ...filters, [key]: value, serviceId: "all" });
    } else if (key === "orderType" && value === "custom") {
      onFilterChange({ ...filters, [key]: value, serviceId: "all" });
    } else {
      onFilterChange({ ...filters, [key]: value });
    }
  };

  const clearAllFilters = () => {
    onFilterChange({
      status: "all",
      deliveryType: "all",
      locationId: "all",
      serviceId: "all",
      orderType: "all",
      search: "",
      sortBy: "deliveryDate",
      sortOrder: "asc",
    });
  };

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.deliveryType !== "all" ||
    filters.locationId !== "all" ||
    filters.serviceId !== "all" ||
    filters.orderType !== "all" ||
    filters.search.trim() !== "";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Filter Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800">
              🔍 Filter Bookings
            </h3>
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
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
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
      </div>

      {/* Quick Filters (Always Visible) */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Search
            </label>
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Type
            </label>
            <select
              value={filters.orderType || "all"}
              onChange={(e) => handleFilterChange("orderType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="all">All Orders ({orderTypeCounts.total})</option>
              <option value="regular">
                Regular Orders ({orderTypeCounts.regular})
              </option>
              <option value="custom">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Type
            </label>
            <select
              value={filters.deliveryType}
              onChange={(e) =>
                handleFilterChange("deliveryType", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="all">All Types</option>
              <option value="Pickup">Pickup</option>
              <option value="Delivery">Delivery</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <select
              value={filters.locationId}
              onChange={(e) => handleFilterChange("locationId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="all">All Locations</option>
              {uniqueLocations.map((location) => {
                const bookingCount = locationBookingCounts[location.id] || 0;
                return (
                  <option key={location.id} value={location.id}>
                    {location.name} ({bookingCount} bookings)
                  </option>
                );
              })}
              {uniqueLocations.length === 0 && (
                <option disabled>No locations available</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Category
              {filters.locationId !== "all" && (
                <span className="text-xs text-blue-600 ml-2">
                  (for{" "}
                  {uniqueLocations.find((l) => l.id === filters.locationId)
                    ?.name || "selected location"}
                  )
                </span>
              )}
            </label>
            <select
              value={filters.serviceId}
              onChange={(e) => handleFilterChange("serviceId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              disabled={
                filters.orderType === "custom" || filters.locationId === "all"
              }
            >
              {filters.orderType === "custom" ? (
                <option value="all">N/A for Custom Orders</option>
              ) : filters.locationId === "all" ? (
                <option value="all">Please select a location first</option>
              ) : (
                <>
                  <option value="all">All Services</option>
                  {servicesForLocation.map((service) => {
                    const bookingCount = serviceBookingCounts[service.id] || 0;
                    return (
                      <option key={service.id} value={service.id}>
                        {service.name} ({bookingCount} bookings)
                      </option>
                    );
                  })}
                  {servicesForLocation.length === 0 && (
                    <option disabled>
                      No services available for this location
                    </option>
                  )}
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Advanced Filters (Expandable) */}
      {isExpanded && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Advanced Filters
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  onFilterChange({
                    ...filters,
                    sortBy: "deliveryDate",
                    sortOrder: "asc",
                  });
                }}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Reset Sort
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Summary */}
      {hasActiveFilters && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-blue-800">
              Active Filters:
            </span>

            {filters.orderType !== "all" && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs border border-blue-200">
                Type: {filters.orderType}
                <button
                  onClick={() => handleFilterChange("orderType", "all")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}

            {filters.status !== "all" && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs border border-blue-200">
                Status: {filters.status}
                <button
                  onClick={() => handleFilterChange("status", "all")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}

            {filters.deliveryType !== "all" && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs border border-blue-200">
                Service: {filters.deliveryType}
                <button
                  onClick={() => handleFilterChange("deliveryType", "all")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}

            {filters.locationId !== "all" && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs border border-blue-200">
                Location:{" "}
                {uniqueLocations.find((l) => l.id === filters.locationId)
                  ?.name || "Unknown Location"}
                <button
                  onClick={() => handleFilterChange("locationId", "all")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}

            {filters.serviceId !== "all" && filters.orderType !== "custom" && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs border border-blue-200">
                Service:{" "}
                {uniqueServices.find((s) => s.id === filters.serviceId)?.name ||
                  "Unknown Service"}
                <button
                  onClick={() => handleFilterChange("serviceId", "all")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}

            {filters.search.trim() && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs border border-blue-200">
                Search: "{filters.search}"
                <button
                  onClick={() => handleFilterChange("search", "")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
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
