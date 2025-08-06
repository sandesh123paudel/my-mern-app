import React from "react";
import { Edit, Trash2, MapPin, Phone, Mail } from "lucide-react";

const LocationCard = ({ location, services, onEdit, onDelete }) => {
  const locationServices = services.filter(
    (service) => {
      // Handle both populated and non-populated locationId
      const serviceLocationId = service.locationId?._id || service.locationId;
      return serviceLocationId === location._id;
    }
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {location.name}
          </h3>
          <p className="text-sm text-gray-600">{location.city}</p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            location.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {location.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={16} className="text-gray-400" />
          <span>{location.address}</span>
        </div>
        {location.contactInfo?.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone size={16} className="text-gray-400" />
            <span>{location.contactInfo.phone}</span>
          </div>
        )}
        {location.contactInfo?.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail size={16} className="text-gray-400" />
            <span>{location.contactInfo.email}</span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">
          Services at this location:
        </p>
        <div className="flex flex-wrap gap-1">
          {locationServices.map((service) => (
            <span
              key={service._id}
              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
            >
              {service.name}
            </span>
          ))}
          {locationServices.length === 0 && (
            <span className="text-xs text-gray-400">
              No services configured
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(location)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
        >
          <Edit size={16} />
          Edit
        </button>
        <button
          onClick={() => onDelete(location._id)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
};

export default LocationCard;