const mongoose = require("mongoose");
const Menu = require("../models/menusModel.js");
const CustomOrder = require("../models/customOrderModel.js");
const Booking = require("../models/bookingModel.js");
const Location = require("../models/locationModel.js");
const {
  sendAdminBookingNotification,
  sendCustomerBookingConfirmation,
} = require("../utils/sendMail.js");
const {
  sendCustomerBookingSMS,
  sendAdminBookingSMS,
} = require("../utils/sendBookingSMS.js");

// Helper function to send response
const sendResponse = (res, statusCode, success, message, data = null) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

// Helper function to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Enhanced helper function to process selectedItems from frontend
const processSelectedItems = (selectedItems, peopleCount = 1) => {
  if (!selectedItems || !Array.isArray(selectedItems)) {
    return [];
  }

  return selectedItems.map((item) => ({
    name: item.name || "",
    description: item.description || "",
    pricePerPerson: item.pricePerPerson || 0,
    pricePerUnit: item.pricePerUnit || 0,
    pricePerOrder: item.pricePerOrder || 0,
    totalPrice: item.totalPrice || item.pricePerPerson * peopleCount || 0,
    category: item.category || "other",
    type: item.type || "selected",
    quantity: item.quantity || 1,
    groupName: item.groupName || item.category || "",
    isVegetarian: item.isVegetarian || false,
    isVegan: item.isVegan || false,
    allergens: Array.isArray(item.allergens) ? item.allergens : [],
    notes: item.notes || "",
  }));
};

// Helper function to convert menu selections to booking items
const convertMenuSelectionsToBookingItems = (menu, selections, peopleCount) => {
  const items = [];

  if (!menu || !selections) {
    return items;
  }

  // Handle simple package items
  if (menu.packageType === "simple" && menu.simpleItems) {
    menu.simpleItems.forEach((item, itemIndex) => {
      const itemSelection = selections[`simple-${itemIndex}`];

      // Add base item
      items.push({
        name: item.name,
        description: item.description || "",
        pricePerPerson: item.priceModifier || 0,
        pricePerOrder: 0,
        totalPrice: (item.priceModifier || 0) * peopleCount,
        category: "package",
        type: "package",
        quantity: item.quantity || 1,
        groupName: "Package Items",
        isVegetarian: item.isVegetarian || false,
        isVegan: item.isVegan || false,
        allergens: item.allergens || [],
        notes: "",
      });

      // Add selected choices
      if (itemSelection?.choices && item.choices) {
        itemSelection.choices.forEach((choiceIndex) => {
          const choice = item.choices[choiceIndex];
          if (choice) {
            items.push({
              name: `${item.name} - ${choice.name}`,
              description: choice.description || "",
              pricePerPerson: choice.priceModifier || 0,
              pricePerOrder: 0,
              totalPrice: (choice.priceModifier || 0) * peopleCount,
              category: "choices",
              type: "choice",
              quantity: 1,
              groupName: item.name,
              isVegetarian: choice.isVegetarian || false,
              isVegan: choice.isVegan || false,
              allergens: choice.allergens || [],
              notes: "",
            });
          }
        });
      }

      // Add selected options
      if (itemSelection?.options && item.options) {
        itemSelection.options.forEach((optionIndex) => {
          const option = item.options[optionIndex];
          if (option) {
            items.push({
              name: `${item.name} - ${option.name}`,
              description: option.description || "",
              pricePerPerson: option.priceModifier || 0,
              pricePerOrder: 0,
              totalPrice: (option.priceModifier || 0) * peopleCount,
              category: "options",
              type: "option",
              quantity: 1,
              groupName: item.name,
              isVegetarian: option.isVegetarian || false,
              isVegan: option.isVegan || false,
              allergens: option.allergens || [],
              notes: "",
            });
          }
        });
      }
    });
  }

  // Handle categorized package items
  if (menu.packageType === "categorized" && menu.categories) {
    menu.categories.forEach((category, categoryIndex) => {
      if (!category.enabled) return;

      // Add included items
      if (category.includedItems) {
        category.includedItems.forEach((item) => {
          items.push({
            name: item.name,
            description: item.description || "",
            pricePerPerson: item.priceModifier || 0,
            pricePerOrder: 0,
            totalPrice: (item.priceModifier || 0) * peopleCount,
            category: category.name.toLowerCase(),
            type: "included",
            quantity: 1,
            groupName: category.name,
            isVegetarian: item.isVegetarian || false,
            isVegan: item.isVegan || false,
            allergens: item.allergens || [],
            notes: "",
          });
        });
      }

      // Add selected items from selection groups
      if (category.selectionGroups) {
        category.selectionGroups.forEach((group, groupIndex) => {
          const key = `category-${categoryIndex}-group-${groupIndex}`;
          const selectedItems = selections[key] || [];

          selectedItems.forEach((itemIndex) => {
            const item = group.items[itemIndex];
            if (item) {
              items.push({
                name: item.name,
                description: item.description || "",
                pricePerPerson: item.priceModifier || 0,
                pricePerOrder: 0,
                totalPrice: (item.priceModifier || 0) * peopleCount,
                category: category.name.toLowerCase(),
                type: "selected",
                quantity: 1,
                groupName: `${category.name} - ${group.name}`,
                isVegetarian: item.isVegetarian || false,
                isVegan: item.isVegan || false,
                allergens: item.allergens || [],
                notes: "",
              });
            }
          });
        });
      }
    });
  }

  // Handle menu addons
  if (menu.addons?.enabled && selections) {
    // Fixed addons
    if (selections["addons-fixed"] && menu.addons.fixedAddons) {
      selections["addons-fixed"].forEach((addonIndex) => {
        const addon = menu.addons.fixedAddons[addonIndex];
        if (addon) {
          const totalPrice = addon.pricePerPerson * peopleCount;
          items.push({
            name: addon.name,
            description: addon.description || "",
            pricePerPerson: addon.pricePerPerson,
            pricePerOrder: 0,
            totalPrice: totalPrice,
            category: "addons",
            type: "addon",
            quantity: peopleCount,
            groupName: "Add-ons",
            isVegetarian: addon.isVegetarian || false,
            isVegan: addon.isVegan || false,
            allergens: addon.allergens || [],
            notes: "",
          });
        }
      });
    }

    // Variable addons
    if (selections["addons-variable"] && menu.addons.variableAddons) {
      Object.entries(selections["addons-variable"]).forEach(
        ([addonIndex, quantity]) => {
          const addon = menu.addons.variableAddons[parseInt(addonIndex)];
          if (addon && quantity > 0) {
            const totalPrice = addon.pricePerUnit * quantity;
            items.push({
              name: `${addon.name} (${quantity} ${addon.unit || "pieces"})`,
              description: addon.description || "",
              pricePerPerson: 0,
              pricePerOrder: addon.pricePerUnit,
              totalPrice: totalPrice,
              category: "addons",
              type: "addon",
              quantity: quantity,
              groupName: "Add-ons",
              isVegetarian: addon.isVegetarian || false,
              isVegan: addon.isVegan || false,
              allergens: addon.allergens || [],
              notes: "",
            });
          }
        }
      );
    }
  }

  return items;
};

