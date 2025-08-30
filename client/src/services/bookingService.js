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
    // Transform the data to match backend expectations
    let transformedData = {
      // Menu information - matches backend expectation
      menu: {
        menuId: bookingData.isCustomOrder
          ? null
          : bookingData.menu?.menuId || null,
        name:
          bookingData.menu?.name ||
          (bookingData.isCustomOrder ? "Custom Order" : "Order"),
        basePrice: bookingData.menu?.basePrice || bookingData.menu?.price || 0,
        locationId: bookingData.menu?.locationId,
        locationName: bookingData.menu?.locationName,
        serviceId: bookingData.menu?.serviceId,
        serviceName: bookingData.menu?.serviceName,
      },

      // Customer details - direct mapping
      customerDetails: {
        name: bookingData.customerDetails?.name || "",
        email: bookingData.customerDetails?.email || "",
        phone: bookingData.customerDetails?.phone || "",
        specialInstructions:
          bookingData.customerDetails?.specialInstructions || "",
        dietaryRequirements:
          bookingData.customerDetails?.dietaryRequirements || [],
        spiceLevel: bookingData.customerDetails?.spiceLevel || "medium",
      },

      // Order details
      peopleCount: bookingData.peopleCount || 1,
      deliveryType: bookingData.deliveryType || "Pickup",
      deliveryDate: bookingData.deliveryDate,

      // Address (conditional)
      address:
        bookingData.deliveryType === "Delivery"
          ? bookingData.address
          : undefined,

      // ADD THESE NEW VENUE FIELDS:
      isFunction: bookingData.isFunction || false,
      venueSelection: bookingData.venueSelection || undefined,
      venueCharge: bookingData.venueCharge || 0,
      couponCode: bookingData.couponCode || null,

      // Selected items - ensure proper format
      selectedItems: (bookingData.selectedItems || []).map((item) => ({
        name: item.name || "",
        description: item.description || "",
        pricePerPerson: item.pricePerPerson || 0,
        pricePerUnit: item.pricePerUnit || 0,
        pricePerOrder: item.pricePerOrder || 0,
        totalPrice: item.totalPrice || 0,
        category: item.category || "other",
        type: item.type || "selected",
        quantity: item.quantity || 1,
        groupName: item.groupName || item.category || "",
        isVegetarian: item.isVegetarian || false,
        isVegan: item.isVegan || false,
        allergens: Array.isArray(item.allergens) ? item.allergens : [],
        notes: item.notes || "",
      })),

      // Menu selections (for reference)
      menuSelections: bookingData.menuSelections || {},

      // Pricing information (UPDATE TO INCLUDE VENUE CHARGE)
      // Pricing information - DON'T add venue charge to total here
      pricing: {
        basePrice: bookingData.pricing?.basePrice || 0,
        modifierPrice: bookingData.pricing?.modifierPrice || 0,
        itemsPrice: bookingData.pricing?.itemsPrice || 0,
        addonsPrice: bookingData.pricing?.addonsPrice || 0,
        venueCharge: bookingData.venueCharge || 0,
        total: bookingData.pricing?.total || 0, // Use total as-is from frontend
      },
      // Custom order flag
      isCustomOrder: bookingData.isCustomOrder || false,
    };

    const response = await axios.post(
      `${backendUrl}/api/bookings`,
      transformedData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
    // ... rest of the function remains the same
  } catch (error) {
    console.error("❌ Error creating booking:", error);
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
    if (params.deliveryType)
      queryParams.append("deliveryType", params.deliveryType);
    if (params.locationId) queryParams.append("locationId", params.locationId);
    if (params.serviceId) queryParams.append("serviceId", params.serviceId);
    if (params.sourceType) queryParams.append("sourceType", params.sourceType); // Updated to match backend

    // Date range filters
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    // Search and sorting
    if (params.search) queryParams.append("search", params.search);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    // Dietary filters
    if (params.dietaryRequirement)
      queryParams.append("dietaryRequirement", params.dietaryRequirement);
    if (params.spiceLevel) queryParams.append("spiceLevel", params.spiceLevel);

    const queryString = queryParams.toString();
    const url = `${backendUrl}/api/bookings${
      queryString ? `?${queryString}` : ""
    }`;

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
 * @param {string} email - Optional email for verification
 * @returns {Object} Response with booking data
 */
export const getBookingByReference = async (reference, email = null) => {
  try {
    if (!reference) {
      throw new Error("Booking reference is required");
    }

    const url = `${backendUrl}/api/bookings/reference/${reference}${
      email ? `?email=${email}` : ""
    }`;

    const response = await axios.get(url, {
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

    const response = await axios.put(
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

    const response = await axios.put(
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
 * Supports filtering by location, service, source type, and date range
 * @param {Object} params - Filter parameters for statistics
 * @returns {Object} Response with statistical data
 */
export const getBookingStats = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Add filter params for stats
    if (params.locationId) queryParams.append("locationId", params.locationId);
    if (params.serviceId) queryParams.append("serviceId", params.serviceId);
    if (params.sourceType) queryParams.append("sourceType", params.sourceType); // Updated to match backend
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.date) queryParams.append("date", params.date); // For daily unique dishes

    const queryString = queryParams.toString();
    const url = `${backendUrl}/api/bookings/stats${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await axios.get(url, { timeout: 10000 });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Error fetching booking stats:", error);
    return {
      success: false,
      error:
        error.response?.data?.message || "Failed to fetch booking statistics",
      data: {
        overview: {
          totalBookings: 0,
          totalRevenue: 0,
          totalPeople: 0,
          averageOrderValue: 0,
          customOrders: 0,
          menuOrders: 0,
          statusBreakdown: {},
          dietaryBreakdown: {},
          spiceLevelBreakdown: {},
          uniqueDishesToday: 0,
        },
        popularItems: [],
        dailyTrends: [],
        categoryBreakdown: [],
      },
    };
  }
};

/**
 * Get unique dishes count for specific date (Dashboard feature)
 * @param {Object} params - Filter parameters including date
 * @returns {Object} Response with unique dishes data
 */
export const getUniqueDishesCount = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (params.date) queryParams.append("date", params.date);
    if (params.locationId) queryParams.append("locationId", params.locationId);
    if (params.serviceId) queryParams.append("serviceId", params.serviceId);

    const queryString = queryParams.toString();
    const url = `${backendUrl}/api/bookings/unique-dishes${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await axios.get(url, { timeout: 10000 });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Error fetching unique dishes count:", error);
    return {
      success: false,
      error:
        error.response?.data?.message || "Failed to fetch unique dishes data",
      data: {
        uniqueDishesCount: 0,
        totalQuantity: 0,
        totalRevenue: 0,
        dishes: [],
        categoryBreakdown: {},
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
export const cancelBooking = async (id, cancellationData = {}) => {
  try {
    if (!id) {
      throw new Error("Booking ID is required");
    }

    const response = await axios.put(
      `${backendUrl}/api/bookings/${id}/cancel`,
      {
        reason: cancellationData.reason || "",
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
    console.error("Error cancelling booking:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to cancel booking",
    };
  }
};

/**
 * Get bookings for a specific customer (Public with email verification)
 * @param {string} email - Customer email
 * @param {Object} params - Additional parameters
 * @returns {Object} Response with customer's bookings
 */
export const getBookingsByCustomer = async (email, params = {}) => {
  try {
    if (!email) {
      throw new Error("Customer email is required");
    }

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);

    const queryString = queryParams.toString();
    const url = `${backendUrl}/api/bookings/customer/${email}${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await axios.get(url, { timeout: 10000 });

    return {
      success: true,
      data: response.data.data.bookings || [],
      pagination: response.data.data.pagination || {},
      total: response.data.data.pagination?.totalCount || 0,
    };
  } catch (error) {
    console.error("Error fetching customer bookings:", error);
    return {
      success: false,
      error:
        error.response?.data?.message || "Failed to fetch customer bookings",
      data: [],
      pagination: {},
      total: 0,
    };
  }
};

/**
 * Get custom order configurations by location (Public)
 * @param {string} locationId - Location ID
 * @returns {Object} Response with custom order configurations
 */
export const getCustomOrdersByLocation = async (locationId) => {
  try {
    if (!locationId) {
      throw new Error("Location ID is required");
    }

    const response = await axios.get(
      `${backendUrl}/api/bookings/custom-orders/location/${locationId}`,
      {
        timeout: 10000,
      }
    );

    return {
      success: true,
      data: response.data.data.customOrders || [],
    };
  } catch (error) {
    console.error("Error fetching custom orders by location:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch custom orders",
      data: [],
    };
  }
};

/**
 * Get custom order configuration by ID (Public)
 * @param {string} id - Custom order configuration ID
 * @returns {Object} Response with custom order configuration
 */
export const getCustomOrderById = async (id) => {
  try {
    if (!id) {
      throw new Error("Custom order ID is required");
    }

    const response = await axios.get(
      `${backendUrl}/api/bookings/custom-orders/${id}`,
      {
        timeout: 10000,
      }
    );

    return {
      success: true,
      data: response.data.data.customOrder,
    };
  } catch (error) {
    console.error("Error fetching custom order by ID:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch custom order",
    };
  }
};

/**
 * Calculate custom order price (Public)
 * @param {string} id - Custom order configuration ID
 * @param {Object} calculationData - Selections and people count
 * @returns {Object} Response with price calculation
 */
export const calculateCustomOrderPrice = async (id, calculationData) => {
  try {
    if (!id) {
      throw new Error("Custom order ID is required");
    }

    const response = await axios.post(
      `${backendUrl}/api/bookings/custom-orders/${id}/calculate`,
      calculationData,
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
    };
  } catch (error) {
    console.error("Error calculating custom order price:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to calculate price",
    };
  }
};

/**
 * Get booking items by category (Admin only)
 * @param {string} id - Booking ID
 * @returns {Object} Response with items grouped by category
 */
export const getBookingItemsByCategory = async (id) => {
  try {
    if (!id) {
      throw new Error("Booking ID is required");
    }

    const response = await axios.get(
      `${backendUrl}/api/bookings/${id}/items-by-category`,
      {
        timeout: 10000,
      }
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Error fetching booking items by category:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        "Failed to fetch booking items by category",
    };
  }
};

// ============================================================================
// LEGACY FUNCTIONS (maintained for backward compatibility)
// ============================================================================

/**
 * @deprecated Use createBooking with isCustomOrder: true instead
 */
export const createCustomOrder = async (customOrderData) => {
  console.warn(
    "createCustomOrder is deprecated. Use createBooking with isCustomOrder: true instead."
  );

  const bookingData = {
    isCustomOrder: true,
    menu: {
      menuId: null,
      name: "Custom Order",
      basePrice: 0,
      locationId: customOrderData.locationId,
      locationName: customOrderData.locationName,
      serviceId: customOrderData.serviceId,
      serviceName: customOrderData.serviceName,
    },
    customerDetails: customOrderData.customerDetails,
    peopleCount: customOrderData.peopleCount || 1,
    selectedItems: customOrderData.selectedItems || [],
    pricing: customOrderData.pricing || { total: 0 },
    deliveryType: customOrderData.deliveryType || "Pickup",
    deliveryDate: customOrderData.deliveryDate,
    address: customOrderData.address,
  };

  return await createBooking(bookingData);
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
  return (
    booking?.isCustomOrder === true ||
    booking?.orderSource?.sourceType === "customOrder" ||
    booking?.menu?.menuId === null
  );
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
  return (
    booking?.orderSource?.serviceName ||
    booking?.menu?.serviceName ||
    "Menu Order"
  );
};

/**
 * Format booking for display with enhanced information
 * @param {Object} booking - Booking object
 * @returns {Object} Enhanced booking object for display
 */
export const formatBookingForDisplay = (booking) => {
  const enhanced = {
    ...booking,
    displayType: isCustomOrder(booking) ? "Custom Order" : "Menu Order",
    orderTypeDisplay: getOrderTypeDisplay(booking),
    isCustomOrder: isCustomOrder(booking),
  };

  if (isCustomOrder(booking)) {
    enhanced.customOrderInfo = {
      totalItems: booking.selectedItems?.length || 0,
      categories:
        booking.selectedItems?.reduce((acc, item) => {
          const category = item.category || "unknown";
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {}) || {},
      averageItemPrice:
        booking.selectedItems?.length > 0
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

  if (bookingData.isFunction) {
    if (!bookingData.venueSelection) {
      errors.push("Venue selection is required for function bookings");
    }

    const validVenues = ["both", "indoor", "outdoor"];
    if (
      bookingData.venueSelection &&
      !validVenues.includes(bookingData.venueSelection)
    ) {
      errors.push("Invalid venue selection");
    }
  }

  if (!bookingData.deliveryDate) {
    errors.push("Delivery/event date is required");
  }
  if (bookingData.isFunction) {
    if (bookingData.deliveryType !== "Event") {
      errors.push("Delivery type must be 'Event' for function services");
    }
  } else {
    if (!["Pickup", "Delivery"].includes(bookingData.deliveryType)) {
      errors.push("Service type (Pickup/Delivery) is required");
    }
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
  if (bookingData.isCustomOrder) {
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
  // Main booking operations
  createBooking,
  getAllBookings,
  getBookingById,
  getBookingByReference,
  updateBookingStatus,
  updatePaymentStatus,
  updateBooking,
  getBookingStats,
  getUniqueDishesCount,
  cancelBooking,

  // Customer operations
  getBookingsByCustomer,

  // Custom order operations
  getCustomOrdersByLocation,
  getCustomOrderById,
  calculateCustomOrderPrice,
  getBookingItemsByCategory,

  // Legacy operations
  createCustomOrder,

  // Utility functions
  isCustomOrder,
  getOrderTypeDisplay,
  formatBookingForDisplay,
  calculateBookingTotals,
  validateBookingData,
  formatErrorMessage,
};

// Add this enhanced function to your bookingService.js

/**
 * Get kitchen preparation requirements for specific date
 * Calculates total portions needed per dish across all orders
 * @param {Object} params - Filter parameters including date
 * @returns {Object} Response with kitchen preparation data
 */
export const getKitchenPrepRequirements = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (params.date) queryParams.append("date", params.date);
    if (params.locationId) queryParams.append("locationId", params.locationId);
    if (params.serviceId) queryParams.append("serviceId", params.serviceId);

    const queryString = queryParams.toString();
    const url = `${backendUrl}/api/bookings/unique-dishes${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await axios.get(url, { timeout: 10000 });

    if (response.success && response.data) {
      // Process the dishes data to calculate kitchen requirements
      const kitchenRequirements = processKitchenRequirements(response.data);

      return {
        success: true,
        data: {
          ...response.data,
          kitchenRequirements,
        },
      };
    }

    return response;
  } catch (error) {
    console.error("Error fetching kitchen prep requirements:", error);
    return {
      success: false,
      error:
        error.response?.data?.message || "Failed to fetch kitchen requirements",
      data: {
        uniqueDishesCount: 0,
        totalQuantity: 0,
        totalRevenue: 0,
        dishes: [],
        categoryBreakdown: {},
        kitchenRequirements: [],
      },
    };
  }
};

/**
 * Process dishes data for kitchen requirements
 * Calculates total portions needed per dish
 */
const processKitchenRequirements = (dishesData) => {
  if (!dishesData.dishes || dishesData.dishes.length === 0) {
    return [];
  }

  return dishesData.dishes
    .map((dish) => {
      // Calculate total people this dish serves
      const totalPeopleServed = dish.bookings
        ? dish.bookings.reduce((sum, booking) => {
            // If quantity is per person, multiply by people count in that booking
            // This would need to be determined by the dish data structure
            return sum + (booking.quantity || 1);
          }, 0)
        : dish.totalQuantity;

      return {
        dishName: dish.dishName,
        category: dish.category,
        totalOrders: dish.totalOrders || 0,
        totalQuantity: dish.totalQuantity,
        totalPeopleServed: totalPeopleServed,
        estimatedPrepTime: estimatePrepTime(dish.category, dish.totalQuantity),
        priority: getPriorityLevel(dish.category, dish.totalQuantity),
        instructions: getKitchenInstructions(dish.dishName, dish.totalQuantity),
        bookingDetails: dish.bookings || [],
      };
    })
    .sort((a, b) => {
      // Sort by priority (high to low), then by prep time (long to short)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.estimatedPrepTime - a.estimatedPrepTime;
    });
};

/**
 * Estimate preparation time based on dish category and quantity
 */
const estimatePrepTime = (category, quantity) => {
  const baseTimes = {
    mains: 45, // minutes
    entree: 30,
    sides: 25,
    desserts: 60,
    addons: 15,
  };

  const baseTime = baseTimes[category?.toLowerCase()] || 30;

  // Add time based on quantity (every 10 portions adds 15 minutes)
  const additionalTime = Math.floor(quantity / 10) * 15;

  return baseTime + additionalTime;
};

/**
 * Get priority level for kitchen preparation
 */
const getPriorityLevel = (category, quantity) => {
  // Priority scale: 1-5 (5 being highest)
  let priority = 3; // default

  // Category-based priority
  if (category?.toLowerCase() === "mains") priority += 1;
  if (category?.toLowerCase() === "desserts") priority += 1;

  // Quantity-based priority
  if (quantity > 50) priority += 1;
  if (quantity > 100) priority += 1;

  return Math.min(5, priority);
};

/**
 * Generate kitchen instructions based on dish and quantity
 */
const getKitchenInstructions = (dishName, quantity) => {
  const instructions = [];

  // Basic quantity instruction
  instructions.push(`Prepare ${quantity} portions`);

  // Quantity-based instructions
  if (quantity > 30) {
    instructions.push("Start early - high volume order");
  }

  if (quantity > 50) {
    instructions.push("Consider batch cooking");
    instructions.push("Ensure adequate prep space");
  }

  if (quantity > 100) {
    instructions.push("HIGH PRIORITY - Large order");
    instructions.push("May require additional staff");
  }

  // Dish-specific instructions could be added here
  // This would typically come from a database of dish preparation guidelines

  return instructions;
};


// Add admin addition to booking
export const addAdminAddition = async (bookingId, additionData) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/bookings/${bookingId}/admin-additions`,
      additionData,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );
    return {
      success: true,
      data: response.data.data.booking,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to add admin addition",
    };
  }
};

// Remove admin addition from booking
export const removeAdminAddition = async (bookingId, additionId) => {
  try {
    const response = await axios.delete(
      `${backendUrl}/api/bookings/${bookingId}/admin-additions/${additionId}`,
      { timeout: 10000 }
    );
    return {
      success: true,
      data: response.data.data.booking,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to remove admin addition",
    };
  }
};