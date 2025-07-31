import axios from "axios";

import { createContext, useEffect, useState } from "react";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  axios.defaults.withCredentials = true;

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  console.log("Backend URL from env:", backendUrl); // Add this line

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  const getUserData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/auth/data");

      if (data.success) {
        setUserData(data.userData);
        setIsLoggedIn(true); // Crucial: Set isLoggedIn to true on successful data fetch
      } else {
        setUserData(null); // Clear user data on failure
        setIsLoggedIn(false); // Crucial: Set isLoggedIn to false on failure
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(null); // Clear user data on error
      setIsLoggedIn(false); // Crucial: Set isLoggedIn to false on error
    }
  };
  const getAuthState = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/auth/is-auth");
      if (data.success) {
        setIsLoggedIn(true);
        // Only fetch user data if successfully authenticated
        // This prevents unnecessary calls if already logged in and data is fresh
        if (!userData || userData.email !== data.user?.email) {
          // Simple check to avoid re-fetching if data is likely current
          getUserData();
        }
      } else {
        setIsLoggedIn(false);
        setUserData(null); // Ensure userData is cleared if not authenticated
      }
    } catch (error) {
      console.error("Error getting auth state:", error);
      setIsLoggedIn(false);
      setUserData(null); // Ensure userData is cleared on auth state error
      // toast.error(error.message); // Optionally show error
    }
  };
  useEffect(() => {
    getAuthState();
  }, []); // Run once on component mount to check initial auth state

  
  const value = {
    backendUrl,
    isLoggedIn,
    setIsLoggedIn,
    userData,
    setUserData,
    getUserData,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
