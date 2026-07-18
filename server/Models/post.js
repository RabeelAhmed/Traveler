const mongoose = require("mongoose");
const { Schema } = mongoose;

const postSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user", // Reference to the user who made the post
    required: true,
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String, // Could be city, country, or detailed place name
    required: true,
  },
  hashtags: {
    type: [String], // Array of strings for hashtags
    validate: {
      validator: function (v) {
        // Ensure there are no more than 5 hashtags
        const validHashtags = v.every(tag => typeof tag === 'string' && tag.startsWith('#'));
        return v.length <= 5 && validHashtags; // No more than 5 hashtags and all should start with #
      },
      message: "You can add up to 5 hashtags only!",
    },
  },
  postingDate: {
    type: Date,
    default: Date.now, // Automatically sets the current date when a post is created
  },
  rating: {
    type: Number, // A number rating for the visited location
    min: 1,
    max: 5,
    required: function() {
      return !this.journeyId; // Required for standalone posts, optional for journeys
    },
  },
  media: [
    {
      url: {
        type: String,
        required: true, // Media URLs (images/videos)
      },
      publicId: {
        type: String, // If using a media storage service like Cloudinary
      },
      resourceType: {
        type: String, // 'image' or 'video'
        default: 'image'
      }
    },
  ],
  tags: [
    {
      type: Schema.Types.ObjectId,
      ref: "user", // Reference to users tagged in the post
    },
  ],
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: "user", // Reference to the user who liked the post
    },
  ],
  journeyId: {
    type: Schema.Types.ObjectId,
    ref: "Journey",
  },
  stepIndex: {
    type: Number,
  },
  comments: [
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "user", // Reference to the user who commented
        required: true,
      },
      commentText: {
        type: String,
        required: true,
      },
      commentedAt: {
        type: Date,
        default: Date.now, // Timestamp for the comment
      },
    },
  ],
});

postSchema.pre("save", async function (next) {
  if (this.isModified("title") || !this.slug) {
    const slugify = (text) => {
      if (!text) return "";
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
    };

    let baseSlug = slugify(this.title || "post");
    let uniqueSlug = baseSlug;
    let count = 1;
    while (true) {
      const existing = await this.constructor.findOne({ slug: uniqueSlug, _id: { $ne: this._id } });
      if (!existing) {
        break;
      }
      uniqueSlug = `${baseSlug}-${count}`;
      count++;
    }
    this.slug = uniqueSlug;
  }
  next();
});

postSchema.pre("findOneAndDelete", async function (next) {
  try {
    const doc = await this.model.findOne(this.getQuery());
    if (doc && doc.media && doc.media.length > 0) {
      const { cloudinary } = require("../Utils/cloudinaryConfig");
      for (const item of doc.media) {
        if (item.publicId) {
          try {
            await cloudinary.uploader.destroy(item.publicId, { resource_type: item.resourceType || "image" });
            console.log(`Successfully deleted post media from Cloudinary: ${item.publicId}`);
          } catch (err) {
            console.error(`Failed to delete Cloudinary asset ${item.publicId} on post delete:`, err);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in Post findOneAndDelete middleware:", error);
  }
  next();
});

module.exports = mongoose.model("Post", postSchema);
