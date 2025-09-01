import { useState, useEffect, useCallback } from "react";
import { InlineLoading } from "../../components/Loading";
import toast from "react-hot-toast";
import {
  getAllCoupons,
  deleteCoupon,
  formatCouponForDisplay,
} from "../../services/couponService";
import { getLocations } from "../../services/locationServices";
import { getServices } from "../../services/serviceServices";
import CouponCard from "../../components/admin/Coupon/CouponCard";
import CouponFormModal from "../../components/admin/Coupon/CouponFormModal";
import { Ticket, Plus, Filter, X, Tag, Percent } from "lucide-react";

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filter data
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);

  // Filter state
  const [filters, setFilters] = useState({
    isActive: undefined,
    search: "",
  });

  // Load initial data
  useEffect(() => {
    loadFilterData();
  }, []);

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

  // Fetch coupons with filters
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      // Clean up undefined values from filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      );

      const result = await getAllCoupons(cleanFilters);

      if (result.success) {
        // Format coupons for display
        const formattedCoupons = result.data.map((coupon) =>
          formatCouponForDisplay(coupon)
        );
        setCoupons(formattedCoupons || []);
        setTotalCount(result.total || 0);
      } else {
        toast.error(result.error || "Failed to load coupons");
        setCoupons([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("Failed to load coupons");
      setCoupons([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value === "" ? undefined : value,
    }));
  };

  const hasActiveFilters = () => {
    return filters.isActive !== undefined || filters.search !== "";
  };

  const clearAllFilters = () => {
    setFilters({
      isActive: undefined,
      search: "",
    });
  };

  const handleAddCoupon = () => {
    setSelectedCoupon(null);
    setShowFormModal(true);
  };

  const handleEditCoupon = (coupon) => {
    setSelectedCoupon(coupon);
    setShowFormModal(true);
  };

  const handleDeleteCoupon = async (couponId) => {
    toast((t) => (
      <div>
        <p>
          Are you sure you want to delete this coupon? This action cannot be
          undone.
        </p>
        <div className="flex justify-start mt-3">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const result = await deleteCoupon(couponId);
                if (result.success) {
                  toast.success("Coupon deleted successfully");
                  fetchCoupons();
                } else {
                  toast.error(result.error || "Failed to delete coupon");
                }
              } catch (error) {
                toast.error("Failed to delete coupon");
              }
            }}
            className="bg-red-500 text-white px-2 py-1 rounded"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors ml-2"
          >
            Cancel
          </button>
        </div>
      </div>
    ));
  };

  const handleModalUpdate = () => {
    fetchCoupons();
  };

  const getCouponStats = () => {
    const stats = {
      total: coupons.length,
      active: coupons.filter(
        (coupon) =>
          coupon.isActive && !coupon.isExpired && coupon.remainingUses > 0
      ).length,
      expired: coupons.filter((coupon) => coupon.isExpired).length,
      inactive: coupons.filter((coupon) => !coupon.isActive).length,
      usedUp: coupons.filter((coupon) => coupon.remainingUses === 0).length,
      expiringSoon: coupons.filter(
        (coupon) => coupon.daysUntilExpiry <= 7 && coupon.daysUntilExpiry > 0
      ).length,
      totalUsage: coupons.reduce(
        (sum, coupon) => sum + (coupon.usedCount || 0),
        0
      ),
    };
    return stats;
  };

  const stats = getCouponStats();

  if (loading && coupons.length === 0) {
    return <InlineLoading message="Loading coupons..." size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Ticket className="text-green-600" size={36} />
            Coupon Management
          </h1>
          <p className="mt-1 text-gray-600">
            Create and manage discount coupons for your customers
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Total: {totalCount} coupons
          </div>
          <button
            onClick={handleAddCoupon}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
          >
            <Plus size={20} />
            Create Coupon
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">{stats.total}</div>
          <div className="text-sm text-green-600">Total Coupons</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">
            {stats.active}
          </div>
          <div className="text-sm text-green-600">Active</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-700">{stats.expired}</div>
          <div className="text-sm text-red-600">Expired</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-700">
            {stats.inactive}
          </div>
          <div className="text-sm text-gray-600">Inactive</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-700">
            {stats.usedUp}
          </div>
          <div className="text-sm text-orange-600">Used Up</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-700">
            {stats.expiringSoon}
          </div>
          <div className="text-sm text-yellow-600">Expiring Soon</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-700">
            {stats.totalUsage}
          </div>
          <div className="text-sm text-blue-600">Total Uses</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Coupons
            </label>
            <input
              type="text"
              placeholder="Search by code or name..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              {filters.search && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Search: "{filters.search}"
                </span>
              )}
              {filters.isActive !== undefined && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {filters.isActive ? "Active Only" : "Inactive Only"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Coupons Display */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-green-800">
              Coupons ({totalCount})
            </h2>
            {loading && (
              <div className="text-sm text-green-600">Loading...</div>
            )}
          </div>
        </div>

        {coupons.length === 0 && !loading ? (
          <div className="p-8 text-center text-gray-600">
            <Tag size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No coupons found</p>
            <p className="text-sm mt-2">
              {hasActiveFilters()
                ? "Try adjusting your filters"
                : "Create your first coupon to get started"}
            </p>
            {!hasActiveFilters() && (
              <button
                onClick={handleAddCoupon}
                className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus size={20} />
                Create Your First Coupon
              </button>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {coupons.map((coupon) => (
                <CouponCard
                  key={coupon._id}
                  coupon={coupon}
                  locations={locations}
                  services={services}
                  onEdit={handleEditCoupon}
                  onDelete={handleDeleteCoupon}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Coupon Form Modal */}
      <CouponFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        coupon={selectedCoupon}
        locations={locations}
        services={services}
        onSuccess={handleModalUpdate}
      />
    </div>
  );
};

export default CouponManagement;
