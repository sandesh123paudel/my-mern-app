import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Create new booking (Public - No auth required)
export const createBooking = async (bookingData) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/bookings`,
      bookingData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error creating booking:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        "Failed to create booking",
    };
  }
};

// Get all bookings with optional filtering (Admin only)
export const getAllBookings = async (params = {}, token) => {
  try {
    const queryParams = new URLSearchParams();

    // Add filter params
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.status) queryParams.append("status", params.status);
    if (params.deliveryType)
      queryParams.append("deliveryType", params.deliveryType);
    if (params.locationId) queryParams.append("locationId", params.locationId);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.search) queryParams.append("search", params.search);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const queryString = queryParams.toString();
    const url = `${backendUrl}/api/bookings${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: true,
      data: response.data.data.bookings,
      pagination: response.data.data.pagination,
    };
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch bookings",
    };
  }
};

// Get single booking by ID (Admin only)
export const getBookingById = async (id, token) => {
  try {
    const response = await axios.get(`${backendUrl}/api/bookings/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return { success: true, data: response.data.data.booking };
  } catch (error) {
    console.error("Error fetching booking:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch booking",
    };
  }
};

// Update booking status (Admin only)
export const updateBookingStatus = async (id, statusData, token) => {
  try {
    const response = await axios.patch(
      `${backendUrl}/api/bookings/${id}/status`,
      statusData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

// Update payment status (Admin only)
export const updatePaymentStatus = async (id, paymentData, token) => {
  try {
    const response = await axios.patch(
      `${backendUrl}/api/bookings/${id}/payment`,
      paymentData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
// Update complete booking details (Admin only)
export const updateBooking = async (id, bookingData, token) => {
  try {
    const response = await axios.put(
      `${backendUrl}/api/bookings/${id}`,
      bookingData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

// Get booking statistics (Admin only)
export const getBookingStats = async (params = {}, token) => {
  try {
    const queryParams = new URLSearchParams();

    // Add filter params for stats
    if (params.locationId) queryParams.append("locationId", params.locationId);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.period) queryParams.append("period", params.period);

    const queryString = queryParams.toString();
    const url = `${backendUrl}/api/bookings/stats${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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
    };
  }
};

// Cancel booking with reason (Admin only)
export const cancelBooking = async (id, cancellationData, token) => {
  try {
    const response = await axios.delete(`${backendUrl}/api/bookings/${id}`, {
      data: cancellationData,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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

// Export all functions
export default {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  updatePaymentStatus,
  updateBooking,
  getBookingStats,
  cancelBooking,
};
