import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Star, Users, ChefHat } from "lucide-react";
import { getMenus } from "../services/menuServices";
import { getLocations } from "../services/locationServices";
import { getServices } from "../services/serviceServices";
import Loading from "../components/Loading";
import MenuFilters from "../components/frontend/MenuFilters";
import MenuSelectionModal from "../components/frontend/MenuSelectionModal";
import CustomOrderModal from "../components/frontend/CustomOrderModel";
import OrderConfirmationModal from "../components/frontend/OrderConfirmationModal";
import MenuCard from "../components/frontend/MenuCard";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [menusResult, locationsResult, servicesResult] =
          await Promise.all([
            getMenus({ isActive: true }),
            getLocations(),
            getServices(),
          ]);

        if (menusResult.success) setMenus(menusResult.data);
        if (locationsResult.success) setLocations(locationsResult.data);
        if (servicesResult.success) setServices(servicesResult.data);
      } catch (error) {
        console.error("Error loading menu data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleProceedToConfirmation = (orderData) => {
    setOrderForConfirmation(orderData);
    setSelectedMenu(null);
  };

  const closeConfirmationModal = () => {
    setOrderForConfirmation(null);
  };

  const filteredServices = selectedLocation
    ? services.filter(
        (service) =>
          (service.locationId?._id || service.locationId) === selectedLocation
      )
    : [];

  useEffect(() => {
    if (selectedLocation && selectedService) {
      const serviceExists = filteredServices.some(
        (s) => s._id === selectedService
      );
      if (!serviceExists) {
        setSelectedService("");
      }
    }
  }, [selectedLocation, selectedService, filteredServices]);

  const getFilteredAndSortedMenus = () => {
    let filtered = [...menus];

    if (selectedLocation) {
      filtered = filtered.filter(
        (menu) => (menu.locationId?._id || menu.locationId) === selectedLocation
      );
    }

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
        <Loading message="Loading delicious menus..." size="large" />
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
      {/* Hero Section */}
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

            {/* CTA Button */}
            <motion.button
              onClick={() => setShowCustomOrderModal(true)}
              className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold text-lg rounded-lg shadow-lg transition-all duration-300"
              style={{ backgroundColor: "#FF6B35" }}
              variants={heroVariants}
              transition={{ delay: 0.6 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 25px rgba(255, 107, 53, 0.3)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              EXPLORE OUR OFFERINGS
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <MenuFilters
          locations={locations}
          services={services}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          selectedService={selectedService}
          setSelectedService={setSelectedService}
          sortBy={sortBy}
          setSortBy={setSortBy}
          filteredServices={filteredServices}
          menuCount={filteredMenus.length}
        />
      </motion.div>

      {/* Menu Cards Section */}
      <motion.section
        className="py-16 bg-gray-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="container mx-auto px-6">
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
                  className="bg-white rounded-lg p-12 max-w-md mx-auto shadow-sm"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: "var(--primary-green)" }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
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
                    No Menus Found
                  </motion.h3>
                  <motion.p
                    className="text-gray-600 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    Try adjusting your filters or create a custom menu instead.
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
                    Create Custom Menu
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
                    Choose Your Perfect Menu
                  </h2>
                  <motion.p
                    className="text-gray-600 max-w-2xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Each package is carefully designed to provide an authentic
                    Nepalese dining experience
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

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

      {/* Custom Order CTA Section */}
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
                scrollTo(0, 0);
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
              Enquiry
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
          />
        )}
        {showCustomOrderModal && (
          <CustomOrderModal
            menus={menus}
            onClose={() => setShowCustomOrderModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Menu;
