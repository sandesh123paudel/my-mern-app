import React from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Users,
  MapPin,
  Award,
  ChefHat,
  Clock,
  Star,
  Utensils,
  Globe,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const About = () => {
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

  const values = [
    {
      icon: Heart,
      title: "Authenticity",
      description:
        "Traditional recipes passed down through generations, bringing genuine Nepalese flavors to every dish",
    },
    {
      icon: Users,
      title: "Community",
      description:
        "Building connections through food, serving both Nepalese community and introducing Australian locals to our culture",
    },
    {
      icon: Award,
      title: "Quality",
      description:
        "Premium ingredients, expert preparation, and unwavering commitment to excellence in every meal",
    },
    {
      icon: Globe,
      title: "Cultural Bridge",
      description:
        "Sharing the rich heritage of Nepal through cuisine, creating cultural understanding and appreciation",
    },
  ];

  const achievements = [
    { number: "2022", label: "Established in Canberra" },
    { number: "2+", label: "Cities Served" },
    { number: "1000+", label: "Happy Customers" },
    { number: "50+", label: "Signature Dishes" },
  ];

  const services = [
    "Custom catering packages for 10-200 guests",
    "100% Halal menu options available",
    "Vegan, vegetarian & non-vegetarian choices",
    "Allergy-friendly and dietary accommodations",
    "Professional setup and service team",
    "Prompt delivery across Sydney & Canberra",
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
                About Us
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              style={{ color: "var(--primary-brown)" }}
              variants={itemVariants}
            >
              ABOUT MC CATERING
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl mb-8"
              style={{ color: "var(--primary-brown)", fontStyle: "italic" }}
              variants={itemVariants}
            >
              A venture of{" "}
              <span className="font-semibold">Mul Chowk Kitchen</span>
            </motion.p>

            <motion.p
              className="text-gray-600 text-lg mb-8 max-w-3xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              Bringing the authentic flavors of Nepal to your special occasions
              across Sydney and Canberra. From intimate family gatherings to
              grand celebrations, we craft memorable culinary experiences that
              honor tradition while embracing innovation.
            </motion.p>
          </motion.div>
        </div>
      </motion.section>

      {/* Our Story Section */}
      <motion.section
        className="py-16 bg-gray-50"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-3xl md:text-4xl font-bold mb-6"
                style={{ color: "var(--primary-brown)" }}
              >
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  MC Catering Services began as a natural extension of Mul Chowk
                  Kitchen, which opened its doors in Campsie, Sydney, before
                  expanding to Mawson, Canberra in 2022. What started as a
                  single restaurant's mission to serve authentic Nepalese
                  cuisine has grown into a comprehensive catering service that
                  brings the warmth of Nepalese hospitality to events across two
                  major Australian cities.
                </p>
                <p>
                  Our vision has always been to become a well-known and
                  respected name in the Australian restaurant industry, offering
                  a unique dining experience that celebrates Nepalese culture
                  and cuisine. Through MC Catering, we extend this vision beyond
                  our restaurant walls, bringing authentic flavors directly to
                  your celebrations.
                </p>
                <p>
                  At Mul Chowk Kitchen, we take pride in offering a menu
                  showcasing Nepalese food in its best serving, and this same
                  commitment to excellence drives our catering services. Every
                  dish tells a story of tradition, crafted with recipes passed
                  down through generations.
                </p>
              </div>
            </motion.div>

            {/* Image Placeholder / Stats */}
            <motion.div
              className="grid grid-cols-2 gap-6"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, staggerChildren: 0.1 }}
            >
              {achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="text-3xl font-bold mb-2"
                    style={{ color: "var(--primary-green)" }}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 200,
                    }}
                  >
                    {achievement.number}
                  </motion.div>
                  <div className="text-gray-600 text-sm font-medium">
                    {achievement.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Our Values Section */}
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
              OUR CORE VALUES
            </h2>
            <p className="text-white/90 max-w-2xl mx-auto">
              The principles that guide everything we do, from sourcing
              ingredients to serving your guests
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {values.map((value, index) => (
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
                  <value.icon
                    className="w-10 h-10"
                    style={{ color: "var(--primary-green)" }}
                  />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {value.title}
                </h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* What We Offer Section */}
      <motion.section
        className="py-16 bg-gray-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Services List */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-3xl md:text-4xl font-bold mb-6"
                style={{ color: "var(--primary-brown)" }}
              >
                What We Offer
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                At MC Catering Services, we specialize in bringing rich flavors
                of Nepal straight to your event — whether it's a small gathering
                or a large celebration.
              </p>

              <motion.div
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {services.map((service, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-3"
                    variants={itemVariants}
                  >
                    <CheckCircle
                      size={20}
                      style={{ color: "var(--primary-green)" }}
                      className="mt-0.5 flex-shrink-0"
                    />
                    <span className="text-gray-600">{service}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Event Types */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
                <h3
                  className="text-2xl font-bold mb-6"
                  style={{ color: "var(--primary-brown)" }}
                >
                  Perfect For Your Events
                </h3>

                <motion.div
                  className="grid grid-cols-2 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {[
                    { icon: Heart, label: "Weddings & Cultural Ceremonies" },
                    { icon: Users, label: "Birthday Parties & Anniversaries" },
                    {
                      icon: Utensils,
                      label: "Corporate Lunches & Office Events",
                    },
                    { icon: Star, label: "Community Events & Private Dinners" },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="text-center p-4"
                      variants={itemVariants}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <item.icon
                        className="w-8 h-8 mx-auto mb-2"
                        style={{ color: "var(--primary-green)" }}
                      />
                      <p className="text-sm text-gray-600 font-medium">
                        {item.label}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Why Choose Us Section */}
      <motion.section
        className="py-16"
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
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: "var(--primary-brown)" }}
            >
              Why Choose MC Catering
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our commitment to quality, food hygiene, and Nepalese food
              authenticity sets us apart from other dining options.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                icon: ChefHat,
                title: "Expert Chefs",
                description:
                  "Our skilled chefs bring years of experience and passion to Nepalese cuisine, using traditional cooking techniques",
              },
              {
                icon: Clock,
                title: "Reliable Service",
                description:
                  "Prompt delivery and professional setup across Sydney & Canberra with friendly team support from order to service",
              },
              {
                icon: Award,
                title: "Proven Excellence",
                description:
                  "Recognized as one of the best Nepalese restaurants, with authentic recipes and fresh, locally sourced ingredients",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200"
                variants={cardVariants}
                whileHover={{
                  y: -5,
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                }}
                transition={{ duration: 0.3 }}
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
                  <feature.icon className="w-8 h-8 text-white" />
                </motion.div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: "var(--primary-brown)" }}
                >
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
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
              Ready to plan your event?
            </h2>
            <motion.p
              className="text-white/90 text-lg mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Get in touch with our team today to discuss packages, dates, and
              menu customizations.
            </motion.p>
            <motion.button
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
              onClick={() => {
                navigate("/inquiry");
                scrollTo(0, 0);
              }}
              whileTap={{ scale: 0.95 }}
            >
              Start Planning Your Event
            </motion.button>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default About;
