import React, { useState, useMemo } from "react";

const BookingFilters = ({
  filters,
  onFilterChange,
  allBookings,
  totalCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get unique locations from all bookings
  const uniqueLocations = useMemo(() => {
    const locationMap = new Map();
    allBookings.forEach((booking) => {
      if (booking.menu?.locationId && booking.menu?.locationName) {
        locationMap.set(booking.menu.locationId, {
          id: booking.menu.locationId,
          name: booking.menu.locationName,
        });
      }
    });
    return Array.from(locationMap.values());
  }, [allBookings]);

  // Get unique services from all bookings (based on menu name patterns or serviceId if available)
  const uniqueServices = useMemo(() => {
    const serviceMap = new Map();
    allBookings.forEach((booking) => {
      if (booking.menu?.name) {
        // Extract service type from menu name or use serviceId if available
        let serviceName = "Unknown Service";
        let serviceId =
          booking.menu.serviceId || booking.menu.name.toLowerCase();

        // Try to determine service type from menu name
        const menuName = booking.menu.name.toLowerCase();
        if (
          menuName.includes("catering") ||
          menuName.includes("corporate") ||
          menuName.includes("lunch")
        ) {
          serviceName = "Catering Service";
          serviceId = "catering";
        } else if (
          menuName.includes("function") ||
          menuName.includes("event") ||
          menuName.includes("party")
        ) {
          serviceName = "Function Service";
          serviceId = "function";
        } else if (menuName.includes("wedding")) {
          serviceName = "Wedding Service";
          serviceId = "wedding";
        } else {
          // Use the actual menu name as service
          serviceName = booking.menu.name;
          serviceId = booking.menu.serviceId || booking.menu.name;
        }

        serviceMap.set(serviceId, {
          id: serviceId,
          name: serviceName,
        });
      }
    });
    return Array.from(serviceMap.values());
  }, [allBookings]);

  // Debug logging
  console.log("Available locations:", uniqueLocations);
  console.log("Available services:", uniqueServices);
  console.log("Current filters:", filters);

  const handleFilterChange = (key, value) => {
    console.log(`Filter changed: ${key} = ${value}`);
    onFilterChange({ [key]: value });
  };

  const clearAllFilters = () => {
    onFilterChange({
      status: "all",
      deliveryType: "all",
      locationId: "all",
      serviceId: "all",
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <option value="all">All Services</option>
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
              onChange={(e) => {
                console.log("Location filter changed to:", e.target.value);
                handleFilterChange("locationId", e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="all">
                All Locations ({allBookings.length} total)
              </option>
              {uniqueLocations.map((location) => {
                const bookingCount = allBookings.filter(
                  (b) => b.menu?.locationId === location.id
                ).length;
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
            {uniqueLocations.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {uniqueLocations.length} location(s) available
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Category
            </label>
            <select
              value={filters.serviceId}
              onChange={(e) => {
                console.log("Service filter changed to:", e.target.value);
                handleFilterChange("serviceId", e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="all">
                All Services ({allBookings.length} total)
              </option>
              {uniqueServices.map((service) => {
                const bookingCount = allBookings.filter((b) => {
                  const menuName = b.menu?.name?.toLowerCase() || "";
                  if (service.id === "catering") {
                    return (
                      menuName.includes("catering") ||
                      menuName.includes("corporate") ||
                      menuName.includes("lunch")
                    );
                  } else if (service.id === "function") {
                    return (
                      menuName.includes("function") ||
                      menuName.includes("event") ||
                      menuName.includes("party")
                    );
                  } else if (service.id === "wedding") {
                    return menuName.includes("wedding");
                  } else {
                    return (
                      b.menu?.serviceId === service.id ||
                      b.menu?.name === service.name
                    );
                  }
                }).length;
                return (
                  <option key={service.id} value={service.id}>
                    {service.name} ({bookingCount} bookings)
                  </option>
                );
              })}
              {uniqueServices.length === 0 && (
                <option disabled>No services available</option>
              )}
            </select>
            {uniqueServices.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {uniqueServices.length} service(s) available
              </p>
            )}
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
                  // Reset to default sorting
                  onFilterChange({
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

            {filters.serviceId !== "all" && (
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
