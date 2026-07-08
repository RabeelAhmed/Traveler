const Conversation = require('../Models/conversation');
const Message = require('../Models/message');
const { success, error } = require('../Utils/responseWrapper');
const { emitMessagesRead } = require('../socket');

// POST /message/conversation
const getOrCreateConversation = async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const curUserId = req.user.user_Id;

    if (!otherUserId) {
      return res.send(error(400, 'otherUserId is required'));
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [curUserId, otherUserId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [curUserId, otherUserId]
      });
    }

    // Populate participants
    await conversation.populate({
      path: 'participants',
      select: 'fullname profilePicture username'
    });

    return res.send(success(200, { conversation }));
  } catch (err) {
    console.error('getOrCreateConversation error:', err);
    return res.send(error(500, 'Something went wrong'));
  }
};

// GET /message/conversations
const getConversations = async (req, res) => {
  try {
    const curUserId = req.user.user_Id;

    const conversations = await Conversation.find({
      participants: curUserId
    })
      .populate({
        path: 'participants',
        select: 'fullname profilePicture username'
      })
      .populate({
        path: 'lastMessage'
      })
      .sort({ updatedAt: -1 });

    return res.send(success(200, { conversations }));
  } catch (err) {
    console.error('getConversations error:', err);
    return res.send(error(500, 'Something went wrong'));
  }
};

// GET /message/:conversationId
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const curUserId = req.user.user_Id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.send(error(404, 'Conversation not found'));
    }

    // Verify participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === curUserId
    );
    if (!isParticipant) {
      return res.status(403).send(error(403, 'Forbidden'));
    }

    const page = +req.query.page || 1;
    const limit = 30;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'sender',
        select: 'fullname profilePicture'
      });

    // Mark other participant's messages as read
    await Message.updateMany(
      { conversationId, sender: { $ne: curUserId }, isRead: false },
      { $set: { isRead: true } }
    );

    // Call emitMessagesRead for the other participant
    const otherUserId = conversation.participants.find(
      (p) => p.toString() !== curUserId
    );
    if (otherUserId) {
      emitMessagesRead(otherUserId, conversationId);
    }

    return res.send(success(200, { messages }));
  } catch (err) {
    console.error('getMessages error:', err);
    return res.send(error(500, 'Something went wrong'));
  }
};

// POST /message/:conversationId
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const curUserId = req.user.user_Id;

    if (!text || !text.trim()) {
      return res.send(error(400, 'Message text is required'));
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.send(error(404, 'Conversation not found'));
    }

    // Verify participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === curUserId
    );
    if (!isParticipant) {
      return res.status(403).send(error(403, 'Forbidden'));
    }

    const newMsg = await Message.create({
      conversationId,
      sender: curUserId,
      text: text.trim()
    });

    // Update conversation lastMessage & updatedAt
    conversation.lastMessage = newMsg._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    await newMsg.populate({
      path: 'sender',
      select: 'fullname profilePicture'
    });

    return res.send(success(201, { message: newMsg }));
  } catch (err) {
    console.error('sendMessage error:', err);
    return res.send(error(500, 'Something went wrong'));
  }
};

module.exports = {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage
};
