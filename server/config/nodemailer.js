import nodemailer from 'nodemailer';

// Working Hostinger email configuration using Titan Email SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.titan.email',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ SMTP Connection Error:', error);
  } else {
    console.log('✅ SMTP Server is ready to take our messages');
    console.log('📧 Email server: smtp.titan.email');
  }
});

export default transporter;