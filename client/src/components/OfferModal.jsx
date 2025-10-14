import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const OfferModal = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Two offers configuration
  const offers = [
    {
      locationId: "68929617b22f8e0df0a3a03c",
      locationName: "Sydney",
      buttonText: "View Sydney Packages",
    },
    {
      locationId: "68913baa69565fd03474f60f",
      locationName: "Canberra",
      buttonText: "View Canberra Packages",
    },
  ];

  useEffect(() => {
    const checkModalExpiry = () => {
      const today = new Date().toDateString();
      const lastShown = sessionStorage.getItem("offerModalLastShown");

      if (lastShown !== today) {
        setIsOpen(true);
        sessionStorage.setItem("offerModalLastShown", today);
      }
    };

    const timer = setTimeout(checkModalExpiry, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => (document.body.style.overflow = "unset");
  }, [isOpen]);

  const handleOfferClick = (offer) => {
    navigate("/menu", {
      state: {
        preSelectedLocationId: offer.locationId,
        locationName: offer.locationName,
        fromOffer: true,
      },
    });
    setIsOpen(false);
  };

  const handleClose = () => setIsOpen(false);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
    exit: { opacity: 0, scale: 0.8, y: 50, transition: { duration: 0.2 } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={handleClose}
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
              {/* Poster Image */}
              <div className="aspect-square w-full relative overflow-hidden bg-gradient-to-br from-[#112e12] to-[#2d5a2f]">
                <img
                  src="/festiveoffer.jpg"
                  alt="Special Offer"
                  className="w-full h-full object-cover"
                  onError={(e) => (e.target.style.display = "none")}
                />
              </div>

              {/* Navigation Buttons (TWO BUTTONS INLINE) */}
              <div className="p-6  bg-white">
                <div className="flex gap-4">
                  {offers.map((offer, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleOfferClick(offer)}
                      className="flex-1 py-2  bg-primary-green hover:bg-primary-brown text-white rounded-lg font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                    >
                      {offer.buttonText}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfferModal;
