const mongoose = require('mongoose');
const { Schema } = mongoose;

const conversationSchema = new Schema({
  participantKey: { type: String },
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

conversationSchema.index({ participantKey: 1 }, { unique: true, partialFilterExpression: { participantKey: { $type: 'string' } } });
conversationSchema.index({ participants: 1, updatedAt: -1 });
conversationSchema.path("participants").validate(value => value.length === 2 && String(value[0]) !== String(value[1]), "A conversation requires two distinct participants");
module.exports = mongoose.model('Conversation', conversationSchema);
