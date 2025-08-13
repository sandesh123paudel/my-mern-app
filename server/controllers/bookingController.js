import mongoose from "mongoose";
import Menu from "../models/menusModel.js";
import Booking from "../models/bookingModel.js";

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
export const createBooking = asyncHandler(async (req, res) => {
  try {
    const isCustomOrder =
      req.body.isCustomOrder || req.body.menu?.menuId === "custom-order";

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

      location = await Location.findById(req.body.menu.locationId);
      if (!location || !location.isActive) {
        return sendResponse(res, 404, false, "Location not found or inactive");
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

    // Generate booking reference
    const generateReference = () => {
      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      const prefix = isCustomOrder ? "CU" : "BK"; // Different prefix for custom orders
      return `${prefix}${year}${month}${day}${random}`;
    };

    // Prepare booking data
    const bookingData = {
      ...req.body,
      isCustomOrder,
      bookingReference: generateReference(),
      menu: isCustomOrder
        ? {
            // Custom order menu info
            menuId: null, // No menu ID for custom orders
            name: req.body.menu?.name || "Custom Order",
            price: req.body.pricing?.total || 0,
            serviceId: null, // No service ID for custom orders
            serviceName: "Custom Order",
            locationId: location._id,
            locationName: location.name,
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

    // Return booking reference for customer
    sendResponse(res, 201, true, "Booking created successfully", {
      bookingReference: savedBooking.bookingReference,
      message: isCustomOrder
        ? "Your custom order has been submitted successfully. You will receive a confirmation email shortly."
        : "Your booking has been submitted successfully. You will receive a confirmation email shortly.",
    });
  } catch (error) {
    console.error("Create booking error:", error);
    sendResponse(res, 500, false, "Failed to create booking", {
      error: error.message,
    });
  }
});

// @desc    Get all bookings for admin dashboard
// @route   GET /api/bookings
// @access  Private (Admin only)
export const getAllBookings = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      deliveryType,
      locationId,
      serviceId,
      orderType, // Add orderType filter (regular, custom, all)
      startDate,
      endDate,
      search,
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
      query.isCustomOrder = false; // Exclude custom orders when filtering by service
    }

    // Filter by order type
    if (orderType) {
      if (orderType === "custom") {
        query.isCustomOrder = true;
      } else if (orderType === "regular") {
        query.isCustomOrder = false;
      }
      // If orderType is "all", don't add any filter
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
export const getBookingById = asyncHandler(async (req, res) => {
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

// @desc    Update booking status (Admin only)
// @route   PATCH /api/bookings/:id/status
// @access  Private (Admin only)
export const updateBookingStatus = asyncHandler(async (req, res) => {
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

// @desc    Update booking payment status (Admin only)
// @route   PATCH /api/bookings/:id/payment
// @access  Private (Admin only)
export const updatePaymentStatus = asyncHandler(async (req, res) => {
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

// @desc    Update booking details (Admin only)
// @route   PUT /api/bookings/:id
// @access  Private (Admin only)
export const updateBooking = asyncHandler(async (req, res) => {
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

// @desc    Get booking statistics for admin dashboard
// @route   GET /api/bookings/stats
// @access  Private (Admin only)
export const getBookingStats = asyncHandler(async (req, res) => {
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
      matchQuery.isCustomOrder = false; // Exclude custom orders when filtering by service
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
        },
      },
    ]);

    // Get popular menu items (including custom order items)
    const popularItems = await Booking.aggregate([
      { $match: matchQuery },
      { $unwind: "$selectedItems" },
      {
        $group: {
          _id: "$selectedItems.name",
          count: { $sum: 1 },
          category: { $first: "$selectedItems.category" },
          isFromCustomOrder: {
            $push: {
              $cond: [{ $eq: ["$isCustomOrder", true] }, true, false],
            },
          },
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

// @desc    Cancel booking (Admin only)
// @route   DELETE /api/bookings/:id
// @access  Private (Admin only)
export const cancelBooking = asyncHandler(async (req, res) => {
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

export default {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  updatePaymentStatus,
  updateBooking,
  getBookingStats,
  cancelBooking,
};
