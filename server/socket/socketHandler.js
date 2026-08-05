import { verifyToken } from "../utils/index.js";
import User from "../models/User.js";
import Chat from "../models/Conversation.js";
import Message from "../models/Message.js";

const connectedUserSockets = new Map();

export function getSocketByUserId(userId) {
  const socketIds = connectedUserSockets.get(userId.toString());

  if (!socketIds || socketIds.size === 0) {
    return null;
  }

  return {
    emit(eventName, payload) {
      socketIds.forEach((socketId) => {
        global.io?.to(socketId).emit(eventName, payload);
      });
    },
  };
}

function addUserSocket(userId, socketId) {
  const userIdString = userId.toString();

  if (!connectedUserSockets.has(userIdString)) {
    connectedUserSockets.set(userIdString, new Set());
  }

  connectedUserSockets.get(userIdString).add(socketId);
}

function removeUserSocket(userId, socketId) {
  const userIdString = userId.toString();
  const socketIds = connectedUserSockets.get(userIdString);

  if (!socketIds) return true;

  socketIds.delete(socketId);

  if (socketIds.size === 0) {
    connectedUserSockets.delete(userIdString);
    return true;
  }

  return false;
}

function isUserOnline(userId) {
  const socketIds = connectedUserSockets.get(userId.toString());

  return socketIds && socketIds.size > 0;
}
function getTokenFromCookie(cookieHeader) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");

  const authCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("Chat_token=")
  );

  if (!authCookie) return null;

  return authCookie.split("=")[1];
}

async function findChatForUser(chatId, userId) {
  if (!chatId || !userId) return null;

  return Chat.findOne({
    _id: chatId,
    "members.user": userId,
  });
}

function setUserUnreadCount(chat, userId, unreadCount) {
  if (!chat) return;

  if (chat.unreadCount && typeof chat.unreadCount.set === "function") {
    chat.unreadCount.set(userId, unreadCount);
  } else {
    if (!chat.unreadCount) {
      chat.unreadCount = {};
    }

    chat.unreadCount[userId] = unreadCount;
  }
}

function increaseUnreadCount(chat, userId) {
  if (!chat) return 0;

  let currentUnreadCount = 0;

  if (chat.unreadCount && typeof chat.unreadCount.get === "function") {
    currentUnreadCount = chat.unreadCount.get(userId) || 0;
  } else {
    currentUnreadCount = chat.unreadCount?.[userId] || 0;
  }

  const updatedUnreadCount = currentUnreadCount + 1;

  setUserUnreadCount(chat, userId, updatedUnreadCount);

  return updatedUnreadCount;
}