// Helper function to convert custom order selections to booking items
const convertCustomOrderSelectionsToBookingItems = (
  customOrder,
  selections,
  peopleCount
) => {
  const items = [];

  if (!customOrder || !selections) {
    return items;
  }

  // Handle custom order category selections
  if (selections.categories) {
    Object.entries(selections.categories).forEach(
      ([categoryName, categorySelections]) => {
        const category = customOrder.categories?.find(
          (cat) => cat.name === categoryName
        );

        if (category && categorySelections) {
          categorySelections.forEach((selection) => {
            const item = category.items?.find(
              (item) => item._id.toString() === selection.itemId
            );

            if (item) {
              const totalPrice =
                (item.pricePerPerson || 0) *
                peopleCount *
                (selection.quantity || 1);

              items.push({
                name: item.name,
                description: item.description || "",
                pricePerPerson: item.pricePerPerson || 0,
                pricePerOrder: 0,
                totalPrice: totalPrice,
                category:
                  categoryName === "entree"
                    ? "entree"
                    : categoryName === "mains"
                    ? "mains"
                    : categoryName.toLowerCase(),
                type: "selected",
                quantity: selection.quantity || 1,
                groupName: category.displayName || categoryName,
                isVegetarian: item.isVegetarian || false,
                isVegan: item.isVegan || false,
                allergens: item.allergens || [],
                notes: "",
              });
            }
          });
        }
      }
    );
  }

  // Handle custom order addons
  if (selections.addons && customOrder.addons?.enabled) {
    selections.addons.forEach((addonSelection) => {
      // Check fixed addons
      if (customOrder.addons.fixedAddons) {
        const addon = customOrder.addons.fixedAddons.find(
          (a) => a._id.toString() === addonSelection.addonId
        );
        if (addon) {
          const totalPrice =
            (addon.pricePerPerson || 0) * peopleCount * addonSelection.quantity;

          items.push({
            name: addon.name,
            description: addon.description || "",
            pricePerPerson: addon.pricePerPerson || 0,
            pricePerOrder: 0,
            totalPrice: totalPrice,
            category: "addons",
            type: "addon",
            quantity: addonSelection.quantity,
            groupName: "Add-ons",
            isVegetarian: addon.isVegetarian || false,
            isVegan: addon.isVegan || false,
            allergens: addon.allergens || [],
            notes: "",
          });
        }
      }

      // Check variable addons
      if (customOrder.addons.variableAddons) {
        const addon = customOrder.addons.variableAddons.find(
          (a) => a._id.toString() === addonSelection.addonId
        );
        if (addon) {
          const totalPrice =
            (addon.pricePerUnit || 0) * addonSelection.quantity;

          items.push({
            name: `${addon.name} (${addonSelection.quantity} ${
              addon.unit || "pieces"
            })`,
            description: addon.description || "",
            pricePerPerson: 0,
            pricePerOrder: addon.pricePerUnit || 0,
            totalPrice: totalPrice,
            category: "addons",
            type: "addon",
            quantity: addonSelection.quantity,
            groupName: "Add-ons",
            isVegetarian: addon.isVegetarian || false,
            isVegan: addon.isVegan || false,
            allergens: addon.allergens || [],
            notes: "",
          });
        }
      }
    });
  }

  return items;
};

