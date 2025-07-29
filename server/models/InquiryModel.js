import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  eventDate: { type: Date, required: true },
  numberOfPeople: { type: Number, required: true },
  venue: { type: String, required: true },
  serviceType: { type: String, required: true },
  message: { type: String },
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "confirmed", "cancelled"],
  },
  createdAt: { type: Date, default: Date.now },
});

const InquiryModel = mongoose.model("Inquiry", inquirySchema);
export default InquiryModel;
