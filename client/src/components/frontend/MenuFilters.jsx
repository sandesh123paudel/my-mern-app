import React from "react";
import { MapPin, Settings, DollarSign } from "lucide-react";

const MenuFilters = ({
  locations,
  services,
  selectedLocation,
  setSelectedLocation,
  selectedService,
  setSelectedService,
  sortBy,
  setSortBy,
  filteredServices,
  menuCount,
}) => {
  return (
    // The main container now uses responsive padding and a sticky top position for a better user experience.
    <div className="py-6 sm:py-8 bg-primary-green text-primary-brown sticky top-0 z-40  ">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* The main layout uses flex-col for mobile and lg:flex-row for larger screens, stacking content vertically then horizontally. */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-y-4 lg:gap-x-8">
          {/* Menu count and title section */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full lg:w-auto justify-center lg:justify-start">
            <h2 className="text-xl md:text-2xl font-bold text-white whitespace-nowrap">
              Available Packages
            </h2>
            <span className="bg-primary-brown text-white px-3 py-1 rounded-full text-sm font-semibold">
              {menuCount} {menuCount === 1 ? "menu" : "menus"}
            </span>
          </div>

          {/* Filter controls section. Using flex-wrap allows items to flow to the next line on smaller screens. */}
          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 w-full lg:w-auto">
            {/* Location Filter */}
            <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
              <MapPin size={20} className="text-primary-brown flex-shrink-0" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-green focus:border-primary-green bg-white min-w-[180px] sm:min-w-[140px] appearance-none"
              >
                <option value="">All Locations</option>
                {locations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {location.name} - {location.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Filter */}
            <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
              <Settings
                size={20}
                className="text-primary-brown flex-shrink-0"
              />
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-green focus:border-primary-green bg-white min-w-[180px] sm:min-w-[140px] appearance-none"
                disabled={!selectedLocation}
              >
                <option value="">
                  {!selectedLocation ? "Select location first" : "All Services"}
                </option>
                {filteredServices.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
              <DollarSign
                size={20}
                className="text-primary-brown flex-shrink-0"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-green focus:border-primary-green bg-white min-w-[140px] appearance-none"
              >
                <option value="default">Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuFilters;
