import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Menu, X, Shield, Settings, LogOut, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { AppContext } from "../context/AppContext";

const Header = () => {
  const { userData, backendUrl, setUserData, setIsLoggedIn, isLoggedIn } =
    useContext(AppContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/menu", label: "Menu" },
    { to: "/inquiry", label: "Inquiry" },
  ];

  // Memoized functions for better performance
  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const toggleUserMenu = useCallback(() => {
    setShowUserMenu((prev) => !prev);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(`${backendUrl}/api/auth/logout`);
      if (data.success) {
        setIsLoggedIn(false);
        setUserData(null);
        toast.success(data.message);
        setShowUserMenu(false);
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Logout failed"
      );
    }
  }, [backendUrl, setIsLoggedIn, setUserData, navigate]);

  const handleLoginClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate("/login");
  }, [navigate]);

  // Check if current path matches the nav item
  const isActive = useCallback(
    (path) => {
      if (path === "/" && location.pathname === "/") return true;
      if (path !== "/" && location.pathname.startsWith(path)) return true;
      return false;
    },
    [location.pathname]
  );

  // Check if user is admin
  const isAdmin =
    userData?.role === "admin" ||
    userData?.role === "superadmin" ||
    userData?.isAdmin;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Animation variants
  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
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
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  return (
    <>
      <motion.header
        className="shadow-sm relative z-50 bg-white border-b border-gray-200"
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
                  className="h-auto w-36 sm:w-46 lg:w-56"
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
              {navItems.map((navItem) => (
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

            {/* Desktop Login/Admin Menu */}
            <motion.div className="hidden md:flex" variants={itemVariants}>
              {isLoggedIn ? (
                <div className="relative" ref={userMenuRef}>
                  <motion.button
                    onClick={toggleUserMenu}
                    className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-all duration-300 font-medium ${
                      isAdmin
                        ? "border-primary-green text-primary-green hover:bg-green-50 "
                        : "border-primary-brown text-primary-brown hover:text-primary-green hover:border-primary-green"
                    }`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isAdmin
                          ? "border border-primary-green text-white"
                          : "bg-primary-green text-white"
                      }`}
                    >
                      {isAdmin ? (
                        <Shield size={14} />
                      ) : (
                        userData?.firstName?.charAt(0) || "U"
                      )}
                    </div>
                    <span className="font-semibold">
                      {isAdmin ? "Admin" : userData?.firstName || "User"}
                    </span>
                    <motion.div
                      animate={{ rotate: showUserMenu ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={16} />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 overflow-hidden"
                      >
                        {/* User Info Header */}
                        <div
                          className={`px-4 py-3 ${
                            isAdmin ? "bg-green-50" : "bg-gray-50"
                          } border-b border-gray-100`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-primary-green text-white">
                              {isAdmin ? (
                                <Shield size={20} />
                              ) : (
                                userData?.firstName?.charAt(0) || "U"
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {userData?.firstName} {userData?.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {userData?.email}
                              </div>
                              {isAdmin && (
                                <div className="text-xs text-primary-green font-medium mt-1">
                                  Administrator
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          {isAdmin && (
                            <motion.button
                              onClick={() => {
                                navigate("/admin");
                                setShowUserMenu(false);
                              }}
                              className="flex items-center w-full text-left px-4 py-3 text-primary-green hover:bg-primary-green transition-all duration-200"
                              whileHover={{ x: 4 }}
                            >
                              <Settings size={18} className="mr-3" />
                              <span className="font-medium">Dashboard</span>
                            </motion.button>
                          )}

                          <motion.button
                            onClick={handleLogout}
                            className="flex items-center w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-all duration-200"
                            whileHover={{ x: 4 }}
                          >
                            <LogOut size={18} className="mr-3" />
                            <span className="font-medium">Sign Out</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button
                  onClick={handleLoginClick}
                  className="flex items-center space-x-2 px-6 py-2 border border-primary-brown rounded-lg text-primary-brown hover:text-primary-green hover:border-primary-green transition-all duration-300 font-medium"
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
              )}
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
                {navItems.map((navItem) => (
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

                {/* Mobile Login/Admin Buttons */}
                {isLoggedIn ? (
                  <div className="flex flex-col space-y-6 mt-8">
                    {/* User Info */}
                    <motion.div
                      className="text-center"
                      variants={mobileItemVariants}
                    >
                      <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-3 bg-primary-green text-white">
                        {isAdmin ? <Shield size={28} /> : "A"}
                      </div>
                      <div className="font-bold text-gray-900 text-lg">
                        {userData?.firstName} {userData?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {userData?.email}
                      </div>
                      {isAdmin && (
                        <div className="text-sm font-semibold mt-2 px-3 py-1 rounded-full inline-block bg-primary-brown text-primary-green">
                          Administrator
                        </div>
                      )}
                    </motion.div>

                    {/* Dashboard Button for Admin */}
                    {isAdmin && (
                      <motion.button
                        className="flex items-center justify-center space-x-3 px-8 py-4 border-2 border-primary-green rounded-xl text-primary-green hover:bg-green-50 font-semibold text-lg transition-all duration-300"
                        onClick={() => {
                          navigate("/admin");
                          toggleMenu();
                        }}
                        variants={mobileItemVariants}
                        whileHover={{ scale: 1.05, y: -3 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Settings size={22} />
                        <span>Dashboard</span>
                      </motion.button>
                    )}

                    {/* Logout Button */}
                    <motion.button
                      className="flex items-center justify-center space-x-3 px-8 py-4 border-2 border-red-500 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-300 font-semibold text-lg"
                      onClick={() => {
                        handleLogout();
                        toggleMenu();
                      }}
                      variants={mobileItemVariants}
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <LogOut size={22} />
                      <span>Sign Out</span>
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    className="flex items-center space-x-3 px-8 py-4 border-2 border-primary-brown rounded-xl text-primary-brown hover:text-primary-green hover:border-primary-green transition-all duration-300 font-semibold text-lg mt-8"
                    onClick={() => {
                      toggleMenu();
                      handleLoginClick();
                    }}
                    variants={mobileItemVariants}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.img
                      src="/catering.svg"
                      alt=""
                      className="h-6"
                      whileHover={{ rotate: 15 }}
                      transition={{ duration: 0.2 }}
                    />
                    <span>Login</span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
