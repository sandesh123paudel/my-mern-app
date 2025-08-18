// controllers/inquiryController.js
const InquiryModel = require("../models/InquiryModel.js");
const {
  sendAdminInquiryNotification,
  sendCustomerInquiryConfirmation,
} = require("../utils/sendMail.js");
const { sendSMS } = require("../utils/sendSMS.js");

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
      venue: venue.trim(),
      serviceType: serviceType.trim(),
      message: message ? message.trim() : "",
    };

    const newInquiry = new InquiryModel(inquiryData);
    await newInquiry.save();

    // Send email notifications (don't wait for them to complete)
    Promise.all([
      sendAdminInquiryNotification(newInquiry.toObject()),
      sendCustomerInquiryConfirmation(newInquiry.toObject()),
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

      // Create SMS message
      const smsMessage = `Hi ${name}! Your inquiry for ${serviceType} on ${eventDateFormatted} has been received. We'll contact you within 24hrs. - ${
        process.env.COMPANY_NAME || "Our Team"
      }`;

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
    } else {
      console.warn("⚠️ No contact number provided, skipping SMS notification");
    }

    res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully! We'll get back to you soon.",
      data: newInquiry,
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
    const { page = 1, limit = 10, status, search } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const searchNumber = parseInt(search.trim());

      const searchConditions = [
        { name: searchRegex },
        { email: searchRegex },
        { message: searchRegex },
        { venue: searchRegex },
        { serviceType: searchRegex },
      ];

      if (!isNaN(searchNumber)) {
        searchConditions.push({ contact: searchNumber });
      }

      query.$or = searchConditions;
    }

    const totalItems = await InquiryModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    const inquiries = await InquiryModel.find(query)
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

const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

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
    );

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

module.exports = {
  submitInquiry,
  getInquiries,
  updateInquiryStatus,
  deleteInquiry,
};
