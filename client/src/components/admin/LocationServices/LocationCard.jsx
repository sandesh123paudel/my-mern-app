import React from "react";
import { Edit, Trash2, MapPin, Phone, Mail, CreditCard, CheckCircle, XCircle } from "lucide-react";

const LocationCard = ({ location, services, onEdit, onDelete }) => {
  const locationServices = services.filter(
    (service) => {
      // Handle both populated and non-populated locationId
      const serviceLocationId = service.locationId?._id || service.locationId;
      return serviceLocationId === location._id;
    }
  );

  // Check if location has bank details configured
  const hasBankDetails = location.bankDetails && 
    location.bankDetails.bankName && 
    location.bankDetails.accountName && 
    location.bankDetails.bsb && 
    location.bankDetails.accountNumber &&
    location.bankDetails.isActive;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {location.name}
          </h3>
          <p className="text-sm text-gray-600">{location.city}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              location.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {location.isActive ? "Active" : "Inactive"}
          </span>
          
          {/* Bank Details Status */}
          <div className="flex items-center gap-1">
            {hasBankDetails ? (
              <>
                <CheckCircle size={14} className="text-green-500" />
                <span className="text-xs text-green-600 font-medium">Bank Details</span>
              </>
            ) : (
              <>
                <XCircle size={14} className="text-orange-500" />
                <span className="text-xs text-orange-600 font-medium">No Bank Details</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={16} className="text-gray-400" />
          <span>{location.address || "No address provided"}</span>
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

      {/* Bank Details Summary */}
      {hasBankDetails && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={16} className="text-green-600" />
            <span className="text-sm font-medium text-green-800">Payment Details Configured</span>
          </div>
          <div className="text-xs text-green-700 space-y-1">
            <div><strong>Bank:</strong> {location.bankDetails.bankName}</div>
            <div><strong>Account:</strong> {location.bankDetails.accountName}</div>
            <div><strong>BSB:</strong> {location.bankDetails.bsb}</div>
            <div><strong>Account Number:</strong> •••••{location.bankDetails.accountNumber.slice(-4)}</div>
          </div>
        </div>
      )}

      {!hasBankDetails && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={16} className="text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Bank Details Needed</span>
          </div>
          <p className="text-xs text-orange-700">
            Configure bank details to include payment information in booking confirmations.
          </p>
        </div>
      )}

      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">
          Services at this location:
        </p>
        <div className="flex flex-wrap gap-1">
          {locationServices.map((service) => (
            <span
              key={service._id}
              className={`px-2 py-1 rounded text-xs ${
                service.isActive 
                  ? "bg-blue-100 text-blue-800" 
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {service.name}
              {!service.isActive && " (Inactive)"}
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
          disabled={locationServices.some(service => service.isActive)}
          title={locationServices.some(service => service.isActive) ? "Cannot delete location with active services" : "Delete location"}
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
      
      {locationServices.some(service => service.isActive) && (
        <p className="text-xs text-red-500 mt-2 text-center">
          Cannot delete: Has active services
        </p>
      )}
    </div>
  );
};

export default LocationCard;