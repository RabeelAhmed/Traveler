const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require('bcrypt')


const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  fullname: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    select:false,
  },
  profilePicture: {
    publicId: {
      type: String,
      default: null, // Default value if publicId is not set
    },
    url: {
      type: String,
      default: "https://res.cloudinary.com/djiqzvcev/image/upload/v1729021294/blank-profile-picture-973460_1280_kwgltq.png", // Default profile picture URL
    },
    resourceType: {
      type: String,
      default: "image",
    },
  },
  bio: {
    type: String,
    maxLength: 300, // Optional short bio
  },
  koFiUrl: { 
    type: String,
    required: false
  },
  dateOfBirth: {
    type: Date, // Field to store date of birth
    required: true, // Change to true if you want to make it mandatory
  },
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
  ], // References to the user's posts
  stories: [
    {
      type: Schema.Types.ObjectId,
      ref: "Story",
    },
  ], // References to the user's Stories
  followers: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ], // List of followers
  following: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ], // List of following users
  badges: [
    {
      name: {
        type: String,
      },
      awardedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  savedPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  verified: {
    type: Number,
    enum: [0, 1],
    default: 0, // Set default to 0 (unverified)
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function (next) {
  if (this.isModified('fullname') || !this.slug) {
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
    
    let baseSlug = slugify(this.fullname || this.username || 'user');
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

userSchema.pre('save',async function (next){
  const user = this;
  if(!user.isModified('password')){
      return next();
  }
  try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(user.password, salt);
      user.password = hash;
      next();
  } catch (error) {
      next(error);
  }
  
})

userSchema.methods.comparePassword = async function(candidatePassword){
  try {
      const isValid = await bcrypt.compare(candidatePassword, this.password);
      return isValid;
  } catch (error) {
      throw error
  }
}

module.exports = mongoose.model('user', userSchema);
