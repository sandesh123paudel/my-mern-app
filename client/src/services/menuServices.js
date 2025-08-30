import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Helper function to clean and prepare menu data
const prepareMenuData = (menuData) => {
  // Deep clone to avoid mutation
  const data = JSON.parse(JSON.stringify(menuData));

  // Clean numeric fields
  const cleanNumericField = (value) => {
    if (value === "" || value === null || value === undefined) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const cleanIntegerField = (value, defaultValue = 1) => {
    if (value === "" || value === null || value === undefined)
      return defaultValue;
    const num = parseInt(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Process basic fields
  data.basePrice = cleanNumericField(data.basePrice);
  data.minPeople = cleanIntegerField(data.minPeople, 1);
  data.maxPeople =
    data.maxPeople === "" ? null : cleanIntegerField(data.maxPeople, null);

  // Process simple items
  if (data.simpleItems && Array.isArray(data.simpleItems)) {
    data.simpleItems = data.simpleItems.map((item) => ({
      ...item,
      priceModifier: cleanNumericField(item.priceModifier),
      quantity: cleanIntegerField(item.quantity, 1),
      options: item.options
        ? item.options.map((option) => ({
            ...option,
            priceModifier: cleanNumericField(option.priceModifier),
          }))
        : [],
      choices: item.choices
        ? item.choices.map((choice) => ({
            ...choice,
            priceModifier: cleanNumericField(choice.priceModifier),
          }))
        : [],
    }));
  }

  // Process categories
  if (data.categories && Array.isArray(data.categories)) {
    data.categories = data.categories.map((category) => ({
      ...category,
      includedItems: category.includedItems
        ? category.includedItems.map((item) => ({
            ...item,
            priceModifier: cleanNumericField(item.priceModifier),
            options: item.options
              ? item.options.map((option) => ({
                  ...option,
                  priceModifier: cleanNumericField(option.priceModifier),
                }))
              : [],
          }))
        : [],
      selectionGroups: category.selectionGroups
        ? category.selectionGroups.map((group) => ({
            ...group,
            minSelections: cleanIntegerField(group.minSelections, 1),
            maxSelections: cleanIntegerField(group.maxSelections, 1),
            items: group.items
              ? group.items.map((item) => ({
                  ...item,
                  priceModifier: cleanNumericField(item.priceModifier),
                  options: item.options
                    ? item.options.map((option) => ({
                        ...option,
                        priceModifier: cleanNumericField(option.priceModifier),
                      }))
                    : [],
                }))
              : [],
          }))
        : [],
    }));
  }

  // Process addons
  if (data.addons) {
    data.addons = {
      ...data.addons,
      fixedAddons: data.addons.fixedAddons
        ? data.addons.fixedAddons.map((addon) => ({
            ...addon,
            pricePerPerson: cleanNumericField(addon.pricePerPerson),
          }))
        : [],
      variableAddons: data.addons.variableAddons
        ? data.addons.variableAddons.map((addon) => ({
            ...addon,
            pricePerUnit: cleanNumericField(addon.pricePerUnit),
            minQuantity: cleanIntegerField(addon.minQuantity, 0),
            maxQuantity: cleanIntegerField(addon.maxQuantity, 20),
            defaultQuantity: cleanIntegerField(addon.defaultQuantity, 0),
          }))
        : [],
    };
  }

  // Remove any _id fields from nested objects (but keep root _id if updating)
  const removeNestedIds = (obj, isRoot = false) => {
    if (Array.isArray(obj)) {
      return obj.map((item) => removeNestedIds(item, false));
    }
    if (obj && typeof obj === "object") {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key === "_id" && !isRoot) {
          continue; // Skip _id fields except at root level
        }
        cleaned[key] = removeNestedIds(value, false);
      }
      return cleaned;
    }
    return obj;
  };

  return removeNestedIds(data, true);
};

// Get all menus with optional filtering
export const getMenus = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Add filter params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const url = `${backendUrl}/api/menus${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await axios.get(url);
    return {
      success: true,
      data: response.data.data || [],
      count: response.data.count || 0,
      message: response.data.message,
    };
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
   

    // Prepare and clean the data
    const cleanData = prepareMenuData(menuData);

    const response = await axios.post(`${backendUrl}/api/menus`, cleanData, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error creating menu:", error);
    console.error("Error details:", error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to create menu",
    };
  }
};

// Update menu
export const updateMenu = async (id, menuData) => {
  try {
   

    // Prepare and clean the data
    const cleanData = prepareMenuData(menuData);
   

    const response = await axios.put(
      `${backendUrl}/api/menus/${id}`,
      cleanData,
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
    console.error("Error updating menu:", error);
    console.error("Error details:", error.response?.data);
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

// Get menus by service ID
export const getMenusByService = async (serviceId) => {
  try {
    const response = await axios.get(
      `${backendUrl}/api/menus/service/${serviceId}`
    );
    return {
      success: true,
      data: response.data.data || [],
      count: response.data.count || 0,
    };
  } catch (error) {
    console.error("Error fetching menus by service:", error);
    return {
      success: false,
      error:
        error.response?.data?.message || "Failed to fetch menus by service",
    };
  }
};

// Get menus by location ID
export const getMenusByLocation = async (locationId) => {
  try {
    const response = await axios.get(
      `${backendUrl}/api/menus/location/${locationId}`
    );
    return {
      success: true,
      data: response.data.data || [],
      count: response.data.count || 0,
    };
  } catch (error) {
    console.error("Error fetching menus by location:", error);
    return {
      success: false,
      error:
        error.response?.data?.message || "Failed to fetch menus by location",
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
