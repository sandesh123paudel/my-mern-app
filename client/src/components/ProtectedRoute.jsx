import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import Loading from "./Loading";

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, userData } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Give some time for auth state to be determined
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Show loading spinner while determining auth state
  if (isLoading) {
    return <Loading message="Checking authentication..." />;
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (userData && userData.role !== "admin" && userData.role !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary-brown mb-4">
            Access Denied
          </h2>
          <p className="text-primary-brown mb-6">
            You don't have permission to access this area.
          </p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
