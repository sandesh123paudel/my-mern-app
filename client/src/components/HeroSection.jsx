import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Play, Pause } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getLocations } from "../services/locationServices";

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

// Updated slide variants for seamless transitions
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 1,
    scale: 1,
    zIndex: 1,
  }),
  center: {
    zIndex: 2,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? "100%" : "-100%",
    opacity: 1,
    scale: 1,
  }),
};

// Smoother transition settings
const transition = {
  x: { type: "spring", stiffness: 400, damping: 40 },
  opacity: { duration: 0.2 },
  scale: { duration: 0.2 },
};

const HeroSection = () => {
  const navigate = useNavigate();

  // Slideshow data - you can replace these with your actual images
  const slides = [
    {
      image: "/herosection.png",
      title: "Authentic Nepalese Flavors",
      subtitle: "Traditional recipes passed down through generations",
    },
    {
      image: "/herosection2.png", // Add your second image
      title: "Premium Catering Services",
      subtitle: "Professional service for every occasion",
    },
    {
      image: "/herosection3.png", // Add your third image
      title: "Fresh & Quality Ingredients",
      subtitle: "Sourced locally for the best taste",
    },
  ];

  // State management
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load locations from API
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const result = await getLocations();
        if (result.success) {
          setLocations(result.data);
        } else {
          console.error("Failed to load locations:", result.error);
        }
      } catch (error) {
        console.error("Error loading locations:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLocations();
  }, []);

  // Auto-slide functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const paginate = (newDirection) => {
    setDirection(newDirection);
    setCurrentSlide((prev) => {
      if (newDirection === 1) {
        return (prev + 1) % slides.length;
      } else {
        return prev === 0 ? slides.length - 1 : prev - 1;
      }
    });
  };

  const handleLocationSelect = (locationId) => {
    // Navigate to menu page with selected location immediately
    navigate("/menu", {
      state: {
        preSelectedLocationId: locationId,
        locationName: locations.find((loc) => loc._id === locationId)?.name,
      },
    });
  };

  const handleExploreOfferings = () => {
    // Always navigate to general menu page without location
    navigate("/menu");
  };

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
          <motion.p className="text-sm md:text-md lg:text-lg font-bold text-primary-green mb-1 leading-tight hover:text-primary-brown transition duration-500">
            <a
              href="https://mulchowkkitchen.com.au/"
              target="_blank"
              rel="noopener noreferrer"
              alt="Mul Chowk Kitchen - Nepalese Restaurant and Bar"
            >
              A Joint Venture of Mul Chowk Kitchen
            </a>
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-brown mb-6 leading-tight"
          >
            NEPALESE CATERING
            <br />
            in{" "}
            <span className="italic font-light text-primary-brown/80">
              Sydney & Canberra
            </span>
          </motion.h1>

          {/* Enhanced Slideshow with Location Buttons */}
          <motion.div variants={fadeUp} className="relative mb-16 z-10">
            {/* Slideshow Container - Enhanced styling */}
            <div className="relative h-[500px] w-full rounded-lg overflow-hidden shadow-xl bg-gray-900">
              {/* Background fallback image to prevent white flash */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${slides[0].image})` }}
              />

              {/* Location Selection Buttons - Top Right */}
              <motion.div
                className="absolute top-4 right-4 z-30 flex gap-2"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                viewport={{ once: true }}
              >
                {!loading &&
                  locations.map((location) => (
                    <motion.button
                      key={location._id}
                      onClick={() => handleLocationSelect(location._id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg backdrop-blur-sm bg-[#FF6B35] text-white hover:bg-primary-green"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MapPin className="w-4 h-4" />
                      {location.name}
                    </motion.button>
                  ))}
              </motion.div>

              {/* Slide Images Container */}
              <div className="absolute inset-0 overflow-hidden">
                <AnimatePresence
                  initial={false}
                  custom={direction}
                  mode="popLayout"
                >
                  <motion.div
                    key={currentSlide}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={transition}
                    className="absolute inset-0 will-change-transform"
                  >
                    <div className="relative h-full w-full">
                      {/* Image with object-cover to fill container */}
                      <img
                        src={slides[currentSlide].image}
                        alt={slides[currentSlide].title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />

                      {/* Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                      {/* Slide Content */}
                      <motion.div
                        className="absolute bottom-6 left-6 text-white"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                      >
                        <div className="bg-primary-brown backdrop-blur-sm rounded-lg p-4 inline-block">
                          <h3 className="text-2xl md:text-3xl text-primary-green font-bold mb-2">
                            {slides[currentSlide].title}
                          </h3>
                          <p className="text-white/90 max-w-md">
                            {slides[currentSlide].subtitle}
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Arrows */}
              <motion.button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 z-20"
                onClick={() => paginate(-1)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>

              <motion.button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 z-20"
                onClick={() => paginate(1)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>

              {/* Play/Pause Button - Moved to bottom left */}
              <motion.button
                className="absolute bottom-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 z-20"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isAutoPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </motion.button>

              {/* Slide Indicators - Bottom center */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {slides.map((_, index) => (
                  <motion.button
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? "bg-white scale-125"
                        : "bg-white/50 hover:bg-white/70"
                    }`}
                    onClick={() => {
                      setDirection(index > currentSlide ? 1 : -1);
                      setCurrentSlide(index);
                    }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            </div>
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
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative"
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
                      <div className="w-8 h-8 rounded-full relative">
                        {value === "Excellence" && (
                          <img
                            src="/excellence.svg"
                            alt="Excellence"
                            className=""
                          />
                        )}
                        {value === "Innovation" && (
                          <img
                            src="/innovate.svg"
                            alt="Innovation"
                            className=""
                          />
                        )}
                        {value === "Quality" && (
                          <img src="/quality.svg" alt="Quality" className="" />
                        )}
                        {value === "Sustainability" && (
                          <img
                            src="/sustain.svg"
                            alt="Sustainability"
                            className=""
                          />
                        )}
                      </div>
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{value}</h3>
                  <p className="text-white/90 text-sm leading-relaxed whitespace-pre-line">
                    {value === "Excellence" &&
                      "Unforgettable Nepali\nExperiences"}
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
