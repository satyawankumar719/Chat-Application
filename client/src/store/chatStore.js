import { create } from "zustand";
import { messageApi } from "@/api/messageApi";
import { invitationApi } from "@/api/invitationApi";
import { useAuthStore } from "./authStore";
import { useSocketStore } from "./socketStore";

const PAGE_SIZE = 50;
const getCurrentUserId = () => {
  const user = useAuthStore.getState().user;
  return user?._id?.toString() || user?.id?.toString() || null;
};
const sortChats = (chats) =>
  [...chats].sort(
    (a, b) =>new Date(b.updatedAt || b.lastMessage?.createdAt || 0) -new Date(a.updatedAt || a.lastMessage?.createdAt || 0)
  );
const mergeUniqueMessages = (messages) => {
  const map = new Map();
messages.forEach((message) => {
  if (message?._id) {
      map.set(message._id, message);
    }
  });
return [...map.values()].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
};

const updateChatLastMessage = (chats, chatId, message) =>
  sortChats(
    chats.map((chat) =>
      chat._id === chatId
        ? {
            ...chat,
            lastMessage: message,
            updatedAt: message.createdAt,
          }: chat));

export const useChatStore = create((set, get) => ({
  chats: [],
  messages: [],
selectedChatId: null,
previousSelectedChatId: null,
loadingChats: false,
loadingMessages: false,
loadingMore: false,
  loadingInvitations: false,
sendingMessage: false,
page: 1,
hasMore: true,
pendingInvitations: [],
socketListenersAttached: false,
error: null,
  invitationMessage: null,
 reset: () => {
    try {
      const { selectedChatId } = get();
if (selectedChatId) {
        useSocketStore.getState().leaveChat(selectedChatId);
      }
    } catch {}
set({
      chats: [],
     messages: [],
selectedChatId: null,
      previousSelectedChatId: null,
      loadingChats: false,
      loadingMessages: false,
      loadingMore: false,
      loadingInvitations: false,
      sendingMessage: false,
page: 1,hasMore: true,
pendingInvitations: [],
socketListenersAttached: false,
error: null,
      invitationMessage: null,
    });
  },
setSelectedChatId: (chatId) => {
    const { selectedChatId } = get();
if (selectedChatId === chatId) return;
const socket = useSocketStore.getState();
if (selectedChatId) {
      socket.leaveChat(selectedChatId);
    }
set({
      selectedChatId: chatId,
      previousSelectedChatId: selectedChatId,
      messages: [],
      page: 1,
      hasMore: true,
    });
if (!chatId) return;
socket.joinChat(chatId);
get().fetchMessages(chatId);
socket.markMessagesRead(chatId);
  },
initSocketListeners: () => {
    const socket = useSocketStore.getState().socket;
if (!socket) return;
    socket.off("receive_message");
    socket.off("invitation_received");
    socket.off("invitation_accepted");
    socket.off("invitation_rejected");
    socket.off("message_status_update");
    socket.on("receive_message", get().handleIncomingMessage);
    socket.on("invitation_received", get().handleInvitationReceived);
socket.on("invitation_accepted", get().handleInvitationAccepted);
socket.on("invitation_rejected", get().handleInvitationRejected);
socket.on("message_status_update", (data = {}) => {
   const ids = data.messageIds || (data.messageId ? [data.messageId] : []);
ids.forEach((id) => get().messageStatusUpdate(id, data.status));
    });
set({
      socketListenersAttached: true,
    });
  },
fetchChats: async () => {
    set({
      loadingChats: true,
      error: null,
    });try {
      const res = await messageApi.getUserChats();
const chats = res.data?.data || res.data || [];
const currentSelectedChat = get().selectedChatId;
set({ chats: sortChats(chats),});
get().fetchPendingInvitations();

if (!currentSelectedChat && chats.length > 0) {
        const firstChatId = chats[0]._id;

        set({
          selectedChatId: firstChatId,
          messages: [],
          page: 1,
          hasMore: true,
        });
useSocketStore.getState().joinChat(firstChatId);
get().fetchMessages(firstChatId);
return;
      }
if ( currentSelectedChat &&
        !chats.some((chat) => chat._id === currentSelectedChat)
      ) { if (chats.length > 0) {
          const firstChatId = chats[0]._id;
set({
            selectedChatId: firstChatId,
            messages: [],
            page: 1,
            hasMore: true,
          });
useSocketStore.getState().joinChat(firstChatId);
get().fetchMessages(firstChatId);
} else {
          set({
            selectedChatId: null,
            messages: [],
          });
        }return;
      }if (currentSelectedChat) {
        useSocketStore
          .getState()
          .joinChat(currentSelectedChat);
      }
    } catch (err) {
      set({
        error:
          err.response?.data?.message ||
          "Unable to load chats.",
      });
    } finally {set({
        loadingChats: false,
      });
}},
fetchPendingInvitations: async () => {
    set({
      loadingInvitations: true,
      invitationMessage: null,
    });
    try {
const res =await invitationApi.getPendingInvitations();
const invitations =res.data?.data ||res.data ||[];
        set({
        pendingInvitations: invitations,
      });
} catch (err) {set({
        invitationMessage:
          err.response?.data?.message ||
          "Unable to load invitations.",});} finally {
set({
        loadingInvitations: false,
      });}},
handleInvitationReceived: (data) => {
const invitation = data?.invitation;
if (!invitation) return;
set((state) => {
const exists = state.pendingInvitations.some( (item) => item._id === invitation._id);
return { pendingInvitations: exists? state.pendingInvitations.map(
              (item) =>
                item._id === invitation._id? invitation: item): [
              invitation,
              ...state.pendingInvitations,
            ],
invitationMessage:
          `New invitation from ${
            invitation.invitedBy?.name ||
            "someone"
          }`,};});},
handleInvitationAccepted: (data) => {
const {invitation,chat,} = data || {};
set((state) => {const updatedChats =chat &&!state.chats.some((c) => c._id === chat._id )
 ? [chat,...state.chats,]: state.chats;
return { pendingInvitations:
          state.pendingInvitations.filter(
            (item) =>
              item._id !== invitation?._id
          ),
        chats:
          sortChats(updatedChats),invitationMessage:
          "Invitation accepted.", };});},
handleInvitationRejected: (data) => {const invitation =data?.invitation;
set((state) => ({pendingInvitations:state.pendingInvitations.filter((item) =>item._id !== invitation?._id),
invitationMessage:"Invitation declined.",}));},
  acceptInvitation: async (invitationId) => {
try {const res =await invitationApi.acceptInvitation(invitationId);
set((state) => ({
 pendingInvitations:
          state.pendingInvitations.filter(
            (item) =>
              item._id !== invitationId
          ),
invitationMessage:res.data?.message ||"Invitation accepted.",}));
await get().fetchChats();
return res;} catch (err) { const message = err.response?.data?.message ||"Unable to accept invitation.";
set({invitationMessage: message,});
throw err; }},
rejectInvitation: async (invitationId) => {
  try {
    const res = await invitationApi.rejectInvitation(invitationId);
    set((state) => ({
      pendingInvitations: state.pendingInvitations.filter((item) => item._id !== invitationId),
      invitationMessage: res.data?.message || "Invitation declined.",
    }));
    return res;
  } catch (err) {
    const message = err.response?.data?.message || "Unable to reject invitation.";
    set({ invitationMessage: message });
    throw err;
  }
},

fetchMessages: async (chatId, page = 1) => {
  if (!chatId) return set({ messages: [], page: 1, hasMore: true });

  page === 1 ? set({ loadingMessages: true, error: null }) : set({ loadingMore: true });

  try {
    const res = await messageApi.getChatMessages(chatId, page, PAGE_SIZE);
    const payload = res.data?.data ?? [];
    const newMessages = Array.isArray(payload) ? payload : payload.messages || [];
    const hasMore = typeof res.data?.hasMore === "boolean" ? res.data.hasMore : newMessages.length === PAGE_SIZE;

    set((state) => ({
      messages: page === 1 ? mergeUniqueMessages(newMessages) : mergeUniqueMessages([...newMessages, ...state.messages]),
      page,
      hasMore,
    }));
  } catch (err) {
    set({ error: err.response?.data?.message || "Unable to load messages." });
  } finally {
    set({ loadingMessages: false, loadingMore: false });
  }
},

loadMoreMessages: async () => {
  const { selectedChatId, page, hasMore, loadingMore } = get();
  if (!selectedChatId || !hasMore || loadingMore) return;
  await get().fetchMessages(selectedChatId, page + 1);
},

handleIncomingMessage: (data) => {
  const incomingMessage = data?.message;
  if (!incomingMessage) return;

  const { selectedChatId, chats, messages } = get();
  const currentUserId = getCurrentUserId();

  const senderId = incomingMessage.sender?._id?.toString() || incomingMessage.sender?.id?.toString();

  const isOwnMessage = senderId && currentUserId && senderId === currentUserId;
  const isSelectedChat = incomingMessage.chat === selectedChatId;

  if (isSelectedChat && !isOwnMessage) {
    useSocketStore.getState().markMessagesRead(selectedChatId);
  }

  set(() => {
    let updatedMessages = messages;

    if (isSelectedChat) {
      const existingIndex = messages.findIndex(
        (m) =>
          m._id === incomingMessage._id ||
          (m.status === "sending" &&
            m.content === incomingMessage.content &&
            m.sender?._id === incomingMessage.sender?._id)
      );

      updatedMessages =
        existingIndex !== -1
          ? messages.map((m, i) => i === existingIndex ? incomingMessage : m)
          : [...messages, incomingMessage];
    }

    return {
      messages: mergeUniqueMessages(updatedMessages),
      chats: updateChatLastMessage(chats, incomingMessage.chat, incomingMessage),
    };
  });
},

sendMessage: async (chatId, content) => {
  if (!chatId || !content?.trim()) return null;

  const currentUser = useAuthStore.getState().user;
  const currentUserId = currentUser?._id?.toString() || currentUser?.id?.toString();
  const socketStore = useSocketStore.getState();

  if (!socketStore.connected) {
    set({ error: "Socket is not connected. Please wait or refresh." });
    return null;
  }

  set({ sendingMessage: true, error: null });

  const tempId = `temp-${Date.now()}`;

  const temporaryMessage = {
    _id: tempId,
    chat: chatId,
    content: content.trim(),
    type: "text",
    status: "sending",
    createdAt: new Date().toISOString(),
    sender: {
      _id: currentUserId || "",
      id: currentUserId || "",
      name: currentUser?.name || "You",
      avatar: currentUser?.avatar || "",
    },
  };

  set((state) => ({
    messages: [...state.messages, temporaryMessage],
    chats: updateChatLastMessage(state.chats, chatId, temporaryMessage),
  }));

  try {
    const result = await new Promise((resolve) => {
      const sent = socketStore.sendMessageSocket(chatId, content.trim(), tempId, resolve);

      if (!sent) {
        setTimeout(() => resolve({ success: false, error: "Socket disconnected." }), 10000);
      }
    });

    if (!result?.success) throw new Error(result?.error || "Unable to send message.");

    const sentMessage = result.message;

    set((state) => ({
      messages: state.messages.some((m) => m._id === sentMessage._id)
        ? state.messages
        : state.messages.map((m) => m._id === tempId ? sentMessage : m),
      chats: updateChatLastMessage(state.chats, chatId, sentMessage),
    }));

    return sentMessage;
  } catch (err) {
    set((state) => ({
      messages: state.messages.filter((m) => m._id !== tempId),
      error: err.message || "Unable to send message.",
    }));
    return null;
  } finally {
    set({ sendingMessage: false });
  }
},

messageStatusUpdate: (messageId, newStatus) => {
  if (!messageId || !newStatus) return;

  set((state) => ({
    messages: state.messages.map((message) =>
      message._id === messageId || message.id === messageId
        ? { ...message, status: newStatus }
        : message
    ),
  }));
}}));