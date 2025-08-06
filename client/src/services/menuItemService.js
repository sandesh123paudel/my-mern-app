import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Get all menu items with optional filtering
export const getMenuItems = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filter params
    if (params.category) queryParams.append('category', params.category);
    if (params.isVegetarian !== undefined) queryParams.append('isVegetarian', params.isVegetarian);
    if (params.isVegan !== undefined) queryParams.append('isVegan', params.isVegan);
    
    const queryString = queryParams.toString();
    const url = `${backendUrl}/api/menuItems${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get(url);
    return { success: true, data: response.data.data, count: response.data.count };
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch menu items",
    };
  }
};

// Get single menu item by ID
export const getMenuItemById = async (id) => {
  try {
    const response = await axios.get(`${backendUrl}/api/menuItems/${id}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error fetching menu item:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch menu item",
    };
  }
};

// Create new menu item
export const createMenuItem = async (menuItemData) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/menuItems`,
      menuItemData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    console.error("Error creating menu item:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to create menu item",
    };
  }
};

// Update menu item
export const updateMenuItem = async (id, menuItemData) => {
  try {
    const response = await axios.put(
      `${backendUrl}/api/menuItems/${id}`,
      menuItemData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    console.error("Error updating menu item:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update menu item",
    };
  }
};

// Delete menu item
export const deleteMenuItem = async (id) => {
  try {
    const response = await axios.delete(`${backendUrl}/api/menuItems/${id}`);
    return { success: true, message: response.data.message };
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to delete menu item",
    };
  }
};