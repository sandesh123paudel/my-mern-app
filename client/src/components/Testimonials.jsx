import React from "react";
import Slider from "react-slick";
import { motion } from "framer-motion";

// Import slick-carousel styles
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

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

const QuoteIcon = () => (
  <motion.svg
    width="44"
    height="40"
    viewBox="0 0 44 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-8 h-8"
    aria-hidden="true"
    initial={{ opacity: 0, rotate: -10 }}
    animate={{ opacity: 1, rotate: 0 }}
    transition={{ duration: 0.5, delay: 0.2 }}
  >
    <path
      d="M33.172 5.469q2.555 0 4.547 1.547a7.4 7.4 0 0 1 2.695 4.007q.47 1.711.469 3.61 0 2.883-1.125 5.86a22.8 22.8 0 0 1-3.094 5.577 33 33 0 0 1-4.57 4.922A35 35 0 0 1 26.539 35l-3.398-3.398q5.296-4.243 7.218-6.563 1.946-2.32 2.016-4.617-2.86-.329-4.781-2.461-1.923-2.133-1.922-4.992 0-3.117 2.18-5.297 2.202-2.203 5.32-2.203m-20.625 0q2.555 0 4.547 1.547a7.4 7.4 0 0 1 2.695 4.007q.47 1.711.469 3.61 0 2.883-1.125 5.86a22.8 22.8 0 0 1-3.094 5.577 33 33 0 0 1-4.57 4.922A35 35 0 0 1 5.914 35l-3.398-3.398q5.296-4.243 7.218-6.563 1.946-2.32 2.016-4.617-2.86-.329-4.781-2.461-1.922-2.133-1.922-4.992 0-3.117 2.18-5.297 2.202-2.203 5.32-2.203"
      fill="currentColor"
    />
  </motion.svg>
);

const StarIcon = ({ filled, index }) => (
  <motion.svg
    width="16"
    height="15"
    viewBox="0 0 16 15"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-4 h-4 ${filled ? "text-orange-500" : "text-gray-300"}`}
    aria-hidden="true"
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{
      duration: 0.3,
      delay: 0.3 + index * 0.1,
      type: "spring",
      stiffness: 200,
    }}
  >
    <path
      d="M7.524.464a.5.5 0 0 1 .952 0l1.432 4.41a.5.5 0 0 0 .476.345h4.637a.5.5 0 0 1 .294.904L11.563 8.85a.5.5 0 0 0-.181.559l1.433 4.41a.5.5 0 0 1-.77.559L8.294 11.65a.5.5 0 0 0-.588 0l-3.751 2.726a.5.5 0 0 1-.77-.56l1.433-4.41a.5.5 0 0 0-.181-.558L.685 6.123A.5.5 0 0 1 .98 5.22h4.637a.5.5 0 0 0 .476-.346z"
      fill="currentColor"
    />
  </motion.svg>
);

const TestimonialCard = ({ quote, name, role, imageUrl, rating }) => {
  return (
    <motion.div
      className="h-full w-full max-w-sm flex flex-col items-start border border-primary-green p-6 rounded-xl bg-white shadow-md hover:shadow-2xl transition-shadow duration-300"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={scaleIn}
      whileHover={{
        transition: { duration: 0.2 },
      }}
    >
      <QuoteIcon />

      <motion.div
        className="flex items-center justify-center mt-4 gap-1"
        aria-label={`Rating: ${rating} out of 5 stars`}
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {[...Array(5)].map((_, index) => (
          <StarIcon key={index} filled={index < rating} index={index} />
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
            color: #492a00;
          }
          .slick-dots li.slick-active button:before {
            color: #a4cd3d;
          }
        `}
      </style>

      <motion.div className="text-center mb-12" variants={fadeUp}>
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-amber-900"
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
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </Slider>
      </motion.div>
    </motion.div>
  );
};

export default Testimonials;
