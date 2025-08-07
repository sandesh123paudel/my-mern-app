import React from "react";
import { motion } from "framer-motion";
import { MapPin, Users, ChefHat, Star } from "lucide-react";

// Helper function to format the price
const formatPrice = (price) => {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(price);
};

// Helper function to count the number of enabled categories
const getMenuCategoryCount = (menu) => {
  let count = 0;
  if (menu.categories?.entree?.enabled) count++;
  if (menu.categories?.mains?.enabled) count++;
  if (menu.categories?.desserts?.enabled) count++;
  if (menu.categories?.addons?.enabled) count++;
  return count;
};

// Variants for the card's animations
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

const MenuCard = ({ menu, onClick }) => (
  <motion.div
    variants={cardVariants}
    whileHover="hover"
    onClick={onClick}
    className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer border border-primary-brown hover:shadow-2xl transition-shadow duration-300"
  >
    {/* Card Header with Background Pattern */}
    <div className="h-48 bg-gradient-to-br from-primary-brown to-primary-brown/90 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-l from-lime-300 via-amber-20000"></div>
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

export default MenuCard;
