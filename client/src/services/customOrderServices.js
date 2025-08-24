import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Get all custom orders with optional filtering
export const getCustomOrders = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Add filter params
    if (params.locationId) queryParams.append("locationId", params.locationId);
    if (params.serviceId) queryParams.append("serviceId", params.serviceId);
    if (params.isActive !== undefined)
      queryParams.append("isActive", params.isActive);
    if (params.search) queryParams.append("search", params.search);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const queryString = queryParams.toString();
    const url = `${backendUrl}/api/custom-orders${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await axios.get(url);
    return {
      success: true,
      data: response.data.data.customOrders,
      pagination: response.data.data.pagination,
    };
  } catch (error) {
    console.error("Error fetching custom orders:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch custom orders",
    };
  }
};

// Get single custom order by ID
export const getCustomOrderById = async (id) => {
  try {
    const response = await axios.get(`${backendUrl}/api/custom-orders/${id}`);
    return { success: true, data: response.data.data.customOrder };
  } catch (error) {
    console.error("Error fetching custom order:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch custom order",
    };
  }
};

// Create new custom order
export const createCustomOrder = async (customOrderData) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/custom-orders`,
      customOrderData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return {
      success: true,
      data: response.data.data.customOrder,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error creating custom order:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to create custom order",
    };
  }
};

// Update custom order
export const updateCustomOrder = async (id, customOrderData) => {
  try {
    const response = await axios.put(
      `${backendUrl}/api/custom-orders/${id}`,
      customOrderData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return {
      success: true,
      data: response.data.data.customOrder,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error updating custom order:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update custom order",
    };
  }
};

// Delete custom order
export const deleteCustomOrder = async (id) => {
  try {
    const response = await axios.delete(
      `${backendUrl}/api/custom-orders/${id}`
    );
    return { success: true, message: response.data.message };
  } catch (error) {
    console.error("Error deleting custom order:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to delete custom order",
    };
  }
};

// Add item to category
export const addItemToCategory = async (
  customOrderId,
  categoryName,
  itemData
) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/custom-orders/${customOrderId}/categories/${categoryName}/items`,
      itemData,
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
    console.error("Error adding item to category:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to add item to category",
    };
  }
};

// Add fixed addon
export const addFixedAddon = async (customOrderId, addonData) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/custom-orders/${customOrderId}/addons/fixed`,
      addonData,
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
    console.error("Error adding fixed addon:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to add fixed addon",
    };
  }
};

// Add variable addon
export const addVariableAddon = async (customOrderId, addonData) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/custom-orders/${customOrderId}/addons/variable`,
      addonData,
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
    console.error("Error adding variable addon:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to add variable addon",
    };
  }
};

// Public API calls (no authentication required)

// Get locations with custom orders
export const getLocationsWithCustomOrders = async () => {
  try {
    const response = await axios.get(
      `${backendUrl}/api/custom-orders/locations`
    );
    return { success: true, data: response.data.data.locations };
  } catch (error) {
    console.error("Error fetching locations with custom orders:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch locations",
    };
  }
};

// Get custom orders by location (Public)
export const getCustomOrdersByLocation = async (locationId) => {
  try {
    const response = await axios.get(
      `${backendUrl}/api/custom-orders/location/${locationId}`
    );
    return {
      success: true,
      data: response.data.data.customOrders,
      location: response.data.data.location,
    };
  } catch (error) {
    console.error("Error fetching custom orders by location:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch custom orders",
    };
  }
};

// Get custom order by ID (Public)
export const getCustomOrderByIdPublic = async (id) => {
  try {
    const response = await axios.get(
      `${backendUrl}/api/custom-orders/public/${id}`
    );
    return { success: true, data: response.data.data.customOrder };
  } catch (error) {
    console.error("Error fetching custom order:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch custom order",
    };
  }
};

// Calculate custom order price (Public)
export const calculateCustomOrderPrice = async (
  customOrderId,
  selections,
  peopleCount
) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/custom-orders/public/${customOrderId}/calculate`,
      { selections, peopleCount },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error calculating custom order price:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        "Failed to calculate custom order price",
    };
  }
};
