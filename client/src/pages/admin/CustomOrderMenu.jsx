import { useState, useEffect, useCallback } from "react";
import { InlineLoading } from "../../components/Loading";
import toast from "react-hot-toast";
import {
  getCustomOrders,
  deleteCustomOrder,
} from "../../services/customOrderServices.js";
import { getLocations } from "../../services/locationServices";
import { getServices } from "../../services/serviceServices";
import CustomOrderCard from "../../components/admin/CustomMenu/CustomOrderCard.jsx";
import CustomOrderFormModal from "../../components/admin/CustomMenu/CustomOrderFormModal";
import { ShoppingCart, Plus, MapPin } from "lucide-react";

const CustomOrder = () => {
  const [customOrders, setCustomOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomOrder, setSelectedCustomOrder] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");

  // Load initial data
  useEffect(() => {
    loadLocations();
  }, []);

  // Fetch custom orders when location changes
  useEffect(() => {
    if (selectedLocationId) {
      fetchCustomOrders();
    } else {
      setCustomOrders([]);
      setLoading(false);
    }
  }, [selectedLocationId]);

  const loadLocations = async () => {
    try {
      const result = await getLocations();
      if (result.success) {
        setLocations(result.data);
      } else {
        toast.error("Failed to load locations");
      }
    } catch (error) {
      toast.error("Failed to load locations");
    }
  };

  const fetchCustomOrders = async () => {
    if (!selectedLocationId) return;

    setLoading(true);
    try {
      const result = await getCustomOrders({ locationId: selectedLocationId });
      if (result.success) {
        setCustomOrders(result.data || []);
      } else {
        toast.error(result.error || "Failed to load custom orders");
        setCustomOrders([]);
      }
    } catch (error) {
      console.error("Error fetching custom orders:", error);
      toast.error("Failed to load custom orders");
      setCustomOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomOrder = () => {
    if (!selectedLocationId) {
      toast.error("Please select a location first");
      return;
    }
    setSelectedCustomOrder(null);
    setShowFormModal(true);
  };

  const handleEditCustomOrder = (customOrder) => {
    setSelectedCustomOrder(customOrder);
    setShowFormModal(true);
  };

  const handleDeleteCustomOrder = async (customOrderId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this custom order? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const result = await deleteCustomOrder(customOrderId);
      if (result.success) {
        toast.success("Custom order deleted successfully");
        fetchCustomOrders();
      } else {
        toast.error(result.error || "Failed to delete custom order");
      }
    } catch (error) {
      toast.error("Failed to delete custom order");
    }
  };

  const handleModalUpdate = () => {
    fetchCustomOrders();
  };

  const selectedLocation = locations.find(
    (loc) => loc._id === selectedLocationId
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="text-primary-green" size={36} />
            Custom Orders
          </h1>
          <p className="mt-1 text-gray-600">
            Create and manage custom order menus by location
          </p>
        </div>
      </div>

      {/* Location Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center gap-4">
          <MapPin className="text-primary-green" size={24} />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Location to Manage Custom Orders
            </label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-primary-green"
            >
              <option value="">Choose a location...</option>
              {locations.map((location) => (
                <option key={location._id} value={location._id}>
                  {location.name} - {location.city}
                </option>
              ))}
            </select>
          </div>
          {selectedLocationId && (
            <button
              onClick={handleAddCustomOrder}
              className="bg-primary-green text-white px-4 py-2 rounded-lg hover:bg-primary-green transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Add Custom Order
            </button>
          )}
        </div>
      </div>

      {/* Selected Location Info */}
      {selectedLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <MapPin className="text-blue-600" size={20} />
            <div>
              <h3 className="font-semibold text-blue-900">
                {selectedLocation.name}
              </h3>
              <p className="text-sm text-blue-700">
                {selectedLocation.address}, {selectedLocation.city}
              </p>
            </div>
            <div className="ml-auto text-sm text-blue-600">
              {customOrders.length} custom order
              {customOrders.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      )}

      {/* Custom Orders Display */}
      {selectedLocationId ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Custom Orders for {selectedLocation?.name || "Selected Location"}
            </h2>
          </div>

          {loading ? (
            <div className="p-8">
              <InlineLoading message="Loading custom orders..." size="large" />
            </div>
          ) : customOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg">
                No custom orders found for this location
              </p>
              <p className="text-sm mt-2 mb-4">
                Create your first custom order menu to get started
              </p>
              <button
                onClick={handleAddCustomOrder}
                className="bg-primary-green text-white px-6 py-2 rounded-lg hover:bg-primary-green transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus size={20} />
                Create Custom Order
              </button>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {customOrders.map((customOrder) => (
                  <CustomOrderCard
                    key={customOrder._id}
                    customOrder={customOrder}
                    onEdit={handleEditCustomOrder}
                    onDelete={handleDeleteCustomOrder}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <MapPin size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Select a Location First
          </h3>
          <p className="text-gray-500 mb-4">
            Choose a location from the dropdown above to view and manage its
            custom orders
          </p>
        </div>
      )}

      {/* Custom Order Form Modal */}
      <CustomOrderFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        customOrder={selectedCustomOrder}
        selectedLocationId={selectedLocationId}
        onSuccess={handleModalUpdate}
      />
    </div>
  );
};

export default CustomOrder;
