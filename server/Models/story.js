const mongoose = require('mongoose');
const cloudinary = require("../Utils/cloudinaryConfig");

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  video: {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
    },
    resourceType: {
      type: String,
      default: 'video'
    }
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
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // Reference to the user who liked the post
    },
  ],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // Note: We manage expiration and Cloudinary deletion via a cron job
  },
});

storySchema.pre("findOneAndDelete", async function (next) {
  try {
    const doc = await this.model.findOne(this.getQuery());
    if (doc && doc.video && doc.video.publicId) {
      const { cloudinary } = require("../Utils/cloudinaryConfig");
      try {
        await cloudinary.uploader.destroy(doc.video.publicId, {
          resource_type: doc.video.resourceType || "video"
        });
        console.log(`Successfully deleted story media from Cloudinary: ${doc.video.publicId}`);
      } catch (err) {
        console.error(`Failed to delete Cloudinary asset ${doc.video.publicId} on story delete:`, err);
      }
    }
  } catch (error) {
    console.error("Error in Story findOneAndDelete middleware:", error);
  }
  next();
});

const Story = mongoose.model('Story', storySchema);
module.exports = Story;
