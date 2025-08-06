import React from "react";
import { Plus } from "lucide-react";
import LocationCard from "./LocationCard";

const LocationsTab = ({
  locations,
  services,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Business Locations</h2>
        <button
          onClick={onAddLocation}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Plus size={20} color="white" />
          Add Location
        </button>
      </div>

      {locations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-lg mb-2">No locations found</div>
          <p className="text-sm">Create your first location to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {locations.map((location) => (
            <LocationCard
              key={location._id}
              location={location}
              services={services}
              onEdit={onEditLocation}
              onDelete={onDeleteLocation}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationsTab;
