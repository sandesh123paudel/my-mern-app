const mongoose = require("mongoose");
const Menu = require("../models/menusModel.js");
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

// @desc    Create new booking (Public - No auth required)
// @route   POST /api/bookings
// @access  Public
const createBooking = asyncHandler(async (req, res) => {
  try {
  

    const isCustomOrder =
      req.body.isCustomOrder || req.body.menu?.menuId === null;

    let menu = null;
    let location = null;

    if (isCustomOrder) {
      // For custom orders, we need to get location information
      if (!req.body.menu?.locationId) {
        return sendResponse(
          res,
          400,
          false,
          "Location is required for custom orders"
        );
      }

      try {
        location = await Location.findById(req.body.menu.locationId);
        if (!location || !location.isActive) {
          return sendResponse(
            res,
            404,
            false,
            "Location not found or inactive"
          );
        }
      } catch (locationError) {
        console.error("Error finding location:", locationError);
        // Fallback to using provided location data
        location = {
          _id: req.body.menu.locationId,
          name: req.body.menu.locationName || "Selected Location",
          isActive: true,
        };
      }

      // For custom orders, we don't validate against menu limits
      // but we should still have reasonable limits
      if (req.body.peopleCount < 1 || req.body.peopleCount > 1000) {
        return sendResponse(
          res,
          400,
          false,
          "Number of people must be between 1 and 1000"
        );
      }
    } else {
      // Regular menu order - existing validation
      if (!req.body.menu?.menuId) {
        return sendResponse(
          res,
          400,
          false,
          "Valid menu ID is required for regular orders"
        );
      }

      menu = await Menu.findById(req.body.menu.menuId)
        .populate("locationId")
        .populate("serviceId");

      if (!menu || !menu.isActive) {
        return sendResponse(res, 404, false, "Menu not found or inactive");
      }

      location = menu.locationId;

      // Verify people count is within menu limits
      if (
        req.body.peopleCount < menu.minPeople ||
        req.body.peopleCount > menu.maxPeople
      ) {
        return sendResponse(
          res,
          400,
          false,
          `Number of people must be between ${menu.minPeople} and ${menu.maxPeople}`
        );
      }
    }

    // Generate unique booking reference
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

        // Check if reference already exists
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
      ...req.body,
      isCustomOrder,
      bookingReference,
      menu: isCustomOrder
        ? {
            // Custom order menu info - use data from frontend
            menuId: null, // Explicitly null for custom orders
            name: req.body.menu?.name || "Custom Order",
            price: 0, // Custom orders use individual item pricing
            serviceId: req.body.menu?.serviceId || null, // Use service from frontend
            serviceName: req.body.menu?.serviceName || "Custom Order", // Use service name from frontend
            locationId: location._id,
            locationName: location.name || req.body.menu?.locationName,
          }
        : {
            // Regular menu order
            menuId: menu._id,
            name: menu.name,
            price: menu.price,
            serviceId: menu.serviceId._id,
            serviceName: menu.serviceId.name,
            locationId: menu.locationId._id,
            locationName: menu.locationId.name,
          },
      customerDetails: {
        name: req.body.customerDetails.name,
        email: req.body.customerDetails.email,
        phone: req.body.customerDetails.phone,
        specialInstructions:
          req.body.customerDetails.description ||
          req.body.customerDetails.specialInstructions ||
          "",
        // Simple dietary requirements - only store what user selected
        dietaryRequirements: req.body.customerDetails.dietaryRequirements || [],
        spiceLevel: req.body.customerDetails.spiceLevel || "medium",
      },
      // Transform selectedItems to ensure itemId is set
      selectedItems: (req.body.selectedItems || []).map((item) => ({
        ...item,
        itemId: item.itemId || item._id,
      })),
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
      orderType,
      startDate,
      endDate,
      search,
      // Simple dietary filters
      dietaryRequirement, // single filter: vegetarian, vegan, gluten-free, halal-friendly
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
      query["menu.locationId"] = locationId;
    }

    // Filter by service (exclude custom orders when filtering by service)
    if (serviceId) {
      query["menu.serviceId"] = serviceId;
      query.isCustomOrder = false;
    }

    // Filter by order type
    if (orderType) {
      if (orderType === "custom") {
        query.isCustomOrder = true;
      } else if (orderType === "regular") {
        query.isCustomOrder = false;
      }
    }

    // Simple dietary requirement filter
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
        { "menu.name": { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .populate("menu.locationId", "name address phone email")
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

    const booking = await Booking.findById(id).populate(
      "menu.locationId",
      "name address phone email"
    );

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

    const updatedBooking = await Booking.findById(id).populate(
      "menu.locationId",
      "name address phone email"
    );

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

    const updatedBooking = await Booking.findById(id).populate(
      "menu.locationId",
      "name address phone email"
    );

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
      
      // Update simple dietary requirements
      if (customerDetails.dietaryRequirements !== undefined) {
        booking.customerDetails.dietaryRequirements = customerDetails.dietaryRequirements;
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

    const updatedBooking = await Booking.findById(id).populate(
      "menu.locationId",
      "name address phone email"
    );

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
    const {
      locationId,
      serviceId,
      orderType,
      startDate,
      endDate,
      period = "month",
    } = req.query;

    // Build match query
    const matchQuery = { isDeleted: false };

    if (locationId) {
      matchQuery["menu.locationId"] = new mongoose.Types.ObjectId(locationId);
    }

    if (serviceId) {
      matchQuery["menu.serviceId"] = new mongoose.Types.ObjectId(serviceId);
      matchQuery.isCustomOrder = false;
    }

    if (orderType) {
      if (orderType === "custom") {
        matchQuery.isCustomOrder = true;
      } else if (orderType === "regular") {
        matchQuery.isCustomOrder = false;
      }
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
            $sum: { $cond: [{ $eq: ["$isCustomOrder", true] }, 1, 0] },
          },
          regularOrders: {
            $sum: { $cond: [{ $eq: ["$isCustomOrder", false] }, 1, 0] },
          },
          statusCounts: {
            $push: "$status",
          },
          // Simple dietary stats
          dietaryBreakdown: {
            $push: "$customerDetails.dietaryRequirements"
          },
          spiceLevelBreakdown: {
            $push: "$customerDetails.spiceLevel"
          }
        },
      },
      {
        $project: {
          totalBookings: 1,
          totalRevenue: 1,
          totalPeople: 1,
          averageOrderValue: { $round: ["$averageOrderValue", 2] },
          customOrders: 1,
          regularOrders: 1,
          statusCounts: {
            $reduce: {
              input: "$statusCounts",
              initialValue: {},
              in: {
                $mergeObjects: [
                  "$$value",
                  {
                    $arrayToObject: [
                      [
                        {
                          k: "$$this",
                          v: {
                            $add: [
                              {
                                $ifNull: [
                                  {
                                    $getField: {
                                      field: "$$this",
                                      input: "$$value",
                                    },
                                  },
                                  0,
                                ],
                              },
                              1,
                            ],
                          },
                        },
                      ],
                    ],
                  },
                ],
              },
            },
          },
          dietaryBreakdown: 1,
          spiceLevelBreakdown: 1,
        },
      },
    ]);

    // Get popular menu items
    const popularItems = await Booking.aggregate([
      { $match: matchQuery },
      { $unwind: "$selectedItems" },
      {
        $group: {
          _id: "$selectedItems.name",
          count: { $sum: 1 },
          category: { $first: "$selectedItems.category" },
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
        regularOrders: 0,
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
      isDeleted: false
    };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .populate("menu.locationId", "name address phone email")
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
      isDeleted: false
    };

    // Add email verification if provided
    if (email) {
      query["customerDetails.email"] = email.toLowerCase();
    }

    const booking = await Booking.findOne(query)
      .populate("menu.locationId", "name address phone email");

    if (!booking) {
      return sendResponse(res, 404, false, "Booking not found or email doesn't match");
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
};