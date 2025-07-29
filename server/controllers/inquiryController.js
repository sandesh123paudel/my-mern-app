import InquiryModel from "../models/InquiryModel.js";

export const submitInquiry = async (req, res) => {
  // Validate request body
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

  if (
    !name ||
    !email ||
    !contact ||
    !eventDate ||
    !numberOfPeople ||
    !venue ||
    !serviceType
  ) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const inquiryData = {
      name,
      email,
      contact,
      eventDate: new Date(eventDate),
      numberOfPeople,
      venue,
      serviceType,
      message: message || "",
    };

    const newInquiry = new InquiryModel(inquiryData);
    await newInquiry.save();

    res.status(200).json({
      success: true,
      message: "Inquiry submitted successfully! We'll get back to you soon.",
    });
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting inquiry. Please try again.",
      error: error.message,
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
      error: error.message,
    });
  }
};