// @desc    Create new booking (Public - No auth required)
// @route   POST /api/bookings
// @access  Public
const createBooking = asyncHandler(async (req, res) => {
  try {
    const {
      menu, // From frontend: { menuId, locationId, serviceId, name, basePrice }
      customerDetails,
      peopleCount,
      selectedItems, // Processed items from frontend
      menuSelections, // Raw menu selections for reference
      pricing,
      deliveryType,
      deliveryDate,
      address,
      isCustomOrder,
      isFunction,
      venueSelection,
      venueCharge = 0,
    } = req.body;

    // Validate required fields
    if (
      !customerDetails ||
      !customerDetails.name ||
      !customerDetails.email ||
      !customerDetails.phone
    ) {
      return sendResponse(res, 400, false, "Customer details are required");
    }

    if (!peopleCount || peopleCount < 1) {
      return sendResponse(res, 400, false, "Valid people count is required");
    }

    if (!deliveryDate) {
      return sendResponse(res, 400, false, "Delivery date is required");
    }

    if (!menu || (!menu.menuId && !isCustomOrder)) {
      return sendResponse(res, 400, false, "Menu information is required");
    }
    if (isFunction) {
      if (!venueSelection) {
        return sendResponse(
          res,
          400,
          false,
          "Venue selection is required for function bookings"
        );
      }
      if (!["both", "indoor", "outdoor"].includes(venueSelection)) {
        return sendResponse(res, 400, false, "Invalid venue selection");
      }
      if (deliveryType && deliveryType !== "Event") {
        return sendResponse(
          res,
          400,
          false,
          "Delivery type must be 'Event' for function bookings"
        );
      }
    }

    let source = null;
    let location = null;
    let processedItems = [];

    if (isCustomOrder) {
      // Handle Custom Order

      if (!menu.locationId || !menu.serviceId) {
        return sendResponse(
          res,
          400,
          false,
          "Location and service are required for custom orders"
        );
      }

      // For custom orders, we might not have a specific customOrder document
      // Instead, we use the location and service directly
      location = await Location.findById(menu.locationId);
      if (!location) {
        return sendResponse(res, 404, false, "Location not found");
      }

      // Process selected items directly from frontend
      if (selectedItems && selectedItems.length > 0) {
        processedItems = processSelectedItems(selectedItems, peopleCount);
      } else {
        return sendResponse(
          res,
          400,
          false,
          "Selected items are required for custom orders"
        );
      }
    } else {
      // Handle Menu Order

      source = await Menu.findById(menu.menuId)
        .populate("locationId")
        .populate("serviceId");

      if (!source || !source.isActive) {
        return sendResponse(res, 404, false, "Menu not found or inactive");
      }

      location = source.locationId;

      // Verify people count is within menu limits
      if (peopleCount < source.minPeople || peopleCount > source.maxPeople) {
        return sendResponse(
          res,
          400,
          false,
          `Number of people must be between ${source.minPeople} and ${source.maxPeople}`
        );
      }

      // Process selected items
      if (selectedItems && selectedItems.length > 0) {
        processedItems = processSelectedItems(selectedItems, peopleCount);
      
      } else if (menuSelections) {
        processedItems = convertMenuSelectionsToBookingItems(
          source,
          menuSelections,
          peopleCount
        );
       
      } else {
        return sendResponse(
          res,
          400,
          false,
          "Either selectedItems or menuSelections must be provided"
        );
      }
    }

    // Generate booking reference
    const generateReference = async () => {
      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      let attempts = 0;
      let reference;
      let isUnique = false;

      while (!isUnique && attempts < 10) {
        const random = Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0");
        const prefix = isCustomOrder ? "CU" : "BK";
        reference = `${prefix}${year}${month}${day}${random}`;

        const existingBooking = await Booking.findOne({
          bookingReference: reference,
        });
        if (!existingBooking) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error("Could not generate unique booking reference");
      }

      return reference;
    };

    const bookingReference = await generateReference();

    // Prepare booking data
    const bookingData = {
      bookingReference,
      orderSource: {
        sourceType: isCustomOrder ? "customOrder" : "menu",
        sourceId: isCustomOrder ? new mongoose.Types.ObjectId() : source._id, // For custom orders without specific document
        sourceName: menu.name || (source ? source.name : "Custom Order"),
        basePrice:
          menu.basePrice ||
          (source ? source.basePrice || source.price || 0 : 0),
        locationId: location._id,
        locationName: location.name,
        serviceId: isCustomOrder ? menu.serviceId : source.serviceId._id,
        serviceName: isCustomOrder ? menu.serviceName : source.serviceId.name,
      },
      customerDetails: {
        name: customerDetails.name,
        email: customerDetails.email.toLowerCase(),
        phone: customerDetails.phone,
        specialInstructions: customerDetails.specialInstructions || "",
        dietaryRequirements: customerDetails.dietaryRequirements || [],
        spiceLevel: customerDetails.spiceLevel || "medium",
      },
      peopleCount,
      selectedItems: processedItems,
      pricing: pricing
        ? {
            ...pricing,
            total: (pricing.total || 0) + (venueCharge || 0),
          }
        : {
            basePrice: isCustomOrder
              ? 0
              : (source?.basePrice || source?.price || 0) * peopleCount,
            modifierPrice: 0,
            itemsPrice: 0,
            addonsPrice: 0,
            total: (pricing?.total || 0) + (venueCharge || 0),
          },
      deliveryType: isFunction ? "Event" : deliveryType || "Pickup", // ✅ Force Event for functions
      deliveryDate: new Date(deliveryDate),
      address: !isFunction && deliveryType === "Delivery" ? address : undefined,
      status: "pending",
      paymentStatus: "pending",
      depositAmount: 0,
      orderDate: new Date(),
      adminNotes: "",
      cancellationReason: "",
      isDeleted: false,
      isFunction: !!isFunction, // ✅ Persist function flag
      venueSelection: isFunction ? venueSelection : undefined, // ✅ Save venue selection
      venueCharge: isFunction ? venueCharge : 0,
    };

    if (isFunction) {
      // Calculate start and end of day for given date
      const targetDate = new Date(deliveryDate);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      // Fetch existing bookings for same location + service + day
      const existingBookings = await Booking.find({
        "orderSource.locationId": new mongoose.Types.ObjectId(location._id),
        "orderSource.serviceId": new mongoose.Types.ObjectId(
          isCustomOrder ? menu.serviceId : source.serviceId._id
        ),
        isFunction: true,
        deliveryDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $nin: ["cancelled"] }, // exclude cancelled
        isDeleted: false,
      });

      // Check conflicts
      let conflict = existingBookings.find((b) => {
        const booked = b.venueSelection;

        if (venueSelection === "both") {
          // if requesting both, ANY existing indoor/outdoor/both blocks it
          return ["indoor", "outdoor", "both"].includes(booked);
        } else if (venueSelection === "indoor") {
          return ["indoor", "both"].includes(booked);
        } else if (venueSelection === "outdoor") {
          return ["outdoor", "both"].includes(booked);
        }
        return false;
      });

      if (conflict) {
        return sendResponse(
          res,
          400,
          false,
          `Venue (${conflict.venueSelection}) not available for the date. Please choose another date or venue option.`
        );
      }
    }

    // Create booking
    const booking = new Booking(bookingData);
    const savedBooking = await booking.save();

    // Get location with bank details for customer email
    let locationWithBankDetails = null;
    try {
      const fullLocation = await Location.findById(location._id);
      if (fullLocation && fullLocation.hasBankDetails()) {
        locationWithBankDetails = fullLocation.formattedBankDetails;
      }
    } catch (error) {
      console.warn("Could not fetch location bank details:", error.message);
    }

    // Send email notifications (don't wait for them to complete)
    Promise.all([
      sendAdminBookingNotification(savedBooking.toObject()),
      sendCustomerBookingConfirmation(
        savedBooking.toObject(),
        locationWithBankDetails
      ),
    ])
      .then((results) => {
        console.log("📧 Booking email notifications sent:", {
          admin: results[0].success
            ? "✅ Success"
            : `❌ Failed: ${results[0].error}`,
          customer: results[1].success
            ? "✅ Success"
            : `❌ Failed: ${results[1].error}`,
        });
      })
      .catch((error) => {
        console.error("❌ Booking email notification error:", error);
      });

    // Send SMS notifications (don't wait for them to complete)
    Promise.all([
      sendAdminBookingSMS(savedBooking.toObject()),
      sendCustomerBookingSMS(savedBooking.toObject()),
    ])
      .then((results) => {
        console.log("📱 Booking SMS notifications sent:", {
          admin: results[0].success
            ? "✅ Success"
            : `❌ Failed: ${results[0].error}`,
          customer: results[1].success
            ? "✅ Success"
            : `❌ Failed: ${results[1].error}`,
        });
      })
      .catch((error) => {
        console.error("❌ Booking SMS notification error:", error);
      });

    // Return booking reference for customer
    sendResponse(res, 201, true, "Booking created successfully", {
      bookingReference: savedBooking.bookingReference,
      message: isCustomOrder
        ? "Your custom order has been submitted successfully. You will receive a confirmation email and SMS shortly."
        : "Your booking has been submitted successfully. You will receive a confirmation email and SMS shortly.",
    });
  } catch (error) {
    console.error("Create booking error:", error);

    // Enhanced error handling
    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(
        (err) => err.message
      );
      return sendResponse(res, 400, false, "Validation error", {
        errors: errorMessages,
      });
    }

    if (error.name === "CastError") {
      return sendResponse(res, 400, false, "Invalid ID format provided");
    }

    sendResponse(res, 500, false, "Failed to create booking", {
      error: error.message,
    });
  }
});

