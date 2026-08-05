import { create } from "zustand";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,
  token: null,

  connectSocket: (token) => {
    const existingSocket = get().socket;

    if (existingSocket?.connected && get().token === token) {
      return existingSocket;
    }

    if (existingSocket) {
      existingSocket.disconnect();
    }

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      ...(token ? { auth: { token } } : {}),
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      set({ connected: true, token });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      set({ connected: false });
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    set({ socket, connected: false, token });
    return socket;
  },

  disconnectSocket: () => {
    const socket = get().socket;

    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        connected: false,
        token: null,
      });
    }
  },

  joinChat: (chatId) => {
    const socket = get().socket;
    if (socket?.connected && chatId) {
      socket.emit("join_chat", chatId);
    }
  },

  leaveChat: (chatId) => {
    const socket = get().socket;
    if (socket?.connected && chatId) {
      socket.emit("leave_chat", chatId);
    }
  },

 

  sendMessageSocket: (chatId, content, tempId, ackCallback) => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.emit("send_message", { chatId, content, tempId }, ackCallback);
      return true;
    }
    return false;
  },

  inviteUser: (receiverId) => {
    const socket = get().socket;

    if (socket?.connected) {
      socket.emit("inviteUser", { receiverId });
    } else {
      console.log("Socket is not connected");
    }
  },

  markMessagesRead: (chatId) => {
    const socket = get().socket;
    if (socket?.connected && chatId) {
      socket.emit("mark_messages_read", { chatId });
    }
  },
}));