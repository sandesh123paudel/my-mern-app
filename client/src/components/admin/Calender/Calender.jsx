import React from "react";

const Calender = () => {
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

export default Calender;
