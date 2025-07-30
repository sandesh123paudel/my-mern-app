import React, { useState } from "react";
import { Menu, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/menu", label: "Menu" },
    { to: "/inquiry", label: "Inquiry" },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Check if current path matches the nav item
  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Animation variants
  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1],
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const mobileMenuVariants = {
    hidden: {
      x: "100%",
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
    visible: {
      x: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const mobileItemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <>
      <motion.header
        className="shadow-sm relative z-50 bg-white border-b border-gray"
        initial="hidden"
        animate="visible"
        variants={headerVariants}
      >
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <motion.div
              className="flex items-center space-x-1"
              variants={itemVariants}
            >
              <Link to="/">
                <motion.img
                  src="/Logo-full.svg"
                  alt="Catering Logo"
                  className="h-auto w-32 sm:w-40 lg:w-50"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                />
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <motion.nav
              className="hidden md:flex space-x-8"
              variants={itemVariants}
            >
              {navItems.map((navItem, index) => (
                <motion.div
                  key={navItem.label}
                  variants={itemVariants}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <Link
                    to={navItem.to}
                    className={`transition-colors duration-300 font-medium relative group pb-1 ${
                      isActive(navItem.to)
                        ? "text-primary-green"
                        : "text-primary-brown hover:text-primary-green"
                    }`}
                  >
                    {navItem.label}
                    {/* Active indicator bar */}
                    <motion.div
                      className={`absolute -bottom-1 left-0 h-0.5 bg-primary-green transition-all duration-300 ${
                        isActive(navItem.to)
                          ? "w-full"
                          : "w-0 group-hover:w-full"
                      }`}
                      initial={false}
                      animate={{
                        width: isActive(navItem.to) ? "100%" : "0%",
                      }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </Link>
                </motion.div>
              ))}
            </motion.nav>

            {/* Desktop Login Button */}
            <motion.div className="hidden md:flex" variants={itemVariants}>
              <motion.button
                onClick={() => navigate("/login", scrollTo(0, 0))}
                className="flex items-center space-x-2 px-6 py-2 border border-primary-brown rounded-lg text-primary-brown hover:text-primary-green hover:border-primary-green transition-all duration-300 font-medium"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <motion.img
                  src="/catering.svg"
                  alt=""
                  style={{ fill: "white" }}
                  className="h-5 hover:fill-primary-brown/80 transition-colors duration-300"
                  whileHover={{ rotate: 10 }}
                  transition={{ duration: 0.2 }}
                />
                <span>Login</span>
              </motion.button>
            </motion.div>

            {/* Mobile menu button */}
            <motion.div className="md:hidden" variants={itemVariants}>
              <motion.button
                onClick={toggleMenu}
                className="text-primary-brown hover:text-primary-green transition-colors duration-300 p-2"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <AnimatePresence mode="wait">
                  {isMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X size={24} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu size={24} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 md:hidden"
            onClick={toggleMenu}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          />
        )}
      </AnimatePresence>

      {/* Mobile Navigation Sidebar */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 md:hidden"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <motion.div
                className="flex justify-end items-center p-6"
                variants={mobileItemVariants}
              >
                <motion.button
                  onClick={toggleMenu}
                  className="text-primary-brown hover:text-primary-green transition-colors duration-300 p-2"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={24} />
                </motion.button>
              </motion.div>

              {/* Mobile Navigation Links */}
              <div className="text-xl flex flex-col items-center justify-center flex-1 space-y-8 px-6">
                {navItems.map((navItem, index) => (
                  <motion.div
                    key={navItem.label}
                    variants={mobileItemVariants}
                    whileHover={{ scale: 1.05, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    <Link
                      to={navItem.to}
                      className={`font-semibold transition-colors duration-300 relative group ${
                        isActive(navItem.to)
                          ? "text-primary-green"
                          : "text-primary-brown hover:text-primary-green"
                      }`}
                      onClick={toggleMenu}
                    >
                      {navItem.label}
                      {/* Mobile active indicator */}
                      <motion.div
                        className={`absolute -bottom-1 left-0 h-0.5 bg-primary-green transition-all duration-300 ${
                          isActive(navItem.to) ? "w-full" : "w-0"
                        }`}
                        initial={false}
                        animate={{
                          width: isActive(navItem.to) ? "100%" : "0%",
                        }}
                        whileHover={{ width: "100%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </Link>
                  </motion.div>
                ))}

                {/* Mobile Login Button */}
                <motion.button
                  className="flex items-center space-x-3 px-8 py-3 border-2 border-primary-brown rounded-lg text-primary-brown hover:text-primary-green hover:border-primary-green transition-all duration-300 font-semibold text-lg mt-8"
                  onClick={() => {
                    toggleMenu();
                    scrollTo(0, 0);
                    navigate("/login");
                  }}
                  variants={mobileItemVariants}
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.img
                    src="/catering.svg"
                    alt=""
                    className="h-5"
                    whileHover={{ rotate: 15 }}
                    transition={{ duration: 0.2 }}
                  />
                  <span>Login</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
