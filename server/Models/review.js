const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 80
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxLength: 1000
  },
  visitedAt: {
    type: Date,
    required: true
  },
  helpful: [{ type: Schema.Types.ObjectId, ref: 'user' }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index: one review per user per location
reviewSchema.index({ author: 1, location: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
