import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Get all inquiries with optional pagination and filtering
export const getInquiries = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add pagination params
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    // Add filter params
    if (params.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    
    // 🔥 FIX: Add venue and serviceType parameters
    if (params.venue && params.venue !== 'all') queryParams.append('venue', params.venue);
    if (params.serviceType && params.serviceType !== 'all') queryParams.append('serviceType', params.serviceType);
    
    const queryString = queryParams.toString();
    const url = `${backendUrl}/api/inquiry/inquiries${queryString ? `?${queryString}` : ''}`;
    
  
    
    const response = await axios.get(url);
    return { success: true, data: response.data.data, pagination: response.data.pagination };
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch inquiries",
    };
  }
};

// Submit new inquiry
export const submitInquiry = async (inquiryData) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/inquiry/submit-inquiry`,
      inquiryData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to submit inquiry",
    };
  }
};

// Update inquiry status
export const updateInquiryStatus = async (inquiryId, status) => {
  try {
    const response = await axios.put(
      `${backendUrl}/api/inquiry/inquiries/${inquiryId}/status`,
      { status }
    );
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    console.error("Error updating inquiry status:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update status",
    };
  }
};

// Delete inquiry
export const deleteInquiry = async (inquiryId) => {
  try {
    const response = await axios.delete(
      `${backendUrl}/api/inquiry/inquiries/${inquiryId}`
    );
    return { success: true, message: response.data.message };
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to delete inquiry",
    };
  }
};