import React from "react";

const InquiryCard = ({ inquiry, onViewDetails }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "responded":
        return "bg-green-100 text-green-800 border-green-200";
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-amber-800">{inquiry.name}</h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                inquiry.status || "pending"
              )}`}
            >
              {inquiry.status || "pending"}
            </span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">Email:</span> {inquiry.email}
            </p>
            <p>
              <span className="font-medium">Contact:</span>{" "}
              {inquiry.contact || "Not provided"}
            </p>
            <p>
              <span className="font-medium">Event Date:</span>{" "}
              {inquiry.eventDate
                ? new Date(inquiry.eventDate).toLocaleDateString()
                : "Not specified"}
            </p>
            <p>
              <span className="font-medium">Guests:</span>{" "}
              {inquiry.numberOfPeople || "Not specified"}
            </p>
            {inquiry.venue && (
              <p>
                <span className="font-medium">Venue:</span> {inquiry.venue}
              </p>
            )}
            {inquiry.serviceType && (
              <p>
                <span className="font-medium">Service:</span>{" "}
                {inquiry.serviceType}
              </p>
            )}
          </div>
          <div className="mt-3">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Message:</span>{" "}
              {inquiry.message?.substring(0, 150)}
              {inquiry.message?.length > 150 && "..."}
            </p>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Received:{" "}
            {new Date(inquiry.createdAt || Date.now()).toLocaleString()}
          </div>
        </div>
        <div className="ml-4">
          <button
            onClick={() => onViewDetails(inquiry)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default InquiryCard;
