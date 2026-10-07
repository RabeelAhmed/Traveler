const Story = require('../Models/story');
const User = require('../Models/User');
const { cloudinary } = require('./cloudinaryConfig');
const { deleteByPattern } = require('./cache');
const cleanupExpiredStories = async () => {
  const expired = await Story.find({ createdAt: { $lte: new Date(Date.now() - 86400000) } }).limit(100);
  let deleted = 0;
  for (const story of expired) {
    try {
      if (story.video?.publicId) await cloudinary.uploader.destroy(story.video.publicId, { resource_type: story.video.resourceType || 'video' });
      // deleteOne avoids repeating media deletion in findOneAndDelete middleware.
      await User.updateMany({ stories: story._id }, { $pull: { stories: story._id } });
      await Story.deleteOne({ _id: story._id });
      deleted++;
    } catch (err) {
      // Retain the document when media deletion fails so the next run retries it.
      console.error('Story cleanup failed:', story._id.toString(), err.message);
    }
  }
  if (deleted) await deleteByPattern('v2:stories:*');
  return { deleted, pending: expired.length === 100 };
};
module.exports = { cleanupExpiredStories };
