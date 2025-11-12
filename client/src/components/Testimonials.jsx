import React, { useEffect } from "react";
import Slider from "react-slick";
import { motion } from "framer-motion";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Quote, Star } from "lucide-react";

// your existing testimonial data (keep it or remove if only using Elfsight)
const testimonialsData = [
  /* ... your data here ... */
];

const Testimonials = () => {
  // 🧠 Load Elfsight script dynamically
  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src="https://elfsightcdn.com/platform.js"]'
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://elfsightcdn.com/platform.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const settings = {
    dots: true,
    infinite: testimonialsData.length > 3,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <motion.div
      className="py-16 px-4 overflow-hidden bg-gray-100 "
      style={{ fontFamily: "Lexend, sans-serif" }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      <motion.div className="text-center mb-12">
        <motion.h1
          className="text-3xl md:text-4xl font-bold"
          style={{ color: "var(--primary-brown)" }}
        >
          What Our Clients Say
        </motion.h1>
        <motion.p className="text-base md:text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
          Hear from our happy clients who have trusted MC Catering Services for
          their special events.
        </motion.p>
      </motion.div>

      {/* 🟢 Elfsight Google Reviews Widget */}
      <div className="max-w-6xl mx-auto mt-10 ">
        <div
          className="elfsight-app-818d7534-f9ff-4cf5-846a-d5157b064b97"
          data-elfsight-app-lazy
        ></div>
      </div>

      {/* Optional: Keep your custom slider below */}
      {/* <Slider {...settings}>
        {testimonialsData.map((testimonial, index) => (
          <TestimonialCard key={index} {...testimonial} index={index} />
        ))}
      </Slider> */}
    </motion.div>
  );
};

export default Testimonials;
