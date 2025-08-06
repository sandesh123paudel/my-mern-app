import React from "react";
import { Edit, Trash2 } from "lucide-react";

const ServiceCard = ({ service, onEdit, onDelete }) => {
  // Handle different ways the location name might be stored
  const getLocationName = () => {
    if (service.locationId?.name) {
      return service.locationId.name;
    }
    if (service.locationName) {
      return service.locationName;
    }
    return "Unknown Location";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {service.name}
          </h3>
          <p className="text-sm text-blue-600">{getLocationName()}</p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            service.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {service.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
        {service.description || "No description provided"}
      </p>

      <div className="text-xs text-gray-500 mb-4">
        Created: {new Date(service.createdAt).toLocaleDateString()}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(service)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
        >
          <Edit size={16} />
          Edit
        </button>
        <button
          onClick={() => onDelete(service._id)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
};

export default ServiceCard;
