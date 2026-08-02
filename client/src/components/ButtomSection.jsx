import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Animation variants
const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
      delay: 0.3,
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const BottomSection = () => {
  const navigate = useNavigate();

  const handleInquiryClick = () => {
    navigate("/inquiry");
    window.scrollTo(0, 0);
  };

  return (
    <div className="w-full overflow-hidden" style={{ backgroundColor: 'var(--primary-green)', fontFamily: 'Lexend, sans-serif' }}>
      <motion.div
        className="max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto flex flex-col md:flex-row items-center justify-between text-center md:text-left p-8 md:p-16 gap-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        {/* Text content */}
        <motion.div variants={slideInLeft}>
          <motion.h1
            className="text-4xl md:text-[46px] md:leading-[60px] font-semibold text-white"
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 1,
              ease: [0.25, 0.1, 0.25, 1],
              delay: 0.2,
            }}
          >
            Ready to try out our services?
          </motion.h1>
          <motion.p
            className="text-white text-lg mt-2"
            variants={fadeUp}
          >
            Your next favorite catering is just one click away.
          </motion.p>
        </motion.div>

        {/* Buttons container */}
        <motion.div 
          className="flex flex-row items-center gap-4"
          variants={fadeUp}
        >
          <motion.button
            onClick={handleInquiryClick}
            className="px-6 py-3 text-white border-2 border-white rounded-lg font-bold text-base transition-all duration-300 hover:shadow-lg"
            whileHover={{ 
              scale: 1.05,
              backgroundColor: 'white',
              color: 'var(--primary-green)',
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            Inquiry
          </motion.button>

          <motion.button
            onClick={() => {
              navigate("/menu");
              window.scrollTo(0, 0);
            }}
            className="px-6 py-3 bg-white font-bold text-base rounded-lg shadow-lg transition-all duration-300"
            style={{ color: "var(--primary-green)" }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            Menu
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default BottomSection;