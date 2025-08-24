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

// Helper function to convert menu/custom order selections to booking items
const convertSelectionsToBookingItems = (
  source,
  selections,
  peopleCount,
  sourceType
) => {
  const items = [];

  if (sourceType === "menu") {
    // Handle menu package selections
    if (source.packageType === "simple" && source.simpleItems && selections) {
      source.simpleItems.forEach((item, itemIndex) => {
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

    // Handle categorized menu items
    if (
      source.packageType === "categorized" &&
      source.categories &&
      selections
    ) {
      source.categories.forEach((category, categoryIndex) => {
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
    if (source.addons?.enabled && selections) {
      // Fixed addons
      if (selections["addons-fixed"] && source.addons.fixedAddons) {
        selections["addons-fixed"].forEach((addonIndex) => {
          const addon = source.addons.fixedAddons[addonIndex];
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
      if (selections["addons-variable"] && source.addons.variableAddons) {
        Object.entries(selections["addons-variable"]).forEach(
          ([addonIndex, quantity]) => {
            const addon = source.addons.variableAddons[parseInt(addonIndex)];
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
  } else if (sourceType === "customOrder") {
    // Handle custom order selections
    if (selections.categories) {
      source.categories.forEach((category) => {
        const categorySelections = selections.categories[category.name] || [];

        categorySelections.forEach((selection) => {
          const item = category.items.id(selection.itemId);
          if (item && item.isAvailable) {
            const totalPrice = item.pricePerPerson * peopleCount;
            items.push({
              name: item.name,
              description: item.description || "",
              pricePerPerson: item.pricePerPerson,
              pricePerOrder: 0,
              totalPrice: totalPrice,
              category: category.name,
              type: "selected",
              quantity: selection.quantity || 1,
              groupName: category.displayName,
              isVegetarian: item.isVegetarian || false,
              isVegan: item.isVegan || false,
              allergens: item.allergens || [],
              notes: "",
            });
          }
        });
      });
    }

    // Handle custom order addons
    if (selections.addons) {
      selections.addons.forEach((addonSelection) => {
        const addon = source.addons.id(addonSelection.addonId);
        if (addon && addon.isAvailable) {
          const quantity = addonSelection.quantity || 1;
          const totalPrice = addon.pricePerOrder * quantity;
          items.push({
            name: addon.name,
            description: addon.description || "",
            pricePerPerson: 0,
            pricePerOrder: addon.pricePerOrder,
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
      });
    }
  }

  return items;
};

// @desc    Create new booking (Public - No auth required)
// @route   POST /api/bookings
// @access  Public
const createBooking = asyncHandler(async (req, res) => {
  try {
    const {
      orderSource,
      customerDetails,
      peopleCount,
      selectedItems,
      rawSelections,
      pricing,
    } = req.body;

    if (!orderSource || !orderSource.sourceType) {
      return sendResponse(
        res,
        400,
        false,
        "Order source information is required"
      );
    }

    let source = null;
    let location = null;

    // Validate and get source information
    if (orderSource.sourceType === "menu") {
      if (!orderSource.sourceId) {
        return sendResponse(
          res,
          400,
          false,
          "Menu ID is required for menu orders"
        );
      }

      source = await Menu.findById(orderSource.sourceId)
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
    } else if (orderSource.sourceType === "customOrder") {
      if (!orderSource.sourceId) {
        return sendResponse(
          res,
          400,
          false,
          "Custom Order ID is required for custom orders"
        );
      }

      source = await CustomOrder.findById(orderSource.sourceId)
        .populate("locationId")
        .populate("serviceId");

      if (!source || !source.isActive) {
        return sendResponse(
          res,
          404,
          false,
          "Custom Order configuration not found or inactive"
        );
      }

      location = source.locationId;

      // Verify people count is within custom order limits
      if (peopleCount < source.minPeople || peopleCount > source.maxPeople) {
        return sendResponse(
          res,
          400,
          false,
          `Number of people must be between ${source.minPeople} and ${source.maxPeople}`
        );
      }

      // Validate custom order selections
      if (rawSelections) {
        const validation = source.validateSelections(
          rawSelections,
          peopleCount
        );
        if (!validation.isValid) {
          return sendResponse(res, 400, false, validation.errors[0]);
        }
      }
    } else {
      return sendResponse(res, 400, false, "Invalid order source type");
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
        const prefix = orderSource.sourceType === "customOrder" ? "CU" : "BK";
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

    // Convert selections to booking items if not provided
    let bookingItems = selectedItems;
    if (!bookingItems || bookingItems.length === 0) {
      if (rawSelections) {
        bookingItems = convertSelectionsToBookingItems(
          source,
          rawSelections,
          peopleCount,
          orderSource.sourceType
        );
      } else {
        return sendResponse(
          res,
          400,
          false,
          "Either selectedItems or rawSelections must be provided"
        );
      }
    }

    // Prepare booking data
    const bookingData = {
      bookingReference,
      orderSource: {
        sourceType: orderSource.sourceType,
        sourceId: source._id,
        sourceName: source.name,
        basePrice:
          orderSource.sourceType === "menu"
            ? source.basePrice || source.price || 0
            : 0,
        locationId: location._id,
        locationName: location.name,
        serviceId: source.serviceId._id,
        serviceName: source.serviceId.name,
      },
      customerDetails: {
        name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone,
        specialInstructions: customerDetails.specialInstructions || "",
        dietaryRequirements: customerDetails.dietaryRequirements || [],
        spiceLevel: customerDetails.spiceLevel || "medium",
      },
      peopleCount,
      selectedItems: bookingItems,
      pricing: pricing || {
        basePrice:
          orderSource.sourceType === "menu"
            ? (source.basePrice || source.price || 0) * peopleCount
            : 0,
        modifierPrice: 0,
        itemsPrice: 0,
        addonsPrice: 0,
        total: 0,
      },
      deliveryType: req.body.deliveryType || "Pickup",
      deliveryDate: new Date(req.body.deliveryDate),
      address: req.body.address || null,
      status: "pending",
      paymentStatus: "pending",
      depositAmount: 0,
      orderDate: new Date(),
      adminNotes: "",
      cancellationReason: "",
      isDeleted: false,
    };

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
      message:
        orderSource.sourceType === "customOrder"
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
    if (selectedItems) booking.selectedItems = selectedItems;
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

// @desc    Get booking statistics
// @route   GET /api/bookings/stats
// @access  Private (Admin only)
const getBookingStats = asyncHandler(async (req, res) => {
  try {
    const { locationId, serviceId, sourceType, startDate, endDate } = req.query;

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
          statusCounts: {
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
          count: { $sum: 1 },
          category: { $first: "$selectedItems.category" },
          type: { $first: "$selectedItems.type" },
          totalRevenue: { $sum: "$selectedItems.totalPrice" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    sendResponse(res, 200, true, "Booking statistics retrieved successfully", {
      overview: stats || {
        totalBookings: 0,
        totalRevenue: 0,
        totalPeople: 0,
        averageOrderValue: 0,
        customOrders: 0,
        menuOrders: 0,
        statusCounts: {},
        dietaryBreakdown: [],
        spiceLevelBreakdown: [],
      },
      popularItems,
    });
  } catch (error) {
    console.error("Get booking stats error:", error);
    sendResponse(res, 500, false, "Failed to retrieve booking statistics", {
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

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  updatePaymentStatus,
  updateBooking,
  getBookingStats,
  cancelBooking,
  getBookingsByCustomer,
  getBookingByReference,
  getCustomOrdersByLocation,
  getCustomOrderById,
  calculateCustomOrderPrice,
  getBookingItemsByCategory,
};