// @desc    Get all bookings for admin dashboard
// @route   GET /api/bookings
// @access  Private (Admin only)
const getAllBookings = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      deliveryType,
      locationId,
      serviceId,
      sourceType, // "menu" or "customOrder"
      startDate,
      endDate,
      search,
      dietaryRequirement,
      spiceLevel,
      sortBy = "orderDate",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = { isDeleted: false };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by delivery type
    if (deliveryType) {
      query.deliveryType = deliveryType;
    }

    // Filter by location
    if (locationId) {
      query["orderSource.locationId"] = locationId;
    }

    // Filter by service
    if (serviceId) {
      query["orderSource.serviceId"] = serviceId;
    }

    // Filter by source type
    if (sourceType) {
      query["orderSource.sourceType"] = sourceType;
    }

    // Dietary requirement filter
    if (dietaryRequirement) {
      query["customerDetails.dietaryRequirements"] = dietaryRequirement;
    }

    // Spice level filter
    if (spiceLevel) {
      query["customerDetails.spiceLevel"] = spiceLevel;
    }

    // Filter by date range
    if (startDate && endDate) {
      query.deliveryDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Search functionality
    if (search) {
      query.$or = [
        { bookingReference: { $regex: search, $options: "i" } },
        { "customerDetails.name": { $regex: search, $options: "i" } },
        { "customerDetails.email": { $regex: search, $options: "i" } },
        { "customerDetails.phone": { $regex: search, $options: "i" } },
        { "orderSource.sourceName": { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .populate("orderSource.locationId", "name address phone email")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    sendResponse(res, 200, true, "Bookings retrieved successfully", {
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get bookings error:", error);
    sendResponse(res, 500, false, "Failed to retrieve bookings", {
      error: error.message,
    });
  }
});

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private (Admin only)
const getBookingById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate("orderSource.locationId", "name address phone email")
      .populate("orderSource.serviceId", "name description");

    if (!booking) {
      return sendResponse(res, 404, false, "Booking not found");
    }

    sendResponse(res, 200, true, "Booking retrieved successfully", {
      booking,
    });
  } catch (error) {
    console.error("Get booking error:", error);
    sendResponse(res, 500, false, "Failed to retrieve booking", {
      error: error.message,
    });
  }
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (Admin only)
const updateBookingStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    // Validate status
    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return sendResponse(res, 400, false, "Invalid status value");
    }

    // Find and update booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return sendResponse(res, 404, false, "Booking not found");
    }

    booking.status = status;
    if (adminNotes) {
      booking.adminNotes = adminNotes;
    }

    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate("orderSource.locationId", "name address phone email")
      .populate("orderSource.serviceId", "name description");

    sendResponse(res, 200, true, "Booking status updated successfully", {
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Update booking status error:", error);
    sendResponse(res, 500, false, "Failed to update booking status", {
      error: error.message,
    });
  }
});

