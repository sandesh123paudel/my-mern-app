// Admin notification email template for inquiries
const ADMIN_INQUIRY_NOTIFICATION_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <title>New Inquiry Received</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style type="text/css">
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; }
    .email-container { max-width: 800px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; }
    .header { background-color: #a4cd3d; color: white; padding: 20px; text-align: center; }
    .logo { max-width: 150px; height: auto; }
    .header h1 { margin: 10px 0 0 0; font-size: 24px; }
    .alert-badge { background-color: #e74c3c; color: white; padding: 5px 15px; border-radius: 3px; font-size: 12px; font-weight: bold; display: inline-block; margin-top: 10px; }
    .content { padding: 30px; }
    .info-box { border: 1px solid #ddd; margin: 20px 0; }
    .box-header { background-color: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; font-weight: bold; color: #333; }
    .box-content { padding: 20px; }
    .detail-row { margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: bold; color: #555; }
    .urgent { color: #e74c3c; font-weight: bold; }
    .action-buttons { text-align: center; margin-top: 30px; }
    .btn { display: inline-block; padding: 12px 25px; margin: 5px; border-radius: 5px; text-decoration: none; color: white; }
    .btn-primary { background-color: #3F8720; }
    .btn-secondary { background-color: #777; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="https://mulchowkkitchen.com.au/catering-logo-500-x-200-px/" alt="MC Logo" class="logo">
      <h1>New Inquiry Received</h1>
      <span class="alert-badge">Action Required</span>
    </div>
    <div class="content">
      <p>A new inquiry has been submitted through the website. Please review the details below and take action.</p>
      
      <div class="info-box">
        <div class="box-header">Customer & Event Details</div>
        <div class="box-content">
          <div class="detail-row">
            <span class="detail-label">Customer Name:</span>
            <span>{{name}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Contact Email:</span>
            <span><a href="mailto:{{email}}">{{email}}</a></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Contact Phone:</span>
            <span><a href="tel:{{contact}}">{{contact}}</a></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Event Date:</span>
            <span class="{{eventDateUrgency}}">{{eventDate}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Number of Guests:</span>
            <span>{{numberOfPeople}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Venue:</span>
            <span>{{venue}}</span>
          </div>
           <div class="detail-row">
            <span class="detail-label">Submitted:</span>
            <span>{{submittedAt}}</span>
          </div>
        </div>
      </div>

      {{#if message}}
      <div class="info-box">
        <div class="box-header">Customer Message</div>
        <div class="box-content">
          <p>{{message}}</p>
        </div>
      </div>
      {{/if}}

      <div class="action-buttons">
        <a href="{{adminDashboardUrl}}" class="btn btn-primary">View in Dashboard</a>
        <a href="mailto:{{email}}" class="btn btn-secondary">Reply to Customer</a>
      </div>
    </div>

    <div class="footer">
      <p>This is an automated notification. Please respond to the customer within 24 business hours.</p>
    </div>
  </div>
</body>
</html>
`;

// Customer confirmation email template for inquiries
const CUSTOMER_INQUIRY_CONFIRMATION_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <title>Inquiry Confirmation</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style type="text/css">
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; }
    .email-container { max-width: 800px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; }
    .header { background-color: #a4cd3d; color: white; padding: 20px; text-align: center; }
    .logo { max-width: 150px; height: auto; }
    .header h1 { margin: 10px 0 0 0; font-size: 24px; }
    .content { padding: 30px; }
    .info-box { border: 1px solid #ddd; margin: 20px 0; }
    .box-header { background-color: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; font-weight: bold; color: #3F8720; }
    .box-content { padding: 20px; }
    .detail-row { margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: bold; color: #555; display: inline-block; min-width: 150px; }
    .next-steps { background-color: #e8f5e8; border: 1px solid #a4cd3d; padding: 20px; margin-top: 30px; }
    .next-steps h3 { margin: 0 0 15px 0; color: #3F8720; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    .footer a { color: #3F8720; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="https://mulchowkkitchen.com.au/catering-logo-500-x-200-px/" alt="{{companyName}} Logo" class="logo">
      <h1>We've Received Your Inquiry!</h1>
    </div>
    <div class="content">
      <p>Dear <strong>{{name}}</strong>,</p>
      <p>Thank you for reaching out to us. We have successfully received your catering inquiry and are excited about the possibility of working with you. We've included a summary of your request below for your reference.</p>
      
      <div class="info-box">
        <div class="box-header">Your Inquiry Summary</div>
        <div class="box-content">
          <div class="detail-row"><span class="detail-label">Name:</span> <span>{{name}}</span></div>
          <div class="detail-row"><span class="detail-label">Email:</span> <span>{{email}}</span></div>
          <div class="detail-row"><span class="detail-label">Phone:</span> <span>{{contact}}</span></div>
          <div class="detail-row"><span class="detail-label">Event Date:</span> <span>{{eventDate}}</span></div>
          <div class="detail-row"><span class="detail-label">Number of Guests:</span> <span>{{numberOfPeople}}</span></div>
          <div class="detail-row"><span class="detail-label">Venue:</span> <span>{{venue}}</span></div>
          <div class="detail-row"><span class="detail-label">Service Type:</span> <span>{{serviceType}}</span></div>
        </div>
      </div>

      {{#if message}}
      <div class="info-box">
        <div class="box-header">Your Message</div>
        <div class="box-content">
          <p>{{message}}</p>
        </div>
      </div>
      {{/if}}

      <div class="next-steps">
        <h3>What's Next?</h3>
        <p>Our team is now reviewing your details. We will get back to you within <strong>24 business hours</strong> with a quote or to ask for more information.</p>
        <p>If you have any urgent questions, please don't hesitate to contact us directly at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a> or call us at {{supportPhone}}.</p>
      </div>
    </div>
    <div class="footer">
      <p>&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
      <p><a href="{{websiteUrl}}">Visit Our Website</a></p>
    </div>
  </div>
</body>
</html>
`;

// Customer confirmation email template for bookings
const CUSTOMER_BOOKING_CONFIRMATION_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <title>Booking Confirmation</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style type="text/css">
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; }
    .email-container { max-width: 800px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; }
    .header { background-color: #a4cd3d; color: white; padding: 20px; text-align: center; }
    .logo { max-width: 150px; height: auto; }
    .header h1 { margin: 10px 0 0 0; font-size: 24px; }
    .content { padding: 30px; }
    .summary-box { text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; margin-bottom: 30px; }
    .summary-box .total { font-size: 28px; font-weight: bold; color: #3F8720; margin: 0 0 10px 0; }
    .summary-box .reference { font-size: 14px; color: #555; }
    .info-box { border: 1px solid #ddd; margin: 20px 0; }
    .box-header { background-color: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; font-weight: bold; color: #3F8720; }
    .box-content { padding: 20px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: bold; color: #555; }
    .payment-notice { background-color: #fef9e7; padding: 20px; border-left: 4px solid #f1c40f; margin: 20px 0; }
    .payment-notice h3 { margin: 0 0 10px 0; color: #b7791f; }
    .payment-notice p { margin: 5px 0; font-size: 16px; }
    .items-paragraph { line-height: 1.6; }
    .refund-notice {
  font-size: 12px;
  color: #dc2626;
  background-color: #fef2f2;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #fca5a5;
  margin: 16px 0;
  font-weight: 500;
  text-align: center;
  box-shadow: 0 1px 3px rgba(220, 38, 38, 0.1);
}
    .category-title { font-weight: bold; color: #3F8720; margin: 15px 0 5px 0; padding-bottom: 5px; border-bottom: 1px solid #eee; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    .footer a { color: #3F8720; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="https://mulchowkkitchen.com.au/catering-logo-500-x-200-px/" alt="{{companyName}} Logo" class="logo">
      <h1>Your Booking is Confirmed!</h1>
    </div>
    <div class="content">
      <p>Dear <strong>{{customerName}}</strong>,</p>
      <p>Thank you for your order! We're excited to be a part of your event. Please review the booking summary below.</p>

     <div class="summary-box">
  {{priceSummaryHtml}}

  <div class="reference">Booking Reference: <strong>{{bookingReference}}</strong></div>
</div>

      <div class="info-box">
        <div class="box-header">Event Details</div>
        <div class="box-content">
          <div class="detail-row"><span class="detail-label">Event Date:</span> <span>{{eventDate}}</span></div>
          <div class="detail-row"><span class="detail-label">Event Time:</span> <span>{{eventTime}}</span></div>
          <div class="detail-row"><span class="detail-label">Number of Guests:</span> <span>{{numberOfPeople}}</span></div>
          <div class="detail-row"><span class="detail-label">Service:</span> <span>{{serviceName}}</span></div>
          <div class="detail-row"><span class="detail-label">Location:</span> <span>{{locationName}}</span></div>
          {{functionVenueSection}}
          <div class="detail-row"><span class="detail-label">Delivery/Pickup:</span> <span>{{deliveryType}}</span></div>
          {{deliveryAddressSection}}
        </div>
      </div>

      {{selectedItemsSection}}
      {{specialInstructionsSection}}
      {{dietaryRequirementsSection}}

      <div class="payment-notice">
        <h3>Payment Information</h3>
        <p>Advance Due: <strong>{{advanceAmountFormatted}}</strong> (30%)</p>
        <p>Remaining Balance: <strong>{{remainingAmountFormatted}}</strong></p>
      </div>

      {{bankDetailsSection}}
      <div class="refund-notice">
  ** Deposits made are non-refundable when orders are cancelled **
</div>
      <div class="info-box" style="background-color: #fff3cd; border: 2px solid #ffc107; margin: 20px 0;">
  <div class="box-header" style="background-color: #ffc107; color: #856404; font-weight: bold;">
    📱 IMPORTANT NOTE
  </div>
  <div class="box-content" style="padding: 20px; text-align: center;">
    <p style="margin: 10px 0; font-size: 16px; font-weight: bold; color: #856404;">
      After making your advance payment, please send a screenshot of the payment confirmation to:
    </p>
    <p style="margin: 15px 0; font-size: 20px; font-weight: bold; color: #d9534f;">
      📞 0449 557 777
    </p>
    <p style="margin: 10px 0; font-size: 14px; color: #6c757d;">
      This helps us process your booking faster and ensures everything is ready for your event.
    </p>
  </div>
</div>

      <p>If you have any questions or need to make changes, please contact us as soon as possible. We look forward to serving you!</p>
      <p><strong>Best regards,<br>The {{companyName}} Team</strong></p>
    </div>

    <div class="footer">
      <p>&copy; {{currentYear}} {{companyName}}</p>
      <p><a href="{{websiteUrl}}">Visit Our Website</a></p>
    </div>
  </div>
</body>
</html>
`;

// Admin notification email template for bookings
const ADMIN_BOOKING_NOTIFICATION_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <title>New Booking Alert</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style type="text/css">
    body {
      margin: 0;
      padding: 20px;
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      color: #333;
    }
    
    .email-container {
      max-width: 800px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #ddd;
    }
    
    .header {
      background-color: #a4cd3d; /* Changed: Matched customer theme */
      color: white;
      padding: 20px;
      text-align: center;
    }
    
    .logo {
      max-width: 150px;
      height: auto;
      margin-bottom: 10px;
    }
    
    .header h1 {
      margin: 10px 0 5px 0;
      font-size: 24px;
    }
    
    .alert-badge {
      background-color: #c0392b;
      color: white;
      padding: 5px 15px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: bold;
      display: inline-block;
      margin-top: 10px;
    }
    
    .urgent-badge {
      background-color: #f39c12;
    }
    
    .content {
      padding: 30px;
    }
    
    /* Changed: Restyled revenue-box to match summary-box */
    .summary-box {
      text-align: center;
      padding: 20px;
      background-color: #f8f9fa;
      border: 1px solid #ddd;
      margin-bottom: 30px;
    }
    
    .summary-box .total {
      font-size: 28px;
      font-weight: bold;
      color: #3F8720;
      margin: 0 0 10px 0;
    }

    .summary-box .reference {
      font-size: 14px;
      color: #555;
    }
    
    .info-box {
      border: 1px solid #ddd; /* Changed: Border thickness */
      margin: 20px 0;
    }
    
    .box-header {
      background-color: #f8f9fa;
      padding: 15px;
      border-bottom: 1px solid #ddd; /* Changed: Border thickness */
      font-weight: bold;
      color: #3F8720; /* Changed: Text color */
    }
    
    .box-content {
      padding: 20px;
    }
    
    /* Changed: Using flexbox for alignment like customer email */
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .detail-row:last-child {
        border-bottom: none;
    }
    
    .detail-label {
      font-weight: bold;
      color: #555;
    }
    
    .detail-value {
      color: #333;
      text-align: right;
    }
    
    .order-badge {
      background-color: #492a00;
      color: white;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: bold;
    }
    
    .custom-badge {
      background-color: #f39c12;
    }
    
    .urgent-date {
      color: #e74c3c;
      font-weight: bold;
    }
    
    .items-paragraph {
      background-color: #f8f9fa;
      padding: 15px;
      border-left: 4px solid #a4cd3d; /* Changed: Border color */
      margin: 15px 0;
      line-height: 1.6;
    }
    
    .category-title {
      font-weight: bold;
      color: #3F8720;
      margin: 15px 0 5px 0;
      padding-bottom: 5px;
      border-bottom: 1px solid #eee;
    }
    
    .urgent-warning {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    
    .action-buttons {
      text-align: center;
      margin: 30px 0;
    }
    
    .btn {
      display: inline-block;
      padding: 12px 25px;
      margin: 0 10px;
      color: white !important; /* Ensure text is white */
      text-decoration: none;
      border: none;
      border-radius: 3px;
    }
    
    .btn-primary {
      background-color: #3F8720; /* Changed: Button color */
    }
    .btn-secondary {
      background-color: #492a00; /* Kept for variety */
    }
    
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #ddd; /* Changed: Border thickness */
      color: #666;
      font-size: 12px;
    }
    
    @media (max-width: 600px) {
      .email-container {
        margin: 10px;
        width: auto !important;
      }
      
      .content {
        padding: 20px;
      }
      
      /* Updated for flexbox on mobile */
      .detail-row {
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
      }

      .detail-value {
        text-align: left;
        margin-top: 5px;
      }
      
      .btn {
        display: block;
        margin: 10px auto;
        width: 80%;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="https://mulchowkkitchen.com.au/catering-logo-500-x-200-px/" alt="MC Logo" class="logo">
      <h1>New Booking Alert</h1>
      <span class="alert-badge {{urgentClass}}">{{urgentText}}</span>
    </div>

    <div class="content">
      <p><strong>Action Required:</strong> A new booking has been received and requires processing.</p>

      <div class="summary-box">
  {{priceSummaryHtml}}

  <div class="reference">Booking Reference: <strong>{{bookingReference}}</strong></div>
</div>

      {{urgentWarning}}

      <div class="info-box">
        <div class="box-header">Customer Information</div>
        <div class="box-content">
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value"><strong>{{customerName}}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">{{customerEmail}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">{{customerPhone}}</span>
          </div>
        </div>
      </div>

      <div class="info-box">
        <div class="box-header">Event Details</div>
        <div class="box-content">
          <div class="detail-row">
            <span class="detail-label">Order Type:</span>
            <span class="detail-value">{{orderType}} {{orderTypeBadge}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Event Date:</span>
            <span class="detail-value {{eventDateClass}}">{{eventDate}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Event Time:</span>
            <span class="detail-value">{{eventTime}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Number of Guests:</span>
            <span class="detail-value">{{numberOfPeople}} people</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Service:</span>
            <span class="detail-value">{{serviceName}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value">{{locationName}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Delivery Type:</span>
            <span class="detail-value">{{deliveryType}}</span>
          </div>
          {{functionVenueSection}}
          {{deliveryAddressSection}}
          <div class="detail-row">
            <span class="detail-label">Order Received:</span>
            <span class="detail-value">{{submittedAt}}</span>
          </div>
        </div>
      </div>

      {{selectedItemsSection}}

      {{specialInstructionsSection}}

      {{dietaryRequirementsSection}}

      <div class="action-buttons">
        <a href="{{adminDashboardUrl}}/admin/bookings" class="btn btn-primary">View in Dashboard</a>
        <a href="mailto:{{customerEmail}}?subject=Re: Booking {{bookingReference}}" class="btn btn-secondary">Email Customer</a>
        <a href="tel:{{customerPhone}}" class="btn btn-secondary">Call Customer</a>
      </div>

      <p style="text-align: center; color: #666; margin-top: 30px;">
        Please process this booking promptly to ensure customer satisfaction.
      </p>
    </div>

    <div class="footer">
      <p>{{companyName}} Admin System - {{currentYear}}</p>
      <p>Automated booking notification</p>
    </div>
  </div>
</body>
</html>


`;

module.exports = {
  ADMIN_INQUIRY_NOTIFICATION_TEMPLATE,
  CUSTOMER_INQUIRY_CONFIRMATION_TEMPLATE,
  ADMIN_BOOKING_NOTIFICATION_TEMPLATE,
  CUSTOMER_BOOKING_CONFIRMATION_TEMPLATE,
};
