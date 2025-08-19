import React, { useState, useEffect } from "react";
import { getLocationById } from "../../../services/locationServices";
import { getServiceById } from "../../../services/serviceServices";

const InquiryCard = ({ inquiry, onViewDetails }) => {
  const [locationName, setLocationName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // Fetch location and service names when inquiry changes
  useEffect(() => {
    if (inquiry) {
      fetchDisplayNames();
    }
  }, [inquiry]);

  const fetchDisplayNames = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      // Handle venue/location
      if (inquiry.venue) {
        // Check if venue is already populated (has name property)
        if (typeof inquiry.venue === "object" && inquiry.venue.name) {
          console.log("Venue already populated:", inquiry.venue.name);
          setLocationName(inquiry.venue.name);
        } else {
          // Venue is an ID, need to fetch
          let venueId;
          if (typeof inquiry.venue === "object" && inquiry.venue !== null) {
            venueId =
              inquiry.venue._id || inquiry.venue.id || inquiry.venue.toString();
          } else {
            venueId = String(inquiry.venue);
          }

          console.log("Fetching venue with ID:", venueId);

          try {
            const result = await getLocationById(venueId);
            console.log("Location API result:", result);

            if (result.success && result.data) {
              setLocationName(result.data.name || "Unknown location");
            } else {
              setLocationName("Unknown location");
              setErrors((prev) => ({
                ...prev,
                location: result.error || "Failed to load location",
              }));
            }
          } catch (error) {
            console.error("Location fetch error:", error);
            setLocationName("Error loading location");
            setErrors((prev) => ({ ...prev, location: error.message }));
          }
        }
      } else {
        setLocationName("Not specified");
      }

      // Handle service
      if (inquiry.serviceType) {
        // Check if service is already populated (has name property)
        if (
          typeof inquiry.serviceType === "object" &&
          inquiry.serviceType.name
        ) {
          console.log("Service already populated:", inquiry.serviceType.name);
          setServiceName(inquiry.serviceType.name);
        } else {
          // Service is an ID, need to fetch
          let serviceId;
          if (
            typeof inquiry.serviceType === "object" &&
            inquiry.serviceType !== null
          ) {
            serviceId =
              inquiry.serviceType._id ||
              inquiry.serviceType.id ||
              inquiry.serviceType.toString();
          } else {
            serviceId = String(inquiry.serviceType);
          }

          console.log("Fetching service with ID:", serviceId);

          try {
            const result = await getServiceById(serviceId);
            console.log("Service API result:", result);

            if (result.success && result.data) {
              setServiceName(result.data.name || "Unknown service");
            } else {
              setServiceName("Unknown service");
              setErrors((prev) => ({
                ...prev,
                service: result.error || "Failed to load service",
              }));
            }
          } catch (error) {
            console.error("Service fetch error:", error);
            setServiceName("Error loading service");
            setErrors((prev) => ({ ...prev, service: error.message }));
          }
        }
      } else {
        console.log("No serviceType found in inquiry");
        setServiceName("Not specified");
      }
    } catch (error) {
      console.error("Error in fetchDisplayNames:", error);
      setLocationName("Error loading");
      setServiceName("Error loading");
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "responded":
        return "bg-green-100 text-green-800 border-green-200";
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-amber-800">
              {inquiry.name || "Unknown"}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                inquiry.status || "pending"
              )}`}
            >
              {inquiry.status || "pending"}
            </span>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">Email:</span>{" "}
              {inquiry.email || "Not provided"}
            </p>
            <p>
              <span className="font-medium">Contact:</span>{" "}
              {inquiry.contact || "Not provided"}
            </p>
            <p>
              <span className="font-medium">Event Date:</span>{" "}
              {formatDate(inquiry.eventDate)}
            </p>
            <p>
              <span className="font-medium">Guests:</span>{" "}
              {inquiry.numberOfPeople || "Not specified"}
            </p>

            {/* Venue/Location */}
            <p>
              <span className="font-medium">Venue:</span>{" "}
              {isLoading ? (
                <span className="text-blue-600 animate-pulse">Loading...</span>
              ) : (
                <span className={errors.location ? "text-red-600" : ""}>
                  {locationName}
                </span>
              )}
            </p>

            {/* Service */}
            <p>
              <span className="font-medium">Service:</span>{" "}
              {isLoading ? (
                <span className="text-blue-600 animate-pulse">Loading...</span>
              ) : (
                <span className={errors.service ? "text-red-600" : ""}>
                  {serviceName}
                </span>
              )}
            </p>
          </div>

          <div className="mt-3">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Message:</span>{" "}
              {inquiry.message ? (
                <>
                  {inquiry.message.substring(0, 150)}
                  {inquiry.message.length > 150 && "..."}
                </>
              ) : (
                "No message provided"
              )}
            </p>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Received: {formatDateTime(inquiry.createdAt)}
          </div>
        </div>

        <div className="ml-4">
          <button
            onClick={() => onViewDetails(inquiry)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default InquiryCard;
