import { Facebook, Instagram } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";

const footerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
      delayChildren: 0.2,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const Footer = () => {
  return (
    <motion.footer
      className="w-full bg-white border-t border-gray-200"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={footerVariants}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-3 flex flex-col gap-4">
        {/* Social Icons */}
        <motion.div className="flex gap-4 text-xl" variants={itemVariants}>
          <a
            href="https://www.facebook.com/mulchowkkitchen/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-green hover:scale-110 transition-all duration-200"
            aria-label="Facebook"
          >
            <Facebook />
          </a>
          <a
            href="https://www.instagram.com/mulchowkkitchen/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-green hover:scale-110 transition-all duration-200"
            aria-label="Instagram"
          >
            <Instagram />
          </a>
        </motion.div>

        {/* Bottom Row: Left and Right Aligned */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center text-sm text-gray-600"
          variants={itemVariants}
        >
          {/* Left Side */}
          <div className="flex flex-col gap-1 text-left">
            <div>
              © {new Date().getFullYear()}{" "}
              <span className="font-semibold text-base">
                MC Catering Services
              </span>
              . All rights reserved.
            </div>
            <a
              href="https://mulchowkkitchen.com.au/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:text-primary-green transition duration-150"
            >
              A Joint Venture of Mul Chowk Kitchen
            </a>
          </div>

          {/* Right Side */}
          <div className="mt-4 md:mt-0 text-left items-end md:text-right">
            <span>Crafted by </span>
            <a
              href="https://www.linkedin.com/in/sandeshpaudel"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:text-primary-green transition duration-150"
            >
              Sandesh Paudel
            </a>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;
