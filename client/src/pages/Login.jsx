import React, { useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  axios.defaults.withCredentials = true;
  const { backendUrl, isLoggedIn, setIsLoggedIn, getUserData } =
    useContext(AppContext);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    let loginToastId = toast.loading("Logging in...");
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backendUrl + "/api/auth/login", {
        ...formData,
      });

      if (data.success) {
        setIsLoggedIn(true);
        // Update the loading toast to a success toast
        toast.success(data.message, { id: loginToastId });
        await getUserData(); // Ensure user data is fetched
        navigate("/");
      } else {
        // Update the loading toast to an error toast
        toast.error(data.message, { id: loginToastId });
      }
    } catch (error) {
      // If an error occurs (e.g., network error), dismiss/update the toast to error
      toast.error(
        error.response?.data?.message ||
          "An unexpected error occurred. Please try again.",
        {
          id: loginToastId,
        }
      );
    } finally {
      setIsSubmitting(false); // Always set loading to false after the process completes
    }
  };

  useEffect(() => {
    isLoggedIn && navigate("/");
  }, [isLoggedIn, navigate]);

  return (
    <div className="flex justify-center items-center py-20">
      <motion.form
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl"
        onSubmit={handleSubmit}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-primary-green mb-2">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-500">
            Sign in to your account to continue
          </p>
        </div>

        {/* Email */}
        <div className="mb-6">
          <label className="text-black/70 font-medium">Email Address *</label>
          <input
            className="h-12 p-3 mt-2 w-full border border-gray-300 rounded-md outline-none focus:border-primary-green transition-colors"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-black/70 font-medium">Password *</label>
          <input
            className="h-12 p-3 mt-2 w-full border border-gray-300 rounded-md outline-none focus:border-primary-green transition-colors"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={!isSubmitting ? { scale: 1.02 } : {}}
          whileTap={!isSubmitting ? { scale: 0.98 } : {}}
          type="submit"
          disabled={isSubmitting}
          className={`w-full font-medium h-12 rounded-md transition duration-300 ${
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
              Signing In...
            </span>
          ) : (
            "Sign In"
          )}
        </motion.button>
      </motion.form>
    </div>
  );
};

export default Login;
