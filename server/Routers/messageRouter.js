const router = require('express').Router();
const {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage
} = require('../Controllers/messageController');
const { verifyAuthToken } = require('../Middleware/jwtAuthMiddleware');

// Named routes first to avoid overlapping with wildcard :conversationId
router.post('/conversation', verifyAuthToken, getOrCreateConversation);
router.get('/conversations', verifyAuthToken, getConversations);
router.get('/:conversationId', verifyAuthToken, getMessages);
router.post('/:conversationId', verifyAuthToken, sendMessage);

module.exports = router;
