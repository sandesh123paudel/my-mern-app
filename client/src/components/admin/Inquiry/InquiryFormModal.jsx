import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { submitInquiry } from "../../../services/inquiryService";
import { getLocations } from "../../../services/locationServices";
import { getServicesByLocation } from "../../../services/serviceServices";

const InquiryFormModal = ({ isOpen, onClose, onSuccess }) => {
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
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  // Load locations when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLocations();
    }
  }, [isOpen]);

  // Load services when venue changes
  useEffect(() => {
    if (formData.venue) {
      fetchServices(formData.venue);
    } else {
      setServices([]);
    }
  }, [formData.venue]);

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      const result = await getLocations();
      if (result.success) {
        setLocations(result.data);
      } else {
        toast.error("Failed to load locations");
        console.error("Error loading locations:", result.error);
      }
    } catch (error) {
      toast.error("Failed to load locations");
      console.error("Error loading locations:", error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchServices = async (locationId) => {
    try {
      setLoadingServices(true);
      const result = await getServicesByLocation(locationId);
      if (result.success) {
        setServices(result.data);
      } else {
        toast.error("Failed to load services for selected location");
        console.error("Error loading services:", result.error);
        setServices([]);
      }
    } catch (error) {
      toast.error("Failed to load services");
      console.error("Error loading services:", error);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If venue is changed, reset service type
    if (name === "venue") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        serviceType: "", // Reset service type when venue changes
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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
    setServices([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.dismiss();

    try {
      const result = await submitInquiry(formData);

      if (result.success) {
        toast.success(result.message || "Inquiry added successfully");
        onClose();
        onSuccess();
        resetForm();
      } else {
        toast.error(result.error || "Failed to add inquiry");
      }
    } catch (error) {
      toast.error("An error occurred while submitting the form");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 top-[-50px] bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <h2 className="text-xl font-bold text-amber-800">Add New Inquiry</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                name="name"
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                name="email"
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Contact *
              </label>
              <input
                type="text"
                name="contact"
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                value={formData.contact}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Event Date *
              </label>
              <input
                type="date"
                name="eventDate"
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                min={new Date().toISOString().split("T")[0]}
                value={formData.eventDate}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Guests *</label>
              <input
                type="number"
                name="numberOfPeople"
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                min={1}
                value={formData.numberOfPeople}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Venue *</label>
              <select
                name="venue"
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                value={formData.venue}
                onChange={handleChange}
                disabled={loading || loadingLocations}
              >
                <option value="">
                  {loadingLocations ? "Loading locations..." : "Select a venue"}
                </option>
                {locations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {location.name}
                  </option>
                ))}
              </select>
              {loadingLocations && (
                <p className="text-xs text-blue-500 mt-1">
                  Loading available venues...
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Service Type *
              </label>
              <select
                name="serviceType"
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                value={formData.serviceType}
                onChange={handleChange}
                disabled={loading || loadingServices || !formData.venue}
              >
                <option value="">
                  {!formData.venue
                    ? "Select a venue first"
                    : loadingServices
                    ? "Loading services..."
                    : "Select a service"}
                </option>
                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name}
                  </option>
                ))}
              </select>
              {!formData.venue && (
                <p className="text-xs text-gray-500 mt-1">
                  Please select a venue to see available services
                </p>
              )}
              {formData.venue && services.length === 0 && !loadingServices && (
                <p className="text-xs text-orange-500 mt-1">
                  No services available for this location
                </p>
              )}
              {loadingServices && (
                <p className="text-xs text-blue-500 mt-1">
                  Loading available services...
                </p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              name="message"
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={4}
              value={formData.message}
              onChange={handleChange}
              disabled={loading}
              placeholder="Additional details about your event..."
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                loadingLocations ||
                (!formData.venue && loadingServices)
              }
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Submitting...
                </span>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InquiryFormModal;
