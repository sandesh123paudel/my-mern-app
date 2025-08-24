import { useState, useEffect, useCallback } from "react";
import { InlineLoading } from "../../components/Loading";
import toast from "react-hot-toast";
import { getMenus, deleteMenu } from "../../services/menuServices";
import { getLocations } from "../../services/locationServices";
import { getServices } from "../../services/serviceServices";
import MenuCard from "../../components/admin/Menu/MenuCard";
import MenuFormModal from "../../components/admin/Menu/MenuFormModal";
import { Menu as MenuIcon, Plus, Filter, X, Package, List } from "lucide-react";

const Menu = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filter data
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);

  // Enhanced filter state
  const [filters, setFilters] = useState({
    locationId: undefined,
    serviceId: undefined,
    isActive: undefined,
    packageType: undefined,
  });

  const [filteredServices, setFilteredServices] = useState([]);

  // Load initial data
  useEffect(() => {
    loadFilterData();
  }, []);

  // Filter services based on selected location
  useEffect(() => {
    if (filters.locationId) {
      const locationServices = services.filter(
        (service) =>
          (service.locationId?._id || service.locationId) === filters.locationId
      );
      setFilteredServices(locationServices);

      // Reset service filter if current service doesn't belong to selected location
      if (
        filters.serviceId &&
        !locationServices.find((s) => s._id === filters.serviceId)
      ) {
        setFilters((prev) => ({ ...prev, serviceId: undefined }));
      }
    } else {
      setFilteredServices(services);
    }
  }, [filters.locationId, services]);

  const loadFilterData = async () => {
    try {
      const [locationsResult, servicesResult] = await Promise.all([
        getLocations(),
        getServices(),
      ]);

      if (locationsResult.success) setLocations(locationsResult.data);
      if (servicesResult.success) setServices(servicesResult.data);
    } catch (error) {
      toast.error("Failed to load filter data");
    }
  };

  // Fetch menus with filters
  const fetchMenus = useCallback(async () => {
    setLoading(true);
    try {
      // Clean up undefined values from filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      );

      const result = await getMenus(cleanFilters);

      if (result.success) {
        setMenus(result.data || []);
        setTotalCount(result.count || 0);
      } else {
        toast.error(result.error || "Failed to load menus");
        setMenus([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching menus:", error);
      toast.error("Failed to load menus");
      setMenus([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value === "" ? undefined : value,
    }));
  };

  const hasActiveFilters = () => {
    return (
      filters.locationId ||
      filters.serviceId ||
      filters.isActive !== undefined ||
      filters.packageType !== undefined
    );
  };

  const clearAllFilters = () => {
    setFilters({
      locationId: undefined,
      serviceId: undefined,
      isActive: undefined,
      packageType: undefined,
    });
  };

  const handleAddMenu = () => {
    setSelectedMenu(null);
    setShowFormModal(true);
  };

  const handleEditMenu = (menu) => {
    setSelectedMenu(menu);
    setShowFormModal(true);
  };

  const handleDeleteMenu = async (menuId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this menu package? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const result = await deleteMenu(menuId);
      if (result.success) {
        toast.success("Menu package deleted successfully");
        fetchMenus(); // Reload the list
      } else {
        toast.error(result.error || "Failed to delete menu package");
      }
    } catch (error) {
      toast.error("Failed to delete menu package");
    }
  };

  const handleModalUpdate = () => {
    fetchMenus();
  };

  const getMenuStats = () => {
    const stats = {
      total: menus.length,
      active: menus.filter((menu) => menu.isActive).length,
      inactive: menus.filter((menu) => !menu.isActive).length,
      categorized: menus.filter(
        (menu) => menu.packageType === "categorized" || !menu.packageType
      ).length,
      simple: menus.filter((menu) => menu.packageType === "simple").length,
      locations: new Set(
        menus.map((menu) => menu.locationId?._id || menu.locationId)
      ).size,
    };
    return stats;
  };

  const stats = getMenuStats();

  if (loading && menus.length === 0) {
    return <InlineLoading message="Loading menu packages..." size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="text-blue-600" size={36} />
            Package Management
          </h1>
          <p className="mt-1 text-gray-600">
            Create and manage menu packages for your locations and services
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Total: {totalCount} packages
          </div>
          <button
            onClick={handleAddMenu}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
          >
            <Plus size={20} />
            Create Package
          </button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
          <div className="text-sm text-blue-600">Total Packages</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">
            {stats.active}
          </div>
          <div className="text-sm text-green-600">Active</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-700">
            {stats.inactive}
          </div>
          <div className="text-sm text-gray-600">Inactive</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-700">
            {stats.categorized}
          </div>
          <div className="text-sm text-purple-600">Categorized</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-700">
            {stats.simple}
          </div>
          <div className="text-sm text-orange-600">Simple</div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-indigo-700">
            {stats.locations}
          </div>
          <div className="text-sm text-indigo-600">Locations</div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <select
              value={filters.locationId || ""}
              onChange={(e) => handleFilterChange("locationId", e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location._id} value={location._id}>
                  {location.name} - {location.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service
            </label>
            <select
              value={filters.serviceId || ""}
              onChange={(e) => handleFilterChange("serviceId", e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!filters.locationId}
            >
              <option value="">
                {!filters.locationId ? "Select location first" : "All Services"}
              </option>
              {filteredServices.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Package Type
            </label>
            <select
              value={filters.packageType || ""}
              onChange={(e) =>
                handleFilterChange("packageType", e.target.value)
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="categorized">Categorized Packages</option>
              <option value="simple">Simple Packages</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={
                filters.isActive === undefined
                  ? ""
                  : filters.isActive.toString()
              }
              onChange={(e) =>
                handleFilterChange(
                  "isActive",
                  e.target.value === "" ? undefined : e.target.value === "true"
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>

          {hasActiveFilters() && (
            <div className="flex items-end">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <X size={16} />
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Active Filters:
            </h5>
            <div className="flex flex-wrap gap-2">
              {filters.locationId && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Location:{" "}
                  {locations.find((l) => l._id === filters.locationId)?.name ||
                    "Unknown"}
                </span>
              )}
              {filters.serviceId && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Service:{" "}
                  {services.find((s) => s._id === filters.serviceId)?.name ||
                    "Unknown"}
                </span>
              )}
              {filters.packageType && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  Type:{" "}
                  {filters.packageType === "categorized"
                    ? "Categorized"
                    : "Simple"}
                </span>
              )}
              {filters.isActive !== undefined && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                  {filters.isActive ? "Active Only" : "Inactive Only"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Packages Display */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-blue-800">
              Menu Packages ({totalCount})
            </h2>
            {loading && <div className="text-sm text-blue-600">Loading...</div>}
          </div>
        </div>

        {menus.length === 0 && !loading ? (
          <div className="p-8 text-center text-gray-600">
            <MenuIcon size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No menu packages found</p>
            <p className="text-sm mt-2">
              {hasActiveFilters()
                ? "Try adjusting your filters"
                : "Create your first menu package to get started"}
            </p>
            {!hasActiveFilters() && (
              <button
                onClick={handleAddMenu}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus size={20} />
                Create Your First Package
              </button>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {menus.map((menu) => (
                <MenuCard
                  key={menu._id}
                  menu={menu}
                  onEdit={handleEditMenu}
                  onDelete={handleDeleteMenu}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Menu Form Modal */}
      <MenuFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        menu={selectedMenu}
        onSuccess={handleModalUpdate}
      />
    </div>
  );
};

export default Menu;
