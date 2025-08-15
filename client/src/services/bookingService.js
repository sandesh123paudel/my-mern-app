import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Set axios to use credentials (cookies) for all requests
axios.defaults.withCredentials = true;

/**
 * Create new booking (Public - No auth required)
 * Supports both regular menu bookings and custom orders
 * @param {Object} bookingData - The booking data to create
 * @returns {Object} Response with success status and data
 */
export const createBooking = async (bookingData) => {
  try {
    // Transform the data for custom orders
    let transformedData = { ...bookingData };
    
    if (bookingData.isCustomOrder) {
      // For custom orders, ensure the structure matches backend expectations
      transformedData = {
        ...bookingData,
        isCustomOrder: true,
        menu: {
          menuId: null, // Explicitly null for custom orders
          name: bookingData.menu?.name || "Custom Order",
          price: 0, // Custom orders use total pricing from selected items
          serviceId: bookingData.menu?.serviceId || null,
          serviceName: bookingData.menu?.serviceName || "Custom Order",
          locationId: bookingData.menu?.locationId,
          locationName: bookingData.menu?.locationName,
        },
        // Ensure selectedItems have the correct structure
        selectedItems: (bookingData.selectedItems || []).map(item => ({
          ...item,
          itemId: item.itemId || item._id,
          type: item.type || "selected",
        })),
      };
      
      // Remove any undefined values that might cause issues
      if (transformedData.menu.menuId === undefined) {
        transformedData.menu.menuId = null;
      }
      if (transformedData.menu.serviceId === undefined) {
        transformedData.menu.serviceId = null;
      }
      
  
    }

    const response = await axios.post(
      `${backendUrl}/api/bookings`,
      transformedData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 15000, // 15 second timeout
      }
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error creating booking:", error);
    console.error("Error response:", error.response?.data);
    console.error("Request data that failed:", error.config?.data);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        error.message ||
        "Failed to create booking",
    };
  }
};

export const getAllBookings = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Pagination params
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);

    // Filter params
    if (params.status) queryParams.append("status", params.status);
    if (params.deliveryType) queryParams.append("deliveryType", params.deliveryType);
    if (params.locationId) queryParams.append("locationId", params.locationId);
    if (params.serviceId) queryParams.append("serviceId", params.serviceId);
    if (params.orderType) queryParams.append("orderType", params.orderType);
    
    // Date range filters
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    
    // Search and sorting
    if (params.search) queryParams.append("search", params.search);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    // Payment filters
    if (params.paymentStatus) queryParams.append("paymentStatus", params.paymentStatus);
    
    // Customer filters
    if (params.customerEmail) queryParams.append("customerEmail", params.customerEmail);
    if (params.customerPhone) queryParams.append("customerPhone", params.customerPhone);

    const queryString = queryParams.toString();
    const url = `${backendUrl}/api/bookings${queryString ? `?${queryString}` : ""}`;

    const response = await axios.get(url, { timeout: 10000 });

    return {
      success: true,
      data: response.data.data.bookings || [],
      pagination: response.data.data.pagination || {},
      total: response.data.data.pagination?.totalCount || 0,
    };
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch bookings",
      data: [],
      pagination: {},
      total: 0,
    };
  }
};

/**
 * Get single booking by ID (Admin only)
 * @param {string} id - Booking ID
 * @returns {Object} Response with booking data
 */
export const getBookingById = async (id) => {
  try {
    if (!id) {
      throw new Error("Booking ID is required");
    }

    const response = await axios.get(`${backendUrl}/api/bookings/${id}`, {
      timeout: 10000,
    });
    return { 
      success: true, 
      data: response.data.data.booking,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching booking:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch booking",
    };
  }
};

/**
 * Get booking by reference number (Public)
 * @param {string} reference - Booking reference number
 * @returns {Object} Response with booking data
 */
export const getBookingByReference = async (reference) => {
  try {
    if (!reference) {
      throw new Error("Booking reference is required");
    }

    const response = await axios.get(`${backendUrl}/api/bookings/reference/${reference}`, {
      timeout: 10000,
    });
    return { 
      success: true, 
      data: response.data.data.booking,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching booking by reference:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch booking",
    };
  }
};

/**
 * Update booking status (Admin only)
 * @param {string} id - Booking ID
 * @param {Object} statusData - Status update data
 * @returns {Object} Response with updated booking
 */
