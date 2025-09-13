// utils/sendBookingSMS.js
const { sendSMS } = require("./sendSMS.js");

// Helper function to format currency with proper rounding
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return num.toFixed(2); // This ensures exactly 2 decimal places
};

// Send SMS to customer for booking confirmation
const sendCustomerBookingSMS = async (bookingData) => {
  try {
    if (!bookingData.customerDetails?.phone) {
      console.warn("No phone number provided for customer booking SMS");
      return { success: false, error: "No phone number provided" };
    }

    // Format event date and time
    const eventDate = new Date(bookingData.deliveryDate);
    const formattedDate = eventDate.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
    });

    const formattedTime = eventDate.toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Create short SMS message with essential info
    const message = `Booking confirmed! Ref: ${
      bookingData.bookingReference
    }. Date: ${formattedDate} ${formattedTime}. Amount: $${formatCurrency(
      bookingData.pricing?.total
    )}. Bank details sent via email. - ${
      process.env.COMPANY_NAME || "Our Team"
    }`;

    return await sendSMS(
      bookingData.customerDetails.phone,
      message,
      `booking_customer_${bookingData._id || Date.now()}`
    );
  } catch (error) {
    console.error("Error sending customer booking SMS:", error);
    return { success: false, error: error.message };
  }
};

// Send SMS to admin for booking notification
const sendAdminBookingSMS = async (bookingData) => {
  try {
    // const adminPhone = process.env.SMS_ADMIN_PHONE;
    // if (!adminPhone) {
    //   console.warn(
    //     "SMS_ADMIN_PHONE not configured, skipping admin booking SMS"
    //   );
    //   return { success: false, error: "Admin phone not configured" };
    // }

    // Format event date
    const eventDate = new Date(bookingData.deliveryDate);
    const formattedDate = eventDate.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
    });

    const formattedTime = eventDate.toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Create admin notification SMS
    const orderType = bookingData.isCustomOrder
      ? "Custom Order"
      : bookingData.menu?.serviceName || "Booking";
    const phoneNumber = bookingData.customerDetails?.phone;
    const clickablePhone = `tel:${phoneNumber}`;
    const message = `New ${orderType}! ${
      bookingData.customerDetails?.name
    } ${clickablePhone}. Ref: ${
      bookingData.bookingReference
    }. ${formattedDate} ${formattedTime}. $${formatCurrency(
      bookingData.pricing?.total
    )}. ${bookingData.peopleCount} guests.`;

    console.log("Admin booking SMS message:", message);

    return await sendSMS(
      adminPhone,
      message,
      `booking_admin_${bookingData._id || Date.now()}`
    );
  } catch (error) {
    console.error("Error sending admin booking SMS:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendCustomerBookingSMS,
  sendAdminBookingSMS,
};
