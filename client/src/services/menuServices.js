import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Get all menus with optional filtering
export const getMenus = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filter params
    if (params.locationId) queryParams.append('locationId', params.locationId);
    if (params.serviceId) queryParams.append('serviceId', params.serviceId);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
    if (params.packageType) queryParams.append('packageType', params.packageType);
    
    const queryString = queryParams.toString();
    const url = `${backendUrl}/api/menus${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get(url);
    return { success: true, data: response.data.data, count: response.data.count };
  } catch (error) {
    console.error("Error fetching menus:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch menus",
    };
  }
};

// Get single menu by ID with populated data
export const getMenuById = async (id) => {
  try {
    const response = await axios.get(`${backendUrl}/api/menus/${id}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error fetching menu:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch menu",
    };
  }
};

// Create new menu
export const createMenu = async (menuData) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/menus`,
      menuData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    console.error("Error creating menu:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to create menu",
    };
  }
};

// Update menu
export const updateMenu = async (id, menuData) => {
  try {
    const response = await axios.put(
      `${backendUrl}/api/menus/${id}`,
      menuData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    console.error("Error updating menu:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update menu",
    };
  }
};

// Delete menu
export const deleteMenu = async (id) => {
  try {
    const response = await axios.delete(`${backendUrl}/api/menus/${id}`);
    return { success: true, message: response.data.message };
  } catch (error) {
    console.error("Error deleting menu:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to delete menu",
    };
  }
};

// Calculate menu price based on selections
export const calculateMenuPrice = async (menuId, selections, peopleCount) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/menus/${menuId}/calculate-price`,
      { selections, peopleCount },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error calculating menu price:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to calculate menu price",
    };
  }
};