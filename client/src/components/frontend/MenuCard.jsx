import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, ChefHat, Star, ArrowRight, Package, List } from "lucide-react";

// Helper function to format the price
const formatPrice = (price) => {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(price);
};

// Helper function to get package type info
const getPackageTypeInfo = (menu) => {
  if (menu.packageType === 'simple') {
    return {
      type: 'Simple Package',
      icon: <List size={14} className="text-purple-500" />,
      color: 'purple'
    };
  } else {
    return {
      type: 'Categorized Package',
      icon: <Package size={14} className="text-blue-500" />,
      color: 'blue'
    };
  }
};

// Helper function to count enabled categories or simple items
const getPackageContentCount = (menu) => {
  if (menu.packageType === 'simple') {
    return {
      type: 'items',
      count: menu.simpleItems?.length || 0
    };
  } else {
    // Count enabled categories
    const enabledCategories = menu.categories?.filter(cat => cat.enabled) || [];
    return {
      type: 'categories',
      count: enabledCategories.length
    };
  }
};

// Helper function to get total items count
const getTotalItemsCount = (menu) => {
  if (menu.packageType === 'simple') {
    return menu.simpleItems?.length || 0;
  } else {
    let totalItems = 0;
    menu.categories?.forEach(category => {
      if (category.enabled) {
        // Count included items
        totalItems += category.includedItems?.length || 0;
        // Count selection group items
        category.selectionGroups?.forEach(group => {
          totalItems += group.items?.length || 0;
        });
      }
    });
    return totalItems;
  }
};

// Helper function to get enabled categories for display
const getEnabledCategories = (menu) => {
  if (menu.packageType === 'simple') {
    return ['Simple Items'];
  } else {
    return menu.categories?.filter(cat => cat.enabled).map(cat => cat.name) || [];
  }
};

// Helper function to check if addons are available
const hasAddons = (menu) => {
  return menu.addons?.enabled && 
    ((menu.addons.fixedAddons?.length > 0) || (menu.addons.variableAddons?.length > 0));
};

