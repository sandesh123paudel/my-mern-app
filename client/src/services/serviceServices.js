import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const getServices = async () => {
  try {
    const response = await axios.get(`${backendUrl}/api/services`);
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error fetching services:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch services",
    };
  }
};

export const getServicesByLocation = async (locationId) => {
  try {
    const response = await axios.get(`${backendUrl}/api/services/location/${locationId}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error fetching services by location:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch services for location",
    };
  }
};

export const getServiceById = async (id) => {
  try {
    const response = await axios.get(`${backendUrl}/api/services/${id}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error fetching service:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch service",
    };
  }
};

export const createService = async (serviceData) => {
  try {
    const response = await axios.post(`${backendUrl}/api/services`, serviceData);
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error creating service:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to create service",
    };
  }
};

export const updateService = async (id, serviceData) => {
  try {
    const response = await axios.put(`${backendUrl}/api/services/${id}`, serviceData);
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error updating service:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update service",
    };
  }
};

export const deleteService = async (id) => {
  try {
    const response = await axios.delete(`${backendUrl}/api/services/${id}`);
    return { success: true, message: response.data.message };
  } catch (error) {
    console.error("Error deleting service:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to delete service",
    };
  }
};