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

// Helper function to check if event date is urgent (within 7 days)
const getEventDateUrgency = (eventDate) => {
  const today = new Date();
  const event = new Date(eventDate);
  const diffTime = event - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= 7 ? "urgent" : "";
};

// Helper function to format address
const formatAddress = (address) => {
  if (!address) return "";
  return `${address.street}, ${address.suburb}, ${address.state} ${address.postcode}`;
};

// Helper function to replace template conditionals
const replaceConditionals = (template, condition, content) => {
  if (condition) {
    return template
      .replace(/{{#if [^}]+}}/g, "")
      .replace(/{{\/if}}/g, "")
      .replace(/{{[^}]+}}/g, (match) => content[match.slice(2, -2)] || match);
  } else {
    return template.replace(/{{#if [^}]+}}.*?{{\/if}}/gs, "");
  }
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

// Fixed email service functions with proper template processing

// Helper function to format currency properly
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return num.toFixed(2);
};

// Helper function to process conditional sections
const processConditionals = (template, data) => {
  // Process {{#if condition}} blocks
  let processedTemplate = template;

  // Handle {{#if isCustomOrder}} blocks
  if (data.isCustomOrder) {
    processedTemplate = processedTemplate
      .replace(/\{\{#if isCustomOrder\}\}/g, "")
      .replace(/\{\{\/if\}\}/g, "");
  } else {
    processedTemplate = processedTemplate.replace(
      /\{\{#if isCustomOrder\}\}.*?\{\{\/if\}\}/gs,
      ""
    );
  }

  // Handle {{#if selectedItems}} blocks
  if (data.selectedItems && data.selectedItems.length > 0) {
    processedTemplate = processedTemplate
      .replace(/\{\{#if selectedItems\}\}/g, "")
      .replace(/\{\{\/selectedItems\}\}/g, "");
  } else {
    processedTemplate = processedTemplate.replace(
      /\{\{#if selectedItems\}\}.*?\{\{\/selectedItems\}\}/gs,
      ""
    );
  }

  // Handle {{#if deliveryAddress}} blocks
  if (data.deliveryAddress) {
    processedTemplate = processedTemplate
      .replace(/\{\{#if deliveryAddress\}\}/g, "")
      .replace(/\{\{\/deliveryAddress\}\}/g, "");
  } else {
    processedTemplate = processedTemplate.replace(
      /\{\{#if deliveryAddress\}\}.*?\{\{\/deliveryAddress\}\}/gs,
      ""
    );
  }

  // Handle {{#if specialInstructions}} blocks
  if (data.specialInstructions) {
    processedTemplate = processedTemplate
      .replace(/\{\{#if specialInstructions\}\}/g, "")
      .replace(/\{\{\/specialInstructions\}\}/g, "");
  } else {
    processedTemplate = processedTemplate.replace(
      /\{\{#if specialInstructions\}\}.*?\{\{\/specialInstructions\}\}/gs,
      ""
    );
  }

  // Handle {{#if message}} blocks
  if (data.message) {
    processedTemplate = processedTemplate
      .replace(/\{\{#if message\}\}/g, "")
      .replace(/\{\{\/message\}\}/g, "");
  } else {
    processedTemplate = processedTemplate.replace(
      /\{\{#if message\}\}.*?\{\{\/message\}\}/gs,
      ""
    );
  }

  return processedTemplate;
};

// Updated sendAdminBookingNotification function
const sendAdminBookingNotification = async (bookingData) => {
  try {
    console.log("🚀 Starting admin booking email notification...");

    const eventDateUrgency = getEventDateUrgency(bookingData.deliveryDate);
    const formattedEventDate = formatDate(bookingData.deliveryDate);
    const formattedEventTime = formatTime(bookingData.deliveryDate);
    const submittedAt = formatDateTime(bookingData.createdAt || new Date());

    // Format delivery address if available
    const deliveryAddress =
      bookingData.deliveryType === "Delivery" && bookingData.address
        ? formatAddress(bookingData.address)
        : "";

    // Format delivery address section
    const deliveryAddressSection = deliveryAddress
      ? `<div class="detail-row">
           <span class="detail-label">Delivery Address:</span>
           <span class="detail-value">${deliveryAddress}</span>
         </div>`
      : "";

    // Format selected items HTML
    let selectedItemsHtml = "";
    if (bookingData.selectedItems && bookingData.selectedItems.length > 0) {
      selectedItemsHtml = bookingData.selectedItems
        .map((item) => `<li>${item.name} - $${formatCurrency(item.price)}</li>`)
        .join("");
    }

    const selectedItemsSection = selectedItemsHtml
      ? `<div class="items-section">
           <div class="items-title">Selected Items:</div>
           <ul class="item-list">${selectedItemsHtml}</ul>
         </div>`
      : "";

    // Format special instructions
    const specialInstructionsSection = bookingData.customerDetails
      ?.specialInstructions
      ? `<div class="message-section">
           <div class="message-label">Special Instructions:</div>
           <div>${bookingData.customerDetails.specialInstructions}</div>
         </div>`
      : "";

    // Format dietary requirements
    let dietaryHtml = "";
    if (bookingData.customerDetails?.dietaryRequirements?.length > 0) {
      dietaryHtml = bookingData.customerDetails.dietaryRequirements
        .map(
          (req) =>
            `<li>${
              req.charAt(0).toUpperCase() + req.slice(1).replace("-", " ")
            }</li>`
        )
        .join("");
    }

    const dietarySection = dietaryHtml
      ? `<div class="items-section">
           <div class="items-title">Dietary Requirements:</div>
           <ul class="item-list">${dietaryHtml}</ul>
         </div>`
      : "";

    // Custom order badge
    const customOrderBadge = bookingData.isCustomOrder
      ? '<span class="custom-order-badge">Custom</span>'
      : "";

    // Prepare template data
    const templateData = {
      bookingReference: bookingData.bookingReference || "N/A",
      orderType: bookingData.menu?.name || "N/A",
      isCustomOrder: bookingData.isCustomOrder || false,
      customerName: bookingData.customerDetails?.name || "N/A",
      customerEmail: bookingData.customerDetails?.email || "N/A",
      customerPhone: bookingData.customerDetails?.phone || "N/A",
      eventDate: formattedEventDate,
      eventTime: formattedEventTime,
      eventDateUrgency: eventDateUrgency,
      numberOfPeople: bookingData.peopleCount || "N/A",
      serviceName: bookingData.menu?.serviceName || "N/A",
      locationName: bookingData.menu?.locationName || "N/A",
      deliveryType: bookingData.deliveryType || "N/A",
      deliveryAddress: deliveryAddress,
      deliveryAddressSection: deliveryAddressSection,
      totalAmount: formatCurrency(bookingData.pricing?.total || 0),
      submittedAt: submittedAt,
      specialInstructions:
        bookingData.customerDetails?.specialInstructions || "",
      specialInstructionsSection: specialInstructionsSection,
      selectedItemsHtml: selectedItemsHtml,
      selectedItemsSection: selectedItemsSection,
      dietarySection: dietarySection,
      customOrderBadge: customOrderBadge,
      adminDashboardUrl:
        process.env.ADMIN_DASHBOARD_URL || "https://www.example.com",
    };

    // Process the template
    let emailContent = ADMIN_BOOKING_NOTIFICATION_TEMPLATE;

    // Replace all template variables
    Object.keys(templateData).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      emailContent = emailContent.replace(regex, templateData[key]);
    });

    // Remove any remaining unmatched template tags
    emailContent = emailContent.replace(/\{\{[^}]+\}\}/g, "");

    const mailOptions = {
      from: {
        name: process.env.COMPANY_NAME || "Your Company",
        address: process.env.EMAIL,
      },
      to: process.env.ADMIN_EMAIL,
      subject: `🎉 New Booking: ${bookingData.bookingReference} - $${templateData.totalAmount}`,
      html: emailContent,
      priority: eventDateUrgency === "urgent" ? "high" : "normal",
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

    const formattedEventDate = formatDate(bookingData.deliveryDate);
    const formattedEventTime = formatTime(bookingData.deliveryDate);
    const submittedAt = formatDateTime(bookingData.createdAt || new Date());

    // Format delivery address if available
    const deliveryAddress =
      bookingData.deliveryType === "Delivery" && bookingData.address
        ? formatAddress(bookingData.address)
        : "";

    // Format selected items HTML
    let selectedItemsHtml = "";
    if (bookingData.selectedItems && bookingData.selectedItems.length > 0) {
      selectedItemsHtml = bookingData.selectedItems
        .map((item) => `<li>${item.name} - $${formatCurrency(item.price)}</li>`)
        .join("");
    }

    // Format total amount properly
    const totalAmount = formatCurrency(bookingData.pricing?.total || 0);

    // Create delivery address section HTML if needed
    let deliveryAddressSection = "";
    if (deliveryAddress) {
      deliveryAddressSection = `
        <div class="detail-row">
          <span class="detail-label">🏠 Delivery Address:</span>
          <span class="detail-value">${deliveryAddress}</span>
        </div>
      `;
    }

    // Create selected items section HTML if needed
    let selectedItemsSection = "";
    if (selectedItemsHtml) {
      selectedItemsSection = `
        <div class="items-section">
          <div class="items-title">Selected Items:</div>
          <ul class="item-list">
            ${selectedItemsHtml}
          </ul>
        </div>
      `;
    }

    // Create special instructions section HTML if needed
    let specialInstructionsSection = "";
    if (bookingData.customerDetails?.specialInstructions) {
      specialInstructionsSection = `
        <div class="items-section">
          <div class="items-title">Special Instructions:</div>
          <div>${bookingData.customerDetails.specialInstructions}</div>
        </div>
      `;
    }

    // Create dietary requirements section HTML if needed
    let dietarySection = "";
    if (
      bookingData.customerDetails?.dietaryRequirements?.length > 0 ||
      bookingData.customerDetails?.spiceLevel
    ) {
      let dietaryContent = "";

      if (bookingData.customerDetails.dietaryRequirements?.length > 0) {
        const dietaryList = bookingData.customerDetails.dietaryRequirements
          .map(
            (req) =>
              `<li>${
                req.charAt(0).toUpperCase() + req.slice(1).replace("-", " ")
              }</li>`
          )
          .join("");

        dietaryContent += `
      <div style="margin-bottom: 10px;">
        <strong>Dietary Requirements:</strong>
        <ul style="margin: 5px 0 0 20px; padding-left: 15px;">
          ${dietaryList}
        </ul>
      </div>
    `;
      }

      if (bookingData.customerDetails.spiceLevel) {
        dietaryContent += `
      <div>
        <strong>Spice Preference:</strong> 
        ${
          bookingData.customerDetails.spiceLevel.charAt(0).toUpperCase() +
          bookingData.customerDetails.spiceLevel.slice(1)
        }
      </div>
    `;
      }

      dietarySection = `
    <div class="items-section" style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <div class="items-title" style="font-weight: 600; color: #492a00; margin-bottom: 10px;">Dietary Preferences</div>
      ${dietaryContent}
    </div>
  `;
    }

    // Create bank details section HTML if needed
    let bankDetailsSection = "";
    if (locationBankDetails) {
      bankDetailsSection = `
        <div class="bank-details">
          <h3>🏦 Payment Details</h3>
          <div class="bank-info">
            <strong>Bank Name:</strong> ${locationBankDetails.bankName}<br>
            <strong>Account Name:</strong> ${locationBankDetails.accountName}<br>
            <strong>BSB:</strong> ${locationBankDetails.bsb}<br>
            <strong>Account Number:</strong> ${locationBankDetails.accountNumber}<br>
            <strong>Reference:</strong> ${bookingData.bookingReference}
          </div>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
            Please use your booking reference <strong>${bookingData.bookingReference}</strong> when making the payment.
          </p>
        </div>
      `;
    }

    // Create custom order badge if needed
    const customOrderBadge = bookingData.isCustomOrder
      ? '<span class="custom-order-badge">Custom</span>'
      : "";

    // Prepare template data
    const templateData = {
      customerName: bookingData.customerDetails?.name || "Valued Customer",
      bookingReference: bookingData.bookingReference || "N/A",
      eventDate: formattedEventDate,
      eventTime: formattedEventTime,
      numberOfPeople: bookingData.peopleCount || "N/A",
      serviceName: bookingData.menu?.serviceName || "N/A",
      customOrderBadge: customOrderBadge,
      locationName: bookingData.menu?.locationName || "N/A",
      deliveryType: bookingData.deliveryType || "N/A",
      deliveryAddressSection: deliveryAddressSection,
      customerPhone: bookingData.customerDetails?.phone || "N/A",
      totalAmount: totalAmount,
      submittedAt: submittedAt,
      selectedItemsSection: selectedItemsSection,
      specialInstructionsSection: specialInstructionsSection,
      dietarySection: dietarySection,

      bankDetailsSection: bankDetailsSection,
      supportEmail: process.env.EMAIL,
      supportPhone: process.env.SUPPORT_PHONE || "+61 XXX XXX XXX",
      businessHours: process.env.BUSINESS_HOURS || "Mon-Fri 9:00 AM - 6:00 PM",
      companyName: process.env.COMPANY_NAME || "MC Catering Services",
      websiteUrl:
        process.env.ADMIN_DASHBOARD_URL || "https://www.mccatering.com.au",
      facebookUrl: process.env.FACEBOOK_URL || "#",
      instagramUrl: process.env.INSTAGRAM_URL || "#",
      currentYear: new Date().getFullYear().toString(),
    };

    // Start with the template
    let emailContent = CUSTOMER_BOOKING_CONFIRMATION_TEMPLATE;

    // Replace all template variables
    Object.keys(templateData).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      emailContent = emailContent.replace(regex, templateData[key] || "");
    });

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
