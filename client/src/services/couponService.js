import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Set axios to use credentials (cookies) for all requests
axios.defaults.withCredentials = true;

// ============================================================================
// PUBLIC FUNCTIONS (No authentication required)
// ============================================================================

/**
 * Validate coupon code (Public - for order confirmation)
 * @param {Object} couponData - Coupon validation data
 * @returns {Object} Response with coupon validation result
 */
export const validateCoupon = async (couponData) => {
  try {
    const { code, locationId, serviceId, orderTotal } = couponData;

    if (!code || !orderTotal) {
      throw new Error("Coupon code and order total are required");
    }

    const response = await axios.post(
      `${backendUrl}/api/coupons/validate`,
      {
        code: code.trim().toUpperCase(),
        locationId,
        serviceId,
        orderTotal: Number(orderTotal),
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to validate coupon",
    };
  }
};

// ============================================================================
// ADMIN FUNCTIONS (Authentication required)
// ============================================================================

/**
 * Get all coupons (Admin only)
 * @param {Object} params - Query parameters for filtering and pagination
 * @returns {Object} Response with coupons list
 */
export const getAllCoupons = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Pagination params
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);

    // Filter params
    if (params.isActive !== undefined) queryParams.append("isActive", params.isActive);
    if (params.search) queryParams.append("search", params.search);

    // Sorting params
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const queryString = queryParams.toString();
    const url = `${backendUrl}/api/coupons${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await axios.get(url, { timeout: 10000 });

    return {
      success: true,
      data: response.data.data.coupons || [],
      pagination: response.data.data.pagination || {},
      total: response.data.data.pagination?.totalCount || 0,
    };
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch coupons",
      data: [],
      pagination: {},
      total: 0,
    };
  }
};

/**
 * Get single coupon by ID (Admin only)
 * @param {string} id - Coupon ID
 * @returns {Object} Response with coupon data
 */
export const getCouponById = async (id) => {
  try {
    if (!id) {
      throw new Error("Coupon ID is required");
    }

    const response = await axios.get(`${backendUrl}/api/coupons/${id}`, {
      timeout: 10000,
    });

    return {
      success: true,
      data: response.data.data.coupon,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching coupon:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch coupon",
    };
  }
};

/**
 * Create new coupon (Admin only)
 * @param {Object} couponData - Coupon data to create
 * @returns {Object} Response with created coupon
 */
export const createCoupon = async (couponData) => {
  try {
    // Validate required fields
    if (!couponData.code || !couponData.name || !couponData.discountPercentage || !couponData.usageLimit || !couponData.expiryDate) {
      throw new Error("All required fields must be provided");
    }

    // Transform data to match backend expectations
    const transformedData = {
      code: couponData.code.trim().toUpperCase(),
      name: couponData.name.trim(),
      discountPercentage: Number(couponData.discountPercentage),
      usageLimit: Number(couponData.usageLimit),
      expiryDate: new Date(couponData.expiryDate).toISOString(),
      isActive: couponData.isActive !== undefined ? couponData.isActive : true,
      applicableLocations: couponData.applicableLocations || [],
      applicableServices: couponData.applicableServices || [],
    };

    const response = await axios.post(
      `${backendUrl}/api/coupons`,
      transformedData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    return {
      success: true,
      data: response.data.data.coupon,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error creating coupon:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to create coupon",
    };
  }
};

/**
 * Update coupon (Admin only)
 * @param {string} id - Coupon ID
 * @param {Object} couponData - Updated coupon data
 * @returns {Object} Response with updated coupon
 */
export const updateCoupon = async (id, couponData) => {
  try {
    if (!id) {
      throw new Error("Coupon ID is required");
    }

    // Transform data to match backend expectations
    const transformedData = {};
    
    if (couponData.code) transformedData.code = couponData.code.trim().toUpperCase();
    if (couponData.name) transformedData.name = couponData.name.trim();
    if (couponData.discountPercentage !== undefined) transformedData.discountPercentage = Number(couponData.discountPercentage);
    if (couponData.usageLimit !== undefined) transformedData.usageLimit = Number(couponData.usageLimit);
    if (couponData.expiryDate) transformedData.expiryDate = new Date(couponData.expiryDate).toISOString();
    if (couponData.isActive !== undefined) transformedData.isActive = couponData.isActive;
    if (couponData.applicableLocations !== undefined) transformedData.applicableLocations = couponData.applicableLocations;
    if (couponData.applicableServices !== undefined) transformedData.applicableServices = couponData.applicableServices;

    const response = await axios.put(
      `${backendUrl}/api/coupons/${id}`,
      transformedData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    return {
      success: true,
      data: response.data.data.coupon,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error updating coupon:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update coupon",
    };
  }
};

/**
 * Delete coupon (Admin only)
 * @param {string} id - Coupon ID
 * @returns {Object} Response with deletion confirmation
 */
export const deleteCoupon = async (id) => {
  try {
    if (!id) {
      throw new Error("Coupon ID is required");
    }

    const response = await axios.delete(`${backendUrl}/api/coupons/${id}`, {
      timeout: 10000,
    });

    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to delete coupon",
    };
  }
};

/**
 * Use coupon (increment usage count) - Admin only
 * @param {string} id - Coupon ID
 * @returns {Object} Response with updated coupon usage
 */
export const useCoupon = async (id) => {
  try {
    if (!id) {
      throw new Error("Coupon ID is required");
    }

    const response = await axios.put(
      `${backendUrl}/api/coupons/${id}/use`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    return {
      success: true,
      data: response.data.data.coupon,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error using coupon:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update coupon usage",
    };
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate coupon data before submission
 * @param {Object} couponData - Coupon data to validate
 * @returns {Object} Validation result
 */
export const validateCouponData = (couponData) => {
  const errors = [];

  // Required fields validation
  if (!couponData.code || !couponData.code.trim()) {
    errors.push("Coupon code is required");
  }

  if (!couponData.name || !couponData.name.trim()) {
    errors.push("Coupon name is required");
  }

  if (couponData.discountPercentage === undefined || couponData.discountPercentage === null) {
    errors.push("Discount percentage is required");
  } else {
    const discount = Number(couponData.discountPercentage);
    if (isNaN(discount) || discount < 0 || discount > 100) {
      errors.push("Discount percentage must be between 0 and 100");
    }
  }

  if (couponData.usageLimit === undefined || couponData.usageLimit === null) {
    errors.push("Usage limit is required");
  } else {
    const limit = Number(couponData.usageLimit);
    if (isNaN(limit) || limit < 1) {
      errors.push("Usage limit must be at least 1");
    }
  }

  if (!couponData.expiryDate) {
    errors.push("Expiry date is required");
  } else {
    const expiryDate = new Date(couponData.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
      errors.push("Expiry date cannot be in the past");
    }
  }

  // Code format validation
  if (couponData.code && couponData.code.trim()) {
    const code = couponData.code.trim();
    if (code.length < 3 || code.length > 20) {
      errors.push("Coupon code must be between 3 and 20 characters");
    }

    // Check for special characters (optional - adjust based on requirements)
    if (!/^[A-Za-z0-9]+$/.test(code)) {
      errors.push("Coupon code can only contain letters and numbers");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Format coupon for display
 * @param {Object} coupon - Coupon object
 * @returns {Object} Enhanced coupon object for display
 */
export const formatCouponForDisplay = (coupon) => {
  const now = new Date();
  const expiryDate = new Date(coupon.expiryDate);

  return {
    ...coupon,
    isExpired: expiryDate < now,
    isValid: coupon.isActive && expiryDate >= now && coupon.usedCount < coupon.usageLimit,
    remainingUses: Math.max(0, coupon.usageLimit - coupon.usedCount),
    usagePercentage: Math.round((coupon.usedCount / coupon.usageLimit) * 100),
    daysUntilExpiry: Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)),
    formattedExpiryDate: expiryDate.toLocaleDateString(),
    statusDisplay: getCouponStatusDisplay(coupon, expiryDate, now),
  };
};

/**
 * Get coupon status display text and color
 * @param {Object} coupon - Coupon object
 * @param {Date} expiryDate - Expiry date
 * @param {Date} now - Current date
 * @returns {Object} Status display information
 */
const getCouponStatusDisplay = (coupon, expiryDate, now) => {
  if (!coupon.isActive) {
    return {
      text: "Inactive",
      color: "gray",
      bgColor: "bg-gray-100 text-gray-800 border-gray-200"
    };
  }

  if (expiryDate < now) {
    return {
      text: "Expired",
      color: "red",
      bgColor: "bg-red-100 text-red-800 border-red-200"
    };
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    return {
      text: "Used Up",
      color: "orange",
      bgColor: "bg-orange-100 text-orange-800 border-orange-200"
    };
  }

  const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry <= 7) {
    return {
      text: "Expiring Soon",
      color: "yellow",
      bgColor: "bg-yellow-100 text-yellow-800 border-yellow-200"
    };
  }

  return {
    text: "Active",
    color: "green",
    bgColor: "bg-green-100 text-green-800 border-green-200"
  };
};

/**
 * Calculate discount amount
 * @param {number} orderTotal - Order total amount
 * @param {number} discountPercentage - Discount percentage
 * @returns {number} Discount amount
 */
export const calculateDiscountAmount = (orderTotal, discountPercentage) => {
  const total = Number(orderTotal) || 0;
  const percentage = Number(discountPercentage) || 0;
  return Math.round((total * percentage / 100) * 100) / 100; // Round to 2 decimal places
};

/**
 * Format error message for user display
 * @param {string|Object} error - Error message or object
 * @returns {string} Formatted error message
 */
export const formatErrorMessage = (error) => {
  if (typeof error === "string") {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (Array.isArray(error)) {
    return error.join(", ");
  }

  return "An unexpected error occurred";
};

// Export all functions as default object
export default {
  // Public functions
  validateCoupon,

  // Admin functions
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  useCoupon,

  // Utility functions
  validateCouponData,
  formatCouponForDisplay,
  calculateDiscountAmount,
  formatErrorMessage,
};