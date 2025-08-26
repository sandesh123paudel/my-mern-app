import React from "react";
import { Users, DollarSign, MapPin, Briefcase } from "lucide-react";

const BookingCalendar = ({
  currentDate,
  calendarBookings,
  onDayClick,
  onMonthNavigate,
  formatPrice,
  selectedLocation,
  selectedService,
}) => {
  const today = new Date();
  const monthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const monthEnd = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay());

  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));

  const dateRange = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dateRange.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const weeks = [];
  for (let i = 0; i < dateRange.length; i += 7) {
    weeks.push(dateRange.slice(i, i + 7));
  }

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

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // NEW: A map for status colors to keep the UI consistent.
  const statusColors = {
    pending: "text-amber-600",
    confirmed: "text-green-600",
    preparing: "text-blue-600",
    ready: "text-purple-600",
    completed: "text-emerald-600",
    cancelled: "text-red-600",
  };

  const getDayBookings = (date) => {
    return calendarBookings[date.toDateString()] || [];
  };

  const getDaySummary = (bookings) => {
    if (bookings.length === 0) return null;

    const activeBookings = bookings.filter(
      (booking) => booking.status !== "cancelled"
    );

    const totalPeople = activeBookings.reduce(
      (sum, booking) => sum + (booking.peopleCount || 0),
      0
    );
    const totalRevenue = activeBookings.reduce(
      (sum, booking) => sum + (booking.pricing?.total || 0),
      0
    );

    const statusCounts = {
      pending: bookings.filter((b) => b.status === "pending").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      preparing: bookings.filter((b) => b.status === "preparing").length,
      ready: bookings.filter((b) => b.status === "ready").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    };

    return {
      totalPeople,
      totalRevenue,
      totalBookings: bookings.length,
      activeBookings: activeBookings.length,
      statusCounts,
    };
  };

  // REMOVED: The getStatusIndicators function is no longer needed.

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const getMonthOverview = () => {
    const allBookings = Object.values(calendarBookings).flat();
    const activeBookings = allBookings.filter((b) => b.status !== "cancelled");

    const activeDays = Object.keys(calendarBookings).filter(
      (dateString) => calendarBookings[dateString].length > 0
    ).length;

    const totalEvents = allBookings.length;

    const totalGuests = activeBookings.reduce(
      (sum, booking) => sum + (booking.peopleCount || 0),
      0
    );

    return { activeDays, totalEvents, totalGuests };
  };

  const monthOverview = getMonthOverview();

  return (
    <div className="p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onMonthNavigate(-1)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            ←
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
              {selectedLocation && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>Location filtered</span>
                </div>
              )}
              {selectedService && (
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  <span>Service filtered</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => onMonthNavigate(1)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-3 text-center font-semibold text-gray-700 bg-gray-50 border border-gray-200"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {weeks.map((week, weekIndex) =>
          week.map((date, dayIndex) => {
            const dayBookings = getDayBookings(date);
            const daySummary = getDaySummary(dayBookings);
            const isToday = date.toDateString() === today.toDateString();
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const hasBookings = dayBookings.length > 0;
            const isPast = isPastDate(date);

            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                onClick={() => onDayClick(date)}
                className={`
                  min-h-[140px] p-2 border border-gray-200 transition-all duration-200
                  ${!isCurrentMonth ? "bg-gray-50 text-gray-400" : "bg-white"}
                  ${isToday ? "ring-2 ring-blue-500 bg-blue-50" : ""}
                  ${isPast && hasBookings ? "bg-green-50" : ""}
                  ${!isPast && hasBookings ? "bg-yellow-50" : ""}
                  ${
                    isCurrentMonth
                      ? "cursor-pointer hover:bg-gray-50 hover:shadow-md"
                      : ""
                  }
                `}
              >
                {/* Date Number with Status Count */}
                <div
                  className={`
                  text-sm font-medium mb-2 flex justify-between items-start
                  ${
                    isToday
                      ? "text-blue-700"
                      : isCurrentMonth
                      ? "text-gray-900"
                      : "text-gray-400"
                  }
                `}
                >
                  <span>{date.getDate()}</span>
                  {hasBookings && (
                    <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {dayBookings.length}
                    </span>
                  )}
                </div>

                {/* Status Indicators and Summary */}
                {daySummary && (
                  <div className="space-y-2">
                    {/* UPDATED: Display status text instead of emojis */}
                    <div className="text-xs space-y-1">
                      {Object.entries(daySummary.statusCounts).map(
                        ([status, count]) =>
                          count > 0 ? (
                            <div
                              key={status}
                              className={`flex justify-between items-center font-medium ${
                                statusColors[status] || "text-gray-500"
                              }`}
                            >
                              <span>
                                {status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                              </span>
                              <span>{count}</span>
                            </div>
                          ) : null
                      )}
                    </div>

                    {/* People & Revenue Summary */}
                    <div className="text-xs space-y-1 pt-1 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1 text-gray-700">
                          <Users className="w-3 h-3" />
                          <span>{daySummary.totalPeople} Guests</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-700 font-medium">
                          <DollarSign className="w-3 h-3" />
                          <span>{formatPrice(daySummary.totalRevenue)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* No Bookings State */}
                {!hasBookings && isCurrentMonth && (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-gray-300 text-xs">No events</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Month Summary */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-3">
          Month Overview - {monthNames[currentDate.getMonth()]}{" "}
          {currentDate.getFullYear()}
        </h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-800 text-lg">
              {monthOverview.activeDays}
            </div>
            <div className="text-gray-600">Active Days</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-800 text-lg">
              {monthOverview.totalEvents}
            </div>
            <div className="text-gray-600">Total Events</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-800 text-lg">
              {monthOverview.totalGuests}
            </div>
            <div className="text-gray-600">Total Guests</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
