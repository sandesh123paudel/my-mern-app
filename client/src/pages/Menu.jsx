import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, ChefHat, Star, ShoppingCart } from "lucide-react";
import { getMenus } from "../services/menuServices";
import { getLocations } from "../services/locationServices";
import { getServices } from "../services/serviceServices";
import Loading, { InlineLoading } from "../components/Loading";
import MenuFilters from "../components/frontend/MenuFilters";
import MenuSelectionModal from "../components/frontend/MenuSelectionModal";
import CustomOrderModal from "../components/frontend/CustomerOrderModel"; // New import

const Menu = () => {
  const [menus, setMenus] = useState([]);
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [showCustomOrderModal, setShowCustomOrderModal] = useState(false); // New state
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const filteredServices = selectedLocation
    ? services.filter(
        (service) =>
          (service.locationId?._id || service.locationId) === selectedLocation
      )
    : [];

  useEffect(() => {
    if (selectedLocation && selectedService) {
      const serviceExists = filteredServices.find(
        (s) => s._id === selectedService
      );
      if (!serviceExists) {
        setSelectedService("");
      }
    }
  }, [selectedLocation, filteredServices, selectedService]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [menusResult, locationsResult, servicesResult] = await Promise.all([
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

  const getFilteredAndSortedMenus = () => {
    let filtered = menus;

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
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredMenus = getFilteredAndSortedMenus();

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(price);
  };

  const getMenuCategoryCount = (menu) => {
    let count = 0;
    if (menu.categories?.entree?.enabled) count++;
    if (menu.categories?.mains?.enabled) count++;
    if (menu.categories?.desserts?.enabled) count++;
    if (menu.categories?.addons?.enabled) count++;
    return count;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    hover: {
      y: -10,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const MenuCard = ({ menu }) => (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      onClick={() => setSelectedMenu(menu)}
      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer border border-gray-100 hover:shadow-2xl transition-shadow duration-300"
    >
      {/* Card Header with Background Pattern */}
      <div className="h-48 bg-gradient-to-br from-primary-brown to-primary-brown/90 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-4 right-4">
          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-primary-brown">
            {formatPrice(menu.price)} / person
          </span>
        </div>
        <div className="absolute bottom-4 left-4 ">
          <h3 className="text-2xl font-bold mb-2">{menu.name}</h3>
          <div className="flex items-center gap-2 ">
            <MapPin size={16} />
            <span className="text-sm">
              {menu.locationId?.name} - {menu.locationId?.city}
            </span>
          </div>
        </div>
        {/* Decorative Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
      </div>

      {/* Card Content */}
      <div className="p-6">
        {menu.description && (
          <p className="text-gray-600 mb-4 line-clamp-2">{menu.description}</p>
        )}

        {/* Menu Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="bg-primary-green/10 rounded-lg p-3 mb-2">
              <Users className="mx-auto text-primary-green" size={20} />
            </div>
            <p className="text-xs text-gray-500">Serves</p>
            <p className="font-semibold text-primary-brown">
              {menu.minPeople}
              {menu.maxPeople ? `-${menu.maxPeople}` : "+"} people
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary-brown/10 rounded-lg p-3 mb-2">
              <ChefHat className="mx-auto text-primary-brown" size={20} />
            </div>
            <p className="text-xs text-gray-500">Categories</p>
            <p className="font-semibold text-primary-brown">
              {getMenuCategoryCount(menu)} courses
            </p>
          </div>

          <div className="text-center">
            <div className="bg-yellow-100 rounded-lg p-3 mb-2">
              <Star className="mx-auto text-yellow-600" size={20} />
            </div>
            <p className="text-xs text-gray-500">Service</p>
            <p className="font-semibold text-primary-brown">
              {menu.serviceId?.name}
            </p>
          </div>
        </div>

        {/* View Menu Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full bg-primary-brown text-white py-3 rounded-xl font-semibold hover:bg-primary-brown/90 transition-colors duration-300"
        >
          Customize Your Menu
        </motion.button>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
        <Loading message="Loading delicious menus..." size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative py-20 md:py-24 bg-gradient-to-r from-primary-brown to-primary-brown/90 text-white overflow-hidden"
      >
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6"
            >
              Our <span className="text-primary-green">Menu</span> Collection
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-lg md:text-xl "
            >
              Discover our carefully crafted menu packages designed for every
              occasion
            </motion.p>
          </div>
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-primary-green/10 rounded-full -translate-y-32 md:-translate-y-48 translate-x-32 md:translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-full translate-y-24 md:translate-y-32 -translate-x-24 md:-translate-x-32"></div>
      </motion.section>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
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

      {/* Menu Cards */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredMenus.map((menu) => (
              <MenuCard
                key={menu._id}
                menu={menu}
                onClick={() => setSelectedMenu(menu)}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Custom Order Section */}
      <section className="py-12 md:py-16 bg-primary-green shadow-inner">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-primary-brown mb-4">
            Don't see what you like?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Create your own unique menu from our full range of dishes and
            beverages. Our culinary team will craft a perfect experience just
            for you.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCustomOrderModal(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-green text-white font-semibold text-lg rounded-xl shadow-lg hover:bg-primary-green/90 transition-colors duration-300"
          >
            <ShoppingCart size={24} />
            Create Custom Menu
          </motion.button>
        </div>
      </section>

      {/* Modals */}
      <AnimatePresence>
        {selectedMenu && (
          <MenuSelectionModal
            menu={selectedMenu}
            onClose={() => setSelectedMenu(null)}
          />
        )}
        {showCustomOrderModal && (
          <CustomOrderModal
            menus={menus}
            onClose={() => setShowCustomOrderModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Menu;
