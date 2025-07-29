import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import inquiryRouter from "./routes/inquiryRoutes.js";

const app = express();
const port = process.env.PORT || 4000;

const allowedOrigins = ["http://localhost:5173"];
app.use(express.json());
app.use(cors({ credentials: true, origin: allowedOrigins }));

app.get("/", (req, res) => {
  res.send("API is working");
});

app.use("/api/inquiry", inquiryRouter);

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
