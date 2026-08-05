import { create } from "zustand";
import { messageApi } from "@/api/messageApi";
import { invitationApi } from "@/api/invitationApi";
import { useAuthStore } from "./authStore";
import { useSocketStore } from "./socketStore";
import { createTempMessage } from "@/lib/messageHelpers";

const PAGE_SIZE = 50;
function getCurrentUserId() {
  const user = useAuthStore.getState().user;
  const idFromdb = user?._id?.toString();
  const idFromField = user?.id?.toString();
  return idFromdb || idFromField || null;
}
function sortChatsByRecent(chatsArray) {
  const copy = [...chatsArray];

  copy.sort(function (chatA, chatB) {
    const timeA = new Date(chatA.updatedAt || chatA.lastMessage?.createdAt || 0).getTime();
    const timeB = new Date(chatB.updatedAt || chatB.lastMessage?.createdAt || 0).getTime();
    return timeB - timeA; 
  });

  return copy;
}
function makeUniqueAndSortMessages(messagesArray) {
  const map = new Map();
  for (let i = 0; i < messagesArray.length; i++) {
    const msg = messagesArray[i];
    if (msg?._id) {
      map.set(msg._id, msg);
    }
  }
  const uniqueArray = [...map.values()];

  uniqueArray.sort(function (a, b) {
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return uniqueArray;
}

function updateLastMessageInChats(chatsArray, chatId, newMessage) {
  const updatedChats = chatsArray.map(function (chat) {
    if (chat._id === chatId) {
      return {
        ...chat,
        lastMessage: newMessage,
        updatedAt: newMessage.createdAt,
      };
    } else {
      return chat;
    }
  });

  return sortChatsByRecent(updatedChats);
}

export const useChatStore = create(function (set, get) {
  return {
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

    reset: function () {
      try {
        const current = get();
        if (current.selectedChatId) {
  
          useSocketStore.getState().leaveChat(current.selectedChatId);
        }
      } catch (ignoreThisError) {
  
      }

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
        page: 1,
        hasMore: true,
        pendingInvitations: [],
        socketListenersAttached: false,
        error: null,
        invitationMessage: null,
      });
    },
    setSelectedChatId: function (chatId) {
      const stateBefore = get();
      const oldChatId = stateBefore.selectedChatId;

      if (oldChatId === chatId) return;

      const socketStore = useSocketStore.getState();

      if (oldChatId) {
        socketStore.leaveChat(oldChatId);
      }
    set({
        selectedChatId: chatId,
        previousSelectedChatId: oldChatId,
        messages: [],
        page: 1,
        hasMore: true,
      });

      if (!chatId) return;
    socketStore.joinChat(chatId);
      get().fetchMessages(chatId);
      socketStore.markMessagesRead(chatId);
    },

      initSocketListeners: function () {
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

      socket.on("message_status_update", function (data) {
        if (!data) data = {};
        let messageIdsList = [];
        if (data.messageIds) {
          messageIdsList = data.messageIds;
        } else if (data.messageId) {
          messageIdsList = [data.messageId];
        }

        for (let i = 0; i < messageIdsList.length; i++) {
          const id = messageIdsList[i];
          get().messageStatusUpdate(id, data.status);
        }
      });

      set({ socketListenersAttached: true });
    },
    fetchChats: async function () {
      set({ loadingChats: true, error: null });

      try {
        const response = await messageApi.getUserChats();
        const chats = response.data?.data || response.data || [];
        set({ chats: sortChatsByRecent(chats) });
        get().fetchPendingInvitations();

        const savedSelectedChatId = get().selectedChatId;

        if (!savedSelectedChatId && chats.length > 0) {
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
        const chatStillExists = chats.some(function (c) {
          return c._id === savedSelectedChatId;
        });

        if (savedSelectedChatId && !chatStillExists) {
          if (chats.length > 0) {
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
            set({ selectedChatId: null, messages: [] });
          }
          return;
        }
        if (savedSelectedChatId) {
          useSocketStore.getState().joinChat(savedSelectedChatId);
        }
      } catch (err) {
        set({
          error: err.response?.data?.message || "Unable to load chats.",
        });
      } finally {
        set({ loadingChats: false });
      }
    },

    fetchPendingInvitations: async function () {
      set({ loadingInvitations: true, invitationMessage: null });

      try {
        const response = await invitationApi.getPendingInvitations();
        const invitations = response.data?.data || response.data || [];
        set({ pendingInvitations: invitations });
      } catch (err) {
        set({
          invitationMessage: err.response?.data?.message || "Unable to load invitations.",
        });
      } finally {
        set({ loadingInvitations: false });
      }
    },
    handleInvitationReceived: function (data) {
      const invitation = data?.invitation;
      if (!invitation) return;

      set(function (state) {
        const alreadyPresent = state.pendingInvitations.some(function (item) {
          return item._id === invitation._id;
        });

        let newList;
        if (alreadyPresent) {
          newList = state.pendingInvitations.map(function (item) {
            if (item._id === invitation._id) {
              return invitation;
            } else {
              return item;
            }
          });
        } else {
          newList = [invitation, ...state.pendingInvitations];
        }

        return {
          pendingInvitations: newList,
          invitationMessage: "New invitation from " + (invitation.invitedBy?.name || "someone"),
        };
      });
    },

    handleInvitationAccepted: function (data) {
      const invitation = data?.invitation;
      const newChat = data?.chat;

      set(function (state) {
        let updatedChats = state.chats;
        if (newChat) {
          const alreadyHasChat = state.chats.some(function (c) {
            return c._id === newChat._id;
          });
          if (!alreadyHasChat) {
            updatedChats = [newChat, ...state.chats];
          }
        }

        return {
          pendingInvitations: state.pendingInvitations.filter(function (item) {
            return item._id !== invitation?._id;
          }),
          chats: sortChatsByRecent(updatedChats),
          invitationMessage: "Invitation accepted.",
        };
      });
    },
    handleInvitationRejected: function (data) {
      const invitation = data?.invitation;

      set(function (state) {
        return {
          pendingInvitations: state.pendingInvitations.filter(function (item) {
            return item._id !== invitation?._id;
          }),
          invitationMessage: "Invitation declined.",
        };
      });
    },
    acceptInvitation: async function (invitationId) {
      try {
        const res = await invitationApi.acceptInvitation(invitationId);

        set(function (state) {
          return {
            pendingInvitations: state.pendingInvitations.filter(function (item) {
              return item._id !== invitationId;
            }),
            invitationMessage: res.data?.message || "Invitation accepted.",
          };
        });
        await get().fetchChats();
        return res;
      } catch (err) {
        const message = err.response?.data?.message || "Unable to accept invitation.";
        set({ invitationMessage: message });
        throw err;
      }
    },

    rejectInvitation: async function (invitationId) {
      try {
        const res = await invitationApi.rejectInvitation(invitationId);

        set(function (state) {
          return {
            pendingInvitations: state.pendingInvitations.filter(function (item) {
              return item._id !== invitationId;
            }),
            invitationMessage: res.data?.message || "Invitation declined.",
          };
        });

        return res;
      } catch (err) {
        const message = err.response?.data?.message || "Unable to reject invitation.";
        set({ invitationMessage: message });
        throw err;
      }
    },
    fetchMessages: async function (chatId, page) {
      if (!page) page = 1;

      if (!chatId) {
        set({ messages: [], page: 1, hasMore: true });
        return;
      }
      if (page === 1) {
        set({ loadingMessages: true, error: null });
      } else {
        set({ loadingMore: true });
      }

      try {
        const response = await messageApi.getChatMessages(chatId, page, PAGE_SIZE);
        const payload = response.data?.data ?? [];
        const newMessages = Array.isArray(payload) ? payload : payload.messages || [];
        let hasMoreFromServer;
        if (typeof response.data?.hasMore === "boolean") {
          hasMoreFromServer = response.data.hasMore;
        } else {
          hasMoreFromServer = newMessages.length === PAGE_SIZE;
        }

        set(function (state) {
          let finalMessages;

          if (page === 1) {
            finalMessages = makeUniqueAndSortMessages(newMessages);
          } else {
            const combined = [...newMessages, ...state.messages];
            finalMessages = makeUniqueAndSortMessages(combined);
          }

          return {
            messages: finalMessages,
            page: page,
            hasMore: hasMoreFromServer,
          };
        });
      } catch (err) {
        set({
          error: err.response?.data?.message || "Unable to load messages.",
        });
      } finally {
        set({ loadingMessages: false, loadingMore: false });
      }
    },
    loadMoreMessages: async function () {
      const current = get();
      if (!current.selectedChatId) return;
      if (!current.hasMore) return;
      if (current.loadingMore) return;

      await get().fetchMessages(current.selectedChatId, current.page + 1);
    },
    handleIncomingMessage: function (data) {
      const incomingMessage = data?.message;
      if (!incomingMessage) return;

      const current = get();
      const currentUserId = getCurrentUserId();

      const senderId = incomingMessage.sender?._id?.toString()
        || incomingMessage.sender?.id?.toString();

      const isMyOwnMessage = senderId && currentUserId && senderId === currentUserId;
      const isForCurrentlySelectedChat = incomingMessage.chat === current.selectedChatId;

      if (isForCurrentlySelectedChat && !isMyOwnMessage) {
        useSocketStore.getState().markMessagesRead(current.selectedChatId);
      }

      set(function () {
        let updatedMessages = current.messages;

        if (isForCurrentlySelectedChat) {
        
          const existingIndex = current.messages.findIndex(function (m) {
            const idMatch = m._id === incomingMessage._id;

            const sendingTempMatch =
              m.status === "sending"
              && m.content === incomingMessage.content
              && m.sender?._id === incomingMessage.sender?._id;

            return idMatch || sendingTempMatch;
          });

          if (existingIndex !== -1) {
            updatedMessages = current.messages.map(function (m, idx) {
              if (idx === existingIndex) {
                return incomingMessage;
              } else {
                return m;
              }
            });
          } else {
            updatedMessages = [...current.messages, incomingMessage];
          }
        }

        return {
          messages: makeUniqueAndSortMessages(updatedMessages),
          chats: updateLastMessageInChats(current.chats, incomingMessage.chat, incomingMessage),
        };
      });
    },
  sendMessage: async (chatId, content, attachment = null) => {
  if (!chatId) return null;

  const text = content?.trim();
  const hasAttachment = Boolean(attachment?.fileUrl);
  if (!text && !hasAttachment) return null;

  const { user } = useAuthStore.getState();
  const socketStore = useSocketStore.getState();

  if (!socketStore.connected) {
    set({
      error: "Socket is not connected. Please wait or refresh.",
    });
    return null;
  }

const tempId = `temp-${Date.now()}`;

const tempMessage = createTempMessage({
  tempId,
  chatId,
  user,
  content: text || attachment?.fileName || "Attachment",
  attachment,
});

  set((state) => ({
    sendingMessage: true,
    error: null,
    messages: [...state.messages, tempMessage],
    chats: updateLastMessageInChats(state.chats, chatId, tempMessage),
  }));

  try {
    const response = await Promise.race([
      new Promise((resolve) =>
        socketStore.sendMessageSocket(chatId, text || attachment?.fileName || "Attachment", tempId, resolve, attachment)
      ),
      new Promise((resolve) =>
        setTimeout(
          () => resolve({ success: false, error: "Socket timeout" }),
          10000
        )
      ),
    ]);

    if (!response.success) {
      throw new Error(response.error || "Unable to send message.");
    }

    const serverMessage = response.message;

    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === tempId ? serverMessage : msg
      ),
      chats: updateLastMessageInChats(
        state.chats,
        chatId,
        serverMessage
      ),
    }));

    return serverMessage;
  } catch (err) {
    set((state) => ({
      messages: state.messages.filter((m) => m._id !== tempId),
      error: err.message,
    }));

    return null;
  } finally {
    set({ sendingMessage: false });
  }
},
    messageStatusUpdate: function (messageId, newStatus) {
      if (!messageId || !newStatus) return;

      set(function (state) {
        const updated = state.messages.map(function (message) {
          const idMatch = message._id === messageId || message.id === messageId;
          if (idMatch) {
            return { ...message, status: newStatus };
          } else {
            return message;
          }
        });

        return { messages: updated };
      });
    },
  };
});
