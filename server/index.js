const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const inquiryRoutes = require("./routes/inquiryRoutes");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", inquiryRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("MongoDB connected");
  app.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`)
  );
}).catch(err => console.error("MongoDB connection error:", err));
