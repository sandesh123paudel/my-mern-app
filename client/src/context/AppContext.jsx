import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  axios.defaults.withCredentials = true;

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const getUserData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/auth/data");

      if (data.success) {
        setUserData(data.userData);
        setIsLoggedIn(true);
        // Check if user is superadmin
        setIsSuperAdmin(data.userData?.role === "superadmin");
      } else {
        setUserData(null);
        setIsLoggedIn(false);
        setIsSuperAdmin(false);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(null);
      setIsLoggedIn(false);
      setIsSuperAdmin(false);
    }
  };

  const getAuthState = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/auth/is-auth");
      if (data.success) {
        setIsLoggedIn(true);
        // Fetch user data if successfully authenticated
        if (!userData) {
          getUserData();
        }
      } else {
        setIsLoggedIn(false);
        setUserData(null);
        setIsSuperAdmin(false);
      }
    } catch (error) {
      console.error("Error getting auth state:", error);
      setIsLoggedIn(false);
      setUserData(null);
      setIsSuperAdmin(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(backendUrl + "/api/auth/logout");
      setIsLoggedIn(false);
      setUserData(null);
      setIsSuperAdmin(false);
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if logout fails on server, clear local state
      setIsLoggedIn(false);
      setUserData(null);
      setIsSuperAdmin(false);
    }
  };

  // Super Admin management functions
  const createNewSuperAdmin = async (adminData) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/auth/create-new-superadmin",
        adminData
      );
      return data;
    } catch (error) {
      console.error("Error creating superadmin:", error);
      throw error;
    }
  };

  const getAllSuperAdmins = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/auth/superadmins");
      return data;
    } catch (error) {
      console.error("Error fetching superadmins:", error);
      throw error;
    }
  };

  const updateSuperAdmin = async (userId, updateData) => {
    try {
      const { data } = await axios.put(
        backendUrl + `/api/auth/superadmin/${userId}`,
        updateData
      );
      // If updating current user, refresh user data
      if (userId === userData?.id) {
        getUserData();
      }
      return data;
    } catch (error) {
      console.error("Error updating superadmin:", error);
      throw error;
    }
  };

  const deleteSuperAdmin = async (userId) => {
    try {
      const { data } = await axios.delete(
        backendUrl + `/api/auth/superadmin/${userId}`
      );
      return data;
    } catch (error) {
      console.error("Error deleting superadmin:", error);
      throw error;
    }
  };

  useEffect(() => {
    getAuthState();
  }, []);

  const value = {
    backendUrl,
    isLoggedIn,
    setIsLoggedIn,
    userData,
    setUserData,
    getUserData,
    isSuperAdmin,
    setIsSuperAdmin,
    logout,
    createNewSuperAdmin,
    getAllSuperAdmins,
    updateSuperAdmin,
    deleteSuperAdmin,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};