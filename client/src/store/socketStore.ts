import { create } from "zustand";
import { io } from "socket.io-client";
import { SocketState, Attachment } from "@/types";
import { useAuthStore } from "./authStore";

function handleAuthError(get: () => SocketState, set: (state: Partial<SocketState>) => void) {
  const activeSocket = get().socket;
  if (activeSocket) activeSocket.disconnect();
  set({ connected: false, socket: null });
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,

  connectSocket: () => {
    const oldSocket = get().socket;
    if (oldSocket?.connected) {
      return oldSocket;
    }
    if (oldSocket) {
      oldSocket.disconnect();
    }

    const userToken = useAuthStore.getState().user?.token;

    const newSocket = io(SOCKET_SERVER_URL, {
      withCredentials: true,
      auth: userToken ? { token: userToken } : undefined,
    });
    newSocket.on("connect", () => {
      console.log("Socket connected, ID =", newSocket.id);
      set({ connected: true });
      newSocket.emit("get_online_users");
    });
    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      set({ connected: false });
    });
    newSocket.on("auth_error", (data: { message?: string }) => {
      console.error("Socket auth error:", data?.message);
      handleAuthError(get, set);
    });
    newSocket.on("connect_error", (error: Error) => {
      console.error("Socket connection error:", error.message);
      if (error.message && error.message.includes("UNAUTHORIZED")) {
        handleAuthError(get, set);
      }
    });
    set({ socket: newSocket, connected: false });

    return newSocket;
  },

  disconnectSocket: () => {
    const activeSocket = get().socket;

    if (activeSocket) {
      activeSocket.disconnect();

      set({
        socket: null,
        connected: false,
      });
    }
  },

  joinChat: (chatId: string) => {
    const activeSocket = get().socket;

    if (activeSocket?.connected && chatId) {
      activeSocket.emit("join_chat", chatId);
    }
  },

  leaveChat: (chatId: string) => {
    const activeSocket = get().socket;

    if (activeSocket?.connected && chatId) {
      activeSocket.emit("leave_chat", chatId);
    }
  },

  sendMessageSocket: (
    chatId: string,
    content: string,
    tempId: string,
    ackCallback?: (res: any) => void,
    attachment: Attachment | null = null,
    attachments: Attachment[] = []
  ) => {
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

  inviteUser: (receiverId: string) => {
    const activeSocket = get().socket;

    if (activeSocket?.connected) {
      activeSocket.emit("inviteUser", { receiverId: receiverId });
    } else {
      console.log("Socket not connected, cannot send invite.");
    }
  },

  markMessagesRead: (chatId: string) => {
    const activeSocket = get().socket;

    if (activeSocket?.connected && chatId) {
      activeSocket.emit("mark_messages_read", { chatId: chatId });
    }

    const authStore = useAuthStore.getState();
    const currentUserId = (authStore?.user?._id || authStore?.user?.id)?.toString();
    if (currentUserId && chatId) {
      import("./chatStore").then(({ useChatStore }) => {
        useChatStore.setState((state) => ({
          chats: state.chats.map((c) => {
            if (c._id === chatId) {
              const newUnread = { ...(c.unreadCount || {}) };
              newUnread[currentUserId] = 0;
              return { ...c, unreadCount: newUnread };
            }
            return c;
          }),
        }));
      });
    }
  },
}));
