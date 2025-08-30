const mongoose = require("mongoose");
const Coupon = require("../models/couponModel.js");

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

// @desc    Validate coupon code (Public - for order confirmation)
// @route   POST /api/coupons/validate
// @access  Public
const validateCoupon = asyncHandler(async (req, res) => {
  try {
    const { code, locationId, serviceId, orderTotal } = req.body;

    if (!code || !orderTotal) {
      return sendResponse(res, 400, false, "Coupon code and order total are required");
    }

    const coupon = await Coupon.findValidCoupon(code);

    if (!coupon) {
      return sendResponse(res, 404, false, "Invalid or expired coupon code");
    }

    // Check location/service restrictions BEFORE returning error
    if (!coupon.canBeUsedForOrder(locationId, serviceId)) {
      return sendResponse(res, 400, false, "This coupon is not applicable for this location or service");
    }

    const discount = coupon.calculateDiscount(orderTotal);
    const newTotal = orderTotal - discount;

    sendResponse(res, 200, true, "Coupon is valid", {
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        name: coupon.name,
        discountPercentage: coupon.discountPercentage,
      },
      discount,
      originalTotal: orderTotal,
      newTotal,
      savings: discount,
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    sendResponse(res, 500, false, "Failed to validate coupon");
  }
});

// @desc    Create new coupon
// @route   POST /api/coupons
// @access  Private (Admin only)
const createCoupon = asyncHandler(async (req, res) => {
  try {
    const {
      code,
      name,
      discountPercentage,
      usageLimit,
      expiryDate,
      isActive = true,
      applicableLocations = [],
      applicableServices = [],
    } = req.body;

    // Basic validation
    if (
      !code ||
      !name ||
      discountPercentage === undefined ||
      !usageLimit ||
      !expiryDate
    ) {
      return sendResponse(
        res,
        400,
        false,
        "All required fields must be provided"
      );
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      return sendResponse(
        res,
        400,
        false,
        "Discount percentage must be between 0 and 100"
      );
    }

    if (usageLimit < 1) {
      return sendResponse(res, 400, false, "Usage limit must be at least 1");
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return sendResponse(res, 400, false, "Coupon code already exists");
    }

    // Validate expiry date
    if (new Date(expiryDate) <= new Date()) {
      return sendResponse(res, 400, false, "Expiry date must be in the future");
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      name,
      discountPercentage,
      usageLimit,
      expiryDate: new Date(expiryDate),
      isActive,
      applicableLocations,
      applicableServices,
    });

    const savedCoupon = await coupon.save();

    sendResponse(res, 201, true, "Coupon created successfully", {
      coupon: savedCoupon,
    });
  } catch (error) {
    console.error("Create coupon error:", error);
    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(
        (err) => err.message
      );
      return sendResponse(res, 400, false, "Validation error", {
        errors: errorMessages,
      });
    }
    sendResponse(res, 500, false, "Failed to create coupon");
  }
});

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private (Admin only)
const getAllCoupons = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const [coupons, totalCount] = await Promise.all([
      Coupon.find(query)
        .populate("applicableLocations", "name")
        .populate("applicableServices", "name")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Coupon.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    sendResponse(res, 200, true, "Coupons retrieved successfully", {
      coupons,
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
    console.error("Get coupons error:", error);
    sendResponse(res, 500, false, "Failed to retrieve coupons");
  }
});

// @desc    Get coupon by ID
// @route   GET /api/coupons/:id
// @access  Private (Admin only)
const getCouponById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id)
      .populate("applicableLocations", "name")
      .populate("applicableServices", "name");

    if (!coupon) {
      return sendResponse(res, 404, false, "Coupon not found");
    }

    sendResponse(res, 200, true, "Coupon retrieved successfully", {
      coupon,
    });
  } catch (error) {
    console.error("Get coupon error:", error);
    sendResponse(res, 500, false, "Failed to retrieve coupon");
  }
});

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private (Admin only)
const updateCoupon = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      name,
      discountPercentage,
      usageLimit,
      expiryDate,
      isActive,
      applicableLocations,
      applicableServices,
    } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return sendResponse(res, 404, false, "Coupon not found");
    }

    // Validation
    if (
      discountPercentage !== undefined &&
      (discountPercentage < 0 || discountPercentage > 100)
    ) {
      return sendResponse(
        res,
        400,
        false,
        "Discount percentage must be between 0 and 100"
      );
    }

    if (usageLimit !== undefined && usageLimit < 1) {
      return sendResponse(res, 400, false, "Usage limit must be at least 1");
    }

    // Check if updating code conflicts with existing coupon
    if (code && code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
      if (existingCoupon) {
        return sendResponse(res, 400, false, "Coupon code already exists");
      }
    }

    // Update fields
    if (code) coupon.code = code.toUpperCase();
    if (name) coupon.name = name;
    if (discountPercentage !== undefined)
      coupon.discountPercentage = discountPercentage;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (expiryDate) coupon.expiryDate = new Date(expiryDate);
    if (isActive !== undefined) coupon.isActive = isActive;
    if (applicableLocations !== undefined)
      coupon.applicableLocations = applicableLocations;
    if (applicableServices !== undefined)
      coupon.applicableServices = applicableServices;

    await coupon.save();

    const updatedCoupon = await Coupon.findById(id)
      .populate("applicableLocations", "name")
      .populate("applicableServices", "name");

    sendResponse(res, 200, true, "Coupon updated successfully", {
      coupon: updatedCoupon,
    });
  } catch (error) {
    console.error("Update coupon error:", error);
    sendResponse(res, 500, false, "Failed to update coupon");
  }
});

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private (Admin only)
const deleteCoupon = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return sendResponse(res, 404, false, "Coupon not found");
    }

    await Coupon.findByIdAndDelete(id);

    sendResponse(res, 200, true, "Coupon deleted successfully");
  } catch (error) {
    console.error("Delete coupon error:", error);
    sendResponse(res, 500, false, "Failed to delete coupon");
  }
});

// @desc    Apply coupon usage (internal use - called after successful booking)
// @route   PUT /api/coupons/:id/use
// @access  Private (Admin only)
const useCoupon = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return sendResponse(res, 404, false, "Coupon not found");
    }

    if (!coupon.isValid) {
      return sendResponse(res, 400, false, "Coupon is not valid");
    }

    await coupon.incrementUsage();

    sendResponse(res, 200, true, "Coupon usage updated successfully", {
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        usedCount: coupon.usedCount,
        remainingUses: coupon.remainingUses,
      },
    });
  } catch (error) {
    console.error("Use coupon error:", error);
    sendResponse(res, 500, false, "Failed to update coupon usage");
  }
});

module.exports = {
  validateCoupon,
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  useCoupon,
};
