import React, { useState } from "react";
import { Menu, X, User } from "lucide-react";
// import { Link } from "react-router-dom"; // Replace with your routing solution
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
        className="shadow-sm relative z-50 bg-white"
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
              {["Home", "About", "Menu", "Inquiry"].map((item, index) => (
                <motion.div
                  key={item}
                  variants={itemVariants}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                    className="text-gray-700 hover:text-primary-brown transition-colors duration-300 font-medium relative group"
                  >
                    {item}
                    <motion.div
                      className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-brown group-hover:w-full transition-all duration-300"
                      whileHover={{ width: "100%" }}
                    />
                  </Link>
                </motion.div>
              ))}
            </motion.nav>

            {/* Desktop Login Button */}
            <motion.div className="hidden md:flex" variants={itemVariants}>
              <motion.button
                className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:text-primary-brown hover:border-primary-brown transition-all duration-300 font-medium"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <motion.img
                  src="/catering.svg"
                  alt=""
                  className="h-5"
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
                className="text-gray-700 hover:text-primary-brown transition-colors duration-300 p-2"
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
                className="flex justify-end items-center p-6 border-gray-200"
                variants={mobileItemVariants}
              >
                <motion.button
                  onClick={toggleMenu}
                  className="text-gray-700 hover:text-primary-brown transition-colors duration-300 p-2"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={24} />
                </motion.button>
              </motion.div>

              {/* Mobile Navigation Links */}
              <div className="text-xl flex flex-col items-center justify-center flex-1 space-y-8 px-6">
                {["Home", "About", "Menu", "Inquiry"].map((item, index) => (
                  <motion.div
                    key={item}
                    variants={mobileItemVariants}
                    whileHover={{ scale: 1.05, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                      className="font-semibold text-gray-700 hover:text-primary-brown transition-colors duration-300 relative group"
                      onClick={toggleMenu}
                    >
                      {item}
                      <motion.div
                        className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-brown"
                        whileHover={{ width: "100%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </Link>
                  </motion.div>
                ))}

                {/* Mobile Login Button */}
                <motion.button
                  className="flex items-center space-x-3 px-8 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:text-primary-brown hover:border-primary-brown transition-all duration-300 font-semibold text-lg mt-8"
                  onClick={toggleMenu}
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
