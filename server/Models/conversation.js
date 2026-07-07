const mongoose = require('mongoose');
const { Schema } = mongoose;

const conversationSchema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  }],
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Enforce exactly 2 participants if needed, but not strictly asked.
module.exports = mongoose.model('Conversation', conversationSchema);
