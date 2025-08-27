// Complete utils/sendMail.js - All functions with simplified template support

const {
  ADMIN_INQUIRY_NOTIFICATION_TEMPLATE,
  CUSTOMER_INQUIRY_CONFIRMATION_TEMPLATE,
  ADMIN_BOOKING_NOTIFICATION_TEMPLATE,
  CUSTOMER_BOOKING_CONFIRMATION_TEMPLATE,
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

// Helper function to format date and time
const formatDateTime = (date) => {
  return new Date(date).toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Helper function to format time only
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Helper function to format currency properly
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return num.toFixed(2);
};

// Helper function to format address
const formatAddress = (address) => {
  if (!address) return "";
  if (typeof address === "string") return address;

  const parts = [];
  if (address.street) parts.push(address.street);
  if (address.suburb) parts.push(address.suburb);
  if (address.state && address.postcode)
    parts.push(`${address.state} ${address.postcode}`);
  else if (address.state) parts.push(address.state);
  else if (address.postcode) parts.push(address.postcode);

  return parts.join(", ");
};

// Helper function to check if event date is urgent (within 3 days)
const isEventUrgent = (eventDate) => {
  const today = new Date();
  const event = new Date(eventDate);
  const diffTime = event - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 3 && diffDays >= 0;
};

// Helper function to format selected items as paragraphs grouped by category
const formatSelectedItemsAsParagraphs = (
  selectedItems,
  isCustomOrder = false
) => {
  if (!selectedItems || selectedItems.length === 0) {
    return "";
  }

  if (isCustomOrder && item.totalPrice && item.totalPrice > 0) {
    description += ` - $${formatCurrency(item.totalPrice)}`;
  }

  // Group items by category
  const itemsByCategory = {};
  selectedItems.forEach((item) => {
    const category = item.category || "other";
    if (!itemsByCategory[category]) {
      itemsByCategory[category] = [];
    }
    itemsByCategory[category].push(item);
  });

  // Format each category as a paragraph
  const categoryParagraphs = Object.keys(itemsByCategory)
    .map((categoryKey) => {
      const items = itemsByCategory[categoryKey];
      const categoryName =
        categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);

      const itemDescriptions = items
        .map((item) => {
          let description = item.name;

          // Add quantity if greater than 1
          if (item.quantity && item.quantity > 1) {
            description += ` (${item.quantity}x)`;
          }

          // Add price for custom orders
          if (isCustomOrder && item.totalPrice && item.totalPrice > 0) {
            description += ` - $${formatCurrency(item.totalPrice)}`;
          }

          return description;
        })
        .join(", ");

      return `<div class="category-title">${categoryName}:</div><p>${itemDescriptions}</p>`;
    })
    .join("");

  return `
    <div class="info-box">
      <div class="box-header">${
        isCustomOrder ? "Selected Items" : "Package Items"
      }</div>
      <div class="box-content">
        <div class="items-paragraph">
          ${categoryParagraphs}
        </div>
      </div>
    </div>
  `;
};

// Helper function to format venue information for functions
const formatFunctionVenueSection = (bookingData) => {
  if (!bookingData.isFunction || !bookingData.venueSelection) {
    return "";
  }

  const venueText =
    bookingData.venueSelection === "both"
      ? "Both Indoor & Outdoor Areas"
      : bookingData.venueSelection.charAt(0).toUpperCase() +
        bookingData.venueSelection.slice(1) +
        " Area";

  let venueChargeText = "";
  if (bookingData.venueCharge && bookingData.venueCharge > 0) {
    venueChargeText = ` (+$${formatCurrency(
      bookingData.venueCharge
    )} venue charge)`;
  }

  return `
    <div class="detail-row">
      <span class="detail-label">Function Venue:</span>
      <span class="detail-value">${venueText}${venueChargeText}</span>
    </div>
  `;
};

// Send admin notification email for inquiries
const sendAdminInquiryNotification = async (inquiryData) => {
  try {
    const eventDateUrgency = isEventUrgent(inquiryData.eventDate)
      ? "urgent"
      : "";

    const replacements = {
      name: inquiryData.name || "N/A",
      email: inquiryData.email || "N/A",
      contact: inquiryData.contact || "N/A",
      eventDate: formatDate(inquiryData.eventDate),
      numberOfPeople: inquiryData.numberOfPeople || "N/A",
      venue: inquiryData.venue?.name || "N/A",
      serviceType: inquiryData.serviceType?.name || "N/A",
      submittedAt: formatDateTime(inquiryData.createdAt || new Date()),
      eventDateUrgency: eventDateUrgency,
      adminDashboardUrl:
        process.env.ADMIN_DASHBOARD_URL || "https://www.mccatering.com.au",
    };

    let emailContent = ADMIN_INQUIRY_NOTIFICATION_TEMPLATE;

    // Handle optional message
    if (inquiryData.message) {
      emailContent = emailContent
        .replace(/{{#if message}}/g, "")
        .replace(/{{\/if}}/g, "")
        .replace(/{{message}}/g, inquiryData.message);
    } else {
      emailContent = emailContent.replace(/{{#if message}}.*?{{\/if}}/gs, "");
    }

    // Apply all replacements
    Object.keys(replacements).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      emailContent = emailContent.replace(regex, replacements[key] || "");
    });

    // Clean up any remaining template tags
    emailContent = emailContent.replace(/\{\{[^}]+\}\}/g, "");

    const mailOptions = {
      from: {
        name: process.env.COMPANY_NAME || "MC Catering Services",
        address: process.env.EMAIL,
      },
      to: process.env.ADMIN_EMAIL,
      subject: `New Inquiry: ${inquiryData.name} - ${formatDate(
        inquiryData.eventDate
      )}`,
      html: emailContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      "Admin inquiry notification sent successfully:",
      result.messageId
    );

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("Error sending admin inquiry notification:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Send customer confirmation email for inquiries
const sendCustomerInquiryConfirmation = async (inquiryData) => {
  try {
    const replacements = {
      name: inquiryData.name || "Valued Customer",
      email: inquiryData.email || "N/A",
      eventDate: formatDate(inquiryData.eventDate),
      numberOfPeople: inquiryData.numberOfPeople || "N/A",
      venue: inquiryData.venue?.name || "N/A",
      serviceType: inquiryData.serviceType?.name || "N/A",
      contact: inquiryData.contact || "N/A",
      submittedAt: formatDateTime(inquiryData.createdAt || new Date()),
      companyName: process.env.COMPANY_NAME || "MC Catering Services",
      supportEmail: process.env.EMAIL || "info@mccatering.com.au",
      supportPhone: process.env.SUPPORT_PHONE || "+61 XXX XXX XXX",
      businessHours: process.env.BUSINESS_HOURS || "Mon-Fri 9:00 AM - 6:00 PM",
      websiteUrl:
        process.env.ADMIN_DASHBOARD_URL || "https://www.mccatering.com.au",
      currentYear: new Date().getFullYear().toString(),
    };

    let emailContent = CUSTOMER_INQUIRY_CONFIRMATION_TEMPLATE;

    // Handle optional message
    if (inquiryData.message) {
      emailContent = emailContent
        .replace(/{{#if message}}/g, "")
        .replace(/{{\/if}}/g, "")
        .replace(/{{message}}/g, inquiryData.message);
    } else {
      emailContent = emailContent.replace(/{{#if message}}.*?{{\/if}}/gs, "");
    }

    // Apply all replacements
    Object.keys(replacements).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      emailContent = emailContent.replace(regex, replacements[key] || "");
    });

    // Clean up any remaining template tags
    emailContent = emailContent.replace(/\{\{[^}]+\}\}/g, "");

    const mailOptions = {
      from: {
        name: process.env.COMPANY_NAME || "MC Catering Services",
        address: process.env.EMAIL,
      },
      to: inquiryData.email,
      subject: `Inquiry Confirmation - ${
        process.env.COMPANY_NAME || "MC Catering Services"
      }`,
      html: emailContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      "Customer inquiry confirmation sent successfully:",
      result.messageId
    );

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("Error sending customer inquiry confirmation:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Updated sendAdminBookingNotification function
const sendAdminBookingNotification = async (bookingData) => {
  try {
    console.log("Starting admin booking email notification...");

    const formattedEventDate = formatDate(bookingData.deliveryDate);
    const formattedEventTime = formatTime(bookingData.deliveryDate);
    const submittedAt = formatDateTime(bookingData.createdAt || new Date());
    const urgent = isEventUrgent(bookingData.deliveryDate);
    const isCustomOrder = bookingData.orderSource?.sourceType === "customOrder";

    // Get order type and service info
    let orderType = "Catering Order";
    let serviceName = "Catering Service";
    let locationName = "Location";

    if (bookingData.orderSource?.sourceName) {
      orderType = bookingData.orderSource.sourceName;
    }
    if (bookingData.orderSource?.serviceName) {
      serviceName = bookingData.orderSource.serviceName;
    }
    if (bookingData.orderSource?.locationName) {
      locationName = bookingData.orderSource.locationName;
    }

    // Create order type badge
    const orderTypeBadge = isCustomOrder
      ? '<span class="order-badge custom-badge">Custom</span>'
      : '<span class="order-badge">Menu</span>';

    // Format delivery address
    let deliveryAddressSection = "";
    if (bookingData.deliveryType === "Delivery" && bookingData.address) {
      const deliveryAddress = formatAddress(bookingData.address);
      deliveryAddressSection = `
        <div class="detail-row">
          <span class="detail-label">Delivery Address:</span>
          <span class="detail-value">${deliveryAddress}</span>
        </div>
      `;
    }

    // Format function venue section
    const functionVenueSection = formatFunctionVenueSection(bookingData);

    // Format selected items as paragraphs by category
    const selectedItemsSection = formatSelectedItemsAsParagraphs(
      bookingData.selectedItems,
      isCustomOrder
    );

    // Format special instructions
    let specialInstructionsSection = "";
    if (bookingData.customerDetails?.specialInstructions) {
      specialInstructionsSection = `
        <div class="info-box">
          <div class="box-header">Special Instructions</div>
          <div class="box-content">
            <p>${bookingData.customerDetails.specialInstructions}</p>
          </div>
        </div>
      `;
    }

    // Format dietary requirements
    let dietaryRequirementsSection = "";
    const dietaryRequirements = [];

    if (bookingData.customerDetails?.dietaryRequirements?.length > 0) {
      dietaryRequirements.push(
        ...bookingData.customerDetails.dietaryRequirements
      );
    }

    if (bookingData.customerDetails?.spiceLevel) {
      dietaryRequirements.push(
        `Spice Level: ${
          bookingData.customerDetails.spiceLevel.charAt(0).toUpperCase() +
          bookingData.customerDetails.spiceLevel.slice(1)
        }`
      );
    }

    if (dietaryRequirements.length > 0) {
      dietaryRequirementsSection = `
        <div class="info-box">
          <div class="box-header">Dietary Requirements</div>
          <div class="box-content">
            <p>${dietaryRequirements.join(", ")}</p>
          </div>
        </div>
      `;
    }

    // Create urgent warning
    let urgentWarning = "";
    if (urgent) {
      urgentWarning = `
        <div class="urgent-warning">
          <strong>URGENT:</strong> This event is within 3 days. Please contact the customer immediately.
        </div>
      `;
    }

    const replacements = {
      // Company info
      companyName: process.env.COMPANY_NAME || "MC Catering Services",
      currentYear: new Date().getFullYear().toString(),

      // Booking info
      bookingReference: bookingData.bookingReference || "N/A",
      orderType: orderType,
      orderTypeBadge: orderTypeBadge,

      // Customer info
      customerName: bookingData.customerDetails?.name || "N/A",
      customerEmail: bookingData.customerDetails?.email || "N/A",
      customerPhone: bookingData.customerDetails?.phone || "N/A",

      // Event details
      eventDate: formattedEventDate,
      eventTime: formattedEventTime,
      eventDateClass: urgent ? "urgent-date" : "",
      numberOfPeople: bookingData.peopleCount || "N/A",
      serviceName: serviceName,
      locationName: locationName,
      deliveryType: bookingData.deliveryType || "N/A",

      // Pricing
      totalAmount: formatCurrency(bookingData.pricing?.total || 0), // Just the number
      totalAmountFormatted: `$${formatCurrency(
        bookingData.pricing?.total || 0
      )}`, // With dollar sign

      // Timestamps
      submittedAt: submittedAt,

      // Urgent styling
      urgentClass: urgent ? "urgent-badge" : "",
      urgentText: urgent ? "Urgent" : "New Booking",

      // Dynamic sections
      urgentWarning: urgentWarning,
      deliveryAddressSection: deliveryAddressSection,
      functionVenueSection: functionVenueSection,
      selectedItemsSection: selectedItemsSection,
      specialInstructionsSection: specialInstructionsSection,
      dietaryRequirementsSection: dietaryRequirementsSection,

      // Admin URLs
      adminDashboardUrl:
        process.env.ADMIN_DASHBOARD_URL || "https://www.mccatering.com.au",
    };

    // Apply all replacements
    let emailContent = ADMIN_BOOKING_NOTIFICATION_TEMPLATE;
    Object.keys(replacements).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      emailContent = emailContent.replace(regex, replacements[key] || "");
    });

    // Clean up any remaining template tags
    emailContent = emailContent.replace(/\{\{[^}]+\}\}/g, "");

    const priority = urgent ? "high" : "normal";
    const urgentFlag = urgent ? "URGENT - " : "";

    const mailOptions = {
      from: {
        name: process.env.COMPANY_NAME || "Booking System",
        address: process.env.EMAIL,
      },
      to: process.env.ADMIN_EMAIL,
      subject: `${urgentFlag}New Booking: ${
        bookingData.bookingReference
      } - $${formatCurrency(bookingData.pricing?.total || 0)}`,
      html: emailContent,
      priority: priority,
    };

    console.log("Sending admin booking email to:", mailOptions.to);
    const result = await transporter.sendMail(mailOptions);
    console.log("Admin booking notification email sent:", result.messageId);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error(
      "Error sending admin booking notification email:",
      error.message
    );
    return {
      success: false,
      error: error.message,
    };
  }
};

// Updated sendCustomerBookingConfirmation function
const sendCustomerBookingConfirmation = async (
  bookingData,
  locationBankDetails = null
) => {
  try {
    console.log("Starting customer booking email confirmation...");

    const formattedEventDate = formatDate(bookingData.deliveryDate);
    const formattedEventTime = formatTime(bookingData.deliveryDate);
    const submittedAt = formatDateTime(bookingData.createdAt || new Date());
    const isCustomOrder = bookingData.orderSource?.sourceType === "customOrder";

    // Calculate advance payment (30% of total)
    const totalAmount = parseFloat(bookingData.pricing?.total || 0);
    const advanceAmount = totalAmount * 0.3;
    const remainingAmount = totalAmount - advanceAmount;

    // Get order type and service info
    let orderType = "Catering Order";
    let serviceName = "Catering Service";
    let locationName = "Location";

    if (bookingData.orderSource?.sourceName) {
      orderType = bookingData.orderSource.sourceName;
    }
    if (bookingData.orderSource?.serviceName) {
      serviceName = bookingData.orderSource.serviceName;
    }
    if (bookingData.orderSource?.locationName) {
      locationName = bookingData.orderSource.locationName;
    }

    // Create order type badge
    const orderTypeBadge = isCustomOrder
      ? '<span class="order-badge custom-badge">Custom</span>'
      : '<span class="order-badge">Menu</span>';

    // Format delivery address
    let deliveryAddressSection = "";
    if (bookingData.deliveryType === "Delivery" && bookingData.address) {
      const deliveryAddress = formatAddress(bookingData.address);
      deliveryAddressSection = `
        <div class="detail-row">
          <span class="detail-label">Delivery Address:</span>
          <span class="detail-value">${deliveryAddress}</span>
        </div>
      `;
    }

    // Format function venue section
    const functionVenueSection = formatFunctionVenueSection(bookingData);

    // Format selected items as paragraphs by category
    const selectedItemsSection = formatSelectedItemsAsParagraphs(
      bookingData.selectedItems,
      isCustomOrder
    );

    // Format special instructions
    let specialInstructionsSection = "";
    if (bookingData.customerDetails?.specialInstructions) {
      specialInstructionsSection = `
        <div class="info-box">
          <div class="box-header">Special Instructions</div>
          <div class="box-content">
            <p>${bookingData.customerDetails.specialInstructions}</p>
          </div>
        </div>
      `;
    }

    // Format dietary requirements
    let dietaryRequirementsSection = "";
    const dietaryRequirements = [];

    if (bookingData.customerDetails?.dietaryRequirements?.length > 0) {
      dietaryRequirements.push(
        ...bookingData.customerDetails.dietaryRequirements
      );
    }

    if (bookingData.customerDetails?.spiceLevel) {
      dietaryRequirements.push(
        `Spice Level: ${
          bookingData.customerDetails.spiceLevel.charAt(0).toUpperCase() +
          bookingData.customerDetails.spiceLevel.slice(1)
        }`
      );
    }

    if (dietaryRequirements.length > 0) {
      dietaryRequirementsSection = `
        <div class="info-box">
          <div class="box-header">Dietary Requirements</div>
          <div class="box-content">
            <p>${dietaryRequirements.join(", ")}</p>
          </div>
        </div>
      `;
    }

    // Format bank details section
    let bankDetailsSection = "";
    if (locationBankDetails) {
      bankDetailsSection = `
        <div class="bank-details">
          <div class="box-header">Bank Payment Details</div>
          <div class="bank-content">
            <p style="text-align: center; margin-bottom: 15px; font-weight: bold;">
              Use these details for your advance payment:
            </p>
            <div class="bank-row">
              <span class="bank-label">Bank Name:</span>
              <span class="bank-value">${locationBankDetails.bankName}</span>
            </div>
            <div class="bank-row">
              <span class="bank-label">Account Name:</span>
              <span class="bank-value">${locationBankDetails.accountName}</span>
            </div>
            <div class="bank-row">
              <span class="bank-label">BSB:</span>
              <span class="bank-value">${locationBankDetails.bsb}</span>
            </div>
            <div class="bank-row">
              <span class="bank-label">Account Number:</span>
              <span class="bank-value">${locationBankDetails.accountNumber}</span>
            </div>
            <div class="bank-row">
              <span class="bank-label">Payment Reference:</span>
              <span class="bank-value"><strong>${bookingData.bookingReference}</strong></span>
            </div>
            <p style="text-align: center; margin-top: 15px; font-weight: bold;">
              Important: Use booking reference ${bookingData.bookingReference} as payment description
            </p>
          </div>
        </div>
      `;
    }

    const replacements = {
      // Company info
      companyName: process.env.COMPANY_NAME || "MC Catering Services",
      currentYear: new Date().getFullYear().toString(),

      // Customer info
      customerName: bookingData.customerDetails?.name || "Valued Customer",
      customerPhone: bookingData.customerDetails?.phone || "N/A",

      // Booking info
      bookingReference: bookingData.bookingReference || "N/A",
      orderType: orderType,
      orderTypeBadge: orderTypeBadge,

      // Event details
      eventDate: formattedEventDate,
      eventTime: formattedEventTime,
      numberOfPeople: bookingData.peopleCount || "N/A",
      serviceName: serviceName,
      locationName: locationName,
      deliveryType: bookingData.deliveryType || "N/A",

      // Pricing
      totalAmount: formatCurrency(bookingData.pricing?.total || 0), // Just the number
      totalAmountFormatted: `$${formatCurrency(
        bookingData.pricing?.total || 0
      )}`, // With dollar sign
      advanceAmountFormatted: `$${formatCurrency(advanceAmount)}`, // With dollar sign
      remainingAmountFormatted: `$${formatCurrency(remainingAmount)}`, // With dollar sign

      // Timestamps
      submittedAt: submittedAt,

      // Dynamic sections
      deliveryAddressSection: deliveryAddressSection,
      functionVenueSection: functionVenueSection,
      selectedItemsSection: selectedItemsSection,
      specialInstructionsSection: specialInstructionsSection,
      dietaryRequirementsSection: dietaryRequirementsSection,
      bankDetailsSection: bankDetailsSection,

      // Contact info
      supportEmail: process.env.EMAIL || "info@mccatering.com.au",
      supportPhone: process.env.SUPPORT_PHONE || "+61 XXX XXX XXX",
      businessHours: process.env.BUSINESS_HOURS || "Mon-Fri 9:00 AM - 6:00 PM",
      websiteUrl:
        process.env.ADMIN_DASHBOARD_URL ||
        "https://www.mccatering.com.au/admin",
    };

    // Apply all replacements
    let emailContent = CUSTOMER_BOOKING_CONFIRMATION_TEMPLATE;
    Object.keys(replacements).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      emailContent = emailContent.replace(regex, replacements[key] || "");
    });

    // Clean up any remaining template tags
    emailContent = emailContent.replace(/\{\{[^}]+\}\}/g, "");

    const mailOptions = {
      from: {
        name: process.env.COMPANY_NAME || "MC Catering Services",
        address: process.env.EMAIL,
      },
      to: bookingData.customerDetails?.email,
      subject: `Booking Confirmed: ${bookingData.bookingReference} - ${formattedEventDate}`,
      html: emailContent,
    };

    console.log("Sending customer booking email to:", mailOptions.to);
    const result = await transporter.sendMail(mailOptions);
    console.log("Customer booking confirmation email sent:", result.messageId);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error(
      "Error sending customer booking confirmation email:",
      error.message
    );
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  sendAdminInquiryNotification,
  sendCustomerInquiryConfirmation,
  sendAdminBookingNotification,
  sendCustomerBookingConfirmation,
};
