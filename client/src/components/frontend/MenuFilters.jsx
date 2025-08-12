import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Settings, DollarSign, X } from "lucide-react";

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
  const hasActiveFilters = selectedLocation || selectedService || sortBy !== "default";

  const clearAllFilters = () => {
    setSelectedLocation("");
    setSelectedService("");
    setSortBy("default");
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const filterCardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      className="py-8 border-b"
      style={{ backgroundColor: 'var(--primary-green)' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          variants={itemVariants}
        >
          <motion.h2 
            className="text-2xl md:text-3xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Available Menu Packages
          </motion.h2>
          <motion.div 
            className="flex items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <motion.span 
              className="text-white/90"
              key={menuCount} // Key change triggers animation
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {menuCount} {menuCount === 1 ? "package" : "packages"} available
            </motion.span>
            <AnimatePresence>
              {hasActiveFilters && (
                <motion.button
                  onClick={clearAllFilters}
                  className="text-white/80 hover:text-white text-sm underline flex items-center gap-1"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={14} />
                  Clear filters
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto"
          variants={containerVariants}
        >
          {/* Location Filter */}
          <motion.div 
            className="bg-white rounded-lg p-4 shadow-sm"
            variants={filterCardVariants}
            whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)" }}
            transition={{ duration: 0.3 }}
          >
            <motion.label 
              className="block text-sm font-semibold mb-2" 
              style={{ color: 'var(--primary-brown)' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <MapPin size={16} className="inline mr-2" />
              Location
            </motion.label>
            <motion.select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent bg-white text-gray-700 transition-all duration-300"
              style={{ 
                focusRingColor: 'var(--primary-green)',
                ':focus': { borderColor: 'var(--primary-green)' }
              }}
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location._id} value={location._id}>
                  {location.name} - {location.city}
                </option>
              ))}
            </motion.select>
          </motion.div>

          {/* Service Filter */}
          <motion.div 
            className="bg-white rounded-lg p-4 shadow-sm"
            variants={filterCardVariants}
            whileHover={{ 
              y: selectedLocation ? -2 : 0, 
              boxShadow: selectedLocation ? "0 8px 25px rgba(0, 0, 0, 0.1)" : "0 4px 6px rgba(0, 0, 0, 0.1)" 
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.label 
              className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${!selectedLocation ? 'text-gray-400' : ''}`}
              style={{ color: selectedLocation ? 'var(--primary-brown)' : '#9CA3AF' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Settings size={16} className="inline mr-2" />
              Service Type
            </motion.label>
            <motion.select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              disabled={!selectedLocation}
              className={`w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent bg-white transition-all duration-300 ${
                !selectedLocation ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
              }`}
              style={{ 
                focusRingColor: 'var(--primary-green)',
                ':focus': { borderColor: 'var(--primary-green)' }
              }}
              whileFocus={{ scale: selectedLocation ? 1.02 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <option value="">
                {!selectedLocation ? "Select location first" : "All Services"}
              </option>
              {filteredServices.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name}
                </option>
              ))}
            </motion.select>
          </motion.div>

          {/* Sort Filter */}
          <motion.div 
            className="bg-white rounded-lg p-4 shadow-sm"
            variants={filterCardVariants}
            whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)" }}
            transition={{ duration: 0.3 }}
          >
            <motion.label 
              className="block text-sm font-semibold mb-2" 
              style={{ color: 'var(--primary-brown)' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <DollarSign size={16} className="inline mr-2" />
              Sort By
            </motion.label>
            <motion.select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent bg-white text-gray-700 transition-all duration-300"
              style={{ 
                focusRingColor: 'var(--primary-green)',
                ':focus': { borderColor: 'var(--primary-green)' }
              }}
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <option value="default">Default Order</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </motion.select>
          </motion.div>
        </motion.div>

        {/* Active Filters */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div 
                className="inline-flex flex-wrap items-center gap-2 bg-white/10 rounded-lg px-4 py-2"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-white/90 text-sm font-medium">Active filters:</span>
                
                <AnimatePresence>
                  {selectedLocation && (
                    <motion.span 
                      className="inline-flex items-center gap-1 bg-white/20 text-white px-2 py-1 rounded text-sm"
                      initial={{ opacity: 0, scale: 0.8, x: -10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: -10 }}
                      transition={{ duration: 0.3 }}
                      layout
                    >
                      {locations.find(l => l._id === selectedLocation)?.name}
                      <motion.button
                        onClick={() => setSelectedLocation("")}
                        className="hover:bg-white/20 rounded p-0.5 transition-colors"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X size={12} />
                      </motion.button>
                    </motion.span>
                  )}
                </AnimatePresence>
                
                <AnimatePresence>
                  {selectedService && (
                    <motion.span 
                      className="inline-flex items-center gap-1 bg-white/20 text-white px-2 py-1 rounded text-sm"
                      initial={{ opacity: 0, scale: 0.8, x: -10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: -10 }}
                      transition={{ duration: 0.3 }}
                      layout
                    >
                      {services.find(s => s._id === selectedService)?.name}
                      <motion.button
                        onClick={() => setSelectedService("")}
                        className="hover:bg-white/20 rounded p-0.5 transition-colors"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X size={12} />
                      </motion.button>
                    </motion.span>
                  )}
                </AnimatePresence>
                
                <AnimatePresence>
                  {sortBy !== "default" && (
                    <motion.span 
                      className="inline-flex items-center gap-1 bg-white/20 text-white px-2 py-1 rounded text-sm"
                      initial={{ opacity: 0, scale: 0.8, x: -10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: -10 }}
                      transition={{ duration: 0.3 }}
                      layout
                    >
                      {sortBy === "price-low" ? "Price: Low-High" : "Price: High-Low"}
                      <motion.button
                        onClick={() => setSortBy("default")}
                        className="hover:bg-white/20 rounded p-0.5 transition-colors"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X size={12} />
                      </motion.button>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default MenuFilters;