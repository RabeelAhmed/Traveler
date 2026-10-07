const Notification = require('./Models/notification');
const Conversation = require('./Models/conversation');
const { authenticateToken } = require('./Middleware/jwtAuthMiddleware');
const { validCoordinates } = require('./Utils/security');
let ioInstance;
const liveUsers = new Map();
const room = id => 'user:' + String(id);
const initsocket = io => {
  ioInstance = io;
  io.use(async (socket, next) => {
    try { socket.data.user = await authenticateToken(socket.handshake.auth?.token); next(); }
    catch { next(new Error('Authentication required')); }
  });
  io.on('connection', socket => {
    const userId = String(socket.data.user.user_Id);
    socket.join(room(userId));
    const expiry = setTimeout(() => socket.disconnect(true), Math.max(0, socket.data.user.exp * 1000 - Date.now()));
    socket.on('disconnect', async () => {
      clearTimeout(expiry);
      const remaining = await io.in(room(userId)).fetchSockets();
      if (!remaining.length && liveUsers.delete(userId)) io.emit('userWentOffline', { userId });
    });
    let lastLocation = 0;
    socket.on('goLive', (payload = {}) => {
      if (!payload || typeof payload !== 'object') return;
      const { lat, lng } = payload;
      if (!validCoordinates(lat, lng)) return;
      const account = socket.data.user.account;
      const data = { userId, lat, lng, username: account.username, profilePic: account.profilePicture, lastSeen: Date.now() };
      liveUsers.set(userId, data);
      io.emit('userWentLive', data);
    });
    socket.on('updateLocation', (payload = {}) => {
      if (!payload || typeof payload !== 'object') return;
      const { lat, lng } = payload;
      if (!validCoordinates(lat, lng) || !liveUsers.has(userId) || Date.now() - lastLocation < 1000) return;
      lastLocation = Date.now();
      Object.assign(liveUsers.get(userId), { lat, lng, lastSeen: lastLocation });
      io.emit('locationUpdated', { userId, lat, lng });
    });
    socket.on('goOffline', () => {
      liveUsers.delete(userId);
      io.emit('userWentOffline', { userId });
    });
    // Messages are emitted by the REST controller only after persistence.
    let lastTyping = 0;
    for (const event of ['typing', 'stopTyping']) socket.on(event, async (payload = {}) => {
      if (!payload || typeof payload !== 'object') return;
      const { conversationId } = payload;
      if (event === 'typing' && Date.now() - lastTyping < 500) return;
      if (event === 'typing') lastTyping = Date.now();
      try {
        const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
        if (!conversation) return;
        const recipient = conversation.participants.find(id => String(id) !== userId);
        if (recipient) io.to(room(recipient)).emit(event, { conversationId, senderId: userId });
      } catch { /* Ignore invalid socket payloads. */ }
    });
  });
};
const notify = async notification => {
  if (!ioInstance) return;
  try {
    const populated = await Notification.findById(notification._id).populate('sender', 'username profilePicture');
    if (populated) ioInstance.to(room(populated.recipient)).emit('newNotification', populated);
  } catch (err) { console.error('Notification delivery failed:', err.message); }
};
const broadcastNewPost = (followers, post) => {
  if (!ioInstance) return;
  for (const id of followers) ioInstance.to(room(id)).emit('newPost', { ...post, isLikedByUser: false });
};
const emitMessagesRead = (sender, conversationId) => ioInstance?.to(room(sender)).emit('messagesRead', { conversationId });
const emitMessage = (recipient, message) => ioInstance?.to(room(recipient)).emit('newMessage', message);
const disconnectUser = id => ioInstance?.in(room(id)).disconnectSockets(true);
module.exports = { initsocket, notify, broadcastNewPost, emitMessagesRead, emitMessage, disconnectUser, liveUsers };
