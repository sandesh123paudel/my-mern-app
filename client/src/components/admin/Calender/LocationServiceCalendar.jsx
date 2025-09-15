import React from "react";

const LocationServiceCalendar = ({
  location,
  service,
  bookings,
  onDateClick,
}) => {
  // Generate a simple calendar for the current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay();

  // Map bookings to date counts
  const bookingCounts = {};
  bookings.forEach((b) => {
    const date = b.deliveryDate?.slice(0, 10); // 'YYYY-MM-DD'
    if (date) bookingCounts[date] = (bookingCounts[date] || 0) + 1;
  });

  // Build calendar grid
  const weeks = [];
  let days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
    if (days.length === 7) {
      weeks.push(days);
      days = [];
    }
  }
  if (days.length) while (days.length < 7) days.push(null);
  if (days.length) weeks.push(days);

  return (
    <div className="border rounded p-2 m-2 w-64 bg-white shadow text-xs">
      <div className="font-bold mb-1 text-center">
        {location.name} ({service.name})
      </div>
      <table className="w-full text-center">
        <thead>
          <tr className="text-gray-500">
            <th>Su</th>
            <th>Mo</th>
            <th>Tu</th>
            <th>We</th>
            <th>Th</th>
            <th>Fr</th>
            <th>Sa</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, i) => (
            <tr key={i}>
              {week.map((day, j) => {
                if (!day) return <td key={j}></td>;
                const dateStr = `${year}-${String(month + 1).padStart(
                  2,
                  "0"
                )}-${String(day).padStart(2, "0")}`;
                const count = bookingCounts[dateStr] || 0;
                return (
                  <td key={j}>
                    <button
                      className={`w-7 h-7 rounded ${
                        count
                          ? "bg-blue-100 hover:bg-blue-300"
                          : "hover:bg-gray-200"
                      } ${count ? "font-bold" : ""}`}
                      onClick={() => onDateClick(dateStr)}
                    >
                      {day}
                      {count > 0 && (
                        <div className="text-blue-600 text-[10px]">{count}</div>
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LocationServiceCalendar;