export const updateBookingStatus = async (id, statusData) => {
  try {
    if (!id) {
      throw new Error("Booking ID is required");
    }

    const response = await axios.patch(
      `${backendUrl}/api/bookings/${id}/status`,
      statusData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    return {
      success: true,
      data: response.data.data.booking,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error updating booking status:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update booking status",
    };
  }
};

/**
 * Update payment status (Admin only)
 * @param {string} id - Booking ID
 * @param {Object} paymentData - Payment update data
 * @returns {Object} Response with updated booking
 */
export const updatePaymentStatus = async (id, paymentData) => {
  try {
    if (!id) {
      throw new Error("Booking ID is required");
    }

    // Validate payment data
    if (paymentData.depositAmount && paymentData.depositAmount < 0) {
      throw new Error("Deposit amount cannot be negative");
    }

    const response = await axios.patch(
      `${backendUrl}/api/bookings/${id}/payment`,
      paymentData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    return {
      success: true,
      data: response.data.data.booking,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error updating payment status:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update payment status",
    };
  }
};

/**
 * Update complete booking details (Admin only)
 * @param {string} id - Booking ID
 * @param {Object} bookingData - Complete booking update data
 * @returns {Object} Response with updated booking
 */
export const updateBooking = async (id, bookingData) => {
  try {
    if (!id) {
      throw new Error("Booking ID is required");
    }

    const response = await axios.put(
      `${backendUrl}/api/bookings/${id}`,
      bookingData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );
    return {
      success: true,
      data: response.data.data.booking,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error updating booking:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update booking",
    };
  }
};

/**
 * Get booking statistics (Admin only)
 * Supports filtering by location, service, order type, and date range
 * @param {Object} params - Filter parameters for statistics
 * @returns {Object} Response with statistical data
 */
export const getBookingStats = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Add filter params for stats
    if (params.locationId) queryParams.append("locationId", params.locationId);
    if (params.serviceId) queryParams.append("serviceId", params.serviceId);
    if (params.orderType) queryParams.append("orderType", params.orderType);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.period) queryParams.append("period", params.period);

    const queryString = queryParams.toString();
    const url = `${backendUrl}/api/bookings/stats${queryString ? `?${queryString}` : ""}`;

    const response = await axios.get(url, { timeout: 10000 });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Error fetching booking stats:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch booking statistics",
      data: {
        overview: {
          totalBookings: 0,
          totalRevenue: 0,
          totalPeople: 0,
          averageOrderValue: 0,
          customOrders: 0,
          regularOrders: 0,
          statusCounts: {},
        },
        popularItems: [],
      },
    };
  }
};

/**
 * Cancel booking with reason (Admin only)
 * @param {string} id - Booking ID
 * @param {Object} cancellationData - Cancellation data with reason
 * @returns {Object} Response with cancellation confirmation
 */
export const cancelBooking = async (id, cancellationData) => {
  try {
    if (!id) {
      throw new Error("Booking ID is required");
    }

    const response = await axios.delete(`${backendUrl}/api/bookings/${id}`, {
      data: cancellationData,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to cancel booking",
    };
  }
};

/**
 * Permanently delete booking (Admin only - use with caution)
 * @param {string} id - Booking ID
 * @returns {Object} Response with deletion confirmation
 */
export const deleteBookingPermanently = async (id) => {
  try {
    if (!id) {
      throw new Error("Booking ID is required");
    }

    const response = await axios.delete(`${backendUrl}/api/bookings/${id}/permanent`, {
      timeout: 10000,
    });
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error permanently deleting booking:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to permanently delete booking",
    };
  }
};

/**
 * Restore cancelled booking (Admin only)
 * @param {string} id - Booking ID
 * @returns {Object} Response with restored booking
 */
export const restoreBooking = async (id) => {
  try {
    if (!id) {
      throw new Error("Booking ID is required");
    }

    const response = await axios.patch(
      `${backendUrl}/api/bookings/${id}/restore`,
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
      data: response.data.data.booking,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error restoring booking:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to restore booking",
    };
  }
};

/**
 * Get bookings for a specific customer (Admin only)
 * @param {Object} customerData - Customer search criteria
 * @returns {Object} Response with customer's bookings
 */
export const getCustomerBookings = async (customerData) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (customerData.email) queryParams.append("email", customerData.email);
    if (customerData.phone) queryParams.append("phone", customerData.phone);
    if (customerData.name) queryParams.append("name", customerData.name);
    if (customerData.limit) queryParams.append("limit", customerData.limit);

    const queryString = queryParams.toString();
    const url = `${backendUrl}/api/bookings/customer${queryString ? `?${queryString}` : ""}`;

    const response = await axios.get(url, { timeout: 10000 });

    return {
      success: true,
      data: response.data.data.bookings || [],
      total: response.data.data.total || 0,
    };
  } catch (error) {
    console.error("Error fetching customer bookings:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch customer bookings",
      data: [],
      total: 0,
    };
  }
};

/**
 * Export bookings to CSV (Admin only)
 * @param {Object} params - Export parameters
 * @returns {Object} Response with CSV data or download link
 */
