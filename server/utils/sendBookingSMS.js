// utils/sendBookingSMS.js
const { sendSMS } = require("./sendSMS.js");
const { toZonedTime, format } = require("date-fns-tz");

const SYDNEY_TIMEZONE = "Australia/Sydney";

// Helper function to format currency with proper rounding
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return num.toFixed(2); // This ensures exactly 2 decimal places
};

// Helper function to format date/time in Sydney timezone
const formatSydneyDateTime = (utcDate) => {
  const sydneyTime = toZonedTime(utcDate, SYDNEY_TIMEZONE);
  const formattedDate = format(sydneyTime, "d MMM", { timeZone: SYDNEY_TIMEZONE });
  const formattedTime = format(sydneyTime, "h:mm a", { timeZone: SYDNEY_TIMEZONE });
  return { formattedDate, formattedTime };
};

// Send SMS to customer for booking confirmation
const sendCustomerBookingSMS = async (bookingData) => {
  try {
    if (!bookingData.customerDetails?.phone) {
      console.warn("No phone number provided for customer booking SMS");
      return { success: false, error: "No phone number provided" };
    }

    // Format event date and time in Sydney timezone
    const eventDate = new Date(bookingData.deliveryDate);
    const { formattedDate, formattedTime } = formatSydneyDateTime(eventDate);

    // Create short SMS message with essential info
    const message = `Booking confirmed! Ref: ${
      bookingData.bookingReference
    }. Date: ${formattedDate} ${formattedTime} . Amount: $${formatCurrency(
      bookingData.pricing?.total
    )}. Bank details sent via email. - ${
      process.env.COMPANY_NAME || "Our Team"
    }`;

    console.log("Customer booking SMS message:", message);

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
    const adminPhone = process.env.SMS_ADMIN_PHONE;
    // if (!adminPhone) {
    //   console.warn(
    //     "SMS_ADMIN_PHONE not configured, skipping admin booking SMS"
    //   );
    //   return { success: false, error: "Admin phone not configured" };
    // }

    // Format event date in Sydney timezone
    const eventDate = new Date(bookingData.deliveryDate);
    const { formattedDate, formattedTime } = formatSydneyDateTime(eventDate);

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
    }. ${formattedDate} ${formattedTime} . $${formatCurrency(
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