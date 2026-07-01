const mongoose = require("mongoose");
const { Schema } = mongoose;

const journeySchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  steps: [
    {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("Journey", journeySchema);
