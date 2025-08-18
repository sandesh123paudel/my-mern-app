const {
  ADMIN_INQUIRY_NOTIFICATION_TEMPLATE,
  CUSTOMER_INQUIRY_CONFIRMATION_TEMPLATE,
} = require("../config/emailTemplate.js");
const transporter = require("../config/nodemailer.js");

// Helper function to format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Helper function to check if event date is urgent (within 7 days)
const getEventDateUrgency = (eventDate) => {
  const today = new Date();
  const event = new Date(eventDate);
  const diffTime = event - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= 7 ? "urgent" : "";
};

// Send admin notification email
const sendAdminInquiryNotification = async (inquiryData) => {
  try {
    const eventDateUrgency = getEventDateUrgency(inquiryData.eventDate);

    // Replace template variables
    let emailContent = ADMIN_INQUIRY_NOTIFICATION_TEMPLATE.replace(
      /{{name}}/g,
      inquiryData.name
    )
      .replace(/{{email}}/g, inquiryData.email)
      .replace(/{{contact}}/g, inquiryData.contact)
      .replace(/{{eventDate}}/g, formatDate(inquiryData.eventDate))
      .replace(/{{numberOfPeople}}/g, inquiryData.numberOfPeople)
      .replace(/{{venue}}/g, inquiryData.venue)
      .replace(/{{serviceType}}/g, inquiryData.serviceType)
      .replace(/{{submittedAt}}/g, formatDate(inquiryData.createdAt))
      .replace(/{{eventDateUrgency}}/g, eventDateUrgency)
      .replace(
        /{{adminDashboardUrl}}/g,
        process.env.ADMIN_DASHBOARD_URL || "https://www.mulchowkkitchen.com.au"
      );

    // Handle optional message
    if (inquiryData.message) {
      emailContent = emailContent
        .replace(/{{#if message}}/g, "")
        .replace(/{{\/if}}/g, "");
      emailContent = emailContent.replace(/{{message}}/g, inquiryData.message);
    } else {
      // Remove the message section if no message
      emailContent = emailContent.replace(/{{#if message}}.*?{{\/if}}/gs, "");
    }

    const mailOptions = {
      from: {
        name: process.env.COMPANY_NAME || "MC Catering Services",
        address: process.env.EMAIL,
      },
      to: process.env.ADMIN_EMAIL,
      subject: `🔔 New Inquiry: ${inquiryData.name} - ${formatDate(
        inquiryData.eventDate
      )}`,
      html: emailContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Admin notification sent successfully:", result.messageId);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("Error sending admin notification:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Send customer confirmation email
const sendCustomerInquiryConfirmation = async (inquiryData) => {
  try {
    // Replace template variables
    let emailContent = CUSTOMER_INQUIRY_CONFIRMATION_TEMPLATE.replace(
      /{{name}}/g,
      inquiryData.name
    )
      .replace(/{{email}}/g, inquiryData.email)
      .replace(/{{contact}}/g, inquiryData.contact)
      .replace(/{{eventDate}}/g, formatDate(inquiryData.eventDate))
      .replace(/{{numberOfPeople}}/g, inquiryData.numberOfPeople)
      .replace(/{{venue}}/g, inquiryData.venue)
      .replace(/{{serviceType}}/g, inquiryData.serviceType)
      .replace(/{{submittedAt}}/g, formatDate(inquiryData.createdAt))
      .replace(
        /{{companyName}}/g,
        process.env.COMPANY_NAME || "MC Catering Services"
      )
      .replace(/{{supportEmail}}/g, process.env.EMAIL)
      .replace(
        /{{supportPhone}}/g,
        process.env.SUPPORT_PHONE || "+61 XXX XXX XXX"
      )
      .replace(
        /{{businessHours}}/g,
        process.env.BUSINESS_HOURS || "Mon-Fri 9:00 AM - 6:00 PM"
      )
      .replace(
        /{{websiteUrl}}/g,
        process.env.ADMIN_DASHBOARD_URL || "https://www.mulchowkkitchen.com.au"
      )
      .replace(/{{facebookUrl}}/g, process.env.FACEBOOK_URL || "#")
      .replace(/{{instagramUrl}}/g, process.env.INSTAGRAM_URL || "#")
      .replace(/{{currentYear}}/g, new Date().getFullYear());

    // Handle optional message
    if (inquiryData.message) {
      emailContent = emailContent
        .replace(/{{#if message}}/g, "")
        .replace(/{{\/if}}/g, "");
      emailContent = emailContent.replace(/{{message}}/g, inquiryData.message);
    } else {
      // Remove the message section if no message
      emailContent = emailContent.replace(/{{#if message}}.*?{{\/if}}/gs, "");
    }

    const mailOptions = {
      from: {
        name: process.env.COMPANY_NAME || "MC Catering Services",
        address: process.env.EMAIL,
      },
      to: inquiryData.email,
      subject: `✅ Inquiry Confirmation - ${
        process.env.COMPANY_NAME || "MC Catering Services"
      }`,
      html: emailContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Customer confirmation sent successfully:", result.messageId);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("Error sending customer confirmation:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  sendAdminInquiryNotification,
  sendCustomerInquiryConfirmation,
};