const Conversation = require('../Models/conversation');
const User = require('../Models/User');
const mongoose = require('mongoose');
const Message = require('../Models/message');
const { success, error } = require('../Utils/responseWrapper');
const { emitMessagesRead, emitMessage } = require('../socket');

// POST /message/conversation
const getOrCreateConversation = async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const curUserId = req.user.user_Id;

    if (!mongoose.isValidObjectId(otherUserId) || otherUserId === curUserId || !await User.exists({ _id: otherUserId })) {
      return res.status(400).send(error(400, 'otherUserId is required'));
    }

    const participants = [curUserId, otherUserId].sort();
    const participantKey = participants.join(':');
    let conversation = await Conversation.findOne({ participants: { $all: participants } });
    if (!conversation) {
      try { conversation = await Conversation.findOneAndUpdate({ participantKey }, { $setOnInsert: { participants, participantKey } }, { upsert: true, new: true, runValidators: true }); }
      catch (err) { if (err.code !== 11000) throw err; conversation = await Conversation.findOne({ participantKey }); }
    }

    // Populate participants
    await conversation.populate({
      path: 'participants',
      select: 'fullname profilePicture username'
    });

    return res.send(success(200, { conversation }));
  } catch (err) {
    console.error('getOrCreateConversation error:', err);
    return res.status(500).send(error(500, 'Something went wrong'));
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
      .sort({ updatedAt: -1 }).limit(100);

    return res.send(success(200, { conversations }));
  } catch (err) {
    console.error('getConversations error:', err);
    return res.status(500).send(error(500, 'Something went wrong'));
  }
};

// GET /message/:conversationId
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const curUserId = req.user.user_Id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).send(error(404, 'Conversation not found'));
    }

    // Verify participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === curUserId
    );
    if (!isParticipant) {
      return res.status(403).send(error(403, 'Forbidden'));
    }

    const page = Number(req.query.page || 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000) return res.status(400).json(error(400, 'Invalid page'));
    const before = req.query.before;
    if (before && !mongoose.isValidObjectId(before)) return res.status(400).json(error(400, 'Invalid message cursor'));
    const limit = 30;

    const messages = await Message.find({ conversationId, ...(before ? { _id: { $lt: before } } : {}) })
      .sort({ _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'sender',
        select: 'fullname profilePicture'
      });

    messages.reverse();
    // Mark other participant's messages as read
    await Message.updateMany(
      { _id: { $in: messages.map(message => message._id) }, sender: { $ne: curUserId }, isRead: false },
      { $set: { isRead: true } }
    );

    // Call emitMessagesRead for the other participant
    const otherUserId = conversation.participants.find(
      (p) => p.toString() !== curUserId
    );
    if (otherUserId) {
      emitMessagesRead(otherUserId, conversationId);
    }

    return res.send(success(200, { messages, hasMore: messages.length === limit }));
  } catch (err) {
    console.error('getMessages error:', err);
    return res.status(500).send(error(500, 'Something went wrong'));
  }
};

// POST /message/:conversationId
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const curUserId = req.user.user_Id;

    if (typeof text !== "string" || !text.trim() || text.length > 1000) {
      return res.status(400).send(error(400, 'Message text is required'));
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).send(error(404, 'Conversation not found'));
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

    const recipient = conversation.participants.find(id => String(id) !== curUserId);
    if (recipient) emitMessage(recipient, newMsg);
    return res.status(201).send(success(201, { message: newMsg }));
  } catch (err) {
    console.error('sendMessage error:', err);
    return res.status(500).send(error(500, 'Something went wrong'));
  }
};

module.exports = {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage
};
