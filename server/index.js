const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv/config");
const inquiryRouter = require("./routes/inquiryRoutes.js");
const authRouter = require("./routes/authRoutes.js");
const cookieParser = require("cookie-parser");
const locationRouter = require("./routes/locationRoutes.js");
const serviceRouter = require("./routes/serviceRoutes.js");
const menuItemRouter = require("./routes/menuItemRoutes.js");
const menuRouter = require("./routes/menuRoutes.js");
const bookingRouter = require("./routes/bookingRoutes.js");

const app = express();
const port = process.env.PORT || 4000;

// Updated CORS for production
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.CLIENT_URL || "https://yourdomain.com"] 
  : ["http://localhost:5173"];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: allowedOrigins }));

// API routes (keep these before static file serving)
app.use("/api/inquiry", inquiryRouter);
app.use("/api/auth", authRouter);
app.use("/api/locations", locationRouter);
app.use("/api/services", serviceRouter);
app.use("/api/menuItems", menuItemRouter);
app.use("/api/menus", menuRouter);
app.use("/api/bookings", bookingRouter);

// Serve static files from Vite build in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the dist folder
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Handle React Router - send all non-API requests to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // Development route
  app.get("/", (req, res) => {
    res.send("API is working");
  });
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("DB Connected");
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });