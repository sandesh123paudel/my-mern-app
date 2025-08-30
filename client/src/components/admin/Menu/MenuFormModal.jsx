import React, { useState, useEffect } from "react";
import {
  Save,
  X,
  Plus,
  Trash2,
  Settings,
  CheckCircle2,
  Package,
  List,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";
import { createMenu, updateMenu } from "../../../services/menuServices";
import { getLocations } from "../../../services/locationServices";
import { getServices } from "../../../services/serviceServices";

// Reusable Add Button Component
const AddButton = ({ onClick, children, className = "", size = "normal" }) => {
  const baseClasses =
    "text-white rounded flex items-center gap-1 hover:opacity-90 transition-colors";
  const sizeClasses =
    size === "small" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses} ${className}`}
    >
      <Plus size={size === "small" ? 14 : 16} />
      {children}
    </button>
  );
};

const MenuFormModal = ({ isOpen, onClose, menu, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    serviceId: "",
    locationId: "",
    description: "",
    basePrice: "",
    minPeople: 1,
    maxPeople: 1000,
    packageType: "categorized",
    // Dynamic categories
    categories: [],
    // Simple items
    simpleItems: [],
    // Addons
    addons: {
      enabled: false,
      fixedAddons: [],
      variableAddons: [],
    },
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.locationId) {
      const locationServices = services.filter(
        (service) =>
          (service.locationId?._id || service.locationId) ===
          formData.locationId
      );
      setFilteredServices(locationServices);

      if (
        formData.serviceId &&
        !locationServices.find((s) => s._id === formData.serviceId)
      ) {
        setFormData((prev) => ({ ...prev, serviceId: "" }));
      }
    } else {
      setFilteredServices([]);
    }
  }, [formData.locationId, services]);

  useEffect(() => {
    if (menu) {
      const extractId = (field) => {
        if (!field) return "";
        return typeof field === "object" ? field._id : field;
      };

      setFormData({
        name: menu.name || "",
        serviceId: extractId(menu.serviceId),
        locationId: extractId(menu.locationId),
        description: menu.description || "",
        basePrice: (menu.basePrice || menu.price)?.toString() || "",
        minPeople: menu.minPeople || 10,
        maxPeople: menu.maxPeople?.toString() || 1000,
        packageType: menu.packageType || "categorized",
        categories: menu.categories || [],
        simpleItems: menu.simpleItems || [],
        addons: menu.addons || {
          enabled: false,
          fixedAddons: [],
          variableAddons: [],
        },
        isActive: menu.isActive ?? true,
      });
    } else {
      resetForm();
    }
  }, [menu]);

  const loadInitialData = async () => {
    try {
      const [locationsResult, servicesResult] = await Promise.all([
        getLocations(),
        getServices(),
      ]);

      if (locationsResult.success) setLocations(locationsResult.data);
      if (servicesResult.success) setServices(servicesResult.data);
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
      basePrice: "",
      minPeople: 10,
      maxPeople: 1000,
      packageType: "categorized",
      categories: [],
      simpleItems: [],
      addons: {
        enabled: false,
        fixedAddons: [],
        variableAddons: [],
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

  // Category management
  const addCategory = () => {
    const newCategory = {
      name: "",
      enabled: true,
      includedItems: [],
      selectionGroups: [],
    };
    setFormData((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }));
  };

  const updateCategory = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((category, i) =>
        i === index ? { ...category, [field]: value } : category
      ),
    }));
  };

  const removeCategory = (index) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index),
    }));
  };

  // Category items management
  const addIncludedItem = (categoryIndex) => {
    const newItem = {
      name: "",
      priceModifier: 0,
      options: [],
    };
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((category, i) =>
        i === categoryIndex
          ? { ...category, includedItems: [...category.includedItems, newItem] }
          : category
      ),
    }));
  };

  const updateIncludedItem = (categoryIndex, itemIndex, field, value) => {
    let processedValue = value;
    if (field === "priceModifier") {
      if (value === "" || value === null || value === undefined) {
        processedValue = "";
      } else {
        const numValue = parseFloat(value);
        processedValue = isNaN(numValue) ? "" : numValue;
      }
    }

    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((category, i) =>
        i === categoryIndex
          ? {
              ...category,
              includedItems: category.includedItems.map((item, j) =>
                j === itemIndex ? { ...item, [field]: processedValue } : item
              ),
            }
          : category
      ),
    }));
  };

  const removeIncludedItem = (categoryIndex, itemIndex) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((category, i) =>
        i === categoryIndex
          ? {
              ...category,
              includedItems: category.includedItems.filter(
                (_, j) => j !== itemIndex
              ),
            }
          : category
      ),
    }));
  };

  // Selection group management
  const addSelectionGroup = (categoryIndex) => {
    const newGroup = {
      name: "",
      items: [],
      selectionType: "single",
      minSelections: 1,
      maxSelections: 1,
      isRequired: true,
    };
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((category, i) =>
        i === categoryIndex
          ? {
              ...category,
              selectionGroups: [...category.selectionGroups, newGroup],
            }
          : category
      ),
    }));
  };

  const updateSelectionGroup = (categoryIndex, groupIndex, field, value) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((category, i) =>
        i === categoryIndex
          ? {
              ...category,
              selectionGroups: category.selectionGroups.map((group, j) =>
                j === groupIndex ? { ...group, [field]: value } : group
              ),
            }
          : category
      ),
    }));
  };

  const removeSelectionGroup = (categoryIndex, groupIndex) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((category, i) =>
        i === categoryIndex
          ? {
              ...category,
              selectionGroups: category.selectionGroups.filter(
                (_, j) => j !== groupIndex
              ),
            }
          : category
      ),
    }));
  };

  const addItemToSelectionGroup = (categoryIndex, groupIndex) => {
    const newItem = {
      name: "",
      priceModifier: 0,
      options: [],
    };
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((category, i) =>
        i === categoryIndex
          ? {
              ...category,
              selectionGroups: category.selectionGroups.map((group, j) =>
                j === groupIndex
                  ? { ...group, items: [...group.items, newItem] }
                  : group
              ),
            }
          : category
      ),
    }));
  };

  const updateSelectionGroupItem = (
    categoryIndex,
    groupIndex,
    itemIndex,
    field,
    value
  ) => {
    let processedValue = value;
    if (field === "priceModifier") {
      if (value === "" || value === null || value === undefined) {
        processedValue = "";
      } else {
        const numValue = parseFloat(value);
        processedValue = isNaN(numValue) ? "" : numValue;
      }
    }

    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((category, i) =>
        i === categoryIndex
          ? {
              ...category,
              selectionGroups: category.selectionGroups.map((group, j) =>
                j === groupIndex
                  ? {
                      ...group,
                      items: group.items.map((item, k) =>
                        k === itemIndex
                          ? { ...item, [field]: processedValue }
                          : item
                      ),
                    }
                  : group
              ),
            }
          : category
      ),
    }));
  };

  const removeItemFromSelectionGroup = (
    categoryIndex,
    groupIndex,
    itemIndex
  ) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((category, i) =>
        i === categoryIndex
          ? {
              ...category,
              selectionGroups: category.selectionGroups.map((group, j) =>
                j === groupIndex
                  ? {
                      ...group,
                      items: group.items.filter((_, k) => k !== itemIndex),
                    }
                  : group
              ),
            }
          : category
      ),
    }));
  };

  // Options management for items
  const addOption = (type, categoryIndex, groupIndex, itemIndex) => {
    const newOption = {
      name: "",
      priceModifier: 0,
    };

    if (type === "simple") {
      setFormData((prev) => ({
        ...prev,
        simpleItems: prev.simpleItems.map((item, i) =>
          i === categoryIndex
            ? { ...item, options: [...(item.options || []), newOption] }
            : item
        ),
      }));
    } else if (type === "included") {
      setFormData((prev) => ({
        ...prev,
        categories: prev.categories.map((category, i) =>
          i === categoryIndex
            ? {
                ...category,
                includedItems: category.includedItems.map((item, j) =>
                  j === groupIndex
                    ? { ...item, options: [...(item.options || []), newOption] }
                    : item
                ),
              }
            : category
        ),
      }));
    } else if (type === "selection") {
      setFormData((prev) => ({
        ...prev,
        categories: prev.categories.map((category, i) =>
          i === categoryIndex
            ? {
                ...category,
                selectionGroups: category.selectionGroups.map((group, j) =>
                  j === groupIndex
                    ? {
                        ...group,
                        items: group.items.map((item, k) =>
                          k === itemIndex
                            ? {
                                ...item,
                                options: [...(item.options || []), newOption],
                              }
                            : item
                        ),
                      }
                    : group
                ),
              }
            : category
        ),
      }));
    }
  };

  const updateOption = (
    type,
    categoryIndex,
    groupIndex,
    itemIndex,
    optionIndex,
    field,
    value
  ) => {
    let processedValue = value;
    if (field === "priceModifier") {
      if (value === "" || value === null || value === undefined) {
        processedValue = "";
      } else {
        const numValue = parseFloat(value);
        processedValue = isNaN(numValue) ? "" : numValue;
      }
    }

    if (type === "simple") {
      setFormData((prev) => ({
        ...prev,
        simpleItems: prev.simpleItems.map((item, i) =>
          i === categoryIndex
            ? {
                ...item,
                options: item.options.map((option, j) =>
                  j === groupIndex
                    ? { ...option, [field]: processedValue }
                    : option
                ),
              }
            : item
        ),
      }));
    } else if (type === "included") {
      setFormData((prev) => ({
        ...prev,
        categories: prev.categories.map((category, i) =>
          i === categoryIndex
            ? {
                ...category,
                includedItems: category.includedItems.map((item, j) =>
                  j === groupIndex
                    ? {
                        ...item,
                        options: item.options.map((option, k) =>
                          k === itemIndex
                            ? { ...option, [field]: processedValue }
                            : option
                        ),
                      }
                    : item
                ),
              }
            : category
        ),
      }));
    } else if (type === "selection") {
      setFormData((prev) => ({
        ...prev,
        categories: prev.categories.map((category, i) =>
          i === categoryIndex
            ? {
                ...category,
                selectionGroups: category.selectionGroups.map((group, j) =>
                  j === groupIndex
                    ? {
                        ...group,
                        items: group.items.map((item, k) =>
                          k === itemIndex
                            ? {
                                ...item,
                                options: item.options.map((option, l) =>
                                  l === optionIndex
                                    ? { ...option, [field]: processedValue }
                                    : option
                                ),
                              }
                            : item
                        ),
                      }
                    : group
                ),
              }
            : category
        ),
      }));
    }
  };

  const removeOption = (
    type,
    categoryIndex,
    groupIndex,
    itemIndex,
    optionIndex
  ) => {
    if (type === "simple") {
      setFormData((prev) => ({
        ...prev,
        simpleItems: prev.simpleItems.map((item, i) =>
          i === categoryIndex
            ? {
                ...item,
                options: item.options.filter((_, j) => j !== groupIndex),
              }
            : item
        ),
      }));
    } else if (type === "included") {
      setFormData((prev) => ({
        ...prev,
        categories: prev.categories.map((category, i) =>
          i === categoryIndex
            ? {
                ...category,
                includedItems: category.includedItems.map((item, j) =>
                  j === groupIndex
                    ? {
                        ...item,
                        options: item.options.filter((_, k) => k !== itemIndex),
                      }
                    : item
                ),
              }
            : category
        ),
      }));
    } else if (type === "selection") {
      setFormData((prev) => ({
        ...prev,
        categories: prev.categories.map((category, i) =>
          i === categoryIndex
            ? {
                ...category,
                selectionGroups: category.selectionGroups.map((group, j) =>
                  j === groupIndex
                    ? {
                        ...group,
                        items: group.items.map((item, k) =>
                          k === itemIndex
                            ? {
                                ...item,
                                options: item.options.filter(
                                  (_, l) => l !== optionIndex
                                ),
                              }
                            : item
                        ),
                      }
                    : group
                ),
              }
            : category
        ),
      }));
    }
  };

  // Simple items management
  const addSimpleItem = () => {
    const newItem = {
      name: "",
      priceModifier: "",
      quantity: "",
      options: [],
      selectionType: "single",
      hasChoices: false,
      choices: [],
    };
    setFormData((prev) => ({
      ...prev,
      simpleItems: [...prev.simpleItems, newItem],
    }));
  };

  const updateSimpleItem = (index, field, value) => {
    let processedValue = value;
    if (field === "quantity" || field === "priceModifier") {
      if (value === "" || value === null || value === undefined) {
        processedValue = "";
      } else {
        const numValue = parseFloat(value);
        processedValue = isNaN(numValue) ? "" : numValue;
      }
    }

    setFormData((prev) => ({
      ...prev,
      simpleItems: prev.simpleItems.map((item, i) =>
        i === index ? { ...item, [field]: processedValue } : item
      ),
    }));
  };

  // Simple item choices management
  const addSimpleItemChoice = (itemIndex) => {
    const newChoice = {
      name: "",
      priceModifier: "",
    };
    setFormData((prev) => ({
      ...prev,
      simpleItems: prev.simpleItems.map((item, i) =>
        i === itemIndex
          ? { ...item, choices: [...(item.choices || []), newChoice] }
          : item
      ),
    }));
  };

  const updateSimpleItemChoice = (itemIndex, choiceIndex, field, value) => {
    let processedValue = value;
    if (field === "priceModifier") {
      if (value === "" || value === null || value === undefined) {
        processedValue = "";
      } else {
        const numValue = parseFloat(value);
        processedValue = isNaN(numValue) ? "" : numValue;
      }
    }

    setFormData((prev) => ({
      ...prev,
      simpleItems: prev.simpleItems.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              choices: item.choices.map((choice, j) =>
                j === choiceIndex
                  ? { ...choice, [field]: processedValue }
                  : choice
              ),
            }
          : item
      ),
    }));
  };

  const removeSimpleItemChoice = (itemIndex, choiceIndex) => {
    setFormData((prev) => ({
      ...prev,
      simpleItems: prev.simpleItems.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              choices: item.choices.filter((_, j) => j !== choiceIndex),
            }
          : item
      ),
    }));
  };

  const removeSimpleItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      simpleItems: prev.simpleItems.filter((_, i) => i !== index),
    }));
  };

  // Addon management
  const toggleAddons = () => {
    setFormData((prev) => ({
      ...prev,
      addons: { ...prev.addons, enabled: !prev.addons.enabled },
    }));
  };

  const addFixedAddon = () => {
    const newAddon = {
      name: "",
      pricePerPerson: 0,
      isDefault: false,
    };
    setFormData((prev) => ({
      ...prev,
      addons: {
        ...prev.addons,
        fixedAddons: [...prev.addons.fixedAddons, newAddon],
      },
    }));
  };

  const updateFixedAddon = (index, field, value) => {
    let processedValue = value;
    if (field === "pricePerPerson") {
      if (value === "" || value === null || value === undefined) {
        processedValue = "";
      } else {
        const numValue = parseFloat(value);
        processedValue = isNaN(numValue) ? "" : numValue;
      }
    }

    setFormData((prev) => ({
      ...prev,
      addons: {
        ...prev.addons,
        fixedAddons: prev.addons.fixedAddons.map((addon, i) =>
          i === index ? { ...addon, [field]: processedValue } : addon
        ),
      },
    }));
  };

  const removeFixedAddon = (index) => {
    setFormData((prev) => ({
      ...prev,
      addons: {
        ...prev.addons,
        fixedAddons: prev.addons.fixedAddons.filter((_, i) => i !== index),
      },
    }));
  };

  const addVariableAddon = () => {
    const newAddon = {
      name: "",
      pricePerUnit: 0,
      unit: "piece",
      minQuantity: 0,
      maxQuantity: 20,
      isDefault: false,
      defaultQuantity: 0,
    };
    setFormData((prev) => ({
      ...prev,
      addons: {
        ...prev.addons,
        variableAddons: [...prev.addons.variableAddons, newAddon],
      },
    }));
  };

  const updateVariableAddon = (index, field, value) => {
    let processedValue = value;
    if (field === "pricePerUnit") {
      if (value === "" || value === null || value === undefined) {
        processedValue = "";
      } else {
        const numValue = parseFloat(value);
        processedValue = isNaN(numValue) ? "" : numValue;
      }
    } else if (field === "maxQuantity" || field === "defaultQuantity") {
      if (value === "" || value === null || value === undefined) {
        processedValue = "";
      } else {
        const numValue = parseInt(value);
        processedValue = isNaN(numValue) ? "" : numValue;
      }
    }

    setFormData((prev) => ({
      ...prev,
      addons: {
        ...prev.addons,
        variableAddons: prev.addons.variableAddons.map((addon, i) =>
          i === index ? { ...addon, [field]: processedValue } : addon
        ),
      },
    }));
  };

  const removeVariableAddon = (index) => {
    setFormData((prev) => ({
      ...prev,
      addons: {
        ...prev.addons,
        variableAddons: prev.addons.variableAddons.filter(
          (_, i) => i !== index
        ),
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simple data processing without complex transformations
      const processedData = {
        ...formData,
        // Handle base price - convert empty string to 0
        basePrice:
          formData.basePrice === "" ? 0 : Number(formData.basePrice) || 0,
        price: formData.basePrice === "" ? 0 : Number(formData.basePrice) || 0, // For backward compatibility

        // Handle people counts
        minPeople:
          formData.minPeople === "" ? 1 : Number(formData.minPeople) || 1,
        maxPeople:
          formData.maxPeople === "" || formData.maxPeople === null
            ? null
            : Number(formData.maxPeople) || null,

        // Simple items - just clean empty strings to proper numbers
        simpleItems: formData.simpleItems.map((item) => ({
          ...item,
          priceModifier:
            item.priceModifier === "" ? 0 : Number(item.priceModifier) || 0,
          quantity: item.quantity === "" ? 1 : Number(item.quantity) || 1,
          options: (item.options || []).map((option) => ({
            ...option,
            priceModifier:
              option.priceModifier === ""
                ? 0
                : Number(option.priceModifier) || 0,
          })),
          choices: (item.choices || []).map((choice) => ({
            ...choice,
            priceModifier:
              choice.priceModifier === ""
                ? 0
                : Number(choice.priceModifier) || 0,
          })),
        })),

        // Categories - clean up nested structures
        categories: formData.categories.map((category) => ({
          ...category,
          includedItems: (category.includedItems || []).map((item) => ({
            ...item,
            priceModifier:
              item.priceModifier === "" ? 0 : Number(item.priceModifier) || 0,
            options: (item.options || []).map((option) => ({
              ...option,
              priceModifier:
                option.priceModifier === ""
                  ? 0
                  : Number(option.priceModifier) || 0,
            })),
          })),
          selectionGroups: (category.selectionGroups || []).map((group) => ({
            ...group,
            minSelections: Number(group.minSelections) || 1,
            maxSelections: Number(group.maxSelections) || 1,
            items: (group.items || []).map((item) => ({
              ...item,
              priceModifier:
                item.priceModifier === "" ? 0 : Number(item.priceModifier) || 0,
              options: (item.options || []).map((option) => ({
                ...option,
                priceModifier:
                  option.priceModifier === ""
                    ? 0
                    : Number(option.priceModifier) || 0,
              })),
            })),
          })),
        })),

        // Addons - clean up pricing fields
        addons: {
          ...formData.addons,
          fixedAddons: (formData.addons.fixedAddons || []).map((addon) => ({
            ...addon,
            pricePerPerson:
              addon.pricePerPerson === ""
                ? 0
                : Number(addon.pricePerPerson) || 0,
          })),
          variableAddons: (formData.addons.variableAddons || []).map(
            (addon) => ({
              ...addon,
              pricePerUnit:
                addon.pricePerUnit === "" ? 0 : Number(addon.pricePerUnit) || 0,
              maxQuantity:
                addon.maxQuantity === "" ? 20 : Number(addon.maxQuantity) || 20,
              minQuantity: Number(addon.minQuantity) || 0,
              defaultQuantity:
                addon.defaultQuantity === ""
                  ? 0
                  : Number(addon.defaultQuantity) || 0,
            })
          ),
        },
      };

      

      let result;
      if (menu) {
        result = await updateMenu(menu._id, processedData);
      } else {
        result = await createMenu(processedData);
      }

      if (result.success) {
        toast.success(
          result.message ||
            `Package ${menu ? "updated" : "created"} successfully`
        );
        onClose();
        onSuccess();
        resetForm();
      } else {
        console.error("API Error:", result.error);
        toast.error(
          result.error || `Failed to ${menu ? "update" : "create"} package`
        );
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error(
        `An error occurred while ${menu ? "updating" : "creating"} the package`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 top-[-25px] bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full p-6 overflow-y-auto max-h-[95vh]">
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-primary-green" />
            {menu ? "Edit Package" : "Create New Package"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="text-primary-green" size={20} />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Package Name *
                </label>
                <input
                  type="text"
                  name="name"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Wedding Dinner Package"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Package Type *
                </label>
                <select
                  name="packageType"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                  value={formData.packageType}
                  onChange={handleChange}
                >
                  <option value="categorized">Categorized Package</option>
                  <option value="simple">Simple Package</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Location *
                </label>
                <select
                  name="locationId"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
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
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
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
                  Base Price per Person (AUD) *
                </label>
                <input
                  type="number"
                  name="basePrice"
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                  required
                  value={formData.basePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Min People *
                </label>
                <input
                  type="number"
                  name="minPeople"
                  min="1"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                  required
                  value={formData.minPeople}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Max People
                </label>
                <input
                  type="number"
                  name="maxPeople"
                  min="1"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
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
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe this package..."
              />
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-green focus:ring-primary-green border-gray-300 rounded"
                />
                <span className="text-sm">Active (visible to customers)</span>
              </label>
            </div>
          </div>

          {/* Package Content based on type */}
          {formData.packageType === "categorized" ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="text-purple-600" size={20} />
                  Categories
                </h3>
                <AddButton
                  onClick={addCategory}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Add Category
                </AddButton>
              </div>

              <div className="space-y-6">
                {formData.categories.map((category, categoryIndex) => (
                  <div
                    key={categoryIndex}
                    className="border border-gray-200 rounded-lg p-6 bg-gray-50"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <input
                        type="text"
                        value={category.name}
                        onChange={(e) =>
                          updateCategory(categoryIndex, "name", e.target.value)
                        }
                        placeholder="Category name (e.g., Main Course, Desserts)"
                        className="flex-1 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                      />
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={category.enabled}
                          onChange={(e) =>
                            updateCategory(
                              categoryIndex,
                              "enabled",
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-primary-green focus:ring-primary-green border-gray-300 rounded"
                        />
                        <span className="text-sm">Enabled</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeCategory(categoryIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {category.enabled && (
                      <div className="space-y-6">
                        {/* Included Items */}
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-700 flex items-center gap-2">
                              <CheckCircle2
                                size={16}
                                className="text-green-500"
                              />
                              Included Items (Always served)
                            </h4>
                            <AddButton
                              onClick={() => addIncludedItem(categoryIndex)}
                              className="bg-green-600 hover:bg-green-700"
                              size="small"
                            >
                              Add Item
                            </AddButton>
                          </div>

                          <div className="space-y-3">
                            {category.includedItems.map((item, itemIndex) => (
                              <div
                                key={itemIndex}
                                className="border border-gray-200 rounded-lg p-3"
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) =>
                                      updateIncludedItem(
                                        categoryIndex,
                                        itemIndex,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Item name"
                                    className="flex-1 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                                  />
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm">$</span>
                                    <input
                                      type="number"
                                      value={
                                        item.priceModifier === ""
                                          ? ""
                                          : item.priceModifier
                                      }
                                      onChange={(e) =>
                                        updateIncludedItem(
                                          categoryIndex,
                                          itemIndex,
                                          "priceModifier",
                                          e.target.value
                                        )
                                      }
                                      placeholder="0.00"
                                      step="0.01"
                                      className="w-20 border border-gray-300 px-2 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      addOption(
                                        "included",
                                        categoryIndex,
                                        itemIndex
                                      )
                                    }
                                    className="text-primary-green hover:text-primary-green text-sm"
                                    title="Add Options"
                                  >
                                    <Plus size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeIncludedItem(
                                        categoryIndex,
                                        itemIndex
                                      )
                                    }
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>

                                {/* Options for this item */}
                                {item.options && item.options.length > 0 && (
                                  <div className="ml-4 space-y-2">
                                    <h5 className="text-sm font-medium text-gray-600">
                                      Options:
                                    </h5>
                                    {item.options.map((option, optionIndex) => (
                                      <div
                                        key={optionIndex}
                                        className="flex items-center gap-2 bg-green-50 p-2 rounded"
                                      >
                                        <input
                                          type="text"
                                          value={option.name}
                                          onChange={(e) =>
                                            updateOption(
                                              "included",
                                              categoryIndex,
                                              itemIndex,
                                              optionIndex,
                                              "name",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Option name"
                                          className="flex-1 text-sm border border-gray-300 px-2 py-1 rounded"
                                        />
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs">$</span>
                                          <input
                                            type="number"
                                            value={option.priceModifier}
                                            onChange={(e) =>
                                              updateOption(
                                                "included",
                                                categoryIndex,
                                                itemIndex,
                                                optionIndex,
                                                "priceModifier",
                                                parseFloat(e.target.value) || 0
                                              )
                                            }
                                            placeholder="0.00"
                                            step="0.01"
                                            className="w-16 text-sm border border-gray-300 px-1 py-1 rounded"
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeOption(
                                              "included",
                                              categoryIndex,
                                              itemIndex,
                                              optionIndex
                                            )
                                          }
                                          className="text-red-600 hover:text-red-800"
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Add button after included items */}
                            {category.includedItems.length > 0 && (
                              <div className="flex justify-center pt-2">
                                <AddButton
                                  onClick={() => addIncludedItem(categoryIndex)}
                                  className="bg-green-600 hover:bg-green-700"
                                  size="small"
                                >
                                  Add Another Item
                                </AddButton>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Selection Groups */}
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-700 flex items-center gap-2">
                              <Settings
                                size={16}
                                className="text-primary-green"
                              />
                              Customer Selection Groups
                            </h4>
                            <AddButton
                              onClick={() => addSelectionGroup(categoryIndex)}
                              className="bg-primary-green hover:bg-green-700"
                              size="small"
                            >
                              Add Group
                            </AddButton>
                          </div>

                          <div className="space-y-4">
                            {category.selectionGroups.map(
                              (group, groupIndex) => (
                                <div
                                  key={groupIndex}
                                  className="border border-gray-200 rounded-lg p-4 bg-blue-50"
                                >
                                  <div className="flex items-center gap-3 mb-4">
                                    <input
                                      type="text"
                                      value={group.name}
                                      onChange={(e) =>
                                        updateSelectionGroup(
                                          categoryIndex,
                                          groupIndex,
                                          "name",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Group name (e.g., Choose your protein)"
                                      className="flex-1 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeSelectionGroup(
                                          categoryIndex,
                                          groupIndex
                                        )
                                      }
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                    <select
                                      value={group.selectionType}
                                      onChange={(e) =>
                                        updateSelectionGroup(
                                          categoryIndex,
                                          groupIndex,
                                          "selectionType",
                                          e.target.value
                                        )
                                      }
                                      className="text-sm border border-gray-300 rounded px-2 py-2"
                                    >
                                      <option value="single">
                                        Single Choice
                                      </option>
                                      <option value="multiple">
                                        Multiple Choice
                                      </option>
                                    </select>

                                    <input
                                      type="number"
                                      value={group.minSelections}
                                      onChange={(e) =>
                                        updateSelectionGroup(
                                          categoryIndex,
                                          groupIndex,
                                          "minSelections",
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      placeholder="Min"
                                      min="0"
                                      className="text-sm border border-gray-300 rounded px-2 py-2"
                                    />

                                    <input
                                      type="number"
                                      value={group.maxSelections}
                                      onChange={(e) =>
                                        updateSelectionGroup(
                                          categoryIndex,
                                          groupIndex,
                                          "maxSelections",
                                          parseInt(e.target.value) || 1
                                        )
                                      }
                                      placeholder="Max"
                                      min="1"
                                      className="text-sm border border-gray-300 rounded px-2 py-2"
                                    />

                                    <label className="flex items-center gap-1 text-sm">
                                      <input
                                        type="checkbox"
                                        checked={group.isRequired}
                                        onChange={(e) =>
                                          updateSelectionGroup(
                                            categoryIndex,
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

                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h5 className="text-sm font-medium text-gray-600">
                                        Items in this group:
                                      </h5>
                                      <AddButton
                                        onClick={() =>
                                          addItemToSelectionGroup(
                                            categoryIndex,
                                            groupIndex
                                          )
                                        }
                                        className="bg-blue-500 hover:bg-blue-600"
                                        size="small"
                                      >
                                        Add Item
                                      </AddButton>
                                    </div>

                                    {group.items.map((item, itemIndex) => (
                                      <div
                                        key={itemIndex}
                                        className="bg-white border border-gray-200 rounded p-3"
                                      >
                                        <div className="flex items-center gap-3 mb-2">
                                          <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) =>
                                              updateSelectionGroupItem(
                                                categoryIndex,
                                                groupIndex,
                                                itemIndex,
                                                "name",
                                                e.target.value
                                              )
                                            }
                                            placeholder="Item name"
                                            className="flex-1 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                                          />
                                          <div className="flex items-center gap-1">
                                            <span className="text-sm">$</span>
                                            <input
                                              type="number"
                                              value={
                                                item.priceModifier === ""
                                                  ? ""
                                                  : item.priceModifier
                                              }
                                              onChange={(e) =>
                                                updateSelectionGroupItem(
                                                  categoryIndex,
                                                  groupIndex,
                                                  itemIndex,
                                                  "priceModifier",
                                                  e.target.value
                                                )
                                              }
                                              placeholder="0.00"
                                              step="0.01"
                                              className="w-20 border border-gray-300 px-2 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                                            />
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              addOption(
                                                "selection",
                                                categoryIndex,
                                                groupIndex,
                                                itemIndex
                                              )
                                            }
                                            className="text-primary-green hover:text-primary-green"
                                            title="Add Options"
                                          >
                                            <Plus size={16} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeItemFromSelectionGroup(
                                                categoryIndex,
                                                groupIndex,
                                                itemIndex
                                              )
                                            }
                                            className="text-red-600 hover:text-red-800"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </div>

                                        {/* Options for selection group items */}
                                        {item.options &&
                                          item.options.length > 0 && (
                                            <div className="ml-4 space-y-2">
                                              <h6 className="text-xs font-medium text-gray-600">
                                                Options:
                                              </h6>
                                              {item.options.map(
                                                (option, optionIndex) => (
                                                  <div
                                                    key={optionIndex}
                                                    className="flex items-center gap-2 bg-green-50 p-2 rounded"
                                                  >
                                                    <input
                                                      type="text"
                                                      value={option.name}
                                                      onChange={(e) =>
                                                        updateOption(
                                                          "selection",
                                                          categoryIndex,
                                                          groupIndex,
                                                          itemIndex,
                                                          optionIndex,
                                                          "name",
                                                          e.target.value
                                                        )
                                                      }
                                                      placeholder="Option name"
                                                      className="flex-1 text-sm border border-gray-300 px-2 py-1 rounded"
                                                    />
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-xs">
                                                        $
                                                      </span>
                                                      <input
                                                        type="number"
                                                        value={
                                                          option.priceModifier ===
                                                          ""
                                                            ? ""
                                                            : option.priceModifier
                                                        }
                                                        onChange={(e) =>
                                                          updateOption(
                                                            "selection",
                                                            categoryIndex,
                                                            groupIndex,
                                                            itemIndex,
                                                            optionIndex,
                                                            "priceModifier",
                                                            e.target.value
                                                          )
                                                        }
                                                        placeholder="0.00"
                                                        step="0.01"
                                                        className="w-16 text-sm border border-gray-300 px-1 py-1 rounded"
                                                      />
                                                    </div>
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        removeOption(
                                                          "selection",
                                                          categoryIndex,
                                                          groupIndex,
                                                          itemIndex,
                                                          optionIndex
                                                        )
                                                      }
                                                      className="text-red-600 hover:text-red-800"
                                                    >
                                                      <X size={14} />
                                                    </button>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          )}
                                      </div>
                                    ))}

                                    {/* Add button after selection group items */}
                                    {group.items.length > 0 && (
                                      <div className="flex justify-center pt-2">
                                        <AddButton
                                          onClick={() =>
                                            addItemToSelectionGroup(
                                              categoryIndex,
                                              groupIndex
                                            )
                                          }
                                          className="bg-blue-500 hover:bg-blue-600"
                                          size="small"
                                        >
                                          Add Another Item
                                        </AddButton>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            )}

                            {/* Add button after selection groups */}
                            {category.selectionGroups.length > 0 && (
                              <div className="flex justify-center pt-2">
                                <AddButton
                                  onClick={() =>
                                    addSelectionGroup(categoryIndex)
                                  }
                                  className="bg-primary-green hover:bg-green-700"
                                  size="small"
                                >
                                  Add Another Group
                                </AddButton>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add button after all categories */}
                {formData.categories.length > 0 && (
                  <div className="flex justify-center pt-4">
                    <AddButton
                      onClick={addCategory}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Add Another Category
                    </AddButton>
                  </div>
                )}

                {formData.categories.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No categories added yet</p>
                    <p className="text-sm">
                      Add categories to organize your package items
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Simple Items Section
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <List className="text-green-600" size={20} />
                  Simple Items
                </h3>
                <AddButton
                  onClick={addSimpleItem}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Add Item
                </AddButton>
              </div>

              <div className="space-y-4">
                {formData.simpleItems.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <input
                        type="text"
                        value={item.name || ""}
                        onChange={(e) =>
                          updateSimpleItem(index, "name", e.target.value)
                        }
                        placeholder="Item name"
                        className="flex-1 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-sm">Qty:</span>
                        <input
                          type="number"
                          value={item.quantity === "" ? "" : item.quantity}
                          onChange={(e) =>
                            updateSimpleItem(index, "quantity", e.target.value)
                          }
                          min="1"
                          placeholder="1"
                          className="w-16 border border-gray-300 px-2 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">$</span>
                        <input
                          type="number"
                          value={
                            item.priceModifier === "" ? "" : item.priceModifier
                          }
                          onChange={(e) =>
                            updateSimpleItem(
                              index,
                              "priceModifier",
                              e.target.value
                            )
                          }
                          placeholder="0.00"
                          step="0.01"
                          className="w-20 border border-gray-300 px-2 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                        />
                      </div>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={item.hasChoices || false}
                          onChange={(e) =>
                            updateSimpleItem(
                              index,
                              "hasChoices",
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-primary-green focus:ring-primary-green border-gray-300 rounded"
                        />
                        <span className="text-sm">Has Choices</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => addOption("simple", index)}
                        className="text-primary-green hover:text-primary-green"
                        title="Add Options"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSimpleItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Choice-based Options (like rice selection) */}
                    {item.hasChoices && (
                      <div className="mb-4 p-3 bg-yellow-50 rounded border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <h5 className="text-sm font-medium text-gray-700">
                              Customer Choices:
                            </h5>
                            <select
                              value={item.selectionType || "single"}
                              onChange={(e) =>
                                updateSimpleItem(
                                  index,
                                  "selectionType",
                                  e.target.value
                                )
                              }
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="single">Single Choice</option>
                              <option value="multiple">Multiple Choice</option>
                            </select>
                          </div>
                          <AddButton
                            onClick={() => addSimpleItemChoice(index)}
                            className="bg-yellow-600 hover:bg-yellow-700"
                            size="small"
                          >
                            Add Choice
                          </AddButton>
                        </div>
                        <div className="space-y-2">
                          {(item.choices || []).map((choice, choiceIndex) => (
                            <div
                              key={choiceIndex}
                              className="flex items-center gap-2 bg-white p-2 rounded border"
                            >
                              <input
                                type="text"
                                value={choice.name || ""}
                                onChange={(e) =>
                                  updateSimpleItemChoice(
                                    index,
                                    choiceIndex,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="Choice name (e.g., Pulao Rice, Plain Rice)"
                                className="flex-1 text-sm border border-gray-300 px-2 py-1 rounded"
                              />
                              <div className="flex items-center gap-1">
                                <span className="text-xs">$</span>
                                <input
                                  type="number"
                                  value={
                                    choice.priceModifier === ""
                                      ? ""
                                      : choice.priceModifier
                                  }
                                  onChange={(e) =>
                                    updateSimpleItemChoice(
                                      index,
                                      choiceIndex,
                                      "priceModifier",
                                      e.target.value
                                    )
                                  }
                                  placeholder="0.00"
                                  step="0.01"
                                  className="w-16 text-sm border border-gray-300 px-1 py-1 rounded"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  removeSimpleItemChoice(index, choiceIndex)
                                }
                                className="text-red-600 hover:text-red-800"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}

                          {/* Add button after choices */}
                          {(item.choices || []).length > 0 && (
                            <div className="flex justify-center pt-2">
                              <AddButton
                                onClick={() => addSimpleItemChoice(index)}
                                className="bg-yellow-600 hover:bg-yellow-700"
                                size="small"
                              >
                                Add Another Choice
                              </AddButton>
                            </div>
                          )}

                          {(!item.choices || item.choices.length === 0) && (
                            <p className="text-xs text-gray-500 italic text-center py-2">
                              No choices added yet. Add choices like "Pulao
                              Rice: +$2", "Plain Rice: $0"
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Regular Options (like extra spicy, large portion) */}
                    {item.options && item.options.length > 0 && (
                      <div className="ml-4 space-y-2">
                        <h5 className="text-sm font-medium text-gray-600">
                          Additional Options:
                        </h5>
                        {item.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className="flex items-center gap-2 bg-green-50 p-2 rounded"
                          >
                            <input
                              type="text"
                              value={option.name || ""}
                              onChange={(e) =>
                                updateOption(
                                  "simple",
                                  index,
                                  optionIndex,
                                  null,
                                  null,
                                  "name",
                                  e.target.value
                                )
                              }
                              placeholder="Option name (e.g., Spicy, Large Portion)"
                              className="flex-1 text-sm border border-gray-300 px-2 py-1 rounded"
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-xs">$</span>
                              <input
                                type="number"
                                value={
                                  option.priceModifier === ""
                                    ? ""
                                    : option.priceModifier
                                }
                                onChange={(e) =>
                                  updateOption(
                                    "simple",
                                    index,
                                    optionIndex,
                                    null,
                                    null,
                                    "priceModifier",
                                    e.target.value
                                  )
                                }
                                placeholder="0.00"
                                step="0.01"
                                className="w-16 text-sm border border-gray-300 px-1 py-1 rounded"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                removeOption("simple", index, optionIndex)
                              }
                              className="text-red-600 hover:text-red-800"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Add button after all simple items */}
                {formData.simpleItems.length > 0 && (
                  <div className="flex justify-center pt-4">
                    <AddButton
                      onClick={addSimpleItem}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Add Another Item
                    </AddButton>
                  </div>
                )}

                {formData.simpleItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <List size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No items added yet</p>
                    <p className="text-sm">Add items to your simple package</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Addons Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="text-orange-600" size={20} />
                Add-ons
              </h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.addons.enabled}
                  onChange={toggleAddons}
                  className="h-4 w-4 text-primary-green focus:ring-primary-green border-gray-300 rounded"
                />
                <span className="text-sm">Enable Add-ons</span>
              </label>
            </div>

            {formData.addons.enabled && (
              <div className="space-y-6">
                {/* Fixed Add-ons */}
                <div className="bg-orange-50 rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-700">
                      Fixed Add-ons (Price scales with number of people)
                    </h4>
                    <AddButton
                      onClick={addFixedAddon}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Add Fixed
                    </AddButton>
                  </div>
                  <div className="space-y-3">
                    {formData.addons.fixedAddons.map((addon, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 bg-white p-3 border border-gray-200 rounded-lg"
                      >
                        <input
                          type="text"
                          value={addon.name}
                          onChange={(e) =>
                            updateFixedAddon(index, "name", e.target.value)
                          }
                          placeholder="Add-on name (e.g., Chicken 65)"
                          className="flex-1 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-sm">$</span>
                          <input
                            type="number"
                            value={
                              addon.pricePerPerson === ""
                                ? ""
                                : addon.pricePerPerson
                            }
                            onChange={(e) =>
                              updateFixedAddon(
                                index,
                                "pricePerPerson",
                                e.target.value
                              )
                            }
                            placeholder="0.00"
                            step="0.01"
                            className="w-20 border border-gray-300 px-2 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                          />
                          <span className="text-sm">per person</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFixedAddon(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}

                    {/* Add button after fixed addons */}
                    {formData.addons.fixedAddons.length > 0 && (
                      <div className="flex justify-center pt-2">
                        <AddButton
                          onClick={addFixedAddon}
                          className="bg-orange-600 hover:bg-orange-700"
                          size="small"
                        >
                          Add Another Fixed Add-on
                        </AddButton>
                      </div>
                    )}

                    {formData.addons.fixedAddons.length === 0 && (
                      <p className="text-sm text-gray-500 italic text-center py-4">
                        No fixed add-ons yet. These add-ons will scale with the
                        number of people.
                      </p>
                    )}
                  </div>
                </div>

                {/* Variable Add-ons */}
                <div className="bg-purple-50 rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-700">
                      Variable Add-ons (Customer chooses quantity)
                    </h4>
                    <AddButton
                      onClick={addVariableAddon}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Add Variable
                    </AddButton>
                  </div>
                  <div className="space-y-3">
                    {formData.addons.variableAddons.map((addon, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <input
                            type="text"
                            value={addon.name}
                            onChange={(e) =>
                              updateVariableAddon(index, "name", e.target.value)
                            }
                            placeholder="Add-on name (e.g., Veg Chowmein)"
                            className="flex-1 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariableAddon(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-sm">$</span>
                            <input
                              type="number"
                              value={
                                addon.pricePerUnit === ""
                                  ? ""
                                  : addon.pricePerUnit
                              }
                              onChange={(e) =>
                                updateVariableAddon(
                                  index,
                                  "pricePerUnit",
                                  e.target.value
                                )
                              }
                              placeholder="0.00"
                              step="0.01"
                              className="flex-1 border border-gray-300 px-2 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">per</span>
                            <input
                              type="text"
                              value={addon.unit}
                              onChange={(e) =>
                                updateVariableAddon(
                                  index,
                                  "unit",
                                  e.target.value
                                )
                              }
                              placeholder="unit"
                              className="flex-1 border border-gray-300 px-2 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">Max:</span>
                            <input
                              type="number"
                              value={
                                addon.maxQuantity === ""
                                  ? ""
                                  : addon.maxQuantity
                              }
                              onChange={(e) =>
                                updateVariableAddon(
                                  index,
                                  "maxQuantity",
                                  e.target.value
                                )
                              }
                              min="1"
                              placeholder="20"
                              className="flex-1 border border-gray-300 px-2 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">Default:</span>
                            <input
                              type="number"
                              value={
                                addon.defaultQuantity === ""
                                  ? ""
                                  : addon.defaultQuantity
                              }
                              onChange={(e) =>
                                updateVariableAddon(
                                  index,
                                  "defaultQuantity",
                                  e.target.value
                                )
                              }
                              min="0"
                              max={addon.maxQuantity || 20}
                              placeholder="0"
                              className="flex-1 border border-gray-300 px-2 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add button after variable addons */}
                    {formData.addons.variableAddons.length > 0 && (
                      <div className="flex justify-center pt-2">
                        <AddButton
                          onClick={addVariableAddon}
                          className="bg-purple-600 hover:bg-purple-700"
                          size="small"
                        >
                          Add Another Variable Add-on
                        </AddButton>
                      </div>
                    )}

                    {formData.addons.variableAddons.length === 0 && (
                      <p className="text-sm text-gray-500 italic text-center py-4">
                        No variable add-ons yet. These allow customers to choose
                        quantities.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!formData.addons.enabled && (
              <div className="text-center py-8 text-gray-400">
                <DollarSign size={48} className="mx-auto mb-2" />
                <p>Add-ons are disabled</p>
                <p className="text-sm">
                  Enable add-ons to allow customers to customize their package
                </p>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 border-t pt-6">
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
              className="px-6 py-2 bg-primary-green text-white rounded hover:bg-primary-green disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              {loading
                ? "Saving..."
                : menu
                ? "Update Package"
                : "Create Package"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuFormModal;
