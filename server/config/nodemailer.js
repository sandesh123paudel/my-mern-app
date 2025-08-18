const nodemailer = require('nodemailer');

// Working Hostinger email configuration using Titan Email SMTP
const transporter = nodemailer.createTransport({
  host: "s4045.sgp1.stableserver.net",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
  pool: true,          // enable pooled connections
  maxConnections: 5,   // keep up to 5 open
  maxMessages: 100,    // reuse connection for 100 emails
});


// Verify connection on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ SMTP Connection Error:", error);
  } else {
    console.log("✅ SMTP Server is ready to take our messages");
    console.log("📧 Email server: s4045.sgp1.stableserver.net");
  }
 
});

module.exports = transporter;
