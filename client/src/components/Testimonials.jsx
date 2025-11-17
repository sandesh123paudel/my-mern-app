import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const Testimonials = () => {
  const widgetId = "shapo-widget-adf21eaec9c69725506c";
  const containerRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Recreate the widget container every mount
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      const div = document.createElement("div");
      div.id = widgetId;
      containerRef.current.appendChild(div);
    }

    const existing = document.querySelector(
      'script[src="https://cdn.shapo.io/js/embed.js"]'
    );

    // If script already exists
    if (existing) {
      if (existing.dataset.loaded === "true") {
        setScriptLoaded(true);
      } else {
        existing.addEventListener("load", () => setScriptLoaded(true));
      }
      return;
    }

    // Create script
    const script = document.createElement("script");
    script.src = "https://cdn.shapo.io/js/embed.js";
    script.defer = true;

    script.onload = () => {
      script.dataset.loaded = "true";
      setScriptLoaded(true);
    };

    script.onerror = () => {
      console.error("Shapo widget failed to load.");
    };

    document.body.appendChild(script);
  }, []);

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

      {/* SHAPO WIDGET */}
      <div className="max-w-6xl mx-auto mt-10">
        <div ref={containerRef}>
          <div id={widgetId}></div>
        </div>

        {!scriptLoaded && (
          <div className="text-center py-6 text-gray-500">
            Loading reviews…
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Testimonials;
