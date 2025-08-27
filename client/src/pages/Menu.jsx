import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Star,
  Users,
  ChefHat,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { getMenus } from "../services/menuServices";
import { getLocations } from "../services/locationServices";
import { getServices } from "../services/serviceServices";
import Loading from "../components/Loading";
import MenuSelectionModal from "../components/frontend/MenuSelectionModal";
import CustomOrderModal from "../components/frontend/CustomOrderModel";
import OrderConfirmationModal from "../components/frontend/OrderConfirmationModal";
import MenuCard from "../components/frontend/MenuCard";
import { useLocation, useNavigate } from "react-router-dom";

const Menu = () => {
  const [menus, setMenus] = useState([]);
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [showCustomOrderModal, setShowCustomOrderModal] = useState(false);
  const [orderForConfirmation, setOrderForConfirmation] = useState(null);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [loading, setLoading] = useState(true);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const navigate = useNavigate();

  // Load initial data (locations and services ONLY - NO MENUS)
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [locationsResult, servicesResult] = await Promise.all([
          getLocations(),
          getServices(),
        ]);

        if (locationsResult.success) setLocations(locationsResult.data);
        if (servicesResult.success) setServices(servicesResult.data);

        // IMPORTANT: Do NOT load menus here - wait for location selection
        setMenus([]); // Explicitly set menus to empty array
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Load menus when location is selected
  useEffect(() => {
    const loadMenusForLocation = async () => {
      if (!selectedLocation) {
        setMenus([]);
        return;
      }

      setLoadingMenus(true);
      try {
        const menusResult = await getMenus({
          isActive: true,
          locationId: selectedLocation,
        });

        if (menusResult.success) {
          setMenus(menusResult.data);
        } else {
          setMenus([]);
        }
      } catch (error) {
        console.error("Error loading menus for location:", error);
        setMenus([]);
      } finally {
        setLoadingMenus(false);
      }
    };

    loadMenusForLocation();
  }, [selectedLocation]);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.preSelectedLocationId) {
      setSelectedLocation(location.state.preSelectedLocationId);
    }
  }, [location.state]);

  const handleLocationSelect = (locationId) => {
    setSelectedLocation(locationId);
    setSelectedService(""); // Reset service when location changes
  };

  const handleProceedToConfirmation = (orderData) => {
    setOrderForConfirmation(orderData);
    setSelectedMenu(null);
    setShowCustomOrderModal(false);
  };

  const closeConfirmationModal = () => {
    setOrderForConfirmation(null);
  };

  const handleBackFromConfirmation = () => {
    if (orderForConfirmation?.isCustomOrder) {
      setShowCustomOrderModal(true);
      setOrderForConfirmation(null);
    } else {
      setSelectedMenu(orderForConfirmation?.menu || null);
      setOrderForConfirmation(null);
    }
  };

  // Filter services based on selected location
  const filteredServices = selectedLocation
    ? services.filter(
        (service) =>
          (service.locationId?._id || service.locationId) === selectedLocation
      )
    : [];

  // Filter menus based on selected service
  const getFilteredAndSortedMenus = () => {
    let filtered = [...menus];

    if (selectedService) {
      filtered = filtered.filter(
        (menu) => (menu.serviceId?._id || menu.serviceId) === selectedService
      );
    }

    switch (sortBy) {
      case "price-low":
        return filtered.sort((a, b) => a.price - b.price);
      case "price-high":
        return filtered.sort((a, b) => b.price - a.price);
      default:
        return filtered;
    }
  };

  const filteredMenus = getFilteredAndSortedMenus();

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const heroVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  if (loading) {
    return (
      <motion.div
        className="min-h-screen bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Loading message="Loading locations..." size="large" />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-white"
      style={{ fontFamily: "Lexend, sans-serif" }}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Hero Section - REMOVED Custom Order Button */}
      <motion.section
        className="relative py-16 md:py-24 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Breadcrumb */}
            <motion.div
              className="flex items-center justify-center gap-2 mb-6"
              variants={itemVariants}
            >
              <span className="text-sm text-gray-500">Home</span>
              <span className="text-sm text-gray-400">/</span>
              <span
                className="text-sm"
                style={{ color: "var(--primary-brown)" }}
              >
                Our Menu Packages
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              style={{ color: "var(--primary-brown)" }}
              variants={heroVariants}
            >
              NEPALESE CATERING
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl mb-8"
              style={{ color: "var(--primary-brown)", fontStyle: "italic" }}
              variants={heroVariants}
              transition={{ delay: 0.2 }}
            >
              Menu Packages for{" "}
              <span className="font-semibold">Sydney & Canberra</span>
            </motion.p>

            <motion.p
              className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto leading-relaxed"
              variants={heroVariants}
              transition={{ delay: 0.4 }}
            >
              Discover our carefully crafted menu packages designed for every
              occasion. From traditional Nepalese flavors to modern fusion
              dishes.
            </motion.p>
          </motion.div>
        </div>
      </motion.section>

      {/* Location Selection Section */}
      {!selectedLocation && (
        <motion.section
          className="py-16 bg-gray-50"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="container mx-auto px-6">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-3xl md:text-4xl font-bold mb-4"
                style={{ color: "var(--primary-brown)" }}
              >
                Choose Your Location
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Select your preferred location to see available menu packages
              </p>
            </motion.div>

            <motion.div
              className="flex flex-wrap justify-center items-center gap-8 max-w-5xl mx-auto"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {locations.map((location, index) => (
                <motion.div
                  key={location._id}
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-all duration-300 w-full sm:w-80"
                  onClick={() => handleLocationSelect(location._id)}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center">
                    <motion.div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: "var(--primary-green)" }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: index * 0.2,
                        type: "spring",
                        stiffness: 200,
                      }}
                    >
                      <MapPin className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3
                      className="text-xl font-bold mb-2"
                      style={{ color: "var(--primary-brown)" }}
                    >
                      {location.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {location.city}, {location.state}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <span>View Menus</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Selected Location Info & Service/Menu Filters */}
      {selectedLocation && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gray-50 py-8"
        >
          <div className="container mx-auto px-6">
            {/* Selected Location Display */}
            <motion.div
              className="flex items-center justify-between mb-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--primary-green)" }}
                >
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3
                    className="text-xl font-bold"
                    style={{ color: "var(--primary-brown)" }}
                  >
                    {
                      locations.find((loc) => loc._id === selectedLocation)
                        ?.name
                    }
                  </h3>
                  <p className="text-gray-600">
                    {
                      locations.find((loc) => loc._id === selectedLocation)
                        ?.city
                    }
                    ,{" "}
                    {
                      locations.find((loc) => loc._id === selectedLocation)
                        ?.state
                    }
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedLocation("");
                  setSelectedService("");
                  setMenus([]);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Change Location
              </button>
            </motion.div>

            {/* Service Filter and Sort Options */}
            {filteredServices.length > 0 && (
              <motion.div
                className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Type
                    </label>
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Services</option>
                      {filteredServices.map((service) => (
                        <option key={service._id} value={service._id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="default">Default</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  {filteredMenus.length} menu
                  {filteredMenus.length !== 1 ? "s" : ""} found
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Menu Cards Section */}
      {selectedLocation && (
        <motion.section
          className="py-16 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="container mx-auto px-6">
            {loadingMenus ? (
              <div className="text-center py-20">
                <Loading message="Loading menus..." size="medium" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {filteredMenus.length === 0 ? (
                  <motion.div
                    key="no-menus"
                    className="text-center py-20"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      className="bg-gray-50 rounded-lg p-12 max-w-md mx-auto"
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ backgroundColor: "var(--primary-green)" }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 0.2,
                          type: "spring",
                          stiffness: 200,
                        }}
                      >
                        <ShoppingCart className="w-8 h-8 text-white" />
                      </motion.div>
                      <motion.h3
                        className="text-2xl font-bold mb-4"
                        style={{ color: "var(--primary-brown)" }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        No Menus Available
                      </motion.h3>
                      <motion.p
                        className="text-gray-600 mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        {selectedService
                          ? "No menus found for the selected service. Try a different service or create a custom order."
                          : "No menus available for this location yet. Create a custom order instead."}
                      </motion.p>
                      <motion.button
                        onClick={() => setShowCustomOrderModal(true)}
                        className="px-6 py-3 text-white rounded-lg font-semibold transition-colors"
                        style={{ backgroundColor: "#FF6B35" }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Create Custom Order
                      </motion.button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="menus-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Section Header */}
                    <motion.div
                      className="text-center mb-12"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <h2
                        className="text-3xl md:text-4xl font-bold mb-4"
                        style={{ color: "var(--primary-brown)" }}
                      >
                        Available Menu Packages
                      </h2>
                      <motion.p
                        className="text-gray-600 max-w-2xl mx-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        Choose from our carefully curated menu packages for your
                        event
                      </motion.p>
                    </motion.div>

                    {/* Menu Grid */}
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {filteredMenus.map((menu, index) => (
                        <motion.div
                          key={menu._id}
                          variants={itemVariants}
                          transition={{ delay: index * 0.1 }}
                          layout
                        >
                          <MenuCard
                            menu={menu}
                            onClick={() => setSelectedMenu(menu)}
                          />
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* MOVED: Custom Order CTA Section - Now after menu cards */}
                    <motion.div
                      className="text-center mt-16 pt-12 border-t border-gray-200"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                    >
                      <motion.h3
                        className="text-2xl md:text-3xl font-bold mb-4"
                        style={{ color: "var(--primary-brown)" }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        Can't find what you're looking for?
                      </motion.h3>
                      <motion.p
                        className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        Create a personalized menu package tailored to your specific needs and preferences
                      </motion.p>
                      <motion.button
                        onClick={() => setShowCustomOrderModal(true)}
                        className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold text-lg rounded-lg shadow-lg transition-all duration-300"
                        style={{ backgroundColor: "#FF6B35" }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        whileHover={{
                          scale: 1.05,
                          boxShadow: "0 10px 25px rgba(255, 107, 53, 0.3)",
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        CREATE CUSTOM ORDER
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </motion.section>
      )}

      {/* Why Choose Us Section */}
      <motion.section
        className="py-16"
        style={{ backgroundColor: "var(--primary-green)" }}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              WHY CHOOSE OUR CATERING
            </h2>
            <p className="text-white/90 max-w-2xl mx-auto">
              We pride ourselves on delivering exceptional Nepalese cuisine with
              unmatched service quality
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Star,
                title: "Quality",
                desc: "Premium ingredients and authentic recipes passed down through generations",
              },
              {
                icon: Users,
                title: "Service",
                desc: "Professional catering team ensuring seamless event execution",
              },
              {
                icon: ChefHat,
                title: "Experience",
                desc: "Years of expertise in creating memorable culinary experiences",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                className="text-center"
                variants={itemVariants}
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.2,
                    type: "spring",
                    stiffness: 200,
                  }}
                >
                  <item.icon
                    className="w-10 h-10"
                    style={{ color: "var(--primary-green)" }}
                  />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-white/80 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Final CTA Section */}
      <motion.section
        className="py-16"
        style={{ backgroundColor: "var(--primary-green)" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-6 text-center">
          <motion.div
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to try out our services?
            </h2>
            <motion.p
              className="text-white/90 text-lg mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Our expert Nepalese catering is just one click away.
            </motion.p>
            <motion.button
              onClick={() => {
                navigate("/inquiry");
                window.scrollTo(0, 0);
              }}
              className="px-8 py-4 bg-white font-bold text-lg rounded-lg shadow-lg transition-all duration-300"
              style={{ color: "var(--primary-green)" }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              Inquiry
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* Modals */}
      <AnimatePresence>
        {selectedMenu && (
          <MenuSelectionModal
            menu={selectedMenu}
            onClose={() => setSelectedMenu(null)}
            onProceedToConfirmation={handleProceedToConfirmation}
          />
        )}
        {orderForConfirmation && (
          <OrderConfirmationModal
            orderData={orderForConfirmation}
            onClose={closeConfirmationModal}
            onBack={handleBackFromConfirmation}
          />
        )}
        {showCustomOrderModal && (
          <CustomOrderModal
            onClose={() => setShowCustomOrderModal(false)}
            onProceedToConfirmation={handleProceedToConfirmation}
            selectedLocationId={selectedLocation} // Pass selected location to custom order
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Menu;