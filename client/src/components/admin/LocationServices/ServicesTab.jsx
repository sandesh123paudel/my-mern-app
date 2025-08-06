import React from "react";
import { Plus, Building } from "lucide-react";
import ServiceCard from "./ServiceCard";

const ServicesTab = ({
  services,
  locations,
  selectedLocationForService,
  setSelectedLocationForService,
  onAddService,
  onEditService,
  onDeleteService,
}) => {
  const filteredServices = services.filter((service) => {
    if (!selectedLocationForService) return true;

    // Handle both populated and non-populated locationId
    const serviceLocationId = service.locationId?._id || service.locationId;
    return serviceLocationId === selectedLocationForService;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Services</h2>
        <div className="flex gap-3">
          <select
            value={selectedLocationForService}
            onChange={(e) => setSelectedLocationForService(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Locations</option>
            {locations.map((location) => (
              <option key={location._id} value={location._id}>
                {location.name}
              </option>
            ))}
          </select>
          <button
            onClick={onAddService}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <Plus size={20} />
            Add Service
          </button>
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Building size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg mb-2">No services found</p>
          <p className="text-sm">
            {selectedLocationForService
              ? "No services found for the selected location"
              : "Create your first service to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service._id}
              service={service}
              onEdit={onEditService}
              onDelete={onDeleteService}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesTab;