// @desc    Update payment status
// @route   PUT /api/bookings/:id/payment
// @access  Private (Admin only)
const updatePaymentStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, depositAmount } = req.body;

    // Validate payment status
    const validPaymentStatuses = ["pending", "deposit_paid", "fully_paid"];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return sendResponse(res, 400, false, "Invalid payment status value");
    }

    // Find and update booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return sendResponse(res, 404, false, "Booking not found");
    }

    booking.paymentStatus = paymentStatus;

    if (depositAmount !== undefined) {
      booking.depositAmount = depositAmount;
    }

    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate("orderSource.locationId", "name address phone email")
      .populate("orderSource.serviceId", "name description");

    sendResponse(res, 200, true, "Payment status updated successfully", {
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Update payment status error:", error);
    sendResponse(res, 500, false, "Failed to update payment status", {
      error: error.message,
    });
  }
});

// @desc    Update booking details
// @route   PUT /api/bookings/:id
// @access  Private (Admin only)
const updateBooking = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerDetails,
      peopleCount,
      deliveryType,
      deliveryDate,
      address,
      selectedItems,
      pricing,
      adminNotes,
    } = req.body;

    // Find booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return sendResponse(res, 404, false, "Booking not found");
    }

    // Update customer details if provided
    if (customerDetails) {
      if (customerDetails.name)
        booking.customerDetails.name = customerDetails.name;
      if (customerDetails.email)
        booking.customerDetails.email = customerDetails.email;
      if (customerDetails.phone)
        booking.customerDetails.phone = customerDetails.phone;
      if (customerDetails.specialInstructions !== undefined) {
        booking.customerDetails.specialInstructions =
          customerDetails.specialInstructions;
      }

      // Update dietary requirements
      if (customerDetails.dietaryRequirements !== undefined) {
        booking.customerDetails.dietaryRequirements =
          customerDetails.dietaryRequirements;
      }
      if (customerDetails.spiceLevel !== undefined) {
        booking.customerDetails.spiceLevel = customerDetails.spiceLevel;
      }
    }

    // Update other fields if provided
    if (peopleCount) booking.peopleCount = peopleCount;
    if (deliveryType) booking.deliveryType = deliveryType;
    if (deliveryDate) booking.deliveryDate = new Date(deliveryDate);
    if (address && deliveryType === "Delivery") booking.address = address;
    if (selectedItems) {
      booking.selectedItems = processSelectedItems(
        selectedItems,
        booking.peopleCount
      );
    }
    if (pricing) booking.pricing = pricing;
    if (adminNotes !== undefined) booking.adminNotes = adminNotes;

    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate("orderSource.locationId", "name address phone email")
      .populate("orderSource.serviceId", "name description");

    sendResponse(res, 200, true, "Booking updated successfully", {
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Update booking error:", error);
    sendResponse(res, 500, false, "Failed to update booking", {
      error: error.message,
    });
  }
});

