import React, { useState } from "react";
import {
  MapPin,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const LocationServiceCalendar = ({
  location,
  service,
  bookings,
  onHeaderClick,
}) => {
  // Individual calendar month state
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay();

  // Get current date for highlighting
  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  const isCurrentMonth = year === todayYear && month === todayMonth;

  // Month navigation functions
  const navigateToPrevMonth = (e) => {
    e.stopPropagation(); // Prevent header click
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const navigateToNextMonth = (e) => {
    e.stopPropagation(); // Prevent header click
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const navigateToCurrentMonth = (e) => {
    e.stopPropagation(); // Prevent header click
    setCurrentDate(new Date());
  };

  // Month names
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Map bookings to date counts for current month
  const bookingCounts = {};
  const bookingDetails = {};

  bookings.forEach((booking, index) => {
    if (!booking.deliveryDate) return;

    const deliveryDate = new Date(booking.deliveryDate);
    if (isNaN(deliveryDate.getTime())) return;

    const bookingYear = deliveryDate.getFullYear();
    const bookingMonth = deliveryDate.getMonth();
    const bookingDay = deliveryDate.getDate();

    if (bookingYear === year && bookingMonth === month) {
      bookingCounts[bookingDay] = (bookingCounts[bookingDay] || 0) + 1;

      if (!bookingDetails[bookingDay]) {
        bookingDetails[bookingDay] = [];
      }
      bookingDetails[bookingDay].push({
        reference: booking.bookingReference,
        customer: booking.customerDetails?.name,
        people: booking.peopleCount,
        status: booking.status,
        type: booking.deliveryType,
      });
    }
  });

  // Build calendar grid
  const weeks = [];
  let days = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
    if (days.length === 7) {
      weeks.push([...days]);
      days = [];
    }
  }

  // Add empty cells for remaining days
  while (days.length > 0 && days.length < 7) {
    days.push(null);
  }
  if (days.length > 0) {
    weeks.push([...days]);
  }

  // Calculate total bookings for this location-service combination
  const totalBookings = bookings.length;

  // Get bookings count for current month
  const currentMonthBookings = Object.values(bookingCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Enhanced Clickable Header */}
      <div
        className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-300"
        onClick={onHeaderClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {/* Location with highlight */}
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <h3
                className="font-bold text-gray-900 text-sm bg-purple-100 px-2 py-1 rounded-md truncate"
                title={location.name}
              >
                {location.name}
              </h3>
            </div>

            {/* Service with highlight */}
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-3 h-3 text-orange-600 flex-shrink-0" />
              <span
                className={`text-xs text-gray-800 ${
                  service.name == "Function" ? "bg-orange-200" : "bg-orange-400"
                } px-2 py-1 rounded-md font-medium`}
                title={service.name}
              >
                {service.name}
              </span>
            </div>
          </div>

          {/* Booking stats */}
          <div className="text-right ml-3">
            <div className="text-xs text-gray-500 mb-1">Total Bookings</div>
            <div className="font-bold text-2xl text-blue-600 mb-1">
              {totalBookings}
            </div>
            <div className="text-xs text-purple-600 font-medium">
              {currentMonthBookings} this month
            </div>
          </div>
        </div>

        {/* Month navigation header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">
              {monthNames[month]} {year}
            </span>
          </div>

          {/* Month navigation controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={navigateToPrevMonth}
              className="p-1 rounded-md hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={navigateToCurrentMonth}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              title="Go to current month"
            >
              Today
            </button>

            <button
              onClick={navigateToNextMonth}
              className="p-1 rounded-md hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-xs text-blue-600 mt-2 font-medium">
          📊 Click to view all bookings →
        </div>
      </div>

      {/* Enhanced Calendar Grid */}
      <div className="p-4">
        <table className="w-full text-center">
          <thead>
            <tr className="text-gray-500 text-xs font-semibold">
              <th className="pb-3 font-semibold w-9">Su</th>
              <th className="pb-3 font-semibold w-9">Mo</th>
              <th className="pb-3 font-semibold w-9">Tu</th>
              <th className="pb-3 font-semibold w-9">We</th>
              <th className="pb-3 font-semibold w-9">Th</th>
              <th className="pb-3 font-semibold w-9">Fr</th>
              <th className="pb-3 font-semibold w-9">Sa</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, weekIndex) => (
              <tr key={weekIndex}>
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return <td key={dayIndex} className="p-1 h-9"></td>;
                  }

                  const count = bookingCounts[day] || 0;
                  const isToday = isCurrentMonth && day === todayDate;
                  const isPastDate =
                    new Date(year, month, day) <
                    new Date(todayYear, todayMonth, todayDate);

                  const hasBookings = count > 0;
                  const dayBookings = bookingDetails[day] || [];

                  // Enhanced tooltip content
                  const tooltipContent = isToday
                    ? `TODAY - ${monthNames[month]} ${day}, ${year}${
                        count > 0 ? ` • ${count} booking(s)` : " • No bookings"
                      }`
                    : count > 0
                    ? `${
                        monthNames[month]
                      } ${day}, ${year} • ${count} booking(s)\n${dayBookings
                        .map(
                          (b) =>
                            `• ${b.reference}: ${b.customer} (${b.people} people)`
                        )
                        .join("\n")}`
                    : `${monthNames[month]} ${day}, ${year} • No bookings`;

                  return (
                    <td key={dayIndex} className="p-1">
                      <div
                        className={`
                          relative w-8 h-8 text-xs font-semibold flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-default
                          ${
                            isToday
                              ? "bg-green-500 text-white shadow-md transform rotate-1" // Rectangular today (slight rotation)
                              : hasBookings
                              ? "bg-blue-500 text-white rounded-full shadow-sm hover:bg-blue-600"
                              : "text-gray-700 hover:bg-gray-100 rounded-sm"
                          }
                                    ${
                                      isPastDate ? "opacity-20" : ""
                                    }  // <— dim past dates

                        `}
                        title={tooltipContent}
                        style={
                          isToday
                            ? {
                                borderRadius: "4px",
                                transform: "rotate(2deg) scale(1.05)",
                              }
                            : {}
                        }
                      >
                        {day}

                        {/* Count badge for multiple bookings */}
                        {count > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold border border-white shadow-sm">
                            {count}
                          </div>
                        )}

                        {/* Today indicator */}
                        {isToday && (
                          <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-300 rounded-full"></div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enhanced Footer */}
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <div className="text-gray-600">
            <div className="font-medium">
              {location.city}
              {location.state && `, ${location.state}`}
            </div>
          </div>
          <div className="text-right">
            {totalBookings > 0 ? (
              <div className="text-green-600 font-medium">
                ✓ Active Location
              </div>
            ) : (
              <div className="text-gray-400">No bookings</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationServiceCalendar;
