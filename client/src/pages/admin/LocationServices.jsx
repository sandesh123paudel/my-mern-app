import React, { useState, useEffect } from "react";
import { Building, CreditCard } from "lucide-react";
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
    bankDetails: null, // Will be initialized when needed
    isActive: true,
  });

  // Service form state
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [selectedLocationForService, setSelectedLocationForService] =
    useState("");
  // Service form state
  const [serviceForm, setServiceForm] = useState({
    name: "",
    locationId: "",
    description: "",
    isActive: true,
    isFunction: false,
    venueOptions: {
      both: { available: false, minPeople: 70, maxPeople: 120, venueCharge: 0 },
      indoor: {
        available: false,
        minPeople: 35,
        maxPeople: 60,
        venueCharge: 0,
      },
      outdoor: {
        available: false,
        minPeople: 20,
        maxPeople: 90,
        venueCharge: 200,
        chargeThreshold: 35,
      },
    },
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
      bankDetails: null,
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
      bankDetails: location.bankDetails
        ? {
            bankName: location.bankDetails.bankName || "",
            accountName: location.bankDetails.accountName || "",
            bsb: location.bankDetails.bsb || "",
            accountNumber: location.bankDetails.accountNumber || "",
            reference: location.bankDetails.reference || "",
            isActive:
              location.bankDetails.isActive !== undefined
                ? location.bankDetails.isActive
                : true,
          }
        : null,
      isActive: location.isActive,
    });
    setShowLocationForm(true);
  };

  const validateLocationForm = () => {
    if (!locationForm.name.trim()) {
      toast.error("Location name is required");
      return false;
    }

    if (!locationForm.city.trim()) {
      toast.error("City is required");
      return false;
    }

    // Validate bank details if provided
    if (locationForm.bankDetails) {
      const { bankName, accountName, bsb, accountNumber } =
        locationForm.bankDetails;

      // If any bank detail is provided, all required fields must be filled
      if (bankName || accountName || bsb || accountNumber) {
        if (!bankName) {
          toast.error("Bank name is required when bank details are provided");
          return false;
        }
        if (!accountName) {
          toast.error(
            "Account name is required when bank details are provided"
          );
          return false;
        }
        if (!bsb || !/^\d{6}$/.test(bsb)) {
          toast.error("BSB must be exactly 6 digits");
          return false;
        }
        if (!accountNumber || !/^\d{6,10}$/.test(accountNumber)) {
          toast.error("Account number must be 6-10 digits");
          return false;
        }
      }
    }

    return true;
  };

  const handleSaveLocation = async () => {
    if (!validateLocationForm()) {
      return;
    }

    setLoading(true);

    try {
      // Clean up bank details - remove if all fields are empty
      let formData = { ...locationForm };

      if (formData.bankDetails) {
        const { bankName, accountName, bsb, accountNumber } =
          formData.bankDetails;
        if (!bankName && !accountName && !bsb && !accountNumber) {
          formData.bankDetails = null;
        }
      }

      let result;
      if (editingLocation) {
        result = await updateLocation(editingLocation._id, formData);
      } else {
        result = await createLocation(formData);
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
        if (result.errors && Array.isArray(result.errors)) {
          result.errors.forEach((error) => toast.error(error));
        } else {
          toast.error(result.error || "Failed to save location");
        }
      }
    } catch (err) {
      toast.error("Failed to save location");
      console.error("Save location error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    // Check if location has active services
    const hasActiveServices = services.some((service) => {
      const serviceLocationId = service.locationId?._id || service.locationId;
      return serviceLocationId === locationId && service.isActive;
    });

    if (hasActiveServices) {
      toast.error(
        "Cannot delete location that has active services. Please deactivate or delete services first."
      );
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to delete this location? This action cannot be undone."
      )
    ) {
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
        console.error("Delete location error:", err);
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
      isFunction: false,
      venueOptions: {
        both: {
          available: false,
          minPeople: 70,
          maxPeople: 120,
          venueCharge: 0,
        },
        indoor: {
          available: false,
          minPeople: 35,
          maxPeople: 60,
          venueCharge: 0,
        },
        outdoor: {
          available: false,
          minPeople: 20,
          maxPeople: 90,
          venueCharge: 200,
          chargeThreshold: 35,
        },
      },
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
      isFunction: service.isFunction || false,
      venueOptions: service.venueOptions || {
        both: {
          available: false,
          minPeople: 70,
          maxPeople: 120,
          venueCharge: 0,
        },
        indoor: {
          available: false,
          minPeople: 35,
          maxPeople: 60,
          venueCharge: 0,
        },
        outdoor: {
          available: false,
          minPeople: 20,
          maxPeople: 90,
          venueCharge: 200,
          chargeThreshold: 35,
        },
      },
    });
    setShowServiceForm(true);
  };
  const handleSaveService = async () => {
    if (!serviceForm.name.trim()) {
      toast.error("Service name is required");
      return;
    }

    if (!serviceForm.locationId) {
      toast.error("Please select a location for this service");
      return;
    }

    setLoading(true);
    if (serviceForm.isFunction) {
      const hasAvailableVenue =
        serviceForm.venueOptions?.both?.available ||
        serviceForm.venueOptions?.indoor?.available ||
        serviceForm.venueOptions?.outdoor?.available;

      if (!hasAvailableVenue) {
        toast.error(
          "At least one venue option must be available for function services"
        );
        return;
      }
    }

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
        if (result.errors && Array.isArray(result.errors)) {
          result.errors.forEach((error) => toast.error(error));
        } else {
          toast.error(result.error || "Failed to save service");
        }
      }
    } catch (err) {
      toast.error("Failed to save service");
      console.error("Save service error:", err);
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
        console.error("Delete service error:", err);
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

  // Calculate statistics
  const locationsWithBankDetails = locations.filter(
    (location) =>
      location.bankDetails &&
      location.bankDetails.bankName &&
      location.bankDetails.accountName &&
      location.bankDetails.bsb &&
      location.bankDetails.accountNumber &&
      location.bankDetails.isActive
  ).length;

  const activeLocations = locations.filter(
    (location) => location.isActive
  ).length;
  const activeServices = services.filter((service) => service.isActive).length;

  if (loading && locations.length === 0) {
    return (
      <InlineLoading message="Loading location & services..." size="large" />
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Location & Service Management
        </h1>
        <p className="text-gray-600">
          Manage your business locations and the services offered at each
          location
        </p>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Building className="text-blue-600" size={20} />
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Total Locations
                </p>
                <p className="text-2xl font-bold text-blue-800">
                  {locations.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Building className="text-green-600" size={20} />
              <div>
                <p className="text-sm text-green-600 font-medium">
                  Active Locations
                </p>
                <p className="text-2xl font-bold text-green-800">
                  {activeLocations}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="text-purple-600" size={20} />
              <div>
                <p className="text-sm text-purple-600 font-medium">
                  With Bank Details
                </p>
                <p className="text-2xl font-bold text-purple-800">
                  {locationsWithBankDetails}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-orange-600 rounded"></div>
              <div>
                <p className="text-sm text-orange-600 font-medium">
                  Active Services
                </p>
                <p className="text-2xl font-bold text-orange-800">
                  {activeServices}
                </p>
              </div>
            </div>
          </div>
        </div>
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
