import React, { useState, useEffect } from "react";

const InquiryCalendar = ({ inquiries, onDateSelect, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  const months = [
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

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    generateCalendar();
  }, [currentMonth, inquiries]);

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const inquiriesOnDay = getInquiriesForDate(date);
      days.push({
        day,
        date,
        inquiries: inquiriesOnDay,
        inquiryCount: inquiriesOnDay.length,
      });
    }

    setCalendarDays(days);
  };

  const getInquiriesForDate = (date) => {
    return inquiries.filter((inquiry) => {
      // Use eventDate instead of createdAt
      if (!inquiry.eventDate) return false;
      const eventDate = new Date(inquiry.eventDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date &&
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedDate = (date) => {
    return (
      selectedDate &&
      date &&
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getInquiryCountColor = (count) => {
    if (count === 0) return "";
    if (count <= 2)
      return "bg-green-100 text-green-800 border border-green-200";
    if (count <= 5)
      return "bg-amber-100 text-amber-800 border border-amber-200";
    return "bg-red-100 text-red-800 border border-red-200";
  };

  const getStatusCounts = (inquiries) => {
    const counts = { pending: 0, responded: 0, archived: 0 };
    inquiries.forEach((inquiry) => {
      const status = inquiry.status || "pending";
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-green-800">Event Calendar</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Previous month"
          >
            ←
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
            title="Go to current month"
          >
            Today
          </button>
          <h4 className="text-lg font-medium min-w-[200px] text-center">
            {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h4>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Next month"
          >
            →
          </button>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayInfo, index) => (
          <div
            key={index}
            className={`
              min-h-[80px] p-1 border border-gray-200 rounded cursor-pointer transition-all duration-200
              ${dayInfo ? "hover:bg-gray-50 hover:shadow-sm" : ""}
              ${
                dayInfo && isToday(dayInfo.date)
                  ? "bg-blue-50 border-blue-300"
                  : ""
              }
              ${
                dayInfo && isSelectedDate(dayInfo.date)
                  ? "bg-green-50 border-green-400 shadow-md"
                  : ""
              }
            `}
            onClick={() => dayInfo && onDateSelect(dayInfo.date)}
            title={
              dayInfo
                ? `${
                    dayInfo.inquiryCount
                  } event(s) on ${dayInfo.date.toLocaleDateString()}`
                : ""
            }
          >
            {dayInfo && (
              <div className="h-full flex flex-col">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {dayInfo.day}
                </div>
                {dayInfo.inquiryCount > 0 && (
                  <div className="flex-1 space-y-1">
                    <div
                      className={`
                      text-xs px-1 py-0.5 rounded text-center font-medium
                      ${getInquiryCountColor(dayInfo.inquiryCount)}
                    `}
                    >
                      {dayInfo.inquiryCount} event
                      {dayInfo.inquiryCount !== 1 ? "s" : ""}
                    </div>

                    {/* Status indicators */}
                    {dayInfo.inquiryCount <= 3 && (
                      <div className="space-y-0.5">
                        {(() => {
                          const statusCounts = getStatusCounts(
                            dayInfo.inquiries
                          );
                          return Object.entries(statusCounts)
                            .filter(([_, count]) => count > 0)
                            .map(([status, count]) => (
                              <div
                                key={status}
                                className={`
                                  text-xs px-1 rounded text-center
                                  ${
                                    status === "pending"
                                      ? "bg-amber-200 text-amber-800"
                                      : ""
                                  }
                                  ${
                                    status === "responded"
                                      ? "bg-green-200 text-green-800"
                                      : ""
                                  }
                                  ${
                                    status === "archived"
                                      ? "bg-gray-200 text-gray-800"
                                      : ""
                                  }
                                `}
                                title={`${count} ${status} inquiry${
                                  count !== 1 ? "s" : ""
                                }`}
                              >
                                {count} {status.charAt(0).toUpperCase()}
                              </div>
                            ));
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2">
        <div className="text-xs font-medium text-gray-600 mb-2">Legend:</div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-50 border border-blue-300 rounded"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-50 border border-green-400 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>1-2 events</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded"></div>
            <span>3-5 events</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span>5+ events</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-200 rounded"></div>
            <span>P = Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-200 rounded"></div>
            <span>R = Responded</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span>A = Archived</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryCalendar;
