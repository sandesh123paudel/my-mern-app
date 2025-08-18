const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
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

const allowedOrigins = ["http://localhost:5173"];
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: allowedOrigins }));

app.get("/", (req, res) => {
  res.send("API is working");
});

app.use("/api/inquiry", inquiryRouter);
app.use("/api/auth", authRouter);
app.use("/api/locations", locationRouter);
app.use("/api/services", serviceRouter);
app.use("/api/menuItems", menuItemRouter);
app.use("/api/menus", menuRouter);
app.use("/api/bookings", bookingRouter);

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
