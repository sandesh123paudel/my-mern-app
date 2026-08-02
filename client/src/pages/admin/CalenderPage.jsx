import React from "react";
import Calender from "../../components/admin/Calender/Calender";
import { RotateCw } from "lucide-react";

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
          className="flex items-center gap-2 bg-primary-green text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
        >
          <RotateCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>
      <Calender key={key} />
    </div>
  );
};

export default CalenderPage;
