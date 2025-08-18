// Admin notification email template
const ADMIN_INQUIRY_NOTIFICATION_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>New Inquiry Received</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Open Sans', Arial, sans-serif;
      background-color: #f8f9fa;
      color: #333333;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #492a00, #a4cd3d);
      padding: 30px 20px;
      text-align: center;
    }
    
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    
    .content {
      padding: 30px 20px;
    }
    
    .alert-badge {
      background-color: #a4cd3d;
      color: #ffffff;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      display: inline-block;
      margin-bottom: 20px;
    }
    
    .inquiry-details {
      background-color: #f8f9fa;
      border-left: 4px solid #a4cd3d;
      padding: 20px;
      margin: 20px 0;
    }
    
    .detail-row {
      display: flex;
      margin-bottom: 12px;
      border-bottom: 1px solid #e9ecef;
      padding-bottom: 8px;
    }
    
    .detail-label {
      font-weight: 600;
      color: #492a00;
      min-width: 140px;
      margin-right: 10px;
    }
    
    .detail-value {
      color: #333333;
      flex: 1;
    }
    
    .message-section {
      background-color: #ffffff;
      border: 2px solid #a4cd3d;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
    }
    
    .message-label {
      font-weight: 600;
      color: #492a00;
      margin-bottom: 8px;
    }
    
    .action-buttons {
      text-align: center;
      margin: 30px 0;
    }
    
    .btn {
      display: inline-block;
      padding: 12px 24px;
      margin: 0 10px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
    }
    
    .btn-primary {
      background-color: #a4cd3d;
      color: #ffffff;
    }
    
    .btn-secondary {
      background-color: #492a00;
      color: #ffffff;
    }
    
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    
    .footer p {
      margin: 0;
      color: #6c757d;
      font-size: 12px;
    }
    
    .urgent {
      color: #dc3545;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 New Inquiry Received</h1>
    </div>
    
    <div class="content">
      <span class="alert-badge">New Inquiry</span>
      
      <p>Hello Admin,</p>
      <p>A new inquiry has been submitted on your website. Please find the details below:</p>
      
      <div class="inquiry-details">
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value">{{name}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">{{email}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Contact:</span>
          <span class="detail-value">{{contact}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Event Date:</span>
          <span class="detail-value {{eventDateUrgency}}">{{eventDate}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Number of People:</span>
          <span class="detail-value">{{numberOfPeople}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Venue:</span>
          <span class="detail-value">{{venue}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Service Type:</span>
          <span class="detail-value">{{serviceType}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Submitted At:</span>
          <span class="detail-value">{{submittedAt}}</span>
        </div>
      </div>
      
      {{#if message}}
      <div class="message-section">
        <div class="message-label">Customer Message:</div>
        <div>{{message}}</div>
      </div>
      {{/if}}
      
      <div class="action-buttons">
        <a href="{{adminDashboardUrl}}" class="btn btn-primary">View in Dashboard</a>
        <a href="mailto:{{email}}" class="btn btn-secondary">Reply to Customer</a>
      </div>
    </div>
    
    <div class="footer">
      <p>This is an automated notification from your inquiry management system.</p>
      <p>Please respond to the customer within 24 hours for the best experience.</p>
    </div>
  </div>
</body>
</html>
`;

// Customer confirmation email template
const CUSTOMER_INQUIRY_CONFIRMATION_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Inquiry Confirmation</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Open Sans', Arial, sans-serif;
      background-color: #f8f9fa;
      color: #333333;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #a4cd3d, #492a00);
      padding: 40px 20px;
      text-align: center;
    }
    
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 26px;
      font-weight: 600;
    }
    
    .header p {
      color: #ffffff;
      margin: 10px 0 0 0;
      opacity: 0.9;
    }
    
    .content {
      padding: 30px 20px;
    }
    
    .success-badge {
      background-color: #a4cd3d;
      color: #ffffff;
      padding: 10px 20px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 600;
      display: inline-block;
      margin-bottom: 25px;
    }
    
    .inquiry-summary {
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
      border-radius: 8px;
      padding: 25px;
      margin: 20px 0;
      border-left: 5px solid #a4cd3d;
    }
    
    .summary-title {
      font-size: 18px;
      font-weight: 600;
      color: #492a00;
      margin-bottom: 15px;
    }
    
    .detail-row {
      display: flex;
      margin-bottom: 10px;
      align-items: center;
    }
    
    .detail-icon {
      width: 20px;
      height: 20px;
      margin-right: 10px;
      color: #a4cd3d;
    }
    
    .detail-label {
      font-weight: 600;
      color: #492a00;
      min-width: 120px;
      margin-right: 10px;
    }
    
    .detail-value {
      color: #333333;
      flex: 1;
    }
    
    .next-steps {
      background-color: #fff8dc;
      border: 2px solid #a4cd3d;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    
    .next-steps h3 {
      color: #492a00;
      margin: 0 0 15px 0;
      font-size: 16px;
    }
    
    .steps-list {
      margin: 0;
      padding-left: 20px;
    }
    
    .steps-list li {
      margin-bottom: 8px;
      color: #333333;
    }
    
    .contact-info {
      background-color: #492a00;
      color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 25px 0;
    }
    
    .contact-info h3 {
      margin: 0 0 10px 0;
      color: #a4cd3d;
    }
    
    .footer {
      background-color: #f8f9fa;
      padding: 25px 20px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    
    .footer p {
      margin: 5px 0;
      color: #6c757d;
      font-size: 12px;
    }
    
    .social-links {
      margin: 15px 0;
    }
    
    .social-links a {
      display: inline-block;
      margin: 0 5px;
      color: #a4cd3d;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Inquiry Received!</h1>
      <p>Thank you for reaching out to us</p>
    </div>
    
    <div class="content">
      <span class="success-badge">Inquiry Confirmed</span>
      
      <p>Dear <strong>{{name}}</strong>,</p>
      <p>Thank you for your inquiry! We have successfully received your request and our team will review it shortly.</p>
      
      <div class="inquiry-summary">
        <div class="summary-title">📋 Your Inquiry Details</div>
        
        <div class="detail-row">
          <span class="detail-label">📅 Event Date:</span>
          <span class="detail-value">{{eventDate}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">👥 Guests:</span>
          <span class="detail-value">{{numberOfPeople}} people</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">📍 Venue:</span>
          <span class="detail-value">{{venue}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🎉 Service:</span>
          <span class="detail-value">{{serviceType}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">📞 Contact:</span>
          <span class="detail-value">{{contact}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">⏰ Submitted:</span>
          <span class="detail-value">{{submittedAt}}</span>
        </div>
      </div>
      
      {{#if message}}
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <strong style="color: #492a00;">Your Message:</strong><br>
        <em style="color: #666;">"{{message}}"</em>
      </div>
      {{/if}}
      
      <div class="next-steps">
        <h3>🚀 What Happens Next?</h3>
        <ol class="steps-list">
          <li>Our team will review your inquiry within 24 hours</li>
          <li>We'll prepare a customized proposal based on your requirements</li>
          <li>You'll receive a detailed quote via email or phone call</li>
          <li>We'll schedule a consultation to discuss your event details</li>
        </ol>
      </div>
      
      <div class="contact-info">
        <h3>Need Immediate Assistance?</h3>
        <p>📧 Email: {{supportEmail}}</p>
        <p>📞 Phone: {{supportPhone}}</p>
        <p>🕒 Business Hours: {{businessHours}}</p>
      </div>
      
      <p style="margin-top: 30px;">We're excited to help make your event memorable! If you have any questions or need to make changes to your inquiry, please don't hesitate to contact us.</p>
      
      <p style="color: #492a00; font-weight: 600;">Best regards,<br>The {{companyName}} Team</p>
    </div>
    
    <div class="footer">
      <p>This is an automated confirmation email.</p>
      <div class="social-links">
        <a href="{{websiteUrl}}">🌐 Website</a> |
        <a href="{{facebookUrl}}">📘 Facebook</a> |
        <a href="{{instagramUrl}}">📷 Instagram</a>
      </div>
      <p>© {{currentYear}} {{companyName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = {
  ADMIN_INQUIRY_NOTIFICATION_TEMPLATE,
  CUSTOMER_INQUIRY_CONFIRMATION_TEMPLATE,
};
