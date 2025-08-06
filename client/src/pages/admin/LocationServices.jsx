import React, { useState, useEffect } from "react";
import { Building } from "lucide-react";
import toast from "react-hot-toast";

// Adjust path as needed
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../../services/locationServices";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "../../services/serviceServices";
import { InlineLoading } from "../../components/Loading";
import LocationsTab from "../../components/admin/LocationServices/LocationsTab";
import ServicesTab from "../../components/admin/LocationServices/ServicesTab";
import LocationFormModal from "../../components/admin/LocationServices/LocationFormModal";
import ServiceFormModal from "../../components/admin/LocationServices/ServiceFormModal";

const LocationServices = () => {
  const [activeTab, setActiveTab] = useState("locations");
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Location form state
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationForm, setLocationForm] = useState({
    name: "",
    city: "",
    address: "",
    contactInfo: {
      phone: "",
      email: "",
    },
    isActive: true,
  });

  // Service form state
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [selectedLocationForService, setSelectedLocationForService] =
    useState("");
  const [serviceForm, setServiceForm] = useState({
    name: "",
    locationId: "",
    description: "",
    isActive: true,
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      const [locationsResult, servicesResult] = await Promise.all([
        getLocations(),
        getServices(),
      ]);

      if (locationsResult.success) {
        setLocations(locationsResult.data);
      } else {
        toast.error(locationsResult.error || "Failed to load locations");
      }

      if (servicesResult.success) {
        setServices(servicesResult.data);
      } else {
        toast.error(servicesResult.error || "Failed to load services");
      }
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Location management functions
  const resetLocationForm = () => {
    setLocationForm({
      name: "",
      city: "",
      address: "",
      contactInfo: {
        phone: "",
        email: "",
      },
      isActive: true,
    });
  };

  const handleAddLocation = () => {
    resetLocationForm();
    setEditingLocation(null);
    setShowLocationForm(true);
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setLocationForm({
      name: location.name,
      city: location.city,
      address: location.address || "",
      contactInfo: {
        phone: location.contactInfo?.phone || "",
        email: location.contactInfo?.email || "",
      },
      isActive: location.isActive,
    });
    setShowLocationForm(true);
  };

  const handleSaveLocation = async () => {
    setLoading(true);

    try {
      let result;
      if (editingLocation) {
        result = await updateLocation(editingLocation._id, locationForm);
      } else {
        result = await createLocation(locationForm);
      }

      if (result.success) {
        toast.success(
          editingLocation
            ? "Location updated successfully"
            : "Location created successfully"
        );
        await loadData(); // Reload data to get updated list
        setShowLocationForm(false);
        setEditingLocation(null);
        resetLocationForm();
      } else {
        toast.error(result.error || "Failed to save location");
      }
    } catch (err) {
      toast.error("Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    // Check if location has services
    const hasServices = services.some(
      (service) => service.locationId === locationId
    );

    if (hasServices) {
      toast.error(
        "Cannot delete location that has services. Please delete or reassign services first."
      );
      return;
    }

    if (window.confirm("Are you sure you want to delete this location?")) {
      setLoading(true);

      try {
        const result = await deleteLocation(locationId);
        if (result.success) {
          toast.success("Location deleted successfully");
          await loadData(); // Reload data
        } else {
          toast.error(result.error || "Failed to delete location");
        }
      } catch (err) {
        toast.error("Failed to delete location");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseLocationForm = () => {
    setShowLocationForm(false);
    setEditingLocation(null);
    resetLocationForm();
  };

  // Service management functions
  const resetServiceForm = () => {
    setServiceForm({
      name: "",
      locationId: selectedLocationForService || "",
      description: "",
      isActive: true,
    });
  };

  const handleAddService = () => {
    if (locations.length === 0) {
      toast.error("Please create a location first before adding services.");
      return;
    }
    resetServiceForm();
    setEditingService(null);
    setShowServiceForm(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      locationId: service.locationId._id || service.locationId,
      description: service.description || "",
      isActive: service.isActive,
    });
    setShowServiceForm(true);
  };

  const handleSaveService = async () => {
    setLoading(true);

    try {
      let result;
      if (editingService) {
        result = await updateService(editingService._id, serviceForm);
      } else {
        result = await createService(serviceForm);
      }

      if (result.success) {
        toast.success(
          editingService
            ? "Service updated successfully"
            : "Service created successfully"
        );
        await loadData(); // Reload data to get updated list
        setShowServiceForm(false);
        setEditingService(null);
        resetServiceForm();
      } else {
        toast.error(result.error || "Failed to save service");
      }
    } catch (err) {
      toast.error("Failed to save service");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this service? This will affect any menus using this service."
      )
    ) {
      setLoading(true);

      try {
        const result = await deleteService(serviceId);
        if (result.success) {
          toast.success("Service deleted successfully");
          await loadData(); // Reload data
        } else {
          toast.error(result.error || "Failed to delete service");
        }
      } catch (err) {
        toast.error("Failed to delete service");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseServiceForm = () => {
    setShowServiceForm(false);
    setEditingService(null);
    resetServiceForm();
  };

  if (loading) {
    return (
      <InlineLoading message="Loading location & services..." size="large" />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Location & Service Management
        </h1>
        <p>
          Manage your business locations and the services offered at each
          location
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("locations")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "locations"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Building className="inline-block w-4 h-4 mr-2" />
            Locations ({locations.length})
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "services"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Services ({services.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "locations" && (
        <LocationsTab
          locations={locations}
          services={services}
          onAddLocation={handleAddLocation}
          onEditLocation={handleEditLocation}
          onDeleteLocation={handleDeleteLocation}
        />
      )}

      {activeTab === "services" && (
        <ServicesTab
          services={services}
          locations={locations}
          selectedLocationForService={selectedLocationForService}
          setSelectedLocationForService={setSelectedLocationForService}
          onAddService={handleAddService}
          onEditService={handleEditService}
          onDeleteService={handleDeleteService}
        />
      )}

      {/* Location Form Modal */}
      <LocationFormModal
        isOpen={showLocationForm}
        onClose={handleCloseLocationForm}
        locationForm={locationForm}
        setLocationForm={setLocationForm}
        onSave={handleSaveLocation}
        editingLocation={editingLocation}
        loading={loading}
      />

      {/* Service Form Modal */}
      <ServiceFormModal
        isOpen={showServiceForm}
        onClose={handleCloseServiceForm}
        serviceForm={serviceForm}
        setServiceForm={setServiceForm}
        onSave={handleSaveService}
        editingService={editingService}
        locations={locations}
        loading={loading}
      />
    </div>
  );
};

export default LocationServices;
