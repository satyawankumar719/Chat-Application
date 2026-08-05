import { verifyToken } from "../utils/index.js";
import User from "../models/User.js";
import Chat from "../models/Conversation.js";
import Message from "../models/Message.js";

const userSocketsMap = new Map();

export const getSocketByUserId = (userId) => {
  const sockets = userSocketsMap.get(userId.toString());

  if (!sockets || sockets.size === 0) return null;

  return {
    emit: (event, data) => {
      sockets.forEach((socketId) => {
        global.io?.to(socketId).emit(event, data);
      });
    },
  };
};

const addUserSocket = (userId, socketId) => {
  const id = userId.toString();

  if (!userSocketsMap.has(id)) {
    userSocketsMap.set(id, new Set());
  }

  userSocketsMap.get(id).add(socketId);
};

const removeUserSocket = (userId, socketId) => {
  const id = userId.toString();
  const sockets = userSocketsMap.get(id);

  if (!sockets) return true;

  sockets.delete(socketId);

  if (sockets.size === 0) {
    userSocketsMap.delete(id);
    return true;
  }

  return false;
};

const isUserOnline = (userId) => {
  const sockets = userSocketsMap.get(userId.toString());

  return sockets && sockets.size > 0;
};

const socketHandler = (io) => {
  global.io = io;

  io.use((socket, next) => {
    let token = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers.cookie) {
      const cookies = socket.handshake.headers.cookie.split(";");

      const tokenCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("Chat_token=")
      );

      if (tokenCookie) {
        token = tokenCookie.split("=")[1];
      }
    }

    if (!token) {
      return next(new Error("Unauthorized access. Token missing."));
    }

    try {
      const decoded = verifyToken(token);

      if (!decoded.isVerified) {
        return next(new Error("Unauthorized. Email not verified."));
      }

      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error("Unauthorized access. Invalid token."));
    }
  });
  io.on("connection", async (socket) => {
    const userId = socket.user.id.toString();

    console.log(`Socket Connected : ${socket.id}`);

    addUserSocket(userId, socket.id);

    if (userSocketsMap.get(userId)?.size === 1) {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
      });

      io.emit("user_status_changed", {
        userId,
        isOnline: true,
      });
    }

    socket.join(`user:${userId}`);

    try {
      const chats = await Chat.find({
        "members.user": userId,
        isActive: true,
      }).select("_id");

      const chatIds = chats.map((chat) => chat._id);

      const pendingMessages = await Message.find({
        chat: { $in: chatIds },
        sender: { $ne: userId },
        status: "sent",
      });

      if (pendingMessages.length) {
        const ids = pendingMessages.map((msg) => msg._id);

        await Message.updateMany(
          { _id: { $in: ids } },
          {
            status: "delivered",
          }
        );

        pendingMessages.forEach((msg) => {
          const sender = getSocketByUserId(msg.sender);

          sender?.emit("message_status_update", {
            messageId: msg._id,
            chatId: msg.chat,
            status: "delivered",
          });
        });
      }
    } catch (error) {
      console.error("Pending message sync error:", error);
    }
    socket.on("join_chat", async (chatId) => {
      if (!chatId) return;

      try {
        const exists = await Chat.exists({
          _id: chatId,
          "members.user": userId,
        });

        if (!exists) return;

        socket.join(`chat:${chatId}`);
      } catch (error) {
        console.error("Join Chat Error:", error);
      }
    });

    socket.on("leave_chat", (chatId) => {
      if (!chatId) return;

      socket.leave(`chat:${chatId}`);
    });

   
    socket.on("send_message", async (data, ackCallback) => {
      try {
        const {
          chatId,
          content,
          type = "text",
          tempId,
        } = data;

        if (!chatId || !content?.trim()) {
          return ackCallback?.({
            success: false,
            error: "Invalid message content.",
          });
        }

        const chat = await Chat.findOne({
          _id: chatId,
          "members.user": userId,
        });

        if (!chat) {
          return ackCallback?.({
            success: false,
            error: "Chat not found.",
          });
        }

        const recipients = chat.members.filter(
          (member) => member.user.toString() !== userId
        );
        const isRecipientOnline = recipients.some((member) =>
          isUserOnline(member.user)
        );

        const messageStatus = isRecipientOnline
          ? "delivered"
          : "sent";

        const newMessage = await Message.create({
          chat: chatId,
          sender: userId,
          content: content.trim(),
          type,
          status: messageStatus,
        });

        // Update last message
        chat.lastMessage = newMessage._id;

        // Increase unread count of recipients
        recipients.forEach((member) => {
          const recipientId = member.user.toString();

          if (
            chat.unreadCount &&
            typeof chat.unreadCount.set === "function"
          ) {
            const current =
              chat.unreadCount.get(recipientId) || 0;

            chat.unreadCount.set(
              recipientId,
              current + 1
            );
          } else {
            if (!chat.unreadCount) {
              chat.unreadCount = {};
            }

            chat.unreadCount[recipientId] =
              (chat.unreadCount[recipientId] || 0) + 1;
          }
        });

        await chat.save();

        // Populate sender info
        const populatedMessage = await Message.findById(
          newMessage._id
        ).populate(
          "sender",
          "name email avatar"
        );

        // Send message to everyone inside chat room
        io.to(`chat:${chatId}`).emit(
          "receive_message",
          {
            message: populatedMessage,
            tempId,
          }
        );

        // Send notification to users
        recipients.forEach((member) => {
          io.to(`user:${member.user}`).emit(
            "receive_message",
            {
              message: populatedMessage,
              tempId,
            }
          );
        });

        // Acknowledge sender
        ackCallback?.({
          success: true,
          message: populatedMessage,
          tempId,
        });
      } catch (error) {
        console.error(
          "Send Message Error:",
          error
        );

        ackCallback?.({
          success: false,
          error: error.message,
        });
      }
    });

  
    socket.on("mark_messages_read", async ({ chatId }) => {
      try {
        if (!chatId) return;

      
        const chat = await Chat.findOne({
          _id: chatId,
          "members.user": userId,
        });

        if (!chat) return;

        const unreadMessages = await Message.find({
          chat: chatId,
          sender: { $ne: userId },
          status: { $ne: "read" },
        });

        if (chat.unreadCount) {
          if (typeof chat.unreadCount.set === "function") {
            chat.unreadCount.set(userId, 0);
          } else {
            chat.unreadCount[userId] = 0;
          }
        } else {
          chat.unreadCount = {
            [userId]: 0,
          };
        }

        await chat.save();

        if (!unreadMessages.length) return;

        const unreadIds = unreadMessages.map(
          (message) => message._id
        );

        await Message.updateMany(
          {
            _id: { $in: unreadIds },
          },
          {
            $set: {
              status: "read",
            },
            $push: {
              readBy: {
                user: userId,
                readAt: new Date(),
              },
            },
          }
        );

        const senders = [
          ...new Set(
            unreadMessages.map((msg) =>
              msg.sender.toString()
            )
          ),
        ];

        senders.forEach((senderId) => {
          getSocketByUserId(senderId)?.emit(
            "message_status_update",
            {
              chatId,
              messageIds: unreadIds,
              status: "read",
            }
          );
        });
      } catch (error) {
        console.error(
          "Mark Read Error:",
          error
        );
      }
    });

    socket.on("disconnect", async () => {
      console.log(
        `Socket Disconnected : ${socket.id}`
      );

      // Remove socket
      const isLastSocket = removeUserSocket(
        userId,
        socket.id
      );
      if (!isLastSocket) return;

      try {
        const lastSeen = new Date();

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen,
        });

        io.emit("user_status_changed", {
          userId,
          isOnline: false,
          lastSeen,
        });
      } catch (error) {
        console.error(
          "Disconnect Error:",
          error
        );
      }
    });
  });
};

export default socketHandler;