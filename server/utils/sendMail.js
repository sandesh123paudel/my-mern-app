// utils/sendMail.js - Complete file with all email functions

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

  // Handle object address format
  const parts = [];
  if (address.street) parts.push(address.street);
  if (address.suburb) parts.push(address.suburb);
  if (address.state && address.postcode)
    parts.push(`${address.state} ${address.postcode}`);
  else if (address.state) parts.push(address.state);
  else if (address.postcode) parts.push(address.postcode);

  return parts.join(", ");
};

// Helper function to check if event date is urgent (within 7 days)
const getEventDateUrgency = (eventDate) => {
  const today = new Date();
  const event = new Date(eventDate);
  const diffTime = event - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= 7 && diffDays >= 0 ? "urgent" : "";
};

// Helper function to check if event date is urgent (within 7 days) - boolean
const isEventUrgent = (eventDate) => {
  const today = new Date();
  const event = new Date(eventDate);
  const diffTime = event - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7 && diffDays >= 0;
};

// Send admin notification email for inquiries
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
      .replace(/{{venue}}/g, inquiryData.venue.name)
      .replace(/{{serviceType}}/g, inquiryData.serviceType.name)
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
    // Replace template variables
    let emailContent = CUSTOMER_INQUIRY_CONFIRMATION_TEMPLATE.replace(
      /{{name}}/g,
      inquiryData.name
    )
      .replace(/{{email}}/g, inquiryData.email)
      .replace(/{{contact}}/g, inquiryData.contact)
      .replace(/{{eventDate}}/g, formatDate(inquiryData.eventDate))
      .replace(/{{numberOfPeople}}/g, inquiryData.numberOfPeople)
      .replace(/{{venue}}/g, inquiryData.venue.name)
      .replace(/{{serviceType}}/g, inquiryData.serviceType.name)
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
    console.log("🚀 Starting admin booking email notification...");
    console.log("📋 Booking data structure:", {
      hasOrderSource: !!bookingData.orderSource,
      orderSourceType: bookingData.orderSource?.sourceType,
      hasMenu: !!bookingData.menu,
      hasCustomerDetails: !!bookingData.customerDetails,
      hasPricing: !!bookingData.pricing,
    });

    // Format dates properly
    const formattedEventDate = formatDate(bookingData.deliveryDate);
    const formattedEventTime = formatTime(bookingData.deliveryDate);
    const submittedAt = formatDateTime(
      bookingData.createdAt || bookingData.orderDate || new Date()
    );

    // Check if event is urgent (within 7 days)
    const urgent = isEventUrgent(bookingData.deliveryDate);

    // Determine if it's a custom order or menu package
    const isCustomOrder =
      bookingData.orderSource?.sourceType === "customOrder" ||
      bookingData.isCustomOrder === true;

    console.log("🔍 Order type determination:", { isCustomOrder });

    // Get order type name properly
    let orderType = "Catering Order";
    if (bookingData.orderSource?.sourceName) {
      orderType = bookingData.orderSource.sourceName;
    } else if (bookingData.menu?.name) {
      orderType = bookingData.menu.name;
    }

    // Get service and location names properly
    let serviceName = "Catering Service";
    let locationName = "Our Location";

    if (bookingData.orderSource?.serviceName) {
      serviceName = bookingData.orderSource.serviceName;
    } else if (bookingData.menu?.serviceName) {
      serviceName = bookingData.menu.serviceName;
    }

    if (bookingData.orderSource?.locationName) {
      locationName = bookingData.orderSource.locationName;
    } else if (bookingData.menu?.locationName) {
      locationName = bookingData.menu.locationName;
    }

    console.log("📍 Service & Location:", { serviceName, locationName });

    // Create order type badge
    let orderTypeBadge = "";
    if (isCustomOrder) {
      orderTypeBadge =
        '<span class="order-type-badge custom-order-badge">Custom Order</span>';
    } else {
      orderTypeBadge = '<span class="order-type-badge">Menu Package</span>';
    }

    // Create urgent badge
    let urgentBadge = "";
    if (urgent) {
      urgentBadge =
        '<span class="urgent-badge">Urgent - Event within 7 days</span>';
    }

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

    // Format special instructions
    let specialInstructionsSection = "";
    if (bookingData.customerDetails?.specialInstructions) {
      specialInstructionsSection = `
        <div class="special-section">
          <div class="special-title">📝 Special Instructions from Customer</div>
          <div class="special-content">${bookingData.customerDetails.specialInstructions}</div>
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
        <div class="special-section">
          <div class="special-title">🥗 Dietary Requirements</div>
          <div class="special-content">${dietaryRequirements.join(", ")}</div>
        </div>
      `;
    }

    // ✅ START: REFACTORED ITEM DISPLAY LOGIC
    let selectedItemsSection = "";
    if (bookingData.selectedItems?.length > 0) {
      const itemsHtml = bookingData.selectedItems
        .map((item) => {
          // Conditionally add price only for custom orders
          const priceHtml = isCustomOrder
            ? `<span class="item-price">$${formatCurrency(
                item.totalPrice ||
                  item.pricePerPerson * bookingData.peopleCount ||
                  0
              )}</span>`
            : "";

          return `
            <li class="item">
              <span class="item-name">${item.name}</span>
              <span class="item-quantity"> x ${
                item.quantity > 0 ? item.quantity : ""
              }</span>
              ${priceHtml}
            </li>
          `;
        })
        .join("");

      // Use a dynamic header based on the order type
      const itemsHeader = isCustomOrder
        ? "🍽️ Customer Selected Items"
        : "📦 Menu Package Items";

      selectedItemsSection = `
        <div class="items-section">
          <div class="items-header">${itemsHeader}</div>
          <ul class="items-list">
            ${itemsHtml}
          </ul>
        </div>
      `;
    }
    // ✅ END: REFACTORED ITEM DISPLAY LOGIC

    // Create urgent warning if needed
    let urgentWarning = "";
    if (urgent) {
      urgentWarning = `
        <div class="alert-message" style="background-color: #f8d7da; border-left: 4px solid #dc3545; color: #721c24;">
          ⚠️ <strong>Urgent:</strong> This event is scheduled within the next 7 days. Please process this booking immediately and contact the customer to confirm details.
        </div>
      `;
    }

    // Prepare all template replacements
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
      totalAmount: formatCurrency(bookingData.pricing?.total || 0),

      // Timestamps
      submittedAt: submittedAt,

      // Dynamic sections
      urgentBadge: urgentBadge,
      urgentWarning: urgentWarning,
      deliveryAddressSection: deliveryAddressSection,
      selectedItemsSection: selectedItemsSection, // Correctly updated
      specialInstructionsSection: specialInstructionsSection,
      dietaryRequirementsSection: dietaryRequirementsSection,

      // Admin URLs
      adminDashboardUrl:
        process.env.ADMIN_DASHBOARD_URL || "https://www.example.com",
    };

    // Apply all replacements to template
    let emailContent = ADMIN_BOOKING_NOTIFICATION_TEMPLATE;

    Object.keys(replacements).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      emailContent = emailContent.replace(regex, replacements[key] || "");
    });

    // Clean up any remaining template tags
    emailContent = emailContent.replace(/\{\{[^}]+\}\}/g, "");

    // Determine email priority and subject
    const priority = urgent ? "high" : "normal";
    const urgentFlag = urgent ? "🚨 URGENT - " : "";

    const mailOptions = {
      from: {
        name: process.env.COMPANY_NAME || "Booking System",
        address: process.env.EMAIL,
      },
      to: process.env.ADMIN_EMAIL,
      subject: `${urgentFlag}🎉 New Booking: ${bookingData.bookingReference} - $${replacements.totalAmount}`,
      html: emailContent,
      priority: priority,
    };

    console.log("📧 Sending admin booking email to:", mailOptions.to);
    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Admin booking notification email sent:", result.messageId);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error(
      "❌ Error sending admin booking notification email:",
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
    console.log("🚀 Starting customer booking email confirmation...");
    console.log("📋 Booking data structure:", {
      hasOrderSource: !!bookingData.orderSource,
      orderSourceType: bookingData.orderSource?.sourceType,
      hasMenu: !!bookingData.menu,
      hasCustomerDetails: !!bookingData.customerDetails,
      hasPricing: !!bookingData.pricing,
    });

    // Format dates properly
    const formattedEventDate = formatDate(bookingData.deliveryDate);
    const formattedEventTime = formatTime(bookingData.deliveryDate);
    const submittedAt = formatDateTime(
      bookingData.createdAt || bookingData.orderDate || new Date()
    );

    // Determine if it's a custom order or menu package
    const isCustomOrder =
      bookingData.orderSource?.sourceType === "customOrder" ||
      bookingData.isCustomOrder === true;

    console.log("🔍 Order type determination:", { isCustomOrder });

    // Get order type name properly
    let orderType = "Catering Order";
    if (bookingData.orderSource?.sourceName) {
      orderType = bookingData.orderSource.sourceName;
    } else if (bookingData.menu?.name) {
      orderType = bookingData.menu.name;
    }

    // Get service and location names properly
    let serviceName = "Catering Service";
    let locationName = "Our Location";

    if (bookingData.orderSource?.serviceName) {
      serviceName = bookingData.orderSource.serviceName;
    } else if (bookingData.menu?.serviceName) {
      serviceName = bookingData.menu.serviceName;
    }

    if (bookingData.orderSource?.locationName) {
      locationName = bookingData.orderSource.locationName;
    } else if (bookingData.menu?.locationName) {
      locationName = bookingData.menu.locationName;
    }

    console.log("📍 Service & Location:", { serviceName, locationName });

    // Create order type badge
    let orderTypeBadge = "";
    if (isCustomOrder) {
      orderTypeBadge =
        '<span class="order-type-badge custom-order-badge">Custom Order</span>';
    } else {
      orderTypeBadge = '<span class="order-type-badge">Menu Package</span>';
    }

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

    // Format special instructions
    let specialInstructionsSection = "";
    if (bookingData.customerDetails?.specialInstructions) {
      specialInstructionsSection = `
        <div class="special-section">
          <div class="special-title">📝 Special Instructions</div>
          <div class="special-content">${bookingData.customerDetails.specialInstructions}</div>
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
        <div class="special-section">
          <div class="special-title">🥗 Dietary Requirements</div>
          <div class="special-content">${dietaryRequirements.join(", ")}</div>
        </div>
      `;
    }

    // ✅ START: REFACTORED ITEM DISPLAY LOGIC
    let selectedItemsSection = "";
    if (bookingData.selectedItems?.length > 0) {
      const itemsHtml = bookingData.selectedItems
        .map((item) => {
          // Conditionally add price only for custom orders
          const priceHtml = isCustomOrder
            ? `<span class="item-price">$${formatCurrency(
                item.totalPrice ||
                  item.pricePerPerson * bookingData.peopleCount ||
                  0
              )}</span>`
            : "";

          return `
            <li class="item">
              <span class="item-name">${item.name}</span>
              <span class="item-quantity"> x ${
                item.quantity > 0 ? item.quantity : ""
              }</span>
              ${priceHtml}
            </li>
          `;
        })
        .join("");

      // Use a dynamic, customer-friendly header
      const itemsHeader = isCustomOrder
        ? "🍽️ Your Selected Items"
        : "📦 Items Included in Your Package";

      selectedItemsSection = `
        <div class="items-section">
          <div class="items-header">${itemsHeader}</div>
          <ul class="items-list">
            ${itemsHtml}
          </ul>
        </div>
      `;
    }
    // ✅ END: REFACTORED ITEM DISPLAY LOGIC

    // Format bank details section
    let bankDetailsSection = "";
    if (locationBankDetails) {
      bankDetailsSection = `
        <div class="bank-details">
          <div class="bank-title">🏦 Payment Details</div>
          <p style="text-align: center; margin-bottom: 15px; color: #155724;">
            Please use the details below to make your payment:
          </p>
          <div class="bank-info">
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
          </div>
          <p style="text-align: center; margin-top: 15px; font-size: 14px; color: #155724;">
            ⚠️ Please use your booking reference <strong>${bookingData.bookingReference}</strong> as the payment description.
          </p>
        </div>
      `;
    }

    // Prepare all template replacements
    const replacements = {
      // Company info
      companyName: process.env.COMPANY_NAME || "MC Catering Services",

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
      totalAmount: formatCurrency(bookingData.pricing?.total || 0),

      // Timestamps
      submittedAt: submittedAt,

      // Dynamic sections
      deliveryAddressSection: deliveryAddressSection,
      selectedItemsSection: selectedItemsSection, // Correctly updated
      specialInstructionsSection: specialInstructionsSection,
      dietaryRequirementsSection: dietaryRequirementsSection,
      bankDetailsSection: bankDetailsSection,

      // Contact info
      supportEmail: process.env.EMAIL || "info@mccatering.com",
      supportPhone: process.env.SUPPORT_PHONE || "+61 XXX XXX XXX",
      businessHours:
        process.env.BUSINESS_HOURS || "Mon-Fri 9:00 AM - 6:00 PM",
      websiteUrl:
        process.env.ADMIN_DASHBOARD_URL || "https://www.mccatering.com.au",
      facebookUrl: process.env.FACEBOOK_URL || "#",
      instagramUrl: process.env.INSTAGRAM_URL || "#",
      currentYear: new Date().getFullYear().toString(),
    };

    // Apply all replacements to template
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
      subject: `✅ Booking Confirmed: ${bookingData.bookingReference} - ${formattedEventDate}`,
      html: emailContent,
    };

    console.log("📧 Sending customer booking email to:", mailOptions.to);
    const result = await transporter.sendMail(mailOptions);
    console.log(
      "✅ Customer booking confirmation email sent:",
      result.messageId
    );

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error(
      "❌ Error sending customer booking confirmation email:",
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