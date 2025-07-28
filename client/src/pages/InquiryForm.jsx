import React from "react";
import { motion } from "framer-motion";

const InquiryForm = () => {
  return (
    <div className="flex justify-center py-10 px-4">
      <motion.form
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-3xl bg-white p-8 rounded-2xl shadow-xl"
      >
        <p className="text-base text-primary-brown font-medium pb-1">
          Bringing Authentic Nepalese Flavors to Your Events in Sydney &
          Canberra
        </p>
        <h1 className="text-4xl font-semibold text-primary-green pb-4">
          Let's Plan Your Perfect Occasion
        </h1>
        <p className="text-sm text-gray-500 pb-8 leading-relaxed">
          Fill out the inquiry form below and we’ll get back to you with
          personalized options that suit your preferences best.
        </p>

        {/* Full Name & Email */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="w-full">
            <label className="text-black/70">Your Name</label>
            <input
              className="h-12 p-3 mt-2 w-full border border-gray-300 rounded-md outline-none focus:border-primary-green"
              type="text"
              placeholder="Enter your name"
              required
            />
          </div>
          <div className="w-full">
            <label className="text-black/70">Your Email</label>
            <input
              className="h-12 p-3 mt-2 w-full border border-gray-300 rounded-md outline-none focus:border-primary-green"
              type="email"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        {/* Contact, Date, People */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="w-full">
            <label className="text-black/70">Contact Number</label>
            <input
              className="h-12 p-3 mt-2 w-full border border-gray-300 rounded-md outline-none focus:border-primary-green"
              type="tel"
              placeholder="Enter your phone number"
              required
            />
          </div>
          <div className="w-full">
            <label className="text-black/70">Date of Event</label>
            <input
              className="h-12 p-3 mt-2 w-full border border-gray-300 rounded-md outline-none focus:border-primary-green"
              type="date"
              required
            />
          </div>
          <div className="w-full">
            <label className="text-black/70">No. of People</label>
            <input
              className="h-12 p-3 mt-2 w-full border border-gray-300 rounded-md outline-none focus:border-primary-green"
              type="number"
              placeholder="e.g. 50"
              min="1"
              required
            />
          </div>
        </div>

        {/* Venue & Service */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="w-full">
            <label className="text-black/70">Venue</label>
            <select
              className="h-12 mt-2 w-full border border-gray-300 rounded-md outline-none focus:border-primary-green px-3"
              required
            >
              <option value="">Select a venue</option>
              <option value="sydney">Sydney</option>
              <option value="canberra">Canberra</option>
            </select>
          </div>
          <div className="w-full">
            <label className="text-black/70">Service Type</label>
            <select
              className="h-12 mt-2 w-full border border-gray-300 rounded-md outline-none focus:border-primary-green px-3"
              required
            >
              <option value="">Select a service</option>
              <option value="catering">Catering</option>
              <option value="function">Function</option>
            </select>
          </div>
        </div>

        {/* Message */}
        <div className="mb-6">
          <label className="text-black/70">Message</label>
          <textarea
            className="w-full mt-2 p-3 h-36 border border-gray-300 rounded-md resize-none outline-none focus:border-primary-green"
            placeholder="Write your message..."
            required
          ></textarea>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          className="mt-2 bg-primary-green text-white font-medium h-12 w-full md:w-48 rounded-md transition duration-300 hover:bg-primary-brown"
        >
          Send Message
        </motion.button>
      </motion.form>
    </div>
  );
};

export default InquiryForm;
