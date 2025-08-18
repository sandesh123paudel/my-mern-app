import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Set up axios to include cookies with requests
axios.defaults.withCredentials = true;

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
      errors: error.response?.data?.errors || null,
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
      errors: error.response?.data?.errors || null,
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

// Bank Details specific functions
export const getLocationBankDetails = async (id) => {
  try {
    const response = await axios.get(
      `${backendUrl}/api/locations/${id}/bank-details`
    );
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error fetching bank details:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch bank details",
    };
  }
};

export const updateLocationBankDetails = async (id, bankDetails) => {
  try {
    const response = await axios.patch(
      `${backendUrl}/api/locations/${id}/bank-details`,
      { bankDetails }
    );
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error updating bank details:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update bank details",
      errors: error.response?.data?.errors || null,
    };
  }
};

export const getLocationsWithBankDetailsStatus = async () => {
  try {
    const response = await axios.get(
      `${backendUrl}/api/locations/admin/with-bank-status`
    );
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error fetching locations with bank status:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        "Failed to fetch locations with bank status",
    };
  }
};

// Utility function to check if location has complete bank details
export const hasCompleteBankDetails = (location) => {
  if (!location.bankDetails) return false;

  const { bankName, accountName, bsb, accountNumber, isActive } =
    location.bankDetails;
  return bankName && accountName && bsb && accountNumber && isActive;
};

// Utility function to format BSB for display
export const formatBSB = (bsb) => {
  if (!bsb) return "";
  const digits = bsb.replace(/\D/g, "");
  if (digits.length === 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return digits;
};

// Utility function to mask account number for display
export const maskAccountNumber = (accountNumber) => {
  if (!accountNumber) return "";
  if (accountNumber.length <= 4) return accountNumber;
  return "•".repeat(accountNumber.length - 4) + accountNumber.slice(-4);
};

// Utility function to validate bank details on frontend
export const validateBankDetails = (bankDetails) => {
  if (!bankDetails) return { isValid: true, errors: [] };

  const errors = [];

  if (!bankDetails.bankName?.trim()) {
    errors.push("Bank name is required");
  }

  if (!bankDetails.accountName?.trim()) {
    errors.push("Account name is required");
  }

  if (!bankDetails.bsb || !/^\d{6}$/.test(bankDetails.bsb)) {
    errors.push("BSB must be exactly 6 digits");
  }

  if (
    !bankDetails.accountNumber ||
    !/^\d{6,10}$/.test(bankDetails.accountNumber)
  ) {
    errors.push("Account number must be 6-10 digits");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