// @desc    Get booking statistics with unique dishes for dashboard
// @route   GET /api/bookings/stats
// @access  Private (Admin only)
const getBookingStats = asyncHandler(async (req, res) => {
  try {
    const { locationId, serviceId, sourceType, startDate, endDate, date } =
      req.query;

    // Build match query
    const matchQuery = { isDeleted: false };

    if (locationId) {
      matchQuery["orderSource.locationId"] = new mongoose.Types.ObjectId(
        locationId
      );
    }

    if (serviceId) {
      matchQuery["orderSource.serviceId"] = new mongoose.Types.ObjectId(
        serviceId
      );
    }

    if (sourceType) {
      matchQuery["orderSource.sourceType"] = sourceType;
    }

    if (startDate && endDate) {
      matchQuery.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get overall stats
    const [stats] = await Booking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$pricing.total" },
          totalPeople: { $sum: "$peopleCount" },
          averageOrderValue: { $avg: "$pricing.total" },
          customOrders: {
            $sum: {
              $cond: [
                { $eq: ["$orderSource.sourceType", "customOrder"] },
                1,
                0,
              ],
            },
          },
          menuOrders: {
            $sum: {
              $cond: [{ $eq: ["$orderSource.sourceType", "menu"] }, 1, 0],
            },
          },
          statusBreakdown: {
            $push: "$status",
          },
          dietaryBreakdown: {
            $push: "$customerDetails.dietaryRequirements",
          },
          spiceLevelBreakdown: {
            $push: "$customerDetails.spiceLevel",
          },
        },
      },
    ]);

    // Get popular items
    const popularItems = await Booking.aggregate([
      { $match: matchQuery },
      { $unwind: "$selectedItems" },
      {
        $group: {
          _id: "$selectedItems.name",
          count: { $sum: "$selectedItems.quantity" },
          category: { $first: "$selectedItems.category" },
          type: { $first: "$selectedItems.type" },
          totalRevenue: { $sum: "$selectedItems.totalPrice" },
          averagePrice: { $avg: "$selectedItems.totalPrice" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    // Get unique dishes for today if date is provided
    let uniqueDishesToday = 0;
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const todayMatchQuery = {
        ...matchQuery,
        deliveryDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      };

      const uniqueDishesResult = await Booking.aggregate([
        { $match: todayMatchQuery },
        { $unwind: "$selectedItems" },
        {
          $group: {
            _id: "$selectedItems.name",
            totalQuantity: { $sum: "$selectedItems.quantity" },
          },
        },
        {
          $group: {
            _id: null,
            uniqueDishes: { $sum: 1 },
            totalItems: { $sum: "$totalQuantity" },
          },
        },
      ]);

      if (uniqueDishesResult.length > 0) {
        uniqueDishesToday = uniqueDishesResult[0].uniqueDishes;
      }
    }

    // Get daily booking trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyTrends = await Booking.aggregate([
      {
        $match: {
          ...matchQuery,
          orderDate: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$orderDate",
            },
          },
          bookings: { $sum: 1 },
          revenue: { $sum: "$pricing.total" },
          people: { $sum: "$peopleCount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get category breakdown
    const categoryBreakdown = await Booking.aggregate([
      { $match: matchQuery },
      { $unwind: "$selectedItems" },
      {
        $group: {
          _id: "$selectedItems.category",
          count: { $sum: "$selectedItems.quantity" },
          revenue: { $sum: "$selectedItems.totalPrice" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Process status breakdown
    const statusCounts = {};
    if (stats && stats.statusBreakdown) {
      stats.statusBreakdown.forEach((status) => {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
    }

    // Process dietary requirements breakdown
    const dietaryCounts = {};
    if (stats && stats.dietaryBreakdown) {
      stats.dietaryBreakdown.forEach((requirements) => {
        if (Array.isArray(requirements)) {
          requirements.forEach((req) => {
            dietaryCounts[req] = (dietaryCounts[req] || 0) + 1;
          });
        }
      });
    }

    // Process spice level breakdown
    const spiceCounts = {};
    if (stats && stats.spiceLevelBreakdown) {
      stats.spiceLevelBreakdown.forEach((level) => {
        spiceCounts[level] = (spiceCounts[level] || 0) + 1;
      });
    }

    const responseData = {
      overview: stats
        ? {
            ...stats,
            statusBreakdown: statusCounts,
            dietaryBreakdown: dietaryCounts,
            spiceLevelBreakdown: spiceCounts,
            uniqueDishesToday,
          }
        : {
            totalBookings: 0,
            totalRevenue: 0,
            totalPeople: 0,
            averageOrderValue: 0,
            customOrders: 0,
            menuOrders: 0,
            statusBreakdown: {},
            dietaryBreakdown: {},
            spiceLevelBreakdown: {},
            uniqueDishesToday: 0,
          },
      popularItems,
      dailyTrends,
      categoryBreakdown,
    };

    sendResponse(
      res,
      200,
      true,
      "Booking statistics retrieved successfully",
      responseData
    );
  } catch (error) {
    console.error("Get booking stats error:", error);
    sendResponse(res, 500, false, "Failed to retrieve booking statistics", {
      error: error.message,
    });
  }
});

// @desc    Get unique dishes count for specific date (Dashboard feature)
// @route   GET /api/bookings/unique-dishes
// @access  Private (Admin only)
const getUniqueDishesCount = asyncHandler(async (req, res) => {
  try {
    const { date, locationId, serviceId } = req.query;

    if (!date) {
      return sendResponse(res, 400, false, "Date parameter is required");
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Build match query
    const matchQuery = {
      isDeleted: false,
      deliveryDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    };

    if (locationId) {
      matchQuery["orderSource.locationId"] = new mongoose.Types.ObjectId(
        locationId
      );
    }

    if (serviceId) {
      matchQuery["orderSource.serviceId"] = new mongoose.Types.ObjectId(
        serviceId
      );
    }

    // Get unique dishes with details
    const dishesData = await Booking.aggregate([
      { $match: matchQuery },
      { $unwind: "$selectedItems" },
      {
        $group: {
          _id: {
            name: "$selectedItems.name",
            category: "$selectedItems.category",
          },
          totalQuantity: { $sum: "$selectedItems.quantity" },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$selectedItems.totalPrice" },
          averagePrice: { $avg: "$selectedItems.totalPrice" },
          bookings: {
            $push: {
              bookingReference: "$bookingReference",
              customerName: "$customerDetails.name",
              quantity: "$selectedItems.quantity",
            },
          },
        },
      },
      {
        $project: {
          dishName: "$_id.name",
          category: "$_id.category",
          totalQuantity: 1,
          totalOrders: 1,
          totalRevenue: 1,
          averagePrice: 1,
          bookings: 1,
          _id: 0,
        },
      },
      { $sort: { totalQuantity: -1 } },
    ]);

    const uniqueDishesCount = dishesData.length;
    const totalQuantity = dishesData.reduce(
      (sum, dish) => sum + dish.totalQuantity,
      0
    );
    const totalRevenue = dishesData.reduce(
      (sum, dish) => sum + dish.totalRevenue,
      0
    );

    // Group by category
    const categoryBreakdown = {};
    dishesData.forEach((dish) => {
      const category = dish.category || "other";
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          uniqueDishes: 0,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      categoryBreakdown[category].uniqueDishes += 1;
      categoryBreakdown[category].totalQuantity += dish.totalQuantity;
      categoryBreakdown[category].totalRevenue += dish.totalRevenue;
    });

    sendResponse(res, 200, true, "Unique dishes data retrieved successfully", {
      date: date,
      uniqueDishesCount,
      totalQuantity,
      totalRevenue,
      dishes: dishesData,
      categoryBreakdown,
    });
  } catch (error) {
    console.error("Get unique dishes count error:", error);
    sendResponse(res, 500, false, "Failed to retrieve unique dishes data", {
      error: error.message,
    });
  }
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Admin only)
const cancelBooking = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return sendResponse(res, 404, false, "Booking not found");
    }

    if (booking.status === "cancelled") {
      return sendResponse(res, 400, false, "Booking is already cancelled");
    }

    booking.status = "cancelled";
    if (reason) {
      booking.cancellationReason = reason;
    }

    await booking.save();

    sendResponse(res, 200, true, "Booking cancelled successfully", {
      bookingReference: booking.bookingReference,
      status: booking.status,
      cancellationReason: booking.cancellationReason,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    sendResponse(res, 500, false, "Failed to cancel booking", {
      error: error.message,
    });
  }
});

// @desc    Get bookings by customer (for customer portal)
// @route   GET /api/bookings/customer/:email
// @access  Public (with email verification)
const getBookingsByCustomer = asyncHandler(async (req, res) => {
  try {
    const { email } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!email) {
      return sendResponse(res, 400, false, "Email is required");
    }

    // Build query
    const query = {
      "customerDetails.email": email.toLowerCase(),
      isDeleted: false,
    };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .populate("orderSource.locationId", "name address phone email")
        .populate("orderSource.serviceId", "name description")
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    sendResponse(res, 200, true, "Customer bookings retrieved successfully", {
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get customer bookings error:", error);
    sendResponse(res, 500, false, "Failed to retrieve customer bookings", {
      error: error.message,
    });
  }
});

// @desc    Get booking by reference number (for customer lookup)
// @route   GET /api/bookings/reference/:reference
// @access  Public
const getBookingByReference = asyncHandler(async (req, res) => {
  try {
    const { reference } = req.params;
    const { email } = req.query; // Optional email for additional verification

    if (!reference) {
      return sendResponse(res, 400, false, "Booking reference is required");
    }

    // Build query
    const query = {
      bookingReference: reference.toUpperCase(),
      isDeleted: false,
    };

    // Add email verification if provided
    if (email) {
      query["customerDetails.email"] = email.toLowerCase();
    }

    const booking = await Booking.findOne(query)
      .populate("orderSource.locationId", "name address phone email")
      .populate("orderSource.serviceId", "name description");

    if (!booking) {
      return sendResponse(
        res,
        404,
        false,
        "Booking not found or email doesn't match"
      );
    }

    sendResponse(res, 200, true, "Booking retrieved successfully", {
      booking,
    });
  } catch (error) {
    console.error("Get booking by reference error:", error);
    sendResponse(res, 500, false, "Failed to retrieve booking", {
      error: error.message,
    });
  }
});

// @desc    Get custom order configurations by location (for frontend)
// @route   GET /api/bookings/custom-orders/location/:locationId
// @access  Public
const getCustomOrdersByLocation = asyncHandler(async (req, res) => {
  try {
    const { locationId } = req.params;

    const customOrders = await CustomOrder.find({
      locationId,
      isActive: true,
    })
      .populate("locationId", "name city")
      .populate("serviceId", "name description")
      .sort({ createdAt: -1 });

    sendResponse(res, 200, true, "Custom orders retrieved successfully", {
      customOrders,
    });
  } catch (error) {
    console.error("Get custom orders by location error:", error);
    sendResponse(res, 500, false, "Failed to retrieve custom orders", {
      error: error.message,
    });
  }
});

// @desc    Get custom order configuration by ID (for frontend)
// @route   GET /api/bookings/custom-orders/:id
// @access  Public
const getCustomOrderById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const customOrder = await CustomOrder.findById(id)
      .populate("locationId", "name city address phone")
      .populate("serviceId", "name description");

    if (!customOrder || !customOrder.isActive) {
      return sendResponse(
        res,
        404,
        false,
        "Custom order configuration not found or inactive"
      );
    }

    sendResponse(res, 200, true, "Custom order retrieved successfully", {
      customOrder,
    });
  } catch (error) {
    console.error("Get custom order by ID error:", error);
    sendResponse(res, 500, false, "Failed to retrieve custom order", {
      error: error.message,
    });
  }
});

// @desc    Calculate custom order price (for frontend preview)
// @route   POST /api/bookings/custom-orders/:id/calculate
// @access  Public
const calculateCustomOrderPrice = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { selections, peopleCount } = req.body;

    if (!selections || !peopleCount) {
      return sendResponse(
        res,
        400,
        false,
        "Selections and people count are required"
      );
    }

    const customOrder = await CustomOrder.findById(id);
    if (!customOrder || !customOrder.isActive) {
      return sendResponse(
        res,
        404,
        false,
        "Custom order configuration not found or inactive"
      );
    }

    // Validate selections
    const validation = customOrder.validateSelections(selections, peopleCount);
    if (!validation.isValid) {
      return sendResponse(res, 400, false, validation.errors[0], {
        errors: validation.errors,
      });
    }

    // Calculate price
    const priceCalculation = customOrder.calculatePrice(
      selections,
      peopleCount
    );

    sendResponse(res, 200, true, "Price calculated successfully", {
      pricing: priceCalculation,
      isValid: validation.isValid,
    });
  } catch (error) {
    console.error("Calculate custom order price error:", error);
    sendResponse(res, 500, false, "Failed to calculate price", {
      error: error.message,
    });
  }
});

// @desc    Get booking items by category (helper for admin)
// @route   GET /api/bookings/:id/items-by-category
// @access  Private (Admin only)
const getBookingItemsByCategory = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return sendResponse(res, 404, false, "Booking not found");
    }

    const itemsByCategory = booking.getItemsByCategory();

    sendResponse(
      res,
      200,
      true,
      "Booking items by category retrieved successfully",
      {
        itemsByCategory,
        totalItems: booking.totalItems,
      }
    );
  } catch (error) {
    console.error("Get booking items by category error:", error);
    sendResponse(
      res,
      500,
      false,
      "Failed to retrieve booking items by category",
      {
        error: error.message,
      }
    );
  }
});

