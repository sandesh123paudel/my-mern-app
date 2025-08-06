import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const getLocations = async () => {
  try {
    const response = await axios.get(`${backendUrl}/api/locations`);
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error fetching locations:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch locations",
    };
  }
};

export const getLocationById = async (id) => {
  try {
    const response = await axios.get(`${backendUrl}/api/locations/${id}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error fetching location:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch location",
    };
  }
};

export const createLocation = async (locationData) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/locations`,
      locationData
    );
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error creating location:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to create location",
    };
  }
};

export const updateLocation = async (id, locationData) => {
  try {
    const response = await axios.put(
      `${backendUrl}/api/locations/${id}`,
      locationData
    );
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error updating location:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update location",
    };
  }
};

export const deleteLocation = async (id) => {
  try {
    const response = await axios.delete(`${backendUrl}/api/locations/${id}`);
    return { success: true, message: response.data.message };
  } catch (error) {
    console.error("Error deleting location:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to delete location",
    };
  }
};