export const exportBookings = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add all filter params
    Object.keys(params).forEach(key => {
      if (params[key]) queryParams.append(key, params[key]);
    });

    const queryString = queryParams.toString();
    const url = `${backendUrl}/api/bookings/export${queryString ? `?${queryString}` : ""}`;

    const response = await axios.get(url, {
      responseType: 'blob',
      timeout: 30000, // Longer timeout for export
    });

    return {
      success: true,
      data: response.data,
      filename: response.headers['content-disposition']?.split('filename=')[1] || 'bookings.csv',
    };
  } catch (error) {
    console.error("Error exporting bookings:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to export bookings",
    };
  }
};

/**
 * Send booking confirmation email (Admin only)
 * @param {string} id - Booking ID
 * @returns {Object} Response with email confirmation
 */
export const sendBookingConfirmation = async (id) => {
  try {
    if (!id) {
      throw new Error("Booking ID is required");
    }

    const response = await axios.post(
      `${backendUrl}/api/bookings/${id}/send-confirmation`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error sending booking confirmation:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to send booking confirmation",
    };
  }
};

// ============================================================================
// CUSTOM ORDER SPECIFIC FUNCTIONS
// ============================================================================

//
/**
 * Create custom order
 * This is a specialized function for creating custom orders
 * @param {Object} customOrderData - Custom order data
 * @returns {Object} Response with created custom order
 */
export const createCustomOrder = async (customOrderData) => {
  try {
    // Validate required fields for custom orders
    if (!customOrderData.locationId) {
      throw new Error("Location is required for custom orders");
    }
    if (!customOrderData.selectedItems || customOrderData.selectedItems.length === 0) {
      throw new Error("At least one item must be selected for custom orders");
    }
    if (!customOrderData.customerDetails) {
      throw new Error("Customer details are required");
    }

    // Transform custom order data to booking format
    const bookingData = {
      isCustomOrder: true,
      menu: {
        menuId: null, // No menu ID for custom orders
        name: "Custom Order",
        price: 0, // Custom orders use total pricing from selected items
        locationId: customOrderData.locationId,
        locationName: customOrderData.locationName,
        serviceId: null, // No service for custom orders
        serviceName: "Custom Order",
      },
      customerDetails: customOrderData.customerDetails,
      peopleCount: customOrderData.peopleCount || 1,
      selectedItems: customOrderData.selectedItems.map(item => ({
        ...item,
        type: "selected", // Mark as selected for custom orders
        itemId: item.itemId || item._id,
      })),
      pricing: customOrderData.pricing || {
        basePrice: 0,
        addonsPrice: customOrderData.totalPrice || 0,
        total: customOrderData.totalPrice || 0,
      },
      deliveryType: customOrderData.deliveryType || "Pickup",
      deliveryDate: customOrderData.deliveryDate,
      address: customOrderData.address,
      // Custom order specific notes
      adminNotes: `Custom Order - ${customOrderData.selectedItems.length} items selected`,
    };

    return await createBooking(bookingData);
  } catch (error) {
    console.error("Error creating custom order:", error);
    return {
      success: false,
      error: error.message || "Failed to create custom order",
    };
  }
};

/**
 * Get available items for custom orders
 * @param {Object} params - Filter parameters
 * @returns {Object} Response with available menu items
 */
export const getCustomOrderItems = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.locationId) queryParams.append("locationId", params.locationId);
    if (params.category) queryParams.append("category", params.category);
    if (params.isVegetarian) queryParams.append("isVegetarian", params.isVegetarian);
    if (params.isVegan) queryParams.append("isVegan", params.isVegan);

    const queryString = queryParams.toString();
    const url = `${backendUrl}/api/menu-items/available${queryString ? `?${queryString}` : ""}`;

    const response = await axios.get(url, { timeout: 10000 });

    return {
      success: true,
      data: response.data.data || [],
      categories: response.data.categories || {},
    };
  } catch (error) {
    console.error("Error fetching custom order items:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch available items",
      data: [],
      categories: {},
    };
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if booking is custom order
 * @param {Object} booking - Booking object
 * @returns {boolean} True if custom order
 */
export const isCustomOrder = (booking) => {
  return booking?.isCustomOrder === true || booking?.menu?.menuId === null;
};

/**
 * Get order type display name
 * @param {Object} booking - Booking object
 * @returns {string} Display name for order type
 */
export const getOrderTypeDisplay = (booking) => {
  if (isCustomOrder(booking)) {
    return "Custom Order";
  }
  return booking?.menu?.serviceName || "Regular Order";
};

/**
 * Format booking for display with enhanced information
 * @param {Object} booking - Booking object
 * @returns {Object} Enhanced booking object for display
 */
export const formatBookingForDisplay = (booking) => {
  const enhanced = {
    ...booking,
    displayType: isCustomOrder(booking) ? "Custom Order" : "Regular Booking",
    orderTypeDisplay: getOrderTypeDisplay(booking),
    isCustomOrder: isCustomOrder(booking),
  };

  if (isCustomOrder(booking)) {
    enhanced.customOrderInfo = {
      totalItems: booking.selectedItems?.length || 0,
      categories: booking.selectedItems?.reduce((acc, item) => {
        const category = item.category || "unknown";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}) || {},
      averageItemPrice: booking.selectedItems?.length > 0 
        ? (booking.pricing?.total || 0) / booking.selectedItems.length 
        : 0,
    };
  }

  return enhanced;
};

/**
 * Calculate booking totals
 * @param {Object} booking - Booking object
 * @returns {Object} Calculated totals
 */
export const calculateBookingTotals = (booking) => {
  const total = booking.pricing?.total || 0;
  const paid = booking.depositAmount || 0;
  const balance = total - paid;
  const paymentPercentage = total > 0 ? Math.round((paid / total) * 100) : 0;

  return {
    total,
    paid,
    balance,
    paymentPercentage,
    isFullyPaid: balance <= 0,
    hasDeposit: paid > 0,
  };
};

/**
 * Validate booking data before submission
 * @param {Object} bookingData - Booking data to validate
 * @returns {Object} Validation result
 */
export const validateBookingData = (bookingData) => {
  const errors = [];

  // Required fields validation
  if (!bookingData.customerDetails?.name) {
    errors.push("Customer name is required");
  }
  if (!bookingData.customerDetails?.email) {
    errors.push("Customer email is required");
  }
  if (!bookingData.customerDetails?.phone) {
    errors.push("Customer phone is required");
  }
  if (!bookingData.peopleCount || bookingData.peopleCount < 1) {
    errors.push("Number of people must be at least 1");
  }
  if (!bookingData.deliveryDate) {
    errors.push("Delivery/event date is required");
  }
  if (!bookingData.deliveryType) {
    errors.push("Service type (Pickup/Delivery) is required");
  }

  // Delivery specific validation
  if (bookingData.deliveryType === "Delivery") {
    if (!bookingData.address?.street) {
      errors.push("Street address is required for delivery");
    }
    if (!bookingData.address?.suburb) {
      errors.push("Suburb is required for delivery");
    }
    if (!bookingData.address?.postcode) {
      errors.push("Postcode is required for delivery");
    }
    if (!bookingData.address?.state) {
      errors.push("State is required for delivery");
    }
  }

  // Menu/Custom order validation
  if (isCustomOrder(bookingData)) {
    if (!bookingData.selectedItems || bookingData.selectedItems.length === 0) {
      errors.push("At least one item must be selected for custom orders");
    }
    if (!bookingData.menu?.locationId) {
      errors.push("Location is required for custom orders");
    }
  } else {
    if (!bookingData.menu?.menuId) {
      errors.push("Menu selection is required");
    }
  }

  // Date validation
  if (bookingData.deliveryDate) {
    const deliveryDate = new Date(bookingData.deliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (deliveryDate < today) {
      errors.push("Delivery date cannot be in the past");
    }
    
    // Check if it's Monday (0 = Sunday, 1 = Monday)
    if (deliveryDate.getDay() === 1) {
      errors.push("Delivery and pickup are not available on Mondays");
    }
  }

  // Email validation
  if (bookingData.customerDetails?.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingData.customerDetails.email)) {
      errors.push("Please enter a valid email address");
    }
  }

  // Phone validation (basic)
  if (bookingData.customerDetails?.phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]{8,}$/;
    if (!phoneRegex.test(bookingData.customerDetails.phone)) {
      errors.push("Please enter a valid phone number");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Format error message for user display
 * @param {string|Object} error - Error message or object
 * @returns {string} Formatted error message
 */
export const formatErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (Array.isArray(error)) {
    return error.join(', ');
  }
  
  return 'An unexpected error occurred';
};

// Export all functions as default object
export default {
  // Main booking operations
  createBooking,
  getAllBookings,
  getBookingById,
  getBookingByReference,
  updateBookingStatus,
  updatePaymentStatus,
  updateBooking,
  getBookingStats,
  cancelBooking,
  deleteBookingPermanently,
  restoreBooking,
  
  // Customer and export operations
  getCustomerBookings,
  exportBookings,
  sendBookingConfirmation,
  
  // Custom order operations
  createCustomOrder,
  getCustomOrderItems,
  
  // Utility functions
  isCustomOrder,
  getOrderTypeDisplay,
  formatBookingForDisplay,
  calculateBookingTotals,
  validateBookingData,
  formatErrorMessage,
};