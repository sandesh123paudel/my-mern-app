import React, { useState, useEffect } from "react";
import { Save, X, Plus, Trash2, Settings, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { createMenu, updateMenu } from "../../../services/menuServices";
import { getLocations } from "../../../services/locationServices";
import { getServices } from "../../../services/serviceServices";
import { getMenuItems } from "../../../services/menuItemService";

const MenuFormModal = ({ isOpen, onClose, menu, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    serviceId: "",
    locationId: "",
    description: "",
    price: "",
    minPeople: 1,
    maxPeople: "",
    categories: {
      entree: {
        enabled: false,
        includedItems: [],
        selectionGroups: [],
      },
      mains: {
        enabled: false,
        includedItems: [],
        selectionGroups: [],
      },
      desserts: {
        enabled: false,
        includedItems: [],
        selectionGroups: [],
      },
    },
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  // Load initial data and set filtered services if editing
  useEffect(() => {
    if (isOpen && menu && formData.locationId && services.length > 0) {
      console.log("Setting up filtered services for editing..."); // Debug log
      const locationServices = services.filter(
        (service) =>
          (service.locationId?._id || service.locationId) ===
          formData.locationId
      );
      console.log("Filtered services:", locationServices); // Debug log
      setFilteredServices(locationServices);
    }
  }, [isOpen, menu, formData.locationId, services]);

  // Load menu data when editing
  useEffect(() => {
    if (menu) {
      console.log("Loading menu for editing:", menu); // Debug log

      // Helper function to extract ID from populated or non-populated field
      const extractId = (field) => {
        if (!field) return "";
        const id = typeof field === "object" ? field._id : field;
        console.log("Extracting ID from field:", field, "-> ID:", id); // Debug log
        return id;
      };

      // Helper function to extract IDs from array of items (populated or not)
      const extractItemIds = (items) => {
        if (!Array.isArray(items)) return [];
        const ids = items.map((item) => extractId(item));
        console.log("Extracting item IDs:", items, "-> IDs:", ids); // Debug log
        return ids;
      };

      // Helper function to process selection groups
      const processSelectionGroups = (selectionGroups) => {
        if (!Array.isArray(selectionGroups)) return [];
        const processed = selectionGroups.map((group) => ({
          ...group,
          items: extractItemIds(group.items),
        }));
        console.log(
          "Processing selection groups:",
          selectionGroups,
          "-> Processed:",
          processed
        ); // Debug log
        return processed;
      };

      // Helper function to process category data
      const processCategoryData = (category) => {
        if (!category)
          return { enabled: false, includedItems: [], selectionGroups: [] };
        const processed = {
          enabled: category.enabled || false,
          includedItems: extractItemIds(category.includedItems),
          selectionGroups: processSelectionGroups(category.selectionGroups),
        };
        console.log(
          "Processing category data:",
          category,
          "-> Processed:",
          processed
        ); // Debug log
        return processed;
      };

      const formData = {
        name: menu.name || "",
        serviceId: extractId(menu.serviceId),
        locationId: extractId(menu.locationId),
        description: menu.description || "",
        price: menu.price?.toString() || "",
        minPeople: menu.minPeople || 1,
        maxPeople: menu.maxPeople?.toString() || "",
        categories: {
          entree: processCategoryData(menu.categories?.entree),
          mains: processCategoryData(menu.categories?.mains),
          desserts: processCategoryData(menu.categories?.desserts),
          addons: processCategoryData(menu.categories?.addons),
        },
        isActive: menu.isActive ?? true,
      };

      console.log("Setting form data:", formData); // Debug log
      setFormData(formData);
    } else {
      resetForm();
    }
  }, [menu]);

  // Filter services based on selected location
  useEffect(() => {
    if (formData.locationId) {
      const locationServices = services.filter(
        (service) =>
          (service.locationId?._id || service.locationId) ===
          formData.locationId
      );
      setFilteredServices(locationServices);

      // Don't reset service selection if we're editing and service belongs to location
      if (
        formData.serviceId &&
        !locationServices.find((s) => s._id === formData.serviceId)
      ) {
        // Only reset if the current service doesn't belong to the selected location
        if (
          !menu ||
          (menu && extractId(menu.serviceId) !== formData.serviceId)
        ) {
          setFormData((prev) => ({ ...prev, serviceId: "" }));
        }
      }
    } else {
      setFilteredServices([]);
    }
  }, [formData.locationId, services, menu]);

  // Helper function to extract ID (defined outside useEffect for reuse)
  const extractId = (field) => {
    if (!field) return "";
    return typeof field === "object" ? field._id : field;
  };

  const loadInitialData = async () => {
    try {
      const [locationsResult, servicesResult, menuItemsResult] =
        await Promise.all([getLocations(), getServices(), getMenuItems()]);

      if (locationsResult.success) setLocations(locationsResult.data);
      if (servicesResult.success) setServices(servicesResult.data);
      if (menuItemsResult.success) setMenuItems(menuItemsResult.data);
    } catch (error) {
      toast.error("Failed to load form data");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      serviceId: "",
      locationId: "",
      description: "",
      price: "",
      minPeople: 1,
      maxPeople: "",
      categories: {
        entree: { enabled: false, includedItems: [], selectionGroups: [] },
        mains: { enabled: false, includedItems: [], selectionGroups: [] },
        desserts: { enabled: false, includedItems: [], selectionGroups: [] },
        addons: { enabled: false, includedItems: [], selectionGroups: [] }, // Added addons
      },
      isActive: true,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCategoryToggle = (categoryName) => {
    setFormData((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryName]: {
          ...prev.categories[categoryName],
          enabled: !prev.categories[categoryName].enabled,
        },
      },
    }));
  };

  const addIncludedItem = (categoryName, itemId) => {
    if (!itemId) return;

    setFormData((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryName]: {
          ...prev.categories[categoryName],
          includedItems: [
            ...prev.categories[categoryName].includedItems,
            itemId,
          ],
        },
      },
    }));
  };

  const removeIncludedItem = (categoryName, itemId) => {
    setFormData((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryName]: {
          ...prev.categories[categoryName],
          includedItems: prev.categories[categoryName].includedItems.filter(
            (id) => id !== itemId
          ),
        },
      },
    }));
  };

  const addSelectionGroup = (categoryName) => {
    setFormData((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryName]: {
          ...prev.categories[categoryName],
          selectionGroups: [
            ...prev.categories[categoryName].selectionGroups,
            {
              name: "",
              items: [],
              selectionType: "single",
              minSelections: 1,
              maxSelections: 1,
              isRequired: true,
            },
          ],
        },
      },
    }));
  };

  const updateSelectionGroup = (categoryName, groupIndex, field, value) => {
    setFormData((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryName]: {
          ...prev.categories[categoryName],
          selectionGroups: prev.categories[categoryName].selectionGroups.map(
            (group, index) =>
              index === groupIndex ? { ...group, [field]: value } : group
          ),
        },
      },
    }));
  };

  const removeSelectionGroup = (categoryName, groupIndex) => {
    setFormData((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryName]: {
          ...prev.categories[categoryName],
          selectionGroups: prev.categories[categoryName].selectionGroups.filter(
            (_, index) => index !== groupIndex
          ),
        },
      },
    }));
  };

  const addItemToSelectionGroup = (categoryName, groupIndex, itemId) => {
    if (!itemId) return;

    setFormData((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryName]: {
          ...prev.categories[categoryName],
          selectionGroups: prev.categories[categoryName].selectionGroups.map(
            (group, index) =>
              index === groupIndex
                ? { ...group, items: [...group.items, itemId] }
                : group
          ),
        },
      },
    }));
  };

  const removeItemFromSelectionGroup = (categoryName, groupIndex, itemId) => {
    setFormData((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryName]: {
          ...prev.categories[categoryName],
          selectionGroups: prev.categories[categoryName].selectionGroups.map(
            (group, index) =>
              index === groupIndex
                ? { ...group, items: group.items.filter((id) => id !== itemId) }
                : group
          ),
        },
      },
    }));
  };

  const getMenuItemsByCategory = (category) => {
    return menuItems.filter((item) => item.category === category);
  };

  const getAvailableItemsForIncluded = (categoryName) => {
    const categoryItems = getMenuItemsByCategory(categoryName);
    const categoryData = formData.categories[categoryName];

    // Get all items already used in selection groups for this category
    const usedInSelectionGroups = [];
    if (categoryData.selectionGroups) {
      categoryData.selectionGroups.forEach((group) => {
        if (group.items) {
          usedInSelectionGroups.push(...group.items);
        }
      });
    }

    // Filter out items already used in selection groups OR already included
    return categoryItems.filter(
      (item) =>
        !usedInSelectionGroups.includes(item._id) &&
        !categoryData.includedItems.includes(item._id)
    );
  };

  const getAvailableItemsForSelectionGroup = (categoryName, groupIndex) => {
    const categoryItems = getMenuItemsByCategory(categoryName);
    const categoryData = formData.categories[categoryName];

    // Get all items already included as "must include"
    const includedItems = categoryData.includedItems || [];

    // Get items used in other selection groups (but not the current one)
    const usedInOtherGroups = [];
    if (categoryData.selectionGroups) {
      categoryData.selectionGroups.forEach((group, index) => {
        if (index !== groupIndex && group.items) {
          usedInOtherGroups.push(...group.items);
        }
      });
    }

    // Get items already in the current selection group
    const currentGroupItems =
      categoryData.selectionGroups[groupIndex]?.items || [];

    // Filter out items already used elsewhere, but keep items already in current group available for editing
    return categoryItems.filter(
      (item) =>
        !includedItems.includes(item._id) &&
        !usedInOtherGroups.includes(item._id) &&
        !currentGroupItems.includes(item._id) // Don't show items already in this group
    );
  };

  const getMenuItemName = (itemId) => {
    // Handle both string IDs and populated objects
    const id = typeof itemId === "object" ? itemId._id : itemId;
    const item = menuItems.find((item) => item._id === id);
    return item ? item.name : "Unknown Item";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        maxPeople: formData.maxPeople
          ? parseInt(formData.maxPeople)
          : undefined,
      };

      let result;
      if (menu) {
        result = await updateMenu(menu._id, submitData);
      } else {
        result = await createMenu(submitData);
      }

      if (result.success) {
        toast.success(
          result.message || `Menu ${menu ? "updated" : "created"} successfully`
        );
        onClose();
        onSuccess();
        resetForm();
      } else {
        toast.error(
          result.error || `Failed to ${menu ? "update" : "create"} menu`
        );
      }
    } catch (error) {
      toast.error(
        `An error occurred while ${menu ? "updating" : "creating"} the menu`
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCategorySection = (categoryName, categoryData) => {
    const availableForIncluded = getAvailableItemsForIncluded(categoryName);

    return (
      <div key={categoryName} className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold capitalize">{categoryName}</h3>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={categoryData.enabled}
              onChange={() => handleCategoryToggle(categoryName)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm">Enable Category</span>
          </label>
        </div>

        {categoryData.enabled && (
          <div className="space-y-6">
            {/* Included Items */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-1">
                <CheckCircle2 size={16} className="text-green-500" />
                Included Items (Always served)
              </h4>
              <div className="space-y-2">
                {categoryData.includedItems.map((itemId, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex-1 text-sm bg-green-50 px-2 py-1 rounded">
                      {getMenuItemName(itemId)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeIncludedItem(categoryName, itemId)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <select
                  onChange={(e) =>
                    addIncludedItem(categoryName, e.target.value)
                  }
                  value=""
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="">Add included item...</option>
                  {availableForIncluded.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {availableForIncluded.length === 0 &&
                  categoryData.includedItems.length === 0 && (
                    <p className="text-xs text-gray-500 italic">
                      All {categoryName} items are being used in selection
                      groups
                    </p>
                  )}
              </div>
            </div>

            {/* Selection Groups */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-700 flex items-center gap-1">
                  <Settings size={16} className="text-blue-500" />
                  Customer Selection Groups
                </h4>
                <button
                  type="button"
                  onClick={() => addSelectionGroup(categoryName)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add Group
                </button>
              </div>

              {categoryData.selectionGroups.map((group, groupIndex) => {
                const availableForThisGroup =
                  getAvailableItemsForSelectionGroup(categoryName, groupIndex);

                return (
                  <div
                    key={groupIndex}
                    className="border border-gray-200 rounded p-3 mb-3"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <input
                        type="text"
                        value={group.name}
                        onChange={(e) =>
                          updateSelectionGroup(
                            categoryName,
                            groupIndex,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="Group name (e.g., Choose your protein)"
                        className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 mr-2"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          removeSelectionGroup(categoryName, groupIndex)
                        }
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                      <select
                        value={group.selectionType}
                        onChange={(e) =>
                          updateSelectionGroup(
                            categoryName,
                            groupIndex,
                            "selectionType",
                            e.target.value
                          )
                        }
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="single">Single Choice</option>
                        <option value="multiple">Multiple Choice</option>
                      </select>

                      <input
                        type="number"
                        value={group.minSelections}
                        onChange={(e) =>
                          updateSelectionGroup(
                            categoryName,
                            groupIndex,
                            "minSelections",
                            parseInt(e.target.value)
                          )
                        }
                        placeholder="Min"
                        min="0"
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      />

                      <input
                        type="number"
                        value={group.maxSelections}
                        onChange={(e) =>
                          updateSelectionGroup(
                            categoryName,
                            groupIndex,
                            "maxSelections",
                            parseInt(e.target.value)
                          )
                        }
                        placeholder="Max"
                        min="1"
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      />

                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={group.isRequired}
                          onChange={(e) =>
                            updateSelectionGroup(
                              categoryName,
                              groupIndex,
                              "isRequired",
                              e.target.checked
                            )
                          }
                          className="h-3 w-3"
                        />
                        Required
                      </label>
                    </div>

                    <div className="space-y-2">
                      {group.items.map((itemId, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex items-center gap-2"
                        >
                          <span className="flex-1 text-sm bg-blue-50 px-2 py-1 rounded">
                            {getMenuItemName(itemId)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              removeItemFromSelectionGroup(
                                categoryName,
                                groupIndex,
                                itemId
                              )
                            }
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <select
                        onChange={(e) =>
                          addItemToSelectionGroup(
                            categoryName,
                            groupIndex,
                            e.target.value
                          )
                        }
                        value=""
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">Add item to group...</option>
                        {availableForThisGroup.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                      {availableForThisGroup.length === 0 && (
                        <p className="text-xs text-gray-500 italic">
                          No available {categoryName} items. Items may already
                          be included or used in other groups.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6 overflow-y-auto max-h-[95vh]">
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {menu ? "Edit Menu" : "Create New Menu"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Menu Name *
                </label>
                <input
                  type="text"
                  name="name"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Wedding Package Menu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Location *
                </label>
                <select
                  name="locationId"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={formData.locationId}
                  onChange={handleChange}
                >
                  <option value="">Select Location</option>
                  {locations.map((location) => (
                    <option key={location._id} value={location._id}>
                      {location.name} - {location.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Service *
                </label>
                <select
                  name="serviceId"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={formData.serviceId}
                  onChange={handleChange}
                  disabled={!formData.locationId}
                >
                  <option value="">
                    {!formData.locationId
                      ? "Select location first"
                      : "Select Service"}
                  </option>
                  {filteredServices.map((service) => (
                    <option key={service._id} value={service._id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Price per Person (AUD) *
                </label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Minimum People *
                </label>
                <input
                  type="number"
                  name="minPeople"
                  min="1"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={formData.minPeople}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Maximum People
                </label>
                <input
                  type="number"
                  name="maxPeople"
                  min="1"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.maxPeople}
                  onChange={handleChange}
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                name="description"
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe this menu package..."
              />
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm">Active (visible to customers)</span>
              </label>
            </div>
          </div>

          {/* Menu Categories */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Menu Categories</h3>
            <div className="space-y-4">
              {Object.entries(formData.categories).map(
                ([categoryName, categoryData]) =>
                  renderCategorySection(categoryName, categoryData)
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              {loading ? "Saving..." : menu ? "Update Menu" : "Create Menu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuFormModal;
