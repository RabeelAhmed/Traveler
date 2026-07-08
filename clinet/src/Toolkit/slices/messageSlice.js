import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosClient } from "../../utils/axiosClient";
import toast from "react-hot-toast";

export const getConversations = createAsyncThunk(
  "message/getConversations",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get("/message/conversations");
      return response.data.result.conversations;
    } catch (error) {
      toast.error("Error fetching conversations");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getOrCreateConversation = createAsyncThunk(
  "message/getOrCreateConversation",
  async (otherUserId, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("/message/conversation", { otherUserId });
      return response.data.result.conversation;
    } catch (error) {
      toast.error("Error opening conversation");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getMessages = createAsyncThunk(
  "message/getMessages",
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/message/${conversationId}`);
      return { conversationId, messages: response.data.result.messages };
    } catch (error) {
      toast.error("Error fetching messages");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  "message/sendMessage",
  async ({ conversationId, text }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(`/message/${conversationId}`, { text });
      return response.data.result.message;
    } catch (error) {
      toast.error("Error sending message");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const messageSlice = createSlice({
  name: "message",
  initialState: {
    conversations: [],
    activeConversation: null,
    messages: [],
    status: "idle",
    unreadCount: 0,
  },
  reducers: {
    receiveMessage: (state, action) => {
      const message = action.payload;
      // If the incoming message belongs to the active conversation, append it
      if (state.activeConversation && state.activeConversation._id === message.conversationId) {
        // Prevent duplicate appending
        if (!state.messages.some((m) => m._id === message._id)) {
          state.messages.push(message);
        }
      }
      
      // Update conversations list: update the matching conversation's lastMessage and bump it to top
      const convIndex = state.conversations.findIndex((c) => c._id === message.conversationId);
      if (convIndex !== -1) {
        const updatedConv = {
          ...state.conversations[convIndex],
          lastMessage: message,
          updatedAt: message.createdAt
        };
        state.conversations.splice(convIndex, 1);
        state.conversations.unshift(updatedConv);
      }
      
      // Update unread count if it's not the active conversation
      if (!state.activeConversation || state.activeConversation._id !== message.conversationId) {
        state.unreadCount += 1;
      }
    },
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },
    markConversationRead: (state, action) => {
      const conversationId = action.payload;
      const convIndex = state.conversations.findIndex((c) => c._id === conversationId);
      if (convIndex !== -1) {
        const conv = state.conversations[convIndex];
        if (conv.lastMessage && !conv.lastMessage.isRead && conv.lastMessage.sender !== state.activeConversation?.participants?.find(p => p._id === conv.lastMessage.sender)?._id) {
          conv.lastMessage.isRead = true;
        }
      }
      // Re-calculate global unread count
      state.unreadCount = state.conversations.reduce((acc, conv) => {
        const hasUnread = conv.lastMessage && !conv.lastMessage.isRead;
        return hasUnread ? acc + 1 : acc;
      }, 0);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getConversations.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
        state.status = "succeeded";
        // Calculate total unread conversations count
        state.unreadCount = action.payload.reduce((acc, conv) => {
          const hasUnread = conv.lastMessage && !conv.lastMessage.isRead;
          return hasUnread ? acc + 1 : acc;
        }, 0);
      })
      .addCase(getConversations.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(getOrCreateConversation.fulfilled, (state, action) => {
        state.activeConversation = action.payload;
        const exists = state.conversations.some((c) => c._id === action.payload._id);
        if (!exists) {
          state.conversations.unshift(action.payload);
        }
      })
      .addCase(getMessages.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.messages = action.payload.messages;
        state.status = "succeeded";
        // Mark active conversation read locally
        const convIndex = state.conversations.findIndex((c) => c._id === action.payload.conversationId);
        if (convIndex !== -1) {
          const conv = state.conversations[convIndex];
          if (conv.lastMessage) {
            conv.lastMessage.isRead = true;
          }
        }
        state.unreadCount = state.conversations.reduce((acc, conv) => {
          const hasUnread = conv.lastMessage && !conv.lastMessage.isRead;
          return hasUnread ? acc + 1 : acc;
        }, 0);
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        state.messages.push(message);
        const convIndex = state.conversations.findIndex((c) => c._id === message.conversationId);
        if (convIndex !== -1) {
          const updatedConv = {
            ...state.conversations[convIndex],
            lastMessage: message,
            updatedAt: message.createdAt
          };
          state.conversations.splice(convIndex, 1);
          state.conversations.unshift(updatedConv);
        }
      });
  },
});

export const { receiveMessage, setActiveConversation, markConversationRead } = messageSlice.actions;
export default messageSlice.reducer;
