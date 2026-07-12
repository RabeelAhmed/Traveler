const cron = require('node-cron');
const Story = require('../Models/story');
const { cloudinary } = require('./cloudinaryConfig');

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running expired stories cleanup cron job...');
  try {
    const expiredStories = await Story.find({
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    console.log(`Found ${expiredStories.length} expired stories to clean up.`);

    for (const story of expiredStories) {
      if (story.video && story.video.publicId) {
        try {
          await cloudinary.uploader.destroy(story.video.publicId, {
            resource_type: story.video.resourceType || 'video'
          });
          console.log(`Deleted expired story media from Cloudinary: ${story.video.publicId}`);
        } catch (err) {
          console.error(`Error deleting Cloudinary asset for story ${story._id}:`, err);
        }
      }
      await Story.findByIdAndDelete(story._id);
      console.log(`Deleted expired story document from database: ${story._id}`);
    }
  } catch (error) {
    console.error('Error in story cleanup cron job:', error);
  }
});
