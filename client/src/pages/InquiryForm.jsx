import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const InquiryForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    eventDate: "",
    numberOfPeople: "",
    venue: "",
    serviceType: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Your Express API Endpoint
  const API_ENDPOINT = import.meta.env.VITE_BACKEND_URL;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      contact: "",
      eventDate: "",
      numberOfPeople: "",
      venue: "",
      serviceType: "",
      message: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Dismiss any existing toasts
    toast.dismiss();

    // Show loading toast
    const loadingToast = toast.loading("Sending your inquiry...");

    try {
      const response = await axios.post(
        `${API_ENDPOINT}/api/inquiry/submit-inquiry`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 seconds timeout
        }
      );

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (response.data.success) {
        toast.success(
          response.data.message ||
            "Inquiry submitted successfully! We'll get back to you soon!"
        );

        // Reset form data
        resetForm();

        // Navigate to home page after a short delay to let user see the success message
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        toast.error(
          response.data.message ||
            "An error occurred while submitting the form."
        );
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);

      console.error("Error submitting form:", error);

      let errorMessage = "An error occurred while submitting the form.";

      if (error.response) {
        // Server responded with error status
        errorMessage =
          error.response.data?.message ||
          `Server error (${error.response.status}). Please try again.`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage =
          "No response from server. Please check your connection and try again.";
      } else if (error.code === "ECONNABORTED") {
        // Request timeout
        errorMessage = "Request timeout. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex justify-center py-10 px-4">
        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-3xl bg-white p-8 rounded-2xl shadow-xl"
          onSubmit={handleSubmit}
        >
          <p className="text-base text-primary-brown font-medium pb-1">
            Bringing Authentic Nepalese Flavors to Your Events in Sydney &
            Canberra
          </p>
          <h1 className="text-4xl font-semibold text-primary-green pb-4">
            Let's Plan Your Perfect Occasion
          </h1>
          <p className="text-sm text-gray-500 pb-8 leading-relaxed">
            Fill out the inquiry form below and we'll get back to you with
            personalized options that suit your preferences best.
          </p>

          {/* Full Name & Email */}
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="w-full">
              <label className="text-black/70">Your Name *</label>
              <input
                className="h-12 p-3 mt-2 w-full border border-gray-300 rounded-md outline-none focus:border-primary-green transition-colors duration-200"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="w-full">
              <label className="text-black/70">Your Email *</label>
              <input
                className="h-12 p-3 mt-2 w-full border border-gray-300 rounded-md outline-none focus:border-primary-green transition-colors duration-200"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Contact, Date, People */}
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="w-full">
              <label className="text-black/70">Contact Number *</label>
              <input
                className="h-12 p-3 mt-2 w-full border border-gray-300 rounded-md outline-none focus:border-primary-green transition-colors duration-200"
                type="phone"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                placeholder="Enter your phone number"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="w-full">
              <label className="text-black/70">Date of Event *</label>
              <input
                className="h-12 p-3 mt-2 w-full border border-gray-300 rounded-md outline-none focus:border-primary-green transition-colors duration-200"
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="w-full">
              <label className="text-black/70">No. of People *</label>
              <input
                className="h-12 p-3 mt-2 w-full border border-gray-300 rounded-md outline-none focus:border-primary-green transition-colors duration-200"
                type="number"
                name="numberOfPeople"
                value={formData.numberOfPeople}
                onChange={handleChange}
                placeholder="e.g. 50"
                min="1"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Venue & Service */}
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="w-full">
              <label className="text-black/70">Venue *</label>
              <select
                className="h-12 mt-2 w-full border border-gray-300 rounded-md outline-none focus:border-primary-green px-3 transition-colors duration-200"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              >
                <option value="">Select a venue</option>
                <option value="sydney">Sydney</option>
                <option value="canberra">Canberra</option>
              </select>
            </div>
            <div className="w-full">
              <label className="text-black/70">Service Type *</label>
              <select
                className="h-12 mt-2 w-full border border-gray-300 rounded-md outline-none focus:border-primary-green px-3 transition-colors duration-200"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                required
                disabled={isSubmitting}
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
              className="w-full mt-2 p-3 h-36 border border-gray-300 rounded-md resize-none outline-none focus:border-primary-green transition-colors duration-200"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Write your message..."
              disabled={isSubmitting}
            ></textarea>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={!isSubmitting ? { scale: 1.03 } : {}}
            whileTap={!isSubmitting ? { scale: 0.97 } : {}}
            type="submit"
            disabled={isSubmitting}
            className={`mt-2 font-medium h-12 w-full md:w-48 rounded-md transition duration-300 ${
              isSubmitting
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-primary-green text-white hover:bg-primary-brown"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending...
              </span>
            ) : (
              "Send Message"
            )}
          </motion.button>

          <p className="text-xs text-gray-400 mt-4">* Required fields</p>
        </motion.form>
      </div>
    </>
  );
};

export default InquiryForm;
