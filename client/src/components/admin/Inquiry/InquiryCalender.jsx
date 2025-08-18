import React, { useState, useEffect } from 'react';

const InquiryCalendar = ({ inquiries, onDateSelect, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
        inquiryCount: inquiriesOnDay.length
      });
    }

    setCalendarDays(days);
  };

  const getInquiriesForDate = (date) => {
    return inquiries.filter(inquiry => {
      if (!inquiry.createdAt) return false;
      const inquiryDate = new Date(inquiry.createdAt);
      return (
        inquiryDate.getDate() === date.getDate() &&
        inquiryDate.getMonth() === date.getMonth() &&
        inquiryDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
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
    if (count === 0) return '';
    if (count <= 2) return 'bg-green-100 text-green-800';
    if (count <= 5) return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-green-800">
          Inquiry Calendar
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <h4 className="text-lg font-medium min-w-[200px] text-center">
            {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h4>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {daysOfWeek.map(day => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayInfo, index) => (
          <div
            key={index}
            className={`
              min-h-[60px] p-1 border border-gray-200 rounded cursor-pointer transition-colors
              ${dayInfo ? 'hover:bg-gray-50' : ''}
              ${dayInfo && isToday(dayInfo.date) ? 'bg-blue-50 border-blue-300' : ''}
              ${dayInfo && isSelectedDate(dayInfo.date) ? 'bg-green-50 border-green-400' : ''}
            `}
            onClick={() => dayInfo && onDateSelect(dayInfo.date)}
          >
            {dayInfo && (
              <div className="h-full flex flex-col">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {dayInfo.day}
                </div>
                {dayInfo.inquiryCount > 0 && (
                  <div className={`
                    text-xs px-1 py-0.5 rounded text-center font-medium
                    ${getInquiryCountColor(dayInfo.inquiryCount)}
                  `}>
                    {dayInfo.inquiryCount} inquiry{dayInfo.inquiryCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-50 border border-blue-300 rounded"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-50 border border-green-400 rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 rounded"></div>
          <span>1-2 inquiries</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-100 rounded"></div>
          <span>3-5 inquiries</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 rounded"></div>
          <span>5+ inquiries</span>
        </div>
      </div>
    </div>
  );
};

export default InquiryCalendar;