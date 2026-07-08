import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend, FiMessageSquare, FiInfo, FiChevronLeft } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

import { getConversations, getMessages, sendMessage, setActiveConversation, markConversationRead } from "../Toolkit/slices/messageSlice";
import { useSocket } from "../context/SocketContext";
import ProfileImage from "../Components/ProfileImage";
import Header from "../Components/Header";
import PageTransition from "../Components/PageTransition";
import { staggerContainer, fadeUp, springPress, scaleIn } from "../utils/motion";

const Messages = () => {
  const dispatch = useDispatch();
  const socket = useSocket();
  
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const curUserId = myProfile?._id;
  
  const { conversations, activeConversation, messages, status } = useSelector((state) => state.message);

  const [text, setText] = useState("");
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [mobileView, setMobileView] = useState("list"); // "list" | "chat"

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    dispatch(getConversations());
  }, [dispatch]);

  // Load messages automatically when activeConversation changes
  useEffect(() => {
    if (activeConversation?._id) {
      dispatch(getMessages(activeConversation._id)).then(() => {
        dispatch(markConversationRead(activeConversation._id));
      });
      setMobileView("chat");
    }
  }, [activeConversation?._id, dispatch]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOtherTyping]);

  // Helper to safely get the other participant's ID
  const getOtherParticipantId = () => {
    if (!activeConversation || !curUserId) return null;
    const other = activeConversation.participants.find((p) => {
      const pId = p?._id || p;
      return pId?.toString() !== curUserId?.toString();
    });
    return (other?._id || other)?.toString();
  };

  // Handle socket events for typing indicator
  useEffect(() => {
    if (!socket || !activeConversation || !curUserId) return;

    const otherParticipantId = getOtherParticipantId();

    const handleTyping = ({ conversationId, senderId }) => {
      if (conversationId === activeConversation._id && senderId?.toString() === otherParticipantId) {
        setIsOtherTyping(true);
        // Fallback timeout in case we miss stopTyping
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsOtherTyping(false);
        }, 3000);
      }
    };

    const handleStopTyping = ({ conversationId }) => {
      if (conversationId === activeConversation._id) {
        setIsOtherTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    };

    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, activeConversation, curUserId]);

  const selectConversation = (conv) => {
    dispatch(setActiveConversation(conv));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConversation) return;

    const currentText = text.trim();
    setText("");

    const otherParticipantId = getOtherParticipantId();
    if (otherParticipantId) {
      socket?.emit("stopTyping", { conversationId: activeConversation._id, recipientId: otherParticipantId });
    }

    try {
      const response = await dispatch(
        sendMessage({ conversationId: activeConversation._id, text: currentText })
      ).unwrap();

      // Emit sendMessage socket event
      if (otherParticipantId) {
        socket?.emit("sendMessage", {
          recipientId: otherParticipantId,
          message: response,
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Typing event emits
  const handleInputChange = (e) => {
    setText(e.target.value);

    if (!socket || !activeConversation) return;
    const otherParticipantId = getOtherParticipantId();
    if (!otherParticipantId) return;

    if (e.target.value.trim().length > 0) {
      socket.emit("typing", { conversationId: activeConversation._id, recipientId: otherParticipantId });
    } else {
      socket.emit("stopTyping", { conversationId: activeConversation._id, recipientId: otherParticipantId });
    }
  };

  return (
    <PageTransition>
      <div className="bg-sand-50 h-screen overflow-hidden pt-20 pb-24 md:pb-6 flex flex-col">
        <Header
          title="Direct Messages"
          subtitle="Chat with other travelers and coordinate journeys in real time."
        />

        <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 flex-1 flex gap-4 md:gap-6 mt-4 items-stretch overflow-hidden">
          {/* Conversation List Column */}
          <div className={`w-full md:w-[320px] md:flex-shrink-0 bg-white border border-sand-150 rounded-[32px] p-5 shadow-[0_8px_30px_rgb(20,41,57,0.02)] flex flex-col md:flex ${
            mobileView === "chat" ? "hidden md:flex" : "flex"
          }`}>
            <h3 className="font-display font-extrabold text-sm text-sand-800 mb-4 px-2">Conversations</h3>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {status === "loading" && conversations.length === 0 ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 bg-sand-100/50 rounded-2xl animate-pulse" />
                ))
              ) : conversations.length > 0 ? (
                <motion.div
                  variants={staggerContainer(0.05, 0.03)}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  {conversations.map((conv) => {
                    const otherUser = conv.participants.find((p) => p._id !== curUserId);
                    if (!otherUser) return null;

                    const isActive = activeConversation?._id === conv._id;
                    const lastMsg = conv.lastMessage;
                    const isUnread = lastMsg && !lastMsg.isRead && lastMsg.sender !== curUserId;

                    return (
                      <motion.div
                        key={conv._id}
                        variants={fadeUp}
                        onClick={() => selectConversation(conv)}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                          isActive
                            ? "bg-ocean-50/50 border-ocean-200/50 shadow-sm"
                            : "bg-white border-transparent hover:bg-sand-50/50 hover:border-sand-150"
                        }`}
                      >
                        <div className="border border-sand-100 rounded-full p-0.5 flex-shrink-0 bg-white">
                          <ProfileImage
                            userProfileImage={otherUser.profilePicture?.url}
                            userId={otherUser._id}
                          />
                        </div>

                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-sand-800 truncate">
                              {otherUser.fullname}
                            </p>
                            {lastMsg && (
                              <span className="text-[9px] font-medium text-sand-400">
                                {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })}
                              </span>
                            )}
                          </div>
                          
                          <p className={`text-[11px] truncate mt-0.5 ${isUnread ? "text-ocean-600 font-extrabold" : "text-sand-500"}`}>
                            {lastMsg ? lastMsg.text : "No messages yet"}
                          </p>
                        </div>

                        {isUnread && (
                          <div className="w-2 h-2 rounded-full bg-jade-500 flex-shrink-0 animate-pulse shadow-sm shadow-jade-300" />
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FiMessageSquare className="text-sand-300 text-3xl mb-2" />
                  <p className="text-xs font-bold text-sand-500">No chats started yet</p>
                  <p className="text-[10px] text-sand-400 mt-1 max-w-[180px] leading-relaxed">
                    Visit another traveler's profile page and hit the Message button to start chatting.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Active Chat Panel Column */}
          <div className={`flex-1 bg-white border border-sand-150 rounded-[32px] shadow-[0_8px_30px_rgb(20,41,57,0.02)] flex flex-col overflow-hidden relative ${
            mobileView === "list" ? "hidden md:flex" : "flex"
          }`}>
            {activeConversation ? (
              <>
                {/* Chat Panel Header */}
                <div className="p-4 border-b border-sand-100 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setMobileView("list")}
                      className="p-1.5 rounded-xl bg-sand-50 hover:bg-sand-100 text-sand-600 md:hidden transition-colors"
                    >
                      <FiChevronLeft className="text-lg" />
                    </button>
                    
                    {/* Other User Avatar */}
                    {(() => {
                      const other = activeConversation.participants.find((p) => p._id !== curUserId);
                      return (
                        <>
                          <div className="border border-sand-100 rounded-full p-0.5 bg-white">
                            <ProfileImage
                              userProfileImage={other?.profilePicture?.url}
                              userId={other?._id}
                            />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-sand-800 leading-none">{other?.fullname}</p>
                            <p className="text-[9px] font-medium text-sand-400 mt-1">@{other?.username}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="p-2 text-sand-400 hover:text-sand-600 cursor-pointer transition-colors">
                    <FiInfo className="text-base" />
                  </div>
                </div>

                {/* Messages List Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-sand-50/20 custom-scrollbar flex flex-col">
                  {status === "loading" && messages.length === 0 ? (
                    /* Shimmer bubble loading skeleton */
                    Array.from({ length: 5 }).map((_, i) => {
                      const isRight = i % 2 === 0;
                      return (
                        <div
                          key={i}
                          className={`w-2/3 h-12 bg-sand-100/60 rounded-2xl animate-pulse ${
                            isRight ? "self-end" : "self-start"
                          }`}
                        />
                      );
                    })
                  ) : messages.length > 0 ? (
                    messages.map((msg) => {
                      const isMe = msg.sender?._id === curUserId || msg.sender === curUserId;
                      return (
                        <div
                          key={msg._id}
                          className={`flex flex-col max-w-[75%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                        >
                          <div
                            className={`px-4 py-2.5 text-xs md:text-sm font-medium leading-relaxed ${
                              isMe
                                ? "bg-ocean-600 text-white rounded-3xl rounded-br-sm text-left shadow-sm"
                                : "bg-white border border-sand-150 text-sand-800 rounded-3xl rounded-bl-sm text-left shadow-sm"
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[9px] font-bold text-sand-400 mt-1 px-1.5">
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
                      <p className="text-xs font-semibold text-sand-500">Wave to start the conversation! 👋</p>
                    </div>
                  )}

                  {/* Typing Indicator Bubble */}
                  {isOtherTyping && (
                    <div className="self-start flex flex-col items-start max-w-[70%]">
                      <div className="px-4 py-3 bg-white border border-sand-150 text-sand-600 rounded-3xl rounded-bl-sm flex items-center gap-1.5 shadow-sm">
                        <motion.span
                          animate={{ scale: [0.7, 1.2, 0.7] }}
                          transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                          className="w-1.5 h-1.5 bg-sand-400 rounded-full"
                        />
                        <motion.span
                          animate={{ scale: [0.7, 1.2, 0.7] }}
                          transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                          className="w-1.5 h-1.5 bg-sand-400 rounded-full"
                        />
                        <motion.span
                          animate={{ scale: [0.7, 1.2, 0.7] }}
                          transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                          className="w-1.5 h-1.5 bg-sand-400 rounded-full"
                        />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Text Form Area */}
                <form
                  onSubmit={handleSend}
                  className="p-4 bg-white border-t border-sand-100 flex items-center gap-3 sticky bottom-0 z-10"
                >
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={text}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-3 bg-sand-50 border border-sand-200 rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:bg-white text-sand-800 placeholder:text-sand-400 transition-all"
                  />
                  
                  <motion.button
                    {...springPress}
                    type="submit"
                    disabled={!text.trim()}
                    className={`p-3 rounded-2xl flex items-center justify-center transition-colors text-white ${
                      text.trim()
                        ? "bg-ocean-600 hover:bg-ocean-700 shadow-md shadow-ocean-500/10 cursor-pointer"
                        : "bg-sand-200 cursor-not-allowed"
                    }`}
                  >
                    <FiSend className="text-base" />
                  </motion.button>
                </form>
              </>
            ) : (
              /* No Active Chat Selected Screen */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-sand-50/10">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-ocean-50 to-sand-100/80 border border-ocean-100 flex items-center justify-center shadow-lg relative mb-4">
                  <FiMessageSquare className="text-ocean-400 text-3xl animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-400 animate-bounce" />
                </div>
                
                <h3 className="font-display font-extrabold text-base text-sand-800">
                  Inbox
                </h3>
                <p className="font-sans text-xs text-sand-400 mt-2 max-w-xs leading-relaxed">
                  Select a conversation from the sidebar list to start exchanging messages.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Messages;