function notifyMessageSenders(senderIds, statusPayload) {
  senderIds.forEach((senderId) => {
    const senderSocket = getSocketByUserId(senderId);

    senderSocket?.emit("message_status_update", statusPayload);
  });
}
async function deliverPendingMessages(userId) {
  try {
    const userChats = await Chat.find({
      "members.user": userId,
      isActive: true,
    }).select("_id");

    if (userChats.length === 0) return;

    const chatIds = userChats.map((chat) => chat._id);

    const pendingMessages = await Message.find({
      chat: { $in: chatIds },
      sender: { $ne: userId },
      status: "sent",
    });

    if (pendingMessages.length === 0) return;

    const pendingMessageIds = pendingMessages.map(
      (message) => message._id
    );

    await Message.updateMany(
      {
        _id: { $in: pendingMessageIds },
      },
      {
        status: "delivered",
      }
    );
    pendingMessages.forEach((message) => {
      const senderSocket = getSocketByUserId(message.sender);

      senderSocket?.emit("message_status_update", {
        messageId: message._id,
        chatId: message.chat,
        status: "delivered",
      });
    });
  } catch (error) {
    console.error("Pending Message Sync Error:", error);
  }
}
export const socketHandler = (io) => {
  global.io = io;

  io.use((socket, next) => {
    let token = socket.handshake.auth?.token;

    if (!token) {
      token = getTokenFromCookie(socket.handshake.headers.cookie);
    }

    if (!token) {
      return next(new Error("Unauthorized access. Token missing."));
    }

    try {
      const decodedUser = verifyToken(token);

      if (!decodedUser.isVerified) {
        return next(new Error("Unauthorized. Email not verified."));
      }

      socket.user = decodedUser;

      next();
    } catch (error) {
      next(new Error("Unauthorized access. Invalid token."));
    }
  });

  io.on("connection", async (socket) => {
    const currentUserId = socket.user.id.toString();

    console.log(
      `Socket Connected: ${socket.id} (User: ${currentUserId})`
    );

    addUserSocket(currentUserId, socket.id);

    const totalActiveSockets =
      connectedUserSockets.get(currentUserId)?.size || 0;

    if (totalActiveSockets === 1) {
      await User.findByIdAndUpdate(currentUserId, {
        isOnline: true,
      });

      io.emit("user_status_changed", {
        userId: currentUserId,
        isOnline: true,
      });
    }

    socket.join(`user:${currentUserId}`);

    await deliverPendingMessages(currentUserId);
socket.on("join_chat", async (chatId) => {
  if (!chatId) return;

  try {
    const isChatMember = await Chat.exists({
      _id: chatId,
      "members.user": currentUserId,
    });

    if (!isChatMember) return;

    socket.join(`chat:${chatId}`);
  } catch (error) {
    console.error("Join Chat Error:", error);
  }
});
socket.on("mark_messages_read", async ({ chatId }) => {
  try {
    if (!chatId) return;

    const chat = await findChatForUser(chatId, currentUserId);

    if (!chat) return;

    const unreadMessages = await Message.find({
      chat: chatId,
      sender: { $ne: currentUserId },
      status: { $ne: "read" },
    });

    setUserUnreadCount(chat, currentUserId, 0);
    await chat.save();

    if (unreadMessages.length === 0) return;

    const unreadMessageIds = unreadMessages.map(
      (message) => message._id
    );

    await Message.updateMany(
      {
        _id: { $in: unreadMessageIds },
      },
      {
        $set: {
          status: "read",
        },
        $push: {
          readBy: {
            user: currentUserId,
            readAt: new Date(),
          },
        },
      }
    );

    const senderIds = new Set(
      unreadMessages.map((message) =>
        message.sender.toString()
      )
    );

    notifyMessageSenders(senderIds, {
      chatId,
      messageIds: unreadMessageIds,
      status: "read",
    });
  } catch (error) {
    console.error("Mark Read Error:", error);
  }
});

socket.on("disconnect", async () => {
  console.log(
    `Socket Disconnected: ${socket.id} (User: ${currentUserId})`
  );

  const isLastActiveSocket = removeUserSocket(
    currentUserId,
    socket.id
  );

  if (!isLastActiveSocket) return;

  try {
    const lastSeen = new Date();

    await User.findByIdAndUpdate(currentUserId, {
      isOnline: false,
      lastSeen,
    });

    io.emit("user_status_changed", {
      userId: currentUserId,
      isOnline: false,
      lastSeen,
    });
  } catch (error) {
    console.error("Disconnect Error:", error);
  }
});

socket.on("leave_chat", (chatId) => {
  if (!chatId) return;

  socket.leave(`chat:${chatId}`);
});


socket.on("send_message", async (messageData, acknowledge) => {
  try {
    const {
      chatId,
      content,
      type = "text",
      tempId,
      fileUrl = null,
      fileName = null,
      fileSize = null,
    } = messageData;

    const messageText =
      typeof content === "string" ? content.trim() : "";

    if (!chatId || (!messageText && !fileUrl)) {
      return acknowledge?.({
        success: false,
        error: "Invalid message content.",
      });
    }

    const chat = await findChatForUser(chatId, currentUserId);

    if (!chat) {
      return acknowledge?.({
        success: false,
        error: "Chat not found.",
      });
    }

    const recipientMembers = chat.members.filter(
      (member) => member.user.toString() !== currentUserId
    );

    const isAnyRecipientOnline = recipientMembers.some((member) =>
      isUserOnline(member.user)
    );

    const messageStatus = isAnyRecipientOnline
      ? "delivered"
      : "sent";

    const savedMessage = await Message.create({
      chat: chatId,
      sender: currentUserId,
      content: messageText || fileName || "Attachment",
      type,
      status: messageStatus,
      fileUrl,
      fileName,
      fileSize,
    });

    chat.lastMessage = savedMessage._id;

    recipientMembers.forEach((member) => {
      increaseUnreadCount(chat, member.user.toString());
    });

    await chat.save();

    const populatedMessage = await Message.findById(
      savedMessage._id
    ).populate("sender", "name email avatar");

    const messagePayload = {
      message: populatedMessage,
      tempId,
    };

    io.to(`chat:${chatId}`).emit(
      "receive_message",
      messagePayload
    );

    recipientMembers.forEach((member) => {
      io.to(`user:${member.user}`).emit(
        "receive_message",
        messagePayload
      );
    });

    acknowledge?.({
      success: true,
      message: populatedMessage,
      tempId,
    });
  } catch (error) {
    console.error("Send Message Error:", error);

    acknowledge?.({
      success: false,
      error: error.message,
    });
  }
});

  })}