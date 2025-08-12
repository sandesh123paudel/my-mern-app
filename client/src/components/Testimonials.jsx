import React from "react";
import Slider from "react-slick";
import { motion } from "framer-motion";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Quote, Star } from "lucide-react";

// Testimonial data (I've kept your original data)
const testimonialsData = [
  {
    quote:
      "The catering for our corporate event was flawless. The food was a huge hit, and the presentation was beautiful. Mul Chowk made everything so easy.",
    name: "Sarah L.",
    role: "Event Coordinator @ TechCorp",
    imageUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100",
    rating: 5,
  },
  {
    quote:
      "We had MC Catering for our wedding, and our guests are still talking about the delicious Momos and the Newari Khaja set. Truly authentic and professional service.",
    name: "David & Emily",
    role: "Newlyweds",
    imageUrl:
      "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=100",
    rating: 5,
  },
  {
    quote:
      "Fantastic service from start to finish. They helped us craft the perfect menu for our party, and the food was delivered hot and on time. Highly recommended!",
    name: "Michael B.",
    role: "Birthday Celebration",
    imageUrl:
      "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=100",
    rating: 4,
  },
  {
    quote:
      "The attention to detail was incredible. The team went above and beyond to make our anniversary special. We will definitely be using their services again.",
    name: "Jessica P.",
    role: "Anniversary Celebration",
    imageUrl:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100",
    rating: 5,
  },
];

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const slideInFromLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const StarIcon = ({ filled, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{
      duration: 0.3,
      delay: 0.3 + index * 0.1,
      type: "spring",
      stiffness: 200,
    }}
  >
    <Star
      size={16}
      className={`${filled ? "text-orange-500 fill-current" : "text-gray-300"}`}
    />
  </motion.div>
);

const TestimonialCard = ({ quote, name, role, imageUrl, rating, index }) => {
  return (
    <motion.div
      className="h-full w-full flex flex-col items-start border border-primary-green p-6 rounded-xl bg-white shadow-md hover:shadow-2xl transition-shadow duration-300"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={scaleIn}
      whileHover={{
        transition: { duration: 0.2 },
      }}
      transition={{ delay: index * 0.1 }}
    >
      <motion.div
        initial={{ opacity: 0, rotate: -10 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Quote className="w-8 h-8" style={{ color: "var(--primary-green)" }} />
      </motion.div>

      <motion.div
        className="flex items-center justify-center mt-4 gap-1"
        aria-label={`Rating: ${rating} out of 5 stars`}
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {[...Array(5)].map((_, starIndex) => (
          <StarIcon
            key={starIndex}
            filled={starIndex < rating}
            index={starIndex}
          />
        ))}
      </motion.div>

      <motion.p
        className="text-sm text-gray-600 mt-4 flex-grow"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        {quote}
      </motion.p>

      <motion.div
        className="flex items-center gap-4 mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <motion.img
          className="h-12 w-12 rounded-full object-cover"
          src={imageUrl}
          alt={`Photo of ${name}`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co/100x100/ccc/ffffff?text=User";
          }}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        />
        <div>
          <motion.h2
            className="text-base text-gray-900 font-semibold"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 1.1 }}
          >
            {name}
          </motion.h2>
          <motion.p
            className="text-sm text-gray-500"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 1.2 }}
          >
            {role}
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Testimonials = () => {
  const settings = {
    dots: true,
    infinite: testimonialsData.length > 3,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: testimonialsData.length > 2,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: testimonialsData.length > 1,
        },
      },
    ],
  };

  return (
    <motion.div
      className="py-16 px-4 overflow-hidden"
      style={{ fontFamily: "Lexend, sans-serif" }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
    >
      <style>
        {`
          .slick-slide > div {
            padding: 0 1rem;
          }
          .slick-dots li button:before {
            font-size: 12px;
            color: var(--primary-brown); /* Using the custom variable */
          }
          .slick-dots li.slick-active button:before {
            color: var(--primary-green); /* Using the custom variable */
          }
        `}
      </style>

      <motion.div className="text-center mb-12" variants={fadeUp}>
        <motion.h1
          className="text-3xl md:text-4xl font-bold"
          style={{ color: "var(--primary-brown)" }}
          variants={slideInFromLeft}
        >
          What Our Clients Say
        </motion.h1>
        <motion.p
          className="text-base md:text-lg text-gray-600 mt-4 max-w-2xl mx-auto"
          variants={fadeUp}
        >
          Hear from the happy clients who have trusted MC Catering for their
          special events.
        </motion.p>
      </motion.div>

      <motion.div
        className="max-w-6xl mx-auto mb-10"
        variants={fadeUp}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <Slider {...settings}>
          {testimonialsData.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} index={index} />
          ))}
        </Slider>
      </motion.div>
    </motion.div>
  );
};

export default Testimonials;