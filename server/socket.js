const Notification = require('./Models/notification');
let ioInstance;
let onlineUsers = new Map();
// Reverse lookup: find userId from socket.id
const getUserIdBySocketId = (socketId) => {
    for (const [uid, sid] of onlineUsers) { if (sid === socketId) return uid; }
    return null;
};

const initsocket = (io) => {
    ioInstance = io;
    io.on('connection',(socket)=>{
        console.log('connected',socket.id)
        socket.on("join",(userId)=>{
            onlineUsers.set(userId,socket.id);
            console.log(`User ${userId} is online.`);
        })
        socket.on("disconnect",()=>{
            for(let [key,value] of onlineUsers ){
                if(value === socket.id){
                    onlineUsers.delete(key)
                    break;
                }
            }
            console.log('User disconnected:', socket.id);
        })

        // Direct Messaging Events
        socket.on('sendMessage', ({ recipientId, message }) => {
            if (!recipientId) return;
            const recipientSocketId = onlineUsers.get(recipientId.toString());
            if (recipientSocketId) {
                ioInstance.to(recipientSocketId).emit('newMessage', message);
            }
        });

        socket.on('typing', ({ conversationId, recipientId }) => {
            if (!recipientId) return;
            const recipientSocketId = onlineUsers.get(recipientId.toString());
            const senderId = getUserIdBySocketId(socket.id);
            if (recipientSocketId) {
                ioInstance.to(recipientSocketId).emit('typing', { conversationId, senderId });
            }
        });

        socket.on('stopTyping', ({ conversationId, recipientId }) => {
            if (!recipientId) return;
            const recipientSocketId = onlineUsers.get(recipientId.toString());
            if (recipientSocketId) {
                ioInstance.to(recipientSocketId).emit('stopTyping', { conversationId });
            }
        });
    })
}

const notify = async(notification) => {
    if(!ioInstance){
        return;
    }
    try {
        // Fetch the notification with populated data
        const populatedNotification = await Notification.findById(notification._id)
            .populate("sender", "username profilePicture") // Populate recipient with selected fields
            .exec();
        if (!populatedNotification) {
            console.error("Notification not found");
            return;
        }
        console.log(populatedNotification.recipient.toString());
        const recipientSocketId = onlineUsers.get(populatedNotification.recipient.toString());
        console.log(onlineUsers);
        if (recipientSocketId) {
            ioInstance.to(recipientSocketId).emit("newNotification", populatedNotification);
            console.log(populatedNotification.type)
        }
    } catch (error) {
        console.error("Error populating notification:", error);
    }
};

/**
 * Broadcast a newly created post to all online followers of the post owner.
 * @param {string[]} followerIds  - array of follower userId strings
 * @param {object}   mappedPost   - already mapPostOutput()-ed post object
 */
const broadcastNewPost = (followerIds, mappedPost) => {
    if (!ioInstance) return;
    for (const followerId of followerIds) {
        const socketId = onlineUsers.get(followerId.toString());
        if (socketId) {
            ioInstance.to(socketId).emit("newPost", mappedPost);
        }
    }
};

module.exports = {initsocket, notify, broadcastNewPost}