// @desc    Check venue availability for specific date and location
// @route   GET /api/bookings/venue-availability
// @access  Public
const checkVenueAvailability = asyncHandler(async (req, res) => {
  try {
    const { locationId, serviceId, date, venueType } = req.query;

    if (!locationId || !serviceId || !date || !venueType) {
      return sendResponse(
        res,
        400,
        false,
        "Location ID, Service ID, date, and venue type are required"
      );
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Check for existing bookings on this date
    const existingBookings = await Booking.find({
      "orderSource.locationId": new mongoose.Types.ObjectId(locationId),
      "orderSource.serviceId": new mongoose.Types.ObjectId(serviceId),
      isFunction: true,
      deliveryDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $nin: ["cancelled"] }, // Exclude cancelled bookings
      isDeleted: false,
    });

    // Check availability based on venue type
    let isAvailable = true;
    let conflictingBookings = [];

    existingBookings.forEach((booking) => {
      const bookedVenue = booking.venueSelection;

      if (venueType === "both") {
        // If requesting both venues, check if either is booked
        if (
          bookedVenue === "both" ||
          bookedVenue === "indoor" ||
          bookedVenue === "outdoor"
        ) {
          isAvailable = false;
          conflictingBookings.push({
            bookingReference: booking.bookingReference,
            venueSelection: bookedVenue,
            customerName: booking.customerDetails.name,
            peopleCount: booking.peopleCount,
          });
        }
      } else if (venueType === "indoor") {
        // If requesting indoor, check if both or indoor is booked
        if (bookedVenue === "both" || bookedVenue === "indoor") {
          isAvailable = false;
          conflictingBookings.push({
            bookingReference: booking.bookingReference,
            venueSelection: bookedVenue,
            customerName: booking.customerDetails.name,
            peopleCount: booking.peopleCount,
          });
        }
      } else if (venueType === "outdoor") {
        // If requesting outdoor, check if both or outdoor is booked
        if (bookedVenue === "both" || bookedVenue === "outdoor") {
          isAvailable = false;
          conflictingBookings.push({
            bookingReference: booking.bookingReference,
            venueSelection: bookedVenue,
            customerName: booking.customerDetails.name,
            peopleCount: booking.peopleCount,
          });
        }
      }
    });

    sendResponse(res, 200, true, "Venue availability checked successfully", {
      isAvailable,
      date: date,
      venueType,
      totalExistingBookings: existingBookings.length,
      conflictingBookings,
    });
  } catch (error) {
    console.error("Check venue availability error:", error);
    sendResponse(res, 500, false, "Failed to check venue availability", {
      error: error.message,
    });
  }
});

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  updatePaymentStatus,
  updateBooking,
  getBookingStats,
  getUniqueDishesCount,
  cancelBooking,
  getBookingsByCustomer,
  getBookingByReference,
  getCustomOrdersByLocation,
  getCustomOrderById,
  calculateCustomOrderPrice,
  getBookingItemsByCategory,
  checkVenueAvailability,
};
