import React from "react";
import { motion } from "framer-motion";
import {
  Home,
  Search,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const quickLinks = [
    {
      icon: Home,
      title: "Home",
      description: "Return to our homepage",
      path: "/",
    },
    {
      icon: Search,
      title: "Menu",
      description: "Browse our delicious offerings",
      path: "/menu",
    },
    {
      icon: MapPin,
      title: "About Us",
      description: "Learn more about MC Catering",
      path: "/about",
    },
    {
      icon: Phone,
      title: "Get Quote",
      description: "Request catering services",
      path: "/inquiry",
    },
  ];

  const contactInfo = [
    {
      icon: Phone,
      title: "Call Us",
      info: "0452453028 / 0449557777",
    },
    {
      icon: Mail,
      title: "Email",
      info: "info@mccatering.com.au",
    },
    {
      icon: MapPin,
      title: "Locations",
      info: "Sydney & Canberra",
    },
    {
      icon: Clock,
      title: "Hours",
      info: "Mon-Sun: 10AM-9PM",
    },
  ];

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "Lexend, sans-serif" }}
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
            {/* 404 Large Number */}
            <motion.div
              className="text-8xl md:text-9xl lg:text-[12rem] font-bold mb-4 opacity-10"
              style={{ color: "var(--primary-green)" }}
              variants={itemVariants}
            >
              404
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 mt-5 md:-mt-10"
              style={{ color: "var(--primary-brown)" }}
              variants={itemVariants}
            >
              PAGE NOT FOUND
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl mb-8"
              style={{ color: "var(--primary-brown)", fontStyle: "italic" }}
              variants={itemVariants}
            >
              Oops! Looks like this dish isn't on our menu
            </motion.p>

            <motion.p
              className="text-gray-600 text-lg mb-8 max-w-3xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              The page you're looking for might have been moved, deleted, or
              doesn't exist. But don't worry, there are plenty of delicious
              options waiting for you at MC Catering!
            </motion.p>

            {/* Quick Action Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={itemVariants}
            >
              <motion.button
                className="px-8 py-4 font-bold text-lg rounded-lg shadow-lg transition-all duration-300 flex items-center gap-3"
                style={{
                  backgroundColor: "var(--primary-green)",
                  color: "white",
                }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  navigate("/");
                  scrollTo(0, 0);
                }}
              >
                <Home size={20} />
                Go Home
              </motion.button>

              <motion.button
                className="px-8 py-4 font-bold text-lg rounded-lg border-2 transition-all duration-300 flex items-center gap-3"
                style={{
                  borderColor: "var(--primary-brown)",
                  color: "var(--primary-brown)",
                  backgroundColor: "transparent",
                }}
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "var(--primary-brown)",
                  color: "white",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  navigate(-1);
                }}
              >
                <ArrowLeft size={20} />
                Go Back
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Quick Links Section */}
      <motion.section
        className="py-16 bg-gray-50"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
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
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: "var(--primary-brown)" }}
            >
              Where would you like to go?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our popular sections and find what you're looking for
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {quickLinks.map((link, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200 cursor-pointer"
                variants={cardVariants}
                whileHover={{
                  y: -5,
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                }}
                transition={{ duration: 0.3 }}
                onClick={() => {
                  navigate(link.path);
                  scrollTo(0, 0);
                }}
              >
                <motion.div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "var(--primary-green)" }}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 200,
                  }}
                >
                  <link.icon className="w-8 h-8 text-white" />
                </motion.div>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: "var(--primary-brown)" }}
                >
                  {link.title}
                </h3>
                <p className="text-gray-600 text-sm">{link.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Contact Info Section */}
      <motion.section
        className="py-16"
        style={{ backgroundColor: "var(--primary-green)" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
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
              Need Help? Get in Touch
            </h2>
            <p className="text-white/90 max-w-2xl mx-auto">
              Our team is here to assist you with any questions about our
              catering services
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {contactInfo.map((contact, index) => (
              <motion.div
                key={index}
                className="text-center"
                variants={cardVariants}
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 200,
                  }}
                >
                  <contact.icon
                    className="w-10 h-10"
                    style={{ color: "var(--primary-green)" }}
                  />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {contact.title}
                </h3>
                <p className="text-white/80 text-sm">{contact.info}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-16 bg-white"
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
            <h2
              className="text-3xl md:text-4xl font-bold mb-6"
              style={{ color: "var(--primary-brown)" }}
            >
              Ready to taste authentic Nepal?
            </h2>
            <motion.p
              className="text-gray-600 text-lg mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Don't let a wrong turn stop you from experiencing the rich flavors
              of Nepalese cuisine. Let's get you back on track!
            </motion.p>
            <motion.button
              className="px-8 py-4 font-bold text-lg rounded-lg shadow-lg transition-all duration-300"
              style={{
                backgroundColor: "var(--primary-green)",
                color: "white",
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2)",
              }}
              onClick={() => {
                navigate("/inquiry");
                scrollTo(0, 0);
              }}
              whileTap={{ scale: 0.95 }}
            >
              Plan Your Event Now
            </motion.button>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default NotFound;
