const cron = require('node-cron');
const { cleanupExpiredStories } = require('./storyCleanup');

// Run every hour
if (!process.env.VERCEL) cron.schedule('0 * * * *', async () => {
  console.log('Running expired stories cleanup cron job...');
  try {
    console.log(await cleanupExpiredStories());
  } catch (error) {
    console.error('Error in story cleanup cron job:', error);
  }
});
