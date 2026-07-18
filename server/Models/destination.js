const mongoose = require("mongoose");
const { Schema } = mongoose;

const destinationSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  category: {
    type: String,
    default: "",
    trim: true,
  },
  district: {
    type: String,
    default: "",
    trim: true,
  },
  location: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  faq: [
    {
      question: { type: String, required: true },
      answer: { type: String, required: true },
    },
  ],
});

module.exports = mongoose.model("Destination", destinationSchema);
