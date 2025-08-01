import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  axios.defaults.withCredentials = true;

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  console.log("Backend URL from env:", backendUrl);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const getUserData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/auth/data");

      if (data.success) {
        setUserData(data.userData);
        setIsLoggedIn(true);
        // Check if user is admin
        setIsAdmin(
          data.userData?.role === "admin" ||
            data.userData?.role === "superadmin"
        );
      } else {
        setUserData(null);
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(null);
      setIsLoggedIn(false);
      setIsAdmin(false);
    }
  };

  const getAuthState = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/auth/is-auth");
      if (data.success) {
        setIsLoggedIn(true);
        // Check if user is admin from the auth response
        setIsAdmin(
          data.user?.role === "admin" || data.user?.role === "superadmin"
        );
        // Only fetch user data if successfully authenticated
        if (!userData || userData.email !== data.user?.email) {
          getUserData();
        }
      } else {
        setIsLoggedIn(false);
        setUserData(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error getting auth state:", error);
      setIsLoggedIn(false);
      setUserData(null);
      setIsAdmin(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(backendUrl + "/api/auth/logout");
      setIsLoggedIn(false);
      setUserData(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if logout fails on server, clear local state
      setIsLoggedIn(false);
      setUserData(null);
      setIsAdmin(false);
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
    isAdmin,
    setIsAdmin,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
