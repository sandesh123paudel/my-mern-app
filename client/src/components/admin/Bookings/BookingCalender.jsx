import React from "react";

const BookingCalendar = ({
  currentDate,
  calendarBookings,
  onDayClick,
  onMonthNavigate,
  formatPrice,
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
  startDate.setDate(startDate.getDate() - monthStart.getDay()); // Start from Sunday

  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay())); // End on Saturday

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

  const getDayBookings = (date) => {
    return calendarBookings[date.toDateString()] || [];
  };

  const getDaySummary = (bookings) => {
    if (bookings.length === 0) return null;

    const totalPeople = bookings.reduce(
      (sum, booking) => sum + (booking.peopleCount || 0),
      0
    );
    const totalRevenue = bookings.reduce(
      (sum, booking) => sum + (booking.pricing?.total || 0),
      0
    );

    // Get unique menu items
    const menuItems = {};
    bookings.forEach((booking) => {
      if (booking.selectedItems) {
        booking.selectedItems.forEach((item) => {
          if (menuItems[item.name]) {
            menuItems[item.name]++;
          } else {
            menuItems[item.name] = 1;
          }
        });
      }
    });

    return {
      totalPeople,
      totalRevenue,
      totalBookings: bookings.length,
      menuItems: Object.entries(menuItems).slice(0, 2), // Show top 2 items
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 border-amber-300";
      case "confirmed":
        return "bg-green-100 border-green-300";
      case "preparing":
        return "bg-blue-100 border-blue-300";
      case "ready":
        return "bg-purple-100 border-purple-300";
      case "completed":
        return "bg-emerald-100 border-emerald-300";
      case "cancelled":
        return "bg-red-100 border-red-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  return (
    <div className="p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onMonthNavigate(-1)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Previous Month"
          >
            ←
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => onMonthNavigate(1)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Next Month"
          >
            →
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-200 rounded border border-amber-300"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-200 rounded border border-green-300"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-emerald-200 rounded border border-emerald-300"></div>
            <span>Completed</span>
          </div>
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

            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                onClick={() => hasBookings && onDayClick(date)}
                className={`
                  min-h-[120px] p-2 border border-gray-200 transition-all duration-200
                  ${!isCurrentMonth ? "bg-gray-50 text-gray-400" : "bg-white"}
                  ${isToday ? "ring-2 ring-blue-500 bg-blue-50" : ""}
                  ${
                    hasBookings
                      ? "cursor-pointer hover:bg-gray-50 hover:shadow-md"
                      : ""
                  }
                `}
              >
                {/* Date Number */}
                <div
                  className={`
                  text-sm font-medium mb-2 flex justify-between items-center
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
                    <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {dayBookings.length}
                    </span>
                  )}
                </div>

                {/* Booking Summary */}
                {daySummary && (
                  <div className="space-y-1">
                    {/* People & Revenue Summary */}
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          👥 {daySummary.totalPeople}
                        </span>
                        <span className="text-green-600 font-medium">
                          {formatPrice(daySummary.totalRevenue)}
                        </span>
                      </div>
                    </div>

                    {/* Top Menu Items */}
                    {daySummary.menuItems.length > 0 && (
                      <div className="text-xs text-gray-600">
                        {daySummary.menuItems.map(([item, count], index) => (
                          <div key={index} className="truncate">
                            🍽️ {item} ({count})
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Status Indicators */}
                    <div className="flex gap-1 mt-2">
                      {dayBookings.slice(0, 3).map((booking, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full border ${getStatusColor(
                            booking.status
                          )}`}
                          title={`${booking.customerDetails?.name} - ${booking.status}`}
                        ></div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayBookings.length - 3}
                        </div>
                      )}
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

      {/* Calendar Legend */}
      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h4 className="font-medium text-amber-800 mb-2">Calendar Guide:</h4>
        <div className="text-sm text-amber-700 space-y-1">
          <p>• Click on any day with bookings to view detailed information</p>
          <p>• Numbers show guest count (👥) and total revenue for the day</p>
          <p>
            • Colored dots indicate booking status: Pending (amber), Confirmed
            (green), Completed (emerald)
          </p>
          <p>• Today's date is highlighted with a blue border</p>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
