// controllers/inquiryController.js
const InquiryModel = require("../models/InquiryModel.js");
const LocationModel = require("../models/locationModel.js"); // Add this import
const ServiceModel = require("../models/serviceModel.js"); // Add this import
const {
  sendAdminInquiryNotification,
  sendCustomerInquiryConfirmation,
} = require("../utils/sendMail.js");
const { sendSMS } = require("../utils/sendSMS.js");
const mongoose = require("mongoose");

const submitInquiry = async (req, res) => {
  try {
    const {
      name,
      email,
      contact,
      eventDate,
      numberOfPeople,
      venue,
      serviceType,
      message,
    } = req.body;

    // Validate venue and serviceType IDs
    if (!mongoose.Types.ObjectId.isValid(venue)) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(serviceType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service type ID",
      });
    }

    // Check if venue and service exist
    const [venueExists, serviceExists] = await Promise.all([
      LocationModel.findById(venue),
      ServiceModel.findById(serviceType),
    ]);

    if (!venueExists) {
      return res.status(400).json({
        success: false,
        message: "Selected venue not found",
      });
    }

    if (!serviceExists) {
      return res.status(400).json({
        success: false,
        message: "Selected service not found",
      });
    }

    const eventDateOnly = new Date(new Date(req.body.eventDate).toDateString());

    const existingInquiry = await InquiryModel.findOne({
      email: req.body.email.toLowerCase().trim(),
      eventDate: eventDateOnly,
    });

    if (existingInquiry) {
      return res.status(400).json({
        success: false,
        message: "You already have an inquiry for this date",
      });
    }

    const inquiryData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      contact: contact,
      eventDate: new Date(new Date(eventDate).toDateString()),
      numberOfPeople: parseInt(numberOfPeople),
      venue: venue, // Store as ObjectId
      serviceType: serviceType, // Store as ObjectId
      message: message ? message.trim() : "",
    };

    const newInquiry = new InquiryModel(inquiryData);
    await newInquiry.save();

    // Populate the inquiry with venue and service details for notifications
    const populatedInquiry = await InquiryModel.findById(newInquiry._id)
      .populate("venue", "name")
      .populate("serviceType", "name locationId");

    // Send email notifications (don't wait for them to complete)
    Promise.all([
      sendAdminInquiryNotification(populatedInquiry.toObject()),
      sendCustomerInquiryConfirmation(populatedInquiry.toObject()),
    ])
      .then((results) => {
        console.log("📧 Email notifications sent:", {
          admin: results[0].success ? "✅ Success" : "❌ Failed",
          customer: results[1].success ? "✅ Success" : "❌ Failed",
        });
      })
      .catch((error) => {
        console.error("❌ Email notification error:", error);
      });

    // Send SMS notification to customer
    if (contact) {
      // Format event date for SMS
      const eventDateFormatted = new Date(eventDate).toLocaleDateString(
        "en-AU",
        {
          day: "numeric",
          month: "short",
        }
      );

      // Create SMS message using service name instead of ID
      const smsMessage = `Hi ${name}! Thanks for your enquiry! We've received it. Please check your email shortly for more details.
- ${process.env.COMPANY_NAME || "Our Team"}`;

      const adminMessage = `New inquiry received from ${name}  for ${populatedInquiry.serviceType.name} in ${populatedInquiry.venue.name} on ${eventDateFormatted}. Customer contact: ${contact}.`;

      // Send SMS asynchronously
      sendSMS(contact, smsMessage, `inquiry_${newInquiry._id}`)
        .then((smsResult) => {
          if (smsResult.success) {
            console.log("📱 SMS sent successfully to customer:", {
              to: contact,
              messageId: smsResult.messageId,
              cost: smsResult.cost,
            });
          } else {
            console.error("❌ SMS send failed:", smsResult.error);
          }
        })
        .catch((smsError) => {
          console.error("❌ SMS service error:", smsError);
        });
      // Send SMS to admin if configured
      sendSMS(
        process.env.SMS_ADMIN_PHONE,
        adminMessage,
        `admin_inquiry_${newInquiry._id}`
      )
        .then((smsResult) => {
          if (smsResult.success) {
            console.log("📱 SMS sent successfully to admin:", {
              to: process.env.SMS_ADMIN_PHONE,
              messageId: smsResult.messageId,
              cost: smsResult.cost,
            });
          }
        })
        .catch((smsError) => {
          console.error("❌ SMS service error:", smsError);
        });
    } else {
      console.warn("⚠️ No contact number provided, skipping SMS notification");
    }

    res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully! We'll get back to you soon.",
      data: populatedInquiry,
    });
  } catch (error) {
    console.error("Error submitting inquiry:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Database validation failed",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Error submitting inquiry. Please try again.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

const getInquiries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      venue,
      serviceType,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    // Filter by venue if provided
    if (venue && venue !== "all" && mongoose.Types.ObjectId.isValid(venue)) {
      query.venue = venue;
    }

    // Filter by service type if provided
    if (
      serviceType &&
      serviceType !== "all" &&
      mongoose.Types.ObjectId.isValid(serviceType)
    ) {
      query.serviceType = serviceType;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const searchNumber = parseInt(search.trim());

      const searchConditions = [
        { name: searchRegex },
        { email: searchRegex },
        { message: searchRegex },
      ];

      if (!isNaN(searchNumber)) {
        searchConditions.push({ contact: searchNumber });
      }

      // Search in populated venue and service names
      const [matchingVenues, matchingServices] = await Promise.all([
        LocationModel.find({ name: searchRegex }).select("_id"),
        ServiceModel.find({ name: searchRegex }).select("_id"),
      ]);

      if (matchingVenues.length > 0) {
        searchConditions.push({
          venue: { $in: matchingVenues.map((v) => v._id) },
        });
      }

      if (matchingServices.length > 0) {
        searchConditions.push({
          serviceType: { $in: matchingServices.map((s) => s._id) },
        });
      }

      query.$or = searchConditions;
    }

    const totalItems = await InquiryModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    const inquiries = await InquiryModel.find(query)
      .populate("venue", "name")
      .populate("serviceType", "name locationId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: inquiries,
      pagination: {
        currentPage: pageNum,
        totalPages,
        total: totalItems,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inquiries. Please try again.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

const getInquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inquiry ID",
      });
    }

    const inquiry = await InquiryModel.findById(id)
      .populate("venue", "name address phone email")
      .populate("serviceType", "name description locationId");

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inquiry",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inquiry ID",
      });
    }

    const validStatuses = ["pending", "responded", "archived"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: pending, responded, archived",
      });
    }

    const inquiry = await InquiryModel.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate("venue", "name")
      .populate("serviceType", "name locationId");

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Inquiry status updated successfully",
      data: inquiry,
    });
  } catch (error) {
    console.error("Error updating inquiry status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating inquiry status",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inquiry ID",
      });
    }

    const inquiry = await InquiryModel.findByIdAndDelete(id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Inquiry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting inquiry",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get inquiry statistics
const getInquiryStats = async (req, res) => {
  try {
    const stats = await InquiryModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalInquiries = await InquiryModel.countDocuments();

    // Get popular venues and services
    const [popularVenues, popularServices] = await Promise.all([
      InquiryModel.aggregate([
        {
          $group: {
            _id: "$venue",
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "locations",
            localField: "_id",
            foreignField: "_id",
            as: "venueInfo",
          },
        },
        {
          $unwind: "$venueInfo",
        },
        {
          $project: {
            _id: 1,
            count: 1,
            name: "$venueInfo.name",
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 5,
        },
      ]),
      InquiryModel.aggregate([
        {
          $group: {
            _id: "$serviceType",
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "services",
            localField: "_id",
            foreignField: "_id",
            as: "serviceInfo",
          },
        },
        {
          $unwind: "$serviceInfo",
        },
        {
          $project: {
            _id: 1,
            count: 1,
            name: "$serviceInfo.name",
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 5,
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalInquiries,
        statusBreakdown: stats,
        popularVenues,
        popularServices,
      },
    });
  } catch (error) {
    console.error("Error fetching inquiry stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inquiry statistics",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

module.exports = {
  submitInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
  deleteInquiry,
  getInquiryStats,
};
