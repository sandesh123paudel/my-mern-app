import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  contact: { 
    type: Number, 
    required: [true, 'Contact number is required']
  },
  eventDate: { 
    type: Date, 
    required: [true, 'Event date is required']
  },
  numberOfPeople: { 
    type: Number, 
    required: [true, 'Number of people is required'],
    min: [1, 'Number of people must be at least 1']
  },
  venue: { 
    type: String, 
    required: [true, 'Venue is required'],
    trim: true
  },
  serviceType: { 
    type: String, 
    required: [true, 'Service type is required'],
    trim: true
  },
  message: { 
    type: String,
    trim: true
  },
  status: {
    type: String,
    default: "pending",
    enum: {
      values: ["pending", "responded", "archived"],
      message: 'Status must be either pending, responded, or archived'
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving
inquirySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field before updating
inquirySchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const InquiryModel = mongoose.model("Inquiry", inquirySchema);
export default InquiryModel;