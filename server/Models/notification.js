const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  }, // Who will receive it
sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "user", 
    required: true 
}, // Who triggered the event
type: { 
    type: String, 
    enum: ["like", "follow", "comment", "Achievement", "Achivement", "journey_start", "journey_step", "journey_complete", "story_like"], 
    required: true 
}, // Notification type
post: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Post",
    default: null,
}, // Optional, for likes/comments
journey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Journey",
    default: null,
}, // Optional, for journey notifications
story: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Story",
    default: null,
}, // Optional, for story notifications
isRead: { 
    type: Boolean, 
    default: false 
}, // Check if notification is seen
createdAt: { 
    type: Date, 
    default: Date.now 
},
});

module.exports = mongoose.model("Notification", notificationSchema);

