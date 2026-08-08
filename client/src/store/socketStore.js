import { create } from "zustand";
import { io } from "socket.io-client";

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
export const useSocketStore = create(function (set, get) {
  return {
    socket: null,    
    connected: false, 
    token: null,     

    connectSocket: function (userToken) {
      const oldSocket = get().socket;
      const oldToken = get().token;
      if (oldSocket?.connected && oldToken === userToken) {
        return oldSocket;
      }
      if (oldSocket) {
        oldSocket.disconnect();
      }
      const newSocket = io(SOCKET_SERVER_URL, {
        withCredentials: true,
        ...(userToken ? { auth: { token: userToken } } : {}),
      });
      newSocket.on("connect", function () {
        console.log("Socket connected, ID =", newSocket.id);
        set({ connected: true, token: userToken });
      });
      newSocket.on("disconnect", function () {
        console.log("Socket disconnected");
        set({ connected: false });
      });
      newSocket.on("connect_error", function (error) {
        console.error("⚠️ Socket connection error:", error.message);
      });
      set({ socket: newSocket, connected: false, token: userToken });

      return newSocket;
    },
    disconnectSocket: function () {
      const activeSocket = get().socket;

      if (activeSocket) {
        activeSocket.disconnect();

        set({
          socket: null,
          connected: false,
          token: null,
        });
      }
    },
    joinChat: function (chatId) {
      const activeSocket = get().socket;

      if (activeSocket?.connected && chatId) {
        activeSocket.emit("join_chat", chatId);
      }
    },
    leaveChat: function (chatId) {
      const activeSocket = get().socket;

      if (activeSocket?.connected && chatId) {
        activeSocket.emit("leave_chat", chatId);
      }
    },
    sendMessageSocket: function (chatId, content, tempId, ackCallback, attachment = null, attachments = []) {
      const activeSocket = get().socket;

      if (activeSocket?.connected) {
         activeSocket.emit(
          "send_message",
          {
            chatId: chatId,
            content: content,
            tempId: tempId,
            type: attachment?.type || "text",
            fileUrl: attachment?.fileUrl || null,
            fileName: attachment?.fileName || null,
            fileSize: attachment?.fileSize || null,
            attachments: attachments,
          },
          ackCallback
        );
        return true;  
      }

      return false; 
    },
    inviteUser: function (receiverId) {
      const activeSocket = get().socket;

      if (activeSocket?.connected) {
        activeSocket.emit("inviteUser", { receiverId: receiverId });
      } else {
        console.log("Socket not connected, cannot send invite.");
      }
    },
    markMessagesRead: function (chatId) {
      const activeSocket = get().socket;

      if (activeSocket?.connected && chatId) {
        activeSocket.emit("mark_messages_read", { chatId: chatId });
      }
    },
    
    
  };
});
