import {
  X,
  Plus,
  Trash2,
  Save,
  Users,
  List,
  Package,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createCustomOrder,
  updateCustomOrder,
} from "../../../services/customOrderServices";
import { getServices } from "../../../services/serviceServices";
import { useEffect, useState } from "react";

const CustomOrderFormModal = ({
  isOpen,
  onClose,
  customOrder,
  selectedLocationId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    locationId: selectedLocationId || "",
    serviceId: "",
    minPeople: 1,
    maxPeople: 100,
    categories: [],
    addons: {
      enabled: false,
      fixedAddons: [],
      variableAddons: [],
    },
    isActive: true,
  });

  // Category options
  const categoryOptions = [
    { name: "entree", displayName: "Starters & Appetizers" },
    { name: "mains", displayName: "Main Courses" },
    { name: "on-tray", displayName: "On-Tray Meals" },
    { name: "kids", displayName: "Kids Menu" },
    { name: "desserts", displayName: "Desserts & Sweets" },
    { name: "sides", displayName: "Side Dishes" },
    { name: "drinks", displayName: "Drinks" },
  ];

  // Load services for the selected location
  useEffect(() => {
    if (isOpen && selectedLocationId) {
      loadServices();
    }
  }, [isOpen, selectedLocationId]);

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (customOrder) {
        // Edit mode
        setFormData({
          name: customOrder.name || "",
          description: customOrder.description || "",
          locationId:
            customOrder.locationId?._id ||
            customOrder.locationId ||
            selectedLocationId,
          serviceId: customOrder.serviceId?._id || customOrder.serviceId || "",
          minPeople: customOrder.minPeople || 1,
          maxPeople: customOrder.maxPeople || 100,
          categories: customOrder.categories || [],
          addons: customOrder.addons || {
            enabled: false,
            fixedAddons: [],
            variableAddons: [],
          },
          isActive:
            customOrder.isActive !== undefined ? customOrder.isActive : true,
        });
      } else {
        // Create mode
        resetForm();
      }
    }
  }, [isOpen, customOrder, selectedLocationId]);

  const loadServices = async () => {
    try {
      const result = await getServices();
      if (result.success) {
        // Filter services for the selected location
        const locationServices = result.data.filter(
          (service) =>
            (service.locationId?._id || service.locationId) ===
            selectedLocationId
        );
        setServices(locationServices);
      }
    } catch (error) {
      toast.error("Failed to load services");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      locationId: selectedLocationId || "",
      serviceId: "",
      minPeople: 1,
      maxPeople: 100,
      categories: [],
      addons: {
        enabled: false,
        fixedAddons: [],
        variableAddons: [],
      },
      isActive: true,
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Category management
  const addCategory = () => {
    const newCategory = {
      name: "mains",
      displayName: "Main Courses",
      description: "",
      items: [],
      isActive: true,
    };
    setFormData((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }));
  };

  const updateCategory = (categoryIndex, field, value) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((cat, index) => {
        if (index === categoryIndex) {
          if (field === "name") {
            const categoryOption = categoryOptions.find(
              (opt) => opt.name === value
            );
            return {
              ...cat,
              [field]: value,
              displayName: categoryOption ? categoryOption.displayName : value,
            };
          }
          return { ...cat, [field]: value };
        }
        return cat;
      }),
    }));
  };

  const removeCategory = (categoryIndex) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, index) => index !== categoryIndex),
    }));
  };

  // Item management
  const addItemToCategory = (categoryIndex) => {
    const newItem = {
      name: "",
      description: "",
      pricePerPerson: 0,
      isVegetarian: false,
      isVegan: false,
      isAvailable: true,
    };

    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((cat, index) =>
        index === categoryIndex
          ? { ...cat, items: [...(cat.items || []), newItem] }
          : cat
      ),
    }));
  };

  const updateCategoryItem = (categoryIndex, itemIndex, field, value) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((cat, catIdx) =>
        catIdx === categoryIndex
          ? {
              ...cat,
              items: cat.items.map((item, itemIdx) =>
                itemIdx === itemIndex ? { ...item, [field]: value } : item
              ),
            }
          : cat
      ),
    }));
  };

  const removeCategoryItem = (categoryIndex, itemIndex) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((cat, catIdx) =>
        catIdx === categoryIndex
          ? {
              ...cat,
              items: cat.items.filter((_, itemIdx) => itemIdx !== itemIndex),
            }
          : cat
      ),
    }));
  };

  // Fixed Addon management
  const addFixedAddon = () => {
    const newAddon = {
      name: "",
      description: "",
      pricePerPerson: 0,
      isDefault: false,
      isVegetarian: false,
      isVegan: false,
      isAvailable: true,
    };
    setFormData((prev) => ({
      ...prev,
      addons: {
        ...prev.addons,
        fixedAddons: [...prev.addons.fixedAddons, newAddon],
      },
    }));
  };

  const updateFixedAddon = (addonIndex, field, value) => {
    setFormData((prev) => ({
      ...prev,
      addons: {
        ...prev.addons,
        fixedAddons: prev.addons.fixedAddons.map((addon, index) =>
          index === addonIndex ? { ...addon, [field]: value } : addon
        ),
      },
    }));
  };

  const removeFixedAddon = (addonIndex) => {
    setFormData((prev) => ({
      ...prev,
      addons: {
        ...prev.addons,
        fixedAddons: prev.addons.fixedAddons.filter(
          (_, index) => index !== addonIndex
        ),
      },
    }));
  };

  // Variable Addon management
  const addVariableAddon = () => {
    const newAddon = {
      name: "",
      description: "",
      pricePerUnit: 0,
      unit: "piece",
      minQuantity: 0,
      maxQuantity: 20,
      isDefault: false,
      defaultQuantity: 0,
      isVegetarian: false,
      isVegan: false,
      isAvailable: true,
    };
    setFormData((prev) => ({
      ...prev,
      addons: {
        ...prev.addons,
        variableAddons: [...prev.addons.variableAddons, newAddon],
      },
    }));
  };

  const updateVariableAddon = (addonIndex, field, value) => {
    setFormData((prev) => ({
      ...prev,
      addons: {
        ...prev.addons,
        variableAddons: prev.addons.variableAddons.map((addon, index) =>
          index === addonIndex ? { ...addon, [field]: value } : addon
        ),
      },
    }));
  };

  const removeVariableAddon = (addonIndex) => {
    setFormData((prev) => ({
      ...prev,
      addons: {
        ...prev.addons,
        variableAddons: prev.addons.variableAddons.filter(
          (_, index) => index !== addonIndex
        ),
      },
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Menu name is required");
      return false;
    }
    if (!formData.serviceId) {
      toast.error("Service is required");
      return false;
    }
    if (formData.minPeople === "" || isNaN(formData.minPeople)) {
      toast.error("Minimum people is required and must be a number");
      return false;
    }
    if (formData.maxPeople === "" || isNaN(formData.maxPeople)) {
      toast.error("Maximum people is required and must be a number");
      return false;
    }
    if (formData.minPeople > formData.maxPeople) {
      toast.error("Minimum people cannot be greater than maximum people");
      return false;
    }
    if (formData.categories.length === 0) {
      toast.error("At least one category is required");
      return false;
    }

    // Validate categories and their items
    for (const category of formData.categories) {
      if (
        category.isActive &&
        (!category.items || category.items.length === 0)
      ) {
        toast.error(
          `Category "${category.displayName}" must have at least one item`
        );
        return false;
      }

      if (category.items) {
        for (const item of category.items) {
          if (!item.name.trim()) {
            toast.error(
              `All items in "${category.displayName}" must have a name`
            );
            return false;
          }
          if (item.pricePerPerson === "" || isNaN(item.pricePerPerson)) {
            toast.error(
              `Item "${item.name || "Unnamed"}" in "${
                category.displayName
              }" must have a valid price`
            );
            return false;
          }
        }
      }
    }

    // Validate addons
    for (const addon of formData.addons.fixedAddons) {
      if (!addon.name.trim()) {
        toast.error("All fixed addons must have a name");
        return false;
      }
      if (addon.pricePerPerson === "" || isNaN(addon.pricePerPerson)) {
        toast.error(
          `Fixed addon "${addon.name || "Unnamed"}" must have a valid price`
        );
        return false;
      }
    }
    for (const addon of formData.addons.variableAddons) {
      if (!addon.name.trim()) {
        toast.error("All variable addons must have a name");
        return false;
      }
      if (addon.pricePerUnit === "" || isNaN(addon.pricePerUnit)) {
        toast.error(
          `Variable addon "${addon.name || "Unnamed"}" must have a valid price`
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      let result;
      if (customOrder) {
        result = await updateCustomOrder(customOrder._id, formData);
      } else {
        result = await createCustomOrder(formData);
      }

      if (result.success) {
        toast.success(
          `Custom order menu ${
            customOrder ? "updated" : "created"
          } successfully`
        );
        onSuccess();
        onClose();
      } else {
        toast.error(
          result.error || `Failed to ${customOrder ? "update" : "create"} menu`
        );
      }
    } catch (error) {
      toast.error(`Failed to ${customOrder ? "update" : "create"} menu`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 top-[-50px] bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto my-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="text-orange-600" size={28} />
              {customOrder
                ? "Edit Custom Order Menu"
                : "Create Custom Order Menu"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Menu Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g., Lunch Special Menu"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service *
              </label>
              <select
                value={formData.serviceId}
                onChange={(e) => handleInputChange("serviceId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              >
                <option value="">Select Service</option>
                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Brief description of this menu"
              />
            </div>
          </div>

          {/* People Range */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Users size={20} />
              People Range
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Min People
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.minPeople}
                  onChange={(e) =>
                    handleInputChange(
                      "minPeople",
                      e.target.value === "" ? "" : parseInt(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Max People
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxPeople}
                  onChange={(e) =>
                    handleInputChange(
                      "maxPeople",
                      e.target.value === "" ? "" : parseInt(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <List size={20} />
                Menu Categories ({formData.categories.length})
              </h3>
              <button
                type="button"
                onClick={addCategory}
                className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                Add Category
              </button>
            </div>

            {formData.categories.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <List size={32} className="mx-auto mb-2 text-gray-300" />
                <p>No categories added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.categories.map((category, categoryIndex) => (
                  <div
                    key={categoryIndex}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    {/* Category Header */}
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        Category {categoryIndex + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeCategory(categoryIndex)}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Remove Category"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Category Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Category Type
                        </label>
                        <select
                          value={category.name}
                          onChange={(e) =>
                            updateCategory(
                              categoryIndex,
                              "name",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                        >
                          {categoryOptions.map((option) => (
                            <option key={option.name} value={option.name}>
                              {option.displayName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Custom Display Name
                        </label>
                        <input
                          type="text"
                          value={category.displayName}
                          onChange={(e) =>
                            updateCategory(
                              categoryIndex,
                              "displayName",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                          placeholder="Optional custom name"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={category.isActive}
                          onChange={(e) =>
                            updateCategory(
                              categoryIndex,
                              "isActive",
                              e.target.checked
                            )
                          }
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Active Category
                        </span>
                      </label>
                    </div>

                    {/* Category Items */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-gray-700">
                          Items ({category.items?.length || 0})
                        </h5>
                        <button
                          type="button"
                          onClick={() => addItemToCategory(categoryIndex)}
                          className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600 transition-colors flex items-center gap-1"
                        >
                          <Plus size={12} />
                          Add Item
                        </button>
                      </div>

                      {!category.items || category.items.length === 0 ? (
                        <div className="text-center py-3 text-gray-500 bg-gray-50 rounded text-sm">
                          No items added yet
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {category.items.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className="bg-gray-50 rounded p-3"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-700">
                                  Item {itemIndex + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeCategoryItem(categoryIndex, itemIndex)
                                  }
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div>
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) =>
                                      updateCategoryItem(
                                        categoryIndex,
                                        itemIndex,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-orange-500"
                                    placeholder="Item name"
                                    required
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) =>
                                      updateCategoryItem(
                                        categoryIndex,
                                        itemIndex,
                                        "description",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-orange-500"
                                    placeholder="Description"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.pricePerPerson}
                                    onChange={(e) =>
                                      updateCategoryItem(
                                        categoryIndex,
                                        itemIndex,
                                        "pricePerPerson",
                                        e.target.value === ""
                                          ? ""
                                          : parseFloat(e.target.value)
                                      )
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-orange-500"
                                    placeholder="Price per person"
                                  />
                                </div>
                              </div>
                              <div className="mt-2 flex gap-3 text-xs">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={item.isVegetarian}
                                    onChange={(e) =>
                                      updateCategoryItem(
                                        categoryIndex,
                                        itemIndex,
                                        "isVegetarian",
                                        e.target.checked
                                      )
                                    }
                                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                  />
                                  <span className="ml-1 text-gray-600">
                                    Vegetarian
                                  </span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={item.isVegan}
                                    onChange={(e) =>
                                      updateCategoryItem(
                                        categoryIndex,
                                        itemIndex,
                                        "isVegan",
                                        e.target.checked
                                      )
                                    }
                                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                  />
                                  <span className="ml-1 text-gray-600">
                                    Vegan
                                  </span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={item.isAvailable}
                                    onChange={(e) =>
                                      updateCategoryItem(
                                        categoryIndex,
                                        itemIndex,
                                        "isAvailable",
                                        e.target.checked
                                      )
                                    }
                                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                  />
                                  <span className="ml-1 text-gray-600">
                                    Available
                                  </span>
                                </label>
                              </div>
                            </div>
                          ))}
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => addItemToCategory(categoryIndex)}
                              className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600 transition-colors flex items-center gap-1"
                            >
                              <Plus size={12} />
                              Add Another Item
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={addCategory}
                    className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Plus size={16} />
                    Add Another Category
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Addons Section */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Plus size={20} />
                Enhanced Addons System
              </h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.addons.enabled}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      addons: { ...prev.addons, enabled: e.target.checked },
                    }))
                  }
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Enable Addons
                </span>
              </label>
            </div>

            {formData.addons.enabled ? (
              <div className="space-y-6">
                {/* Fixed Addons */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">
                      Fixed Addons - Price Per Person (
                      {formData.addons.fixedAddons.length})
                    </h4>
                    <button
                      type="button"
                      onClick={addFixedAddon}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Fixed Addon
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Fixed addons scale with the number of people (e.g., $5 per
                    person)
                  </p>

                  {formData.addons.fixedAddons.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded text-sm">
                      No fixed addons added yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.addons.fixedAddons.map((addon, addonIndex) => (
                        <div
                          key={addonIndex}
                          className="bg-blue-50 rounded border border-blue-200 p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-800">
                              Fixed Addon {addonIndex + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFixedAddon(addonIndex)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <div>
                              <input
                                type="text"
                                value={addon.name}
                                onChange={(e) =>
                                  updateFixedAddon(
                                    addonIndex,
                                    "name",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                placeholder="Addon name"
                                required
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                value={addon.description}
                                onChange={(e) =>
                                  updateFixedAddon(
                                    addonIndex,
                                    "description",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                placeholder="Description"
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={addon.pricePerPerson}
                                onChange={(e) =>
                                  updateFixedAddon(
                                    addonIndex,
                                    "pricePerPerson",
                                    e.target.value === ""
                                      ? ""
                                      : parseFloat(e.target.value)
                                  )
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                placeholder="Price per person"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={addon.isDefault}
                                onChange={(e) =>
                                  updateFixedAddon(
                                    addonIndex,
                                    "isDefault",
                                    e.target.checked
                                  )
                                }
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-1 text-gray-600">
                                Default Selected
                              </span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={addon.isVegetarian}
                                onChange={(e) =>
                                  updateFixedAddon(
                                    addonIndex,
                                    "isVegetarian",
                                    e.target.checked
                                  )
                                }
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-1 text-gray-600">
                                Vegetarian
                              </span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={addon.isVegan}
                                onChange={(e) =>
                                  updateFixedAddon(
                                    addonIndex,
                                    "isVegan",
                                    e.target.checked
                                  )
                                }
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-1 text-gray-600">Vegan</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={addon.isAvailable}
                                onChange={(e) =>
                                  updateFixedAddon(
                                    addonIndex,
                                    "isAvailable",
                                    e.target.checked
                                  )
                                }
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-1 text-gray-600">
                                Available
                              </span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Variable Addons */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">
                      Variable Addons - Customer Chooses Quantity (
                      {formData.addons.variableAddons.length})
                    </h4>
                    <button
                      type="button"
                      onClick={addVariableAddon}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Variable Addon
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Variable addons have fixed unit prices but customers choose
                    quantity (e.g., $2 per bottle, min: 0, max: 10)
                  </p>

                  {formData.addons.variableAddons.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded text-sm">
                      No variable addons added yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.addons.variableAddons.map(
                        (addon, addonIndex) => (
                          <div
                            key={addonIndex}
                            className="bg-green-50 rounded border border-green-200 p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-green-800">
                                Variable Addon {addonIndex + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeVariableAddon(addonIndex)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                              <div>
                                <input
                                  type="text"
                                  value={addon.name}
                                  onChange={(e) =>
                                    updateVariableAddon(
                                      addonIndex,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                                  placeholder="Addon name"
                                  required
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  value={addon.description}
                                  onChange={(e) =>
                                    updateVariableAddon(
                                      addonIndex,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                                  placeholder="Description"
                                />
                              </div>
                              <div>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={addon.pricePerUnit}
                                  onChange={(e) =>
                                    updateVariableAddon(
                                      addonIndex,
                                      "pricePerUnit",
                                      e.target.value === ""
                                        ? ""
                                        : parseFloat(e.target.value)
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                                  placeholder="Price per unit"
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  value={addon.unit}
                                  onChange={(e) =>
                                    updateVariableAddon(
                                      addonIndex,
                                      "unit",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                                  placeholder="Unit (e.g., piece, bottle)"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                  Min Quantity
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={addon.minQuantity}
                                  onChange={(e) =>
                                    updateVariableAddon(
                                      addonIndex,
                                      "minQuantity",
                                      e.target.value === ""
                                        ? ""
                                        : parseInt(e.target.value, 10)
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                  Max Quantity
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={addon.maxQuantity}
                                  onChange={(e) =>
                                    updateVariableAddon(
                                      addonIndex,
                                      "maxQuantity",
                                      e.target.value === ""
                                        ? ""
                                        : parseInt(e.target.value, 10)
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                  Default Quantity
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={addon.defaultQuantity}
                                  onChange={(e) =>
                                    updateVariableAddon(
                                      addonIndex,
                                      "defaultQuantity",
                                      e.target.value === ""
                                        ? ""
                                        : parseInt(e.target.value, 10)
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={addon.isDefault}
                                  onChange={(e) =>
                                    updateVariableAddon(
                                      addonIndex,
                                      "isDefault",
                                      e.target.checked
                                    )
                                  }
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <span className="ml-1 text-gray-600">
                                  Default Selected
                                </span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={addon.isVegetarian}
                                  onChange={(e) =>
                                    updateVariableAddon(
                                      addonIndex,
                                      "isVegetarian",
                                      e.target.checked
                                    )
                                  }
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <span className="ml-1 text-gray-600">
                                  Vegetarian
                                </span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={addon.isVegan}
                                  onChange={(e) =>
                                    updateVariableAddon(
                                      addonIndex,
                                      "isVegan",
                                      e.target.checked
                                    )
                                  }
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <span className="ml-1 text-gray-600">
                                  Vegan
                                </span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={addon.isAvailable}
                                  onChange={(e) =>
                                    updateVariableAddon(
                                      addonIndex,
                                      "isAvailable",
                                      e.target.checked
                                    )
                                  }
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <span className="ml-1 text-gray-600">
                                  Available
                                </span>
                              </label>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <AlertCircle size={32} className="mx-auto mb-2 text-gray-300" />
                <p>Enable addons to start adding fixed and variable addons</p>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  handleInputChange("isActive", e.target.checked)
                }
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Active Menu (visible to customers)
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {customOrder ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {customOrder ? "Update Menu" : "Create Menu"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomOrderFormModal;
