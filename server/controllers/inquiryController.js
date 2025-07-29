// controllers/inquiryController.js
import InquiryModel from "../models/InquiryModel.js";

export const submitInquiry = async (req, res) => {
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

    res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully! We'll get back to you soon.",
      data: newInquiry,
    });
  } catch (error) {
    console.error("Error submitting inquiry:", error);

    // Handle mongoose validation errors
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

export const getInquiries = async (req, res) => {
  try {
    const inquiries = await InquiryModel.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: inquiries,
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
