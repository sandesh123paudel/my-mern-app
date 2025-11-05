const nodemailer = require('nodemailer');

// Working Hostinger email configuration using Titan Email SMTP
const transporter = nodemailer.createTransport({
  host: "s4045.sgp1.stableserver.net", // "mail.mccatering.com.au"
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



module.exports = transporter;
