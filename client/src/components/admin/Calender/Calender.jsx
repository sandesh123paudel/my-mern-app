import React, { useEffect, useState } from "react";
import LocationServiceCalendar from "./LocationServiceCalendar";
import { useNavigate } from "react-router-dom";
import { getLocations } from "../../../services/locationServices";
import { getServices } from "../../../services/serviceServices";
import { getAllBookings } from "../../../services/bookingService";

const Calender = () => {
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [locRes, servRes, bookRes] = await Promise.all([
          getLocations(),
          getServices(),
          getAllBookings({ limit: 1000 }),
        ]);
        setLocations(locRes.data || []);
        setServices(servRes.data || []);
        setBookings(bookRes.data || []);
      } catch (e) {
        // handle error
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Build all location-service pairs
  const pairs = [];
  locations.forEach((loc) => {
    services.forEach((serv) => {
      pairs.push({ location: loc, service: serv });
    });
  });

  // Group bookings by locationId and serviceId
  const getBookingsForPair = (locationId, serviceId) =>
    bookings.filter(
      (b) =>
        (b.menu?.locationId === locationId || b.locationId === locationId) &&
        (b.menu?.serviceId === serviceId || b.serviceId === serviceId)
    );

  const handleDateClick = (date, location, service) => {
    navigate(
      `/admin/bookings?date=${date}&locationId=${location._id}&serviceId=${service._id}`
    );
  };

  if (loading) return <div>Loading calendars...</div>;

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {pairs.map(({ location, service }) => (
        <LocationServiceCalendar
          key={location._id + "-" + service._id}
          location={location}
          service={service}
          bookings={getBookingsForPair(location._id, service._id)}
          onDateClick={(date) => handleDateClick(date, location, service)}
        />
      ))}
    </div>
  );
};

export default Calender;
