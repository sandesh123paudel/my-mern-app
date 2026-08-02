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

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-4 h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="text-sm sm:text-base font-semibold text-green-800">
          Event Calendar
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            title="Previous month"
          >
            ←
          </button>
          <button
            onClick={goToToday}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
            title="Go to current month"
          >
            Today
          </button>
          <h4 className="text-xs sm:text-sm font-medium min-w-[90px] sm:min-w-[110px] text-center">
            {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h4>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            title="Next month"
          >
            →
          </button>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="p-1 text-center text-[10px] sm:text-xs font-medium text-gray-600 bg-gray-50 rounded"
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
              min-h-[42px] sm:min-h-[52px] p-1 border border-gray-200 rounded cursor-pointer transition-all duration-200
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
                <div className="text-[11px] sm:text-xs font-medium text-gray-900">
                  {dayInfo.day}
                </div>
                {dayInfo.inquiryCount > 0 && (
                  <div
                    className={`
                      mt-auto text-[9px] sm:text-[10px] px-1 py-0.5 rounded text-center font-medium leading-tight
                      ${getInquiryCountColor(dayInfo.inquiryCount)}
                    `}
                  >
                    {dayInfo.inquiryCount}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 bg-blue-50 border border-blue-300 rounded"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 bg-green-50 border border-green-400 rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 bg-green-100 border border-green-200 rounded"></div>
          <span>1-2</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 bg-amber-100 border border-amber-200 rounded"></div>
          <span>3-5</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 bg-red-100 border border-red-200 rounded"></div>
          <span>5+</span>
        </div>
      </div>
    </div>
  );
};

export default InquiryCalendar;
