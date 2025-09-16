// Calender.js - Enhanced Calendar Component with Sorting and Features
import React, { useEffect, useState } from "react";
import LocationServiceCalendar from "./LocationServiceCalendar";
import { useNavigate } from "react-router-dom";
import { getLocations } from "../../../services/locationServices";
import { getServices } from "../../../services/serviceServices";
import { getAllBookings } from "../../../services/bookingService";
import { InlineLoading } from "../../Loading";

const Calender = () => {
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [locRes, servRes, bookRes] = await Promise.all([
          getLocations(),
          getServices(),
          getAllBookings({ limit: 1000 }),
        ]);

        // Only include active locations and services
        const activeLocations = (locRes.data || []).filter(
          (loc) => loc.isActive !== false
        );
        const activeServices = (servRes.data || []).filter(
          (serv) => serv.isActive !== false
        );

        setLocations(activeLocations);
        setServices(activeServices);
        setBookings(bookRes.data || []);
      } catch (e) {
        console.error("Error fetching calendar data:", e);
        setError("Failed to load calendar data");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Build location-service pairs - create all combinations
  const buildLocationServicePairs = () => {
    const pairs = [];
    locations.forEach((location) => {
      const locationServices = services.filter((service) => {
        if (service.locationId) {
          return (
            service.locationId === location._id ||
            service.locationId?._id === location._id
          );
        }
        return true;
      });

      const servicesToPair =
        locationServices.length > 0 ? locationServices : services;

      servicesToPair.forEach((service) => {
        pairs.push({ location, service });
      });
    });
    return pairs;
  };

  // Group bookings by locationId and serviceId - FIXED DATA TYPE COMPARISON
  const getBookingsForPair = (locationId, serviceId) => {
    const filtered = bookings.filter((booking) => {
      const bookingLocationRaw =
        booking.orderSource?.locationId ||
        booking.menu?.locationId ||
        booking.locationId;
      const bookingServiceRaw =
        booking.orderSource?.serviceId ||
        booking.menu?.serviceId ||
        booking.serviceId;

      const bookingLocationId =
        typeof bookingLocationRaw === "object"
          ? bookingLocationRaw._id || bookingLocationRaw.toString()
          : bookingLocationRaw;

      const bookingServiceId =
        typeof bookingServiceRaw === "object"
          ? bookingServiceRaw._id || bookingServiceRaw.toString()
          : bookingServiceRaw;

      return bookingLocationId === locationId && bookingServiceId === serviceId;
    });

    return filtered;
  };

  // Build pairs with booking counts and sort by booking count (highest first)
  const pairsWithBookings = buildLocationServicePairs()
    .map((pair) => ({
      ...pair,
      bookings: getBookingsForPair(pair.location._id, pair.service._id),
      bookingCount: getBookingsForPair(pair.location._id, pair.service._id)
        .length,
    }))
    .sort((a, b) => b.bookingCount - a.bookingCount); // Sort by booking count descending

  const handleLocationServiceClick = (location, service) => {
    const url = `/admin/bookings?locationId=${location._id}&serviceId=${service._id}`;
    navigate(url);
  };

  if (loading) {
    return <InlineLoading message="Loading calendar data..." size="large" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-red-600 mb-2">Error: {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (pairsWithBookings.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-gray-600">
          <div className="text-lg mb-2">
            No Active Location-Service Combinations
          </div>
          <div className="text-sm">
            Locations: {locations.length}, Services: {services.length}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-3">Summary Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {pairsWithBookings.length}
            </div>
            <div className="text-sm text-gray-600">Active Combinations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {bookings.length}
            </div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {pairsWithBookings.filter((p) => p.bookingCount > 0).length}
            </div>
            <div className="text-sm text-gray-600">With Bookings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.max(...pairsWithBookings.map((p) => p.bookingCount), 0)}
            </div>
            <div className="text-sm text-gray-600">Highest Count</div>
          </div>
        </div>
      </div>
      {/* Calendar Grid - Sorted by booking count */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {pairsWithBookings.map(
          ({ location, service, bookings, bookingCount }, index) => (
            <div key={`${location._id}-${service._id}`} className="relative">
              <LocationServiceCalendar
                location={location}
                service={service}
                bookings={bookings}
                onHeaderClick={() =>
                  handleLocationServiceClick(location, service)
                }
              />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Calender;
