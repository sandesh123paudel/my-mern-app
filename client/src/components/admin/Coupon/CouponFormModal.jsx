import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Save,
  Loader2,
  AlertCircle,
  Tag,
  Percent,
  Calendar,
  Users,
  MapPin,
  Briefcase,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createCoupon,
  updateCoupon,
  validateCouponData,
} from "../../../services/couponService";

const CouponFormModal = ({
  isOpen,
  onClose,
  coupon,
  locations,
  services,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    discountPercentage: "",
    usageLimit: "",
    expiryDate: "",
    isActive: true,
    applicableLocations: [],
    applicableServices: [],
  });

  const [filteredServices, setFilteredServices] = useState([]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when modal opens or coupon changes
  useEffect(() => {
    if (isOpen) {
      if (coupon) {
        // Edit mode
        setFormData({
          code: coupon.code || "",
          name: coupon.name || "",
          discountPercentage: coupon.discountPercentage?.toString() || "",
          usageLimit: coupon.usageLimit?.toString() || "",
          expiryDate: coupon.expiryDate
            ? new Date(coupon.expiryDate).toISOString().split("T")[0]
            : "",
          isActive: coupon.isActive !== undefined ? coupon.isActive : true,
          applicableLocations: coupon.applicableLocations || [],
          applicableServices: coupon.applicableServices || [],
        });
      } else {
        // Create mode
        resetForm();
      }
      setErrors({});
    }
  }, [isOpen, coupon]);

  // Filter services based on selected location
  useEffect(() => {
    if (formData.applicableLocations.length > 0) {
      const selectedLocationId = formData.applicableLocations[0];
      const locationServices = services.filter((service) => {
        // Check if service belongs to the selected location
        const serviceLocationId = service.locationId?._id || service.locationId;
        return serviceLocationId === selectedLocationId;
      });
      setFilteredServices(locationServices);

      // Clear service selection if current service doesn't belong to selected location
      if (formData.applicableServices.length > 0) {
        const currentServiceId = formData.applicableServices[0];
        const serviceStillValid = locationServices.some(
          (service) => service._id === currentServiceId
        );
        if (!serviceStillValid) {
          setFormData((prev) => ({ ...prev, applicableServices: [] }));
        }
      }
    } else {
      setFilteredServices(services);
    }
  }, [formData.applicableLocations, services]);

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      discountPercentage: "",
      usageLimit: "",
      expiryDate: "",
      isActive: true,
      applicableLocations: [],
      applicableServices: [],
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleLocationChange = (locationId) => {
    setFormData((prev) => ({
      ...prev,
      applicableLocations: locationId === "" ? [] : [locationId],
    }));
  };

  const handleServiceChange = (serviceId) => {
    setFormData((prev) => ({
      ...prev,
      applicableServices: serviceId === "" ? [] : [serviceId],
    }));
  };

  const validateForm = () => {
    const validation = validateCouponData(formData);

    if (!validation.isValid) {
      const newErrors = {};
      validation.errors.forEach((error) => {
        if (error.includes("code")) newErrors.code = error;
        else if (error.includes("name")) newErrors.name = error;
        else if (error.includes("discount"))
          newErrors.discountPercentage = error;
        else if (error.includes("usage")) newErrors.usageLimit = error;
        else if (error.includes("expiry")) newErrors.expiryDate = error;
        else newErrors.general = error;
      });
      setErrors(newErrors);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      if (coupon) {
        // Update existing coupon
        result = await updateCoupon(coupon._id, formData);
      } else {
        // Create new coupon
        result = await createCoupon(formData);
      }

      if (result.success) {
        toast.success(
          result.message ||
            `Coupon ${coupon ? "updated" : "created"} successfully`
        );
        onSuccess();
        onClose();
      } else {
        toast.error(
          result.error || `Failed to ${coupon ? "update" : "create"} coupon`
        );
        if (result.error && result.error.includes("already exists")) {
          setErrors({ code: "This coupon code already exists" });
        }
      }
    } catch (error) {
      console.error("Error submitting coupon:", error);
      toast.error(`Failed to ${coupon ? "update" : "create"} coupon`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 top-[-50px] bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary-green text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tag size={24} />
            <h2 className="text-xl font-semibold">
              {coupon ? "Edit Coupon" : "Create New Coupon"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/90 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]"
        >
          <div className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 mt-0.5" />
                <p className="text-red-700 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., SAVE20"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-primary-green uppercase ${
                    errors.code ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                  maxLength={20}
                />
                {errors.code && (
                  <p className="text-red-600 text-xs mt-1">{errors.code}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  3-20 characters, letters and numbers only
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coupon Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., 20% Off Weekend Special"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-primary-green ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-red-600 text-xs mt-1">{errors.name}</p>
                )}
              </div>
            </div>

            {/* Discount and Usage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Percent size={14} />
                  Discount Percentage *
                </label>
                <input
                  type="number"
                  name="discountPercentage"
                  value={formData.discountPercentage}
                  onChange={handleInputChange}
                  placeholder="20"
                  min="0"
                  max="100"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-primary-green ${
                    errors.discountPercentage
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.discountPercentage && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.discountPercentage}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Users size={14} />
                  Usage Limit *
                </label>
                <input
                  type="number"
                  name="usageLimit"
                  value={formData.usageLimit}
                  onChange={handleInputChange}
                  placeholder="100"
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-primary-green ${
                    errors.usageLimit ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.usageLimit && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.usageLimit}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar size={14} />
                  Expiry Date *
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-primary-green ${
                    errors.expiryDate ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.expiryDate && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.expiryDate}
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary-green border-gray-300 rounded focus:ring-primary-green"
                  disabled={isSubmitting}
                />
                <span className="text-sm font-medium text-gray-700">
                  Active (customers can use this coupon)
                </span>
              </label>
            </div>

            {/* Location Restrictions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                <MapPin size={14} />
                Applicable Location (select one or leave empty for all
                locations)
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="location"
                      checked={formData.applicableLocations.length === 0}
                      onChange={() => handleLocationChange("")}
                      className="w-4 h-4 text-primary-green border-gray-300 focus:ring-primary-green"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm text-gray-700 font-medium">
                      All Locations
                    </span>
                  </label>
                  {locations.map((location) => (
                    <label
                      key={location._id}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="radio"
                        name="location"
                        checked={formData.applicableLocations.includes(
                          location._id
                        )}
                        onChange={() => handleLocationChange(location._id)}
                        className="w-4 h-4 text-primary-green border-gray-300 focus:ring-primary-green"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm text-gray-700">
                        {location.name} - {location.city}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Service Restrictions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                <Briefcase size={14} />
                Applicable Service (select one or leave empty for all services)
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="service"
                      checked={formData.applicableServices.length === 0}
                      onChange={() => handleServiceChange("")}
                      className="w-4 h-4 text-primary-green border-gray-300 focus:ring-primary-green"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm text-gray-700 font-medium">
                      {formData.applicableLocations.length > 0
                        ? "All Services for Selected Location"
                        : "All Services"}
                    </span>
                  </label>
                  {filteredServices.map((service) => (
                    <label
                      key={service._id}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="radio"
                        name="service"
                        checked={formData.applicableServices.includes(
                          service._id
                        )}
                        onChange={() => handleServiceChange(service._id)}
                        className="w-4 h-4 text-primary-green border-gray-300 focus:ring-primary-green"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm text-gray-700">
                        {service.name}
                      </span>
                    </label>
                  ))}
                  {formData.applicableLocations.length > 0 &&
                    filteredServices.length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        No services available for the selected location
                      </p>
                    )}
                </div>
              </div>
            </div>

            {/* Preview */}
            {formData.code && formData.discountPercentage && (
              <div className="bg-brown-50 border border-primary-green rounded-lg p-4">
                <h4 className="font-medium text-primary-green mb-2">Preview</h4>
                <div className="bg-white border-2 border-dashed border-primary-green rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-primary-green">
                    {formData.code}
                  </div>
                  <div className="text-sm text-primary-green">
                    {formData.discountPercentage}% OFF
                  </div>
                  {formData.name && (
                    <div className="text-xs text-gray-600 mt-1">
                      {formData.name}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {coupon ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {coupon ? "Update Coupon" : "Create Coupon"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CouponFormModal;
