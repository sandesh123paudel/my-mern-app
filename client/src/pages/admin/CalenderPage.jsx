import React from "react";
import Calender from "../../components/admin/Calender/Calender";

const CalenderPage = () => {
  const [key, setKey] = React.useState(0);

  const handleRefresh = () => {
    setKey((prevKey) => prevKey + 1);
  };

  return (
    <div className=" p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold mb-4">Booking Calendars</h2>

        <button
          onClick={() => {
            handleRefresh();
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          🔄 Refresh
        </button>
      </div>
      <Calender key={key} />
    </div>
  );
};

export default CalenderPage;
