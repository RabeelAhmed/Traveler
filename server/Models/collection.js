const mongoose = require('mongoose');
const { Schema } = mongoose;

const collectionSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 60,
  },
  description: {
    type: String,
    trim: true,
    maxLength: 200,
  },
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
  ],
  isPublic: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Collection', collectionSchema);
