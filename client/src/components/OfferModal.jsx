import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const OfferModal = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Single offer configuration - modify as needed (VERSION 1 STYLE)
  const offer = {
    locationId: "68929617b22f8e0df0a3a03c", // Replace with your actual location ID
    locationName: "Sydney", // Change to your preferred location
    buttonText: "View Sydney Packages", // Customize button text
  };

  // Check if modal should show (expires daily)
  useEffect(() => {
    const checkModalExpiry = () => {
      const today = new Date().toDateString();
      const lastShown = sessionStorage.getItem("offerModalLastShown");

      if (lastShown !== today) {
        setIsOpen(true);
        sessionStorage.setItem("offerModalLastShown", today);
      }
    };

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(checkModalExpiry, 100);
    return () => clearTimeout(timer);
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleOfferClick = () => {
    // Navigate to menu page with selected location (VERSION 1 FUNCTIONALITY)
    navigate("/menu", {
      state: {
        preSelectedLocationId: offer.locationId,
        locationName: offer.locationName,
        fromOffer: true,
      },
    });
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Modal backdrop and content variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleClose}
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <motion.div
              className="relative bg-transparent max-w-md w-full"
              variants={modalVariants}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <motion.button
                className="absolute -top-4 -right-4 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-800 hover:text-black shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-6 h-6" />
              </motion.button>

              {/* Poster Container */}
              <div className="relative bg-white rounded-xl overflow-hidden shadow-2xl">
                {/* Poster Image - Square aspect ratio */}
                <div className="aspect-square w-full relative overflow-hidden bg-gradient-to-br from-[#112e12] to-[#2d5a2f]">
                  <img
                    src="/dashainoffer.png" // Replace with your offer poster image path
                    alt="Special Offer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Hide the broken image and show fallback content
                      e.target.style.display = "none";
                    }}
                  />

                  {/* Fallback content - always rendered but hidden if image loads */}
                  {/* <div className="absolute inset-0 flex items-center justify-center text-white text-center px-6">
                    <div>
                      <h2 className="text-3xl font-bold mb-4">
                        🎉 Special Offer!
                      </h2>
                      <p className="text-lg opacity-90 mb-2">
                        Get 5% off on your total bill
                      </p>
                      <p className="text-sm opacity-80">on cash payment</p>
                    </div>
                  </div> */}
                </div>

                {/* Navigation Button */}
                <div className="p-6 bg-white">
                  <motion.button
                    onClick={handleOfferClick}
                    className="w-full py-4 bg-primary-green hover:bg-primary-brown text-white rounded-lg font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                    whileHover={{ y: -2 }}
                    whileTap={{ y: 0 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {offer.buttonText}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OfferModal;
