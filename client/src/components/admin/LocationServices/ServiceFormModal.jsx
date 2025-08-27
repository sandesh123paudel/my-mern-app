import React from "react";
import { Save, X } from "lucide-react";

const ServiceFormModal = ({
  isOpen,
  onClose,
  serviceForm,
  setServiceForm,
  onSave,
  editingService,
  locations,
  loading,
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className="fixed inset-0 top-[-50px] bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            {editingService ? "Edit Service" : "Add New Service"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Name *
              </label>
              <input
                type="text"
                value={serviceForm.name}
                onChange={(e) =>
                  setServiceForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Catering Services"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <select
                value={serviceForm.locationId}
                onChange={(e) =>
                  setServiceForm((prev) => ({
                    ...prev,
                    locationId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Location</option>
                {locations
                  .filter((loc) => loc.isActive)
                  .map((location) => (
                    <option key={location._id} value={location._id}>
                      {location.name} - {location.city}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={serviceForm.description}
                onChange={(e) =>
                  setServiceForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Describe what this service offers..."
              />
            </div>
            {/* Function Service Toggle */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={serviceForm.isFunction || false}
                  onChange={(e) =>
                    setServiceForm((prev) => ({
                      ...prev,
                      isFunction: e.target.checked,
                      // Reset venue options when toggling off
                      ...(e.target.checked ? {} : { venueOptions: {} }),
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Function Service</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Check this if the service offers venue bookings (indoor/outdoor)
              </p>
            </div>

            {/* Venue Options - Only show if isFunction is true */}
            {serviceForm.isFunction && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Venue Options
                </h3>

                {/* Both Venues Option */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={
                        serviceForm.venueOptions?.both?.available || false
                      }
                      onChange={(e) =>
                        setServiceForm((prev) => ({
                          ...prev,
                          venueOptions: {
                            ...prev.venueOptions,
                            both: {
                              ...prev.venueOptions?.both,
                              available: e.target.checked,
                              minPeople: 70,
                              maxPeople: 120,
                              venueCharge: 0,
                            },
                          },
                        }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Both Venues (Indoor + Outdoor)
                    </label>
                  </div>
                  {serviceForm.venueOptions?.both?.available && (
                    <div className="ml-6 text-sm text-gray-600 bg-white p-3 rounded border">
                      <p>Min: 70 people | Max: 120 people | No venue charge</p>
                    </div>
                  )}
                </div>

                {/* Indoor Option */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={
                        serviceForm.venueOptions?.indoor?.available || false
                      }
                      onChange={(e) =>
                        setServiceForm((prev) => ({
                          ...prev,
                          venueOptions: {
                            ...prev.venueOptions,
                            indoor: {
                              ...prev.venueOptions?.indoor,
                              available: e.target.checked,
                              minPeople: 35,
                              maxPeople: 60,
                              venueCharge: 0,
                            },
                          },
                        }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Indoor Only
                    </label>
                  </div>
                  {serviceForm.venueOptions?.indoor?.available && (
                    <div className="ml-6 text-sm text-gray-600 bg-white p-3 rounded border">
                      <p>Min: 35 people | Max: 60 people | No venue charge</p>
                    </div>
                  )}
                </div>

                {/* Outdoor Option */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={
                        serviceForm.venueOptions?.outdoor?.available || false
                      }
                      onChange={(e) =>
                        setServiceForm((prev) => ({
                          ...prev,
                          venueOptions: {
                            ...prev.venueOptions,
                            outdoor: {
                              ...prev.venueOptions?.outdoor,
                              available: e.target.checked,
                              minPeople: 20,
                              maxPeople: 90,
                              venueCharge: 200,
                              chargeThreshold: 35,
                            },
                          },
                        }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Outdoor Only
                    </label>
                  </div>
                  {serviceForm.venueOptions?.outdoor?.available && (
                    <div className="ml-6 text-sm text-gray-600 bg-white p-3 rounded border">
                      <p>Min: 20 people | Max: 90 people</p>
                      <p className="text-orange-600">
                        $200 venue charge for bookings under 35 people
                      </p>
                    </div>
                  )}
                </div>

                {/* Validation Warning */}
                {serviceForm.isFunction &&
                  !serviceForm.venueOptions?.both?.available &&
                  !serviceForm.venueOptions?.indoor?.available &&
                  !serviceForm.venueOptions?.outdoor?.available && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-sm text-yellow-800">
                        Please select at least one venue option for function
                        services.
                      </p>
                    </div>
                  )}
              </div>
            )}

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={serviceForm.isActive}
                  onChange={(e) =>
                    setServiceForm((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Active Service</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!serviceForm.name || !serviceForm.locationId || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md flex items-center gap-2"
            >
              <Save size={20} />
              {loading
                ? "Saving..."
                : editingService
                ? "Update Service"
                : "Create Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceFormModal;
