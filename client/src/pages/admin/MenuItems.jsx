import { useState, useEffect, useCallback } from "react";
import { InlineLoading } from "../../components/Loading";
import toast from "react-hot-toast";
import { getMenuItems, deleteMenuItem } from "../../services/menuItemService";
import MenuItemCard from "../../components/admin/MenuItem/MenuItemCard";
import MenuItemFormModal from "../../components/admin/MenuItem/MenuItemFormModal";
import MenuItemFilters from "../../components/admin/MenuItem/MenuItemFilters";
import { ChefHat, Plus } from "lucide-react";

const MenuItems = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [filters, setFilters] = useState({
    category: undefined,
    isVegetarian: undefined,
    isVegan: undefined,
  });

  // Fetch menu items with filters
  const fetchMenuItems = useCallback(async () => {
    setLoading(true);
    try {
      // Clean up undefined values from filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      );

      const result = await getMenuItems(cleanFilters);

      if (result.success) {
        setMenuItems(result.data || []);
        setTotalCount(result.count || 0);
      } else {
        toast.error(result.error || "Failed to load menu items");
        setMenuItems([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast.error("Failed to load menu items");
      setMenuItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const handleAddMenuItem = () => {
    setSelectedMenuItem(null);
    setShowFormModal(true);
  };

  const handleEditMenuItem = (menuItem) => {
    setSelectedMenuItem(menuItem);
    setShowFormModal(true);
  };

  const handleDeleteMenuItem = async (menuItemId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this menu item? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const result = await deleteMenuItem(menuItemId);
      if (result.success) {
        toast.success("Menu item deleted successfully");
        fetchMenuItems(); // Reload the list
      } else {
        toast.error(result.error || "Failed to delete menu item");
      }
    } catch (error) {
      toast.error("Failed to delete menu item");
    }
  };

  const handleModalUpdate = () => {
    fetchMenuItems();
  };

  const handleClearFilters = () => {
    fetchMenuItems();
  };

  // Group menu items by category for display
  const groupedMenuItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const getCategoryStats = () => {
    const stats = {
      entree: menuItems.filter((item) => item.category === "entree").length,
      mains: menuItems.filter((item) => item.category === "mains").length,
      desserts: menuItems.filter((item) => item.category === "desserts").length,
      vegetarian: menuItems.filter((item) => item.isVegetarian).length,
      vegan: menuItems.filter((item) => item.isVegan).length,
    };
    return stats;
  };

  const stats = getCategoryStats();

  if (loading && menuItems.length === 0) {
    return <InlineLoading message="Loading menu items..." size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <ChefHat className="text-blue-600" />
            Menu Items Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your restaurant menu items, pricing, and categories
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">Total: {totalCount} items</div>
          <button
            onClick={handleAddMenuItem}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <Plus size={20} />
            Add Menu Item
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">
            {stats.entree}
          </div>
          <div className="text-sm text-green-600">Entrees</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-700">{stats.mains}</div>
          <div className="text-sm text-blue-600">Mains</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-700">
            {stats.desserts}
          </div>
          <div className="text-sm text-purple-600">Desserts</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-700">
            {stats.vegetarian}
          </div>
          <div className="text-sm text-yellow-600">Vegetarian</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-emerald-700">
            {stats.vegan}
          </div>
          <div className="text-sm text-emerald-600">Vegan</div>
        </div>
      </div>

      {/* Filters */}
      <MenuItemFilters
        filters={filters}
        setFilters={setFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Menu Items Display */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-blue-800">
              Menu Items ({totalCount})
            </h2>
            {loading && <div className="text-sm text-blue-600">Loading...</div>}
          </div>
        </div>

        {menuItems.length === 0 && !loading ? (
          <div className="p-8 text-center text-gray-600">
            <ChefHat size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No menu items found</p>
            <p className="text-sm mt-2">
              {Object.values(filters).some((f) => f !== undefined)
                ? "Try adjusting your filters"
                : "Create your first menu item to get started"}
            </p>
          </div>
        ) : (
          <div className="p-6">
            {/* Display by category if no specific category filter is applied */}
            {!filters.category ? (
              <div className="space-y-8">
                {["entree", "mains", "desserts"].map((category) => {
                  const categoryItems = groupedMenuItems[category] || [];
                  if (categoryItems.length === 0) return null;

                  return (
                    <div key={category}>
                      <h3 className="text-xl font-semibold text-gray-800 mb-4 capitalize flex items-center gap-2">
                        {category}
                        <span className="text-sm font-normal text-gray-500">
                          ({categoryItems.length} items)
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {categoryItems.map((menuItem) => (
                          <MenuItemCard
                            key={menuItem._id}
                            menuItem={menuItem}
                            onEdit={handleEditMenuItem}
                            onDelete={handleDeleteMenuItem}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Display as grid when category filter is applied */
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {menuItems.map((menuItem) => (
                  <MenuItemCard
                    key={menuItem._id}
                    menuItem={menuItem}
                    onEdit={handleEditMenuItem}
                    onDelete={handleDeleteMenuItem}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Menu Item Form Modal */}
      <MenuItemFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        menuItem={selectedMenuItem}
        onSuccess={handleModalUpdate}
      />
    </div>
  );
};

export default MenuItems;
