const mongoose = require("mongoose");
const { Schema } = mongoose;

const journeySchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: "user",
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
  collaborators: [{ type: Schema.Types.ObjectId, ref: 'user' }],
  pendingInvites: [{ type: Schema.Types.ObjectId, ref: 'user' }],
  maxCollaborators: { type: Number, default: 5 },
});

journeySchema.pre("save", async function (next) {
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

    let baseSlug = slugify(this.title || "journey");
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

module.exports = mongoose.model("Journey", journeySchema);
