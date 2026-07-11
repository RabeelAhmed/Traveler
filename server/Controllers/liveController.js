const { liveUsers } = require('../socket');
const { success } = require('../Utils/responseWrapper');

const getLiveUsers = async (req, res) => {
  try {
    const formattedLiveUsers = Array.from(liveUsers.entries()).map(([userId, data]) => ({
      userId,
      ...data,
    }));
    return res.send(success(200, { liveUsers: formattedLiveUsers }));
  } catch (err) {
    console.error('getLiveUsers Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getLiveUsers,
};
