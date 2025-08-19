import React, { useState, useEffect } from "react";
import { getLocations } from "../../../services/locationServices";
import { getServicesByLocation } from "../../../services/serviceServices";

const InquiryFilters = ({ filters, onFiltersChange, totalItems, loading }) => {
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);

  // Load locations on component mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Load services when venue filter changes
  useEffect(() => {
    if (filters.venue && filters.venue !== "all") {
      fetchServicesByVenue(filters.venue);
    } else {
      setServices([]);
      // Reset service filter if venue changes to "all"
      if (filters.service !== "all") {
        onFiltersChange({ ...filters, service: "all" });
      }
    }
  }, [filters.venue]);

  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const result = await getLocations();
      if (result.success) {
        setLocations(result.data || []);
      } else {
        console.error("Failed to load locations:", result.error);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchServicesByVenue = async (venueId) => {
    setLoadingServices(true);
    try {
      const result = await getServicesByLocation(venueId);
      if (result.success) {
        setServices(result.data || []);
      } else {
        console.error("Failed to load services:", result.error);
        setServices([]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };

    // Reset service filter if venue changes
    if (key === "venue" && value !== filters.venue) {
      newFilters.service = "all";
    }

    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: "all",
      venue: "all",
      service: "all",
      search: "",
      selectedDate: null,
    });
  };

  const clearDateFilter = () => {
    onFiltersChange({ ...filters, selectedDate: null });
  };

  const hasActiveFilters = () => {
    return (
      filters.selectedDate ||
      filters.status !== "all" ||
      filters.venue !== "all" ||
      filters.service !== "all" ||
      filters.search.trim()
    );
  };

  const getSelectedLocationName = () => {
    if (filters.venue === "all") return null;
    const location = locations.find((l) => l._id === filters.venue);
    return location ? location.name : filters.venue;
  };

  const getSelectedServiceName = () => {
    if (filters.service === "all") return null;
    const service = services.find((s) => s._id === filters.service);
    return service ? service.name : filters.service;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 sticky top-0 z-10">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-2">
            Search
          </label>
          <input
            type="text"
            placeholder="Search by name, email, contact, or message..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="responded">Responded</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Venue Filter */}
          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Venue
            </label>
            <select
              value={filters.venue}
              onChange={(e) => handleFilterChange("venue", e.target.value)}
              disabled={loadingLocations}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
            >
              <option value="all">
                {loadingLocations ? "Loading venues..." : "All Venues"}
              </option>
              {locations.map((location) => (
                <option key={location._id} value={location._id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          {/* Service Filter */}
          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Service
            </label>
            <select
              value={filters.service}
              onChange={(e) => handleFilterChange("service", e.target.value)}
              disabled={loadingServices || filters.venue === "all"}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
            >
              <option value="all">
                {filters.venue === "all"
                  ? "Select venue first"
                  : loadingServices
                  ? "Loading services..."
                  : "All Services"}
              </option>
              {services.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name}
                </option>
              ))}
            </select>
            {filters.venue === "all" && (
              <p className="text-xs text-gray-500 mt-1">
                Please select a venue to see available services
              </p>
            )}
            {filters.venue !== "all" &&
              services.length === 0 &&
              !loadingServices && (
                <p className="text-xs text-orange-500 mt-1">
                  No services available for this venue
                </p>
              )}
          </div>

          {/* Results Info */}
          <div className="flex items-center">
            <div className="text-sm text-gray-600">
              <div className="font-medium">Results</div>
              <div>{totalItems} inquiries</div>
              {loading && <div className="text-green-600">Loading...</div>}
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={clearAllFilters}
              disabled={!hasActiveFilters()}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-600">
              Active filters:
            </span>

            {filters.selectedDate && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1">
                Date: {filters.selectedDate.toLocaleDateString()}
                <button
                  onClick={clearDateFilter}
                  className="ml-1 hover:text-blue-900 font-bold"
                  title="Remove date filter"
                >
                  ×
                </button>
              </span>
            )}

            {filters.status !== "all" && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                Status: {filters.status}
              </span>
            )}

            {filters.venue !== "all" && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                Venue: {getSelectedLocationName()}
              </span>
            )}

            {filters.service !== "all" && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                Service: {getSelectedServiceName()}
              </span>
            )}

            {filters.search && (
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                Search: "{filters.search}"
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InquiryFilters;
