import React from "react";
import { motion } from "framer-motion";

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const HeroSection = () => {
  return (
    <section className="relative py-10 lg:py-18">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Content */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px", amount: 0.3 }}
          variants={staggerContainer}
          className="text-start mb-16"
        >
          <motion.h1
            variants={fadeUp}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-brown mb-6 leading-tight"
          >
            DISCOVER CULINARY
            <br />
            EXCELLENCE{" "}
            <span className="italic font-light text-primary-brown/80">
              with Us
            </span>
          </motion.h1>

          {/* Food Grid Display */}
          <motion.div variants={fadeUp} className="relative mb-16 z-10">
            <motion.img
              src="/herosection.png"
              alt=""
              className="h-300px w-full object-cover rounded-lg shadow-xl"
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
              viewport={{ once: true, margin: "-50px" }}
            />

            {/* Explore Our Offerings Button */}
            <motion.div
              className="absolute -bottom-8 right-0 transform"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.4,
                duration: 0.8,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <motion.button
                className="bg-orange-500 text-white px-6 py-3 font-semibold hover:bg-orange-600 transition-colors duration-300 shadow-lg rounded-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                EXPLORE OUR OFFERINGS
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Core Values Section */}
      <div className={`bg-primary-green py-16 -mt-64 z-0 relative pt-72`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-12 text-white"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            viewport={{ once: true, margin: "-50px" }}
          >
            OUR CORE VALUES
          </motion.h2>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative"
            initial="hidden"
            whileInView="visible"
            variants={staggerContainer}
            viewport={{ once: true, margin: "-50px" }}
          >
            {/* Vertical separators for larger screens */}
            <div className="hidden lg:block absolute inset-0 pointer-events-none">
              {[1, 2, 3].map((_, index) => (
                <motion.div
                  key={index}
                  className="absolute top-0 bottom-0 w-px bg-white/30"
                  style={{ left: `${25 * (index + 1)}%` }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  whileInView={{ scaleY: 1, opacity: 1 }}
                  transition={{
                    delay: 0.5 + index * 0.1,
                    duration: 0.8,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  viewport={{ once: true }}
                />
              ))}
            </div>

            {/* Core Value Items */}
            {["Excellence", "Innovation", "Quality", "Sustainability"].map(
              (value, index) => (
                <motion.div
                  key={value}
                  variants={fadeUp}
                  className="text-center group relative"
                  whileHover={{ y: -5 }}
                >
                  <div className="mb-6 flex justify-center">
                    <motion.div
                      className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:bg-primary-brown/10 transition-colors duration-300"
                      whileHover={{ scale: 1.1 }}
                    >
                      <div className="w-8 h-8 bg-primary-brown rounded-full relative">
                        <div className="absolute inset-1 bg-white rounded-full"></div>
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-primary-brown rounded-full"></div>
                        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-primary-brown rounded-full"></div>
                      </div>
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{value}</h3>
                  <p className="text-white/90 text-sm leading-relaxed whitespace-pre-line">
                    {value === "Excellence" &&
                      "Unforgettable Culinary\nExperiences"}
                    {value === "Innovation" &&
                      "Dynamic, Fresh,\nExciting Flavors"}
                    {value === "Quality" &&
                      "Source to Plate Culinary\nDelights"}
                    {value === "Sustainability" &&
                      "Eco-friendly Dining\nPractices"}
                  </p>

                  {/* Mobile separator */}
                  {index < 3 && (
                    <motion.div
                      className="lg:hidden w-16 h-px bg-white/30 mx-auto mt-8"
                      initial={{ scaleX: 0, opacity: 0 }}
                      whileInView={{ scaleX: 1, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      viewport={{ once: true }}
                    />
                  )}
                </motion.div>
              )
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