const MenuCard = ({ menu, onClick }) => {
  // Animation variants
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const iconVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
      },
    },
    hover: {
      scale: 1.1,
      transition: { duration: 0.2 },
    },
  };

  const badgeVariants = {
    hidden: { scale: 0, opacity: 0, x: -20 },
    visible: {
      scale: 1,
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        delay: 0.2,
      },
    },
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: {
      scale: 1.02,
      boxShadow: "0 8px 25px rgba(255, 107, 53, 0.3)",
      transition: { duration: 0.3 },
    },
    tap: { scale: 0.98 },
  };

  const packageTypeInfo = getPackageTypeInfo(menu);
  const packageContent = getPackageContentCount(menu);
  const totalItems = getTotalItemsCount(menu);
  const enabledCategories = getEnabledCategories(menu);
  const hasAddonsAvailable = hasAddons(menu);

  return (
    <motion.div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-primary-brown overflow-hidden cursor-pointer transition-all duration-300 group"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      layout
    >
      {/* Card Header */}
      <motion.div
        className="p-6 border-b border-primary-green"
        variants={contentVariants}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <motion.h3
              className="text-xl font-bold mb-2 group-hover:transition-colors duration-300"
              style={{ color: "var(--primary-brown)" }}
              whileHover={{ color: "var(--primary-green)" }}
              transition={{ duration: 0.3 }}
            >
              {menu.name}
            </motion.h3>
            
            {/* Package Type Badge */}
            <motion.div
              className="flex items-center gap-2 mb-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {packageTypeInfo.icon}
              <span className={`text-sm font-medium text-${packageTypeInfo.color}-600`}>
                {packageTypeInfo.type}
              </span>
            </motion.div>

            <motion.div
              className="flex items-center text-gray-600 text-sm"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <MapPin size={14} className="mr-1" />
              </motion.div>
              <span>
                {menu.locationId?.name} - {menu.locationId?.city}
              </span>
            </motion.div>
          </div>
          <motion.div
            className="text-right"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <motion.div
              className="text-2xl font-bold"
              style={{ color: "var(--primary-brown)" }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {formatPrice(menu.basePrice || menu.price)}
            </motion.div>
            <div className="text-sm text-gray-500">per person</div>
          </motion.div>
        </div>

        {/* Service Badge */}
        <motion.span
          className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: "var(--primary-green)" }}
          variants={badgeVariants}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          {menu.serviceId?.name}
        </motion.span>
      </motion.div>

      {/* Card Body */}
      <motion.div className="p-6" variants={contentVariants}>
        {/* Description */}
        {menu.description && (
          <motion.p
            className="text-gray-600 mb-6 line-clamp-3 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {menu.description}
          </motion.p>
        )}

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-3 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, staggerChildren: 0.1 }}
        >
          {/* People Count */}
          <motion.div
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
              style={{ backgroundColor: "rgba(164, 205, 61, 0.1)" }}
              variants={iconVariants}
              whileHover="hover"
            >
              <Users size={20} style={{ color: "var(--primary-green)" }} />
            </motion.div>
            <div className="text-xs text-gray-500 mb-1">Serves</div>
            <motion.div
              className="font-semibold text-sm"
              style={{ color: "var(--primary-brown)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {menu.minPeople || 1}
              {menu.maxPeople && menu.maxPeople !== 1000 ? `-${menu.maxPeople}` : "+"} people
            </motion.div>
          </motion.div>

          {/* Package Content */}
          <motion.div
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
              style={{ backgroundColor: "rgba(73, 42, 0, 0.1)" }}
              variants={iconVariants}
              whileHover="hover"
            >
              <ChefHat size={20} style={{ color: "var(--primary-brown)" }} />
            </motion.div>
            <div className="text-xs text-gray-500 mb-1">
              {packageContent.type === 'categories' ? 'Categories' : 'Items'}
            </div>
            <motion.div
              className="font-semibold text-sm"
              style={{ color: "var(--primary-brown)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {packageContent.count} {packageContent.type}
            </motion.div>
          </motion.div>

          {/* Total Items */}
          <motion.div
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 bg-yellow-100"
              variants={iconVariants}
              whileHover="hover"
            >
              <Star size={20} className="text-yellow-600" />
            </motion.div>
            <div className="text-xs text-gray-500 mb-1">Total Items</div>
            <motion.div
              className="font-semibold text-sm"
              style={{ color: "var(--primary-brown)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {totalItems} items
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Package Content Tags */}
        <motion.div
          className="flex flex-wrap gap-2 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, staggerChildren: 0.05 }}
        >
          <AnimatePresence>
            {enabledCategories.map((categoryName, index) => (
              <motion.span
                key={categoryName}
                className="px-2 py-1 text-xs font-medium rounded"
                style={{
                  backgroundColor: index % 2 === 0 
                    ? "rgba(164, 205, 61, 0.1)" 
                    : "rgba(73, 42, 0, 0.1)",
                  color: index % 2 === 0 
                    ? "var(--primary-green)" 
                    : "var(--primary-brown)",
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                layout
              >
                {categoryName}
              </motion.span>
            ))}
            {hasAddonsAvailable && (
              <motion.span
                className="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-700"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                layout
              >
                Add-ons Available
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Package Summary */}
        {menu.packageType === 'simple' && menu.simpleItems?.length > 0 && (
          <motion.div
            className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="text-xs text-purple-700 font-medium mb-1">Sample Items:</div>
            <div className="text-xs text-purple-600">
              {menu.simpleItems.slice(0, 3).map(item => item.name).join(', ')}
              {menu.simpleItems.length > 3 && ` +${menu.simpleItems.length - 3} more`}
            </div>
          </motion.div>
        )}

        {menu.packageType === 'categorized' && menu.categories?.length > 0 && (
          <motion.div
            className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="text-xs text-blue-700 font-medium mb-1">Categories:</div>
            <div className="text-xs text-blue-600">
              {menu.categories.filter(cat => cat.enabled).slice(0, 3).map(cat => cat.name).join(', ')}
              {menu.categories.filter(cat => cat.enabled).length > 3 && 
                ` +${menu.categories.filter(cat => cat.enabled).length - 3} more`}
            </div>
          </motion.div>
        )}

        {/* Action Button */}
        <motion.button
          className="w-full py-3 px-4 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group/btn relative overflow-hidden"
          style={{ backgroundColor: "#FF6B35" }}
          variants={buttonVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
        >
          {/* Button Background Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.6 }}
          />

          {/* Button Content */}
          <span className="relative z-10">Order Package</span>
          <motion.div
            className="relative z-10"
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowRight
              size={16}
              className="group-hover/btn:translate-x-1 transition-transform duration-300"
            />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Hover Overlay Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        initial={false}
      />
    </motion.div>
  );
};

export default MenuCard;