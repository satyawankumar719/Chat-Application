import { create } from "zustand";
import { messageApi } from "@/api/messageApi";
import { useAuthStore } from "./authStore";
import { useSocketStore } from "./socketStore";
import { createTempMessage } from "@/lib/messageHelpers";
import { groupApi } from "@/api/groupApi";
const PAGE_SIZE = 50;

function getCurrentUserId() {
  const user = useAuthStore.getState().user;
  const idFromdb = user?._id?.toString();
  const idFromField = user?.id?.toString();
  return idFromdb || idFromField || null;
}

async function uploadFileResumable(file, chatId, onProgress, uploadId, signal) {
  const CHUNK_SIZE = 1 * 1024 * 1024;
  const fileType = file.type.startsWith("image") ? "image" : "file";

  let startByte = 0;
  let currentUploadId = uploadId;

  try {
    const initRes = await messageApi.initUpload({
      uploadId,
      chatId,
      fileName: file.name,
      fileSize: file.size,
      fileType,
    });
    const session = initRes.data?.data;
    startByte = session?.uploadedBytes || 0;
    currentUploadId = session?.uploadId || uploadId;

    if (session?.status === "upload_completed" && session?.finalUrl) {
      return {
        fileUrl: session.finalUrl,
        fileName: file.name,
        fileSize: file.size,
        type: fileType,
      };
    }
  } catch (e) {
    // Fall back if init fails
  }

  const handleUnload = () => {
    try {
      const payload = JSON.stringify({ uploadId: currentUploadId });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/messages/upload/interrupt", payload);
      }
    } catch {}
  };
  window.addEventListener("beforeunload", handleUnload);

  try {
    while (startByte < file.size) {
      if (signal?.aborted) {
        throw new Error("ERR_CANCELED");
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        onProgress({ loaded: startByte, total: file.size, isReconnecting: true });
        await new Promise((resolve) => {
          const handleOnline = () => {
            window.removeEventListener("online", handleOnline);
            resolve();
          };
          window.addEventListener("online", handleOnline);
        });
        try {
          const statusRes = await messageApi.getUploadStatus(currentUploadId);
          startByte = statusRes.data?.data?.uploadedBytes || startByte;
        } catch {}
      }

      const endByte = Math.min(file.size, startByte + CHUNK_SIZE);
      const chunkBlob = file.slice(startByte, endByte);

      const formData = new FormData();
      formData.append("uploadId", currentUploadId);
      formData.append("startByte", startByte.toString());
      formData.append("chunk", chunkBlob, file.name);

      const chunkRes = await messageApi.uploadChunk(
        formData,
        (pEvent) => {
          const currentLoaded = pEvent.loaded || 0;
          const totalLoaded = Math.min(file.size, startByte + currentLoaded);
          onProgress({ loaded: totalLoaded, total: file.size, isReconnecting: false });
        },
        signal
      );

      const chunkData = chunkRes.data?.data;

      if (chunkData?.completed && chunkData?.fileUrl) {
        return {
          fileUrl: chunkData.fileUrl,
          fileName: file.name,
          fileSize: file.size,
          type: fileType,
        };
      }

      startByte = chunkData?.uploadedBytes || endByte;
    }
  } finally {
    window.removeEventListener("beforeunload", handleUnload);
  }

  throw new Error("Upload ended without URL.");
}


function sortChatsByRecent(chatsArray) {
  const copy = [...chatsArray];

  for (let i = 0; i < copy.length; i++) {
    for (let j = i + 1; j < copy.length; j++) {
      const timeI = new Date(copy[i].updatedAt || copy[i].lastMessage?.createdAt || 0).getTime();
      const timeJ = new Date(copy[j].updatedAt || copy[j].lastMessage?.createdAt || 0).getTime();

      if (timeJ > timeI) {
        const temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
      }
    }
  }

  return copy;
}

function makeUniqueAndSortMessages(messagesArray) {
  const map = {};
  const result = [];

  for (let i = 0; i < messagesArray.length; i++) {
    const msg = messagesArray[i];
    if (msg?._id && !map[msg._id]) {
      map[msg._id] = true;
      result.push(msg);
    }
  }

  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      if (new Date(result[i].createdAt) > new Date(result[j].createdAt)) {
        const temp = result[i];
        result[i] = result[j];
        result[j] = temp;
      }
    }
  }

  return result;
}

function getSenderId(sender) {
  if (!sender) return "";
  if (typeof sender === "object") {
    return (sender._id || sender.id || "").toString();
  }
  return sender.toString();
}

function updateLastMessageInChats(chatsArray, chatId, newMessage, isCurrentlySelected, currentUserId) {
  const result = [];

  for (let i = 0; i < chatsArray.length; i++) {
    const chat = chatsArray[i];
    if (chat._id === chatId) {
      const senderId = getSenderId(newMessage?.sender);
      const isFromOther = senderId && currentUserId && senderId !== currentUserId.toString();
      let newUnreadCount = { ...(chat.unreadCount || {}) };

      if (isCurrentlySelected) {
        if (currentUserId) newUnreadCount[currentUserId] = 0;
      } else if (isFromOther && currentUserId) {
        const prev = typeof newUnreadCount[currentUserId] === "number" ? newUnreadCount[currentUserId] : 0;
        newUnreadCount[currentUserId] = prev + 1;
      }

      result.push({
        ...chat,
        lastMessage: newMessage,
        updatedAt: newMessage.createdAt,
        unreadCount: newUnreadCount,
      });
    } else {
      result.push(chat);
    }
  }

  return sortChatsByRecent(result);
}


function updateUserStatusInChats(chatsArray, userId, isOnline, lastSeen) {
  if (!userId || !Array.isArray(chatsArray)) return chatsArray || [];
  const result = [];
  const userIdStr = userId.toString();

  for (let i = 0; i < chatsArray.length; i++) {
    const chat = chatsArray[i];
    if (!chat) continue;
    const newMembers = [];

    for (let j = 0; j < (chat.members || []).length; j++) {
      const member = chat.members[j];
      if (!member) continue;

      const userObj = typeof member.user === "object" && member.user !== null ? member.user : null;
      const memberId = (userObj?._id || userObj?.id || member.user || "").toString();

      if (memberId === userIdStr) {
        if (userObj) {
          newMembers.push({
            ...member,
            user: {
              ...userObj,
              isOnline: isOnline,
              lastSeen: lastSeen || userObj.lastSeen,
            },
          });
        } else {
          newMembers.push(member);
        }
      } else {
        newMembers.push(member);
      }
    }

    result.push({ ...chat, members: newMembers });
  }

  return result;
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
    sendingMessage: false,

    page: 1,
    hasMore: true,
    isTyping: false,

    socketListenersAttached: false,

    error: null,

    onlineUserIds: [],

    reset: function () {
      try {
        const current = get();
        if (current.selectedChatId) {
          useSocketStore.getState().leaveChat(current.selectedChatId);
        }
      } catch {

      }

      set({
        chats: [],
        messages: [],
        selectedChatId: null,
        previousSelectedChatId: null,
        loadingChats: false,
        loadingMessages: false,
        loadingMore: false,
        sendingMessage: false,
        page: 1,
        hasMore: true,
        isTyping: false,
        socketListenersAttached: false,
        error: null,
        onlineUserIds: [],
      });
    },

    addChat: function (newChat) {
      set(function (state) {
        for (let i = 0; i < state.chats.length; i++) {
          if (state.chats[i]._id === newChat._id) {
            return state;
          }
        }
        return { chats: sortChatsByRecent([newChat, ...state.chats]) };
      });
    },

    setSelectedChatId: function (chatId) {
      const stateBefore = get();
      const oldChatId = stateBefore.selectedChatId;

      if (oldChatId === chatId) return;

      const socketStore = useSocketStore.getState();
      const currentUserId = getCurrentUserId();

      if (oldChatId) {
        socketStore.leaveChat(oldChatId);
      }

      set(function (state) {
        const updatedChats = state.chats.map((c) => {
          if (c._id === chatId) {
            const newUnread = { ...(c.unreadCount || {}) };
            if (currentUserId) newUnread[currentUserId] = 0;
            return { ...c, unreadCount: newUnread };
          }
          return c;
        });

        return {
          chats: updatedChats,
          selectedChatId: chatId,
          previousSelectedChatId: oldChatId,
          messages: [],
          page: 1,
          hasMore: true,
        };
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
      socket.off("message_status_update");
      socket.off("user_status_changed");
      socket.off("get_online_users");

      socket.on("receive_message", get().handleIncomingMessage);

      socket.on("get_online_users", function (onlineUserIds) {
        if (!Array.isArray(onlineUserIds)) return;
        const stringIds = onlineUserIds.map((id) => id.toString());
        set(function (state) {
          let updatedChats = state.chats;
          for (let i = 0; i < stringIds.length; i++) {
            updatedChats = updateUserStatusInChats(updatedChats, stringIds[i], true);
          }
          return {
            onlineUserIds: stringIds,
            chats: updatedChats,
          };
        });
      });

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

      socket.on("user_status_changed", function (data) {
        if (!data?.userId) return;
        get().handleUserStatusChanged(data.userId, data.isOnline, data.lastSeen);
      });

      set({ socketListenersAttached: true });
    },

    handleUserStatusChanged: function (userId, isOnline, lastSeen) {
      if (!userId) return;
      const targetId = userId.toString();
      const currentUserId = getCurrentUserId();

      if (targetId === currentUserId?.toString()) return;

      set(function (state) {
        let newOnlineIds = state.onlineUserIds || [];
        if (isOnline) {
          if (!newOnlineIds.includes(targetId)) {
            newOnlineIds = [...newOnlineIds, targetId];
          }
        } else {
          newOnlineIds = newOnlineIds.filter((id) => id !== targetId);
        }

        return {
          onlineUserIds: newOnlineIds,
          chats: updateUserStatusInChats(state.chats, targetId, isOnline, lastSeen),
        };
      });
    },

    fetchChats: async function () {
      set({ loadingChats: true, error: null });

      try {
        const response = await messageApi.getUserChats();
        const chats = response.data?.data || response.data || [];

        const onlineIds = get().onlineUserIds || [];
        let updatedChats = chats;
        for (let i = 0; i < onlineIds.length; i++) {
          updatedChats = updateUserStatusInChats(updatedChats, onlineIds[i], true);
        }

        set({ chats: sortChatsByRecent(updatedChats) });

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

        let chatStillExists = false;
        for (let i = 0; i < chats.length; i++) {
          if (chats[i]._id === savedSelectedChatId) {
            chatStillExists = true;
            break;
          }
        }

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

      const senderId = getSenderId(incomingMessage.sender);

      const isMyOwnMessage = senderId && currentUserId && senderId === currentUserId.toString();
      const isForCurrentlySelectedChat = incomingMessage.chat === current.selectedChatId;

      if (isForCurrentlySelectedChat && !isMyOwnMessage) {
        useSocketStore.getState().markMessagesRead(current.selectedChatId);
      }

      set(function () {
        let updatedMessages = current.messages;

        if (isForCurrentlySelectedChat) {
          let existingIndex = -1;
          for (let i = 0; i < current.messages.length; i++) {
            const m = current.messages[i];

            const idMatch = m._id === incomingMessage._id;

            const sendingTempMatch =
              (m.status === "sending" || m.isUploading)
              && m.content === incomingMessage.content
              && getSenderId(m.sender) === senderId;

            if (idMatch || sendingTempMatch) {
              existingIndex = i;
              break;
            }
          }


          if (existingIndex !== -1) {
            const replaced = [];
            for (let k = 0; k < current.messages.length; k++) {
              if (k === existingIndex) {
                replaced.push(incomingMessage);
              } else {
                replaced.push(current.messages[k]);
              }
            }
            updatedMessages = replaced;
          } else {
            updatedMessages = [...current.messages, incomingMessage];
          }
        }

        return {
          messages: makeUniqueAndSortMessages(updatedMessages),
          chats: updateLastMessageInChats(
            current.chats,
            incomingMessage.chat,
            incomingMessage,
            isForCurrentlySelectedChat,
            currentUserId
          ),
        };
      });
    },

    cancelUpload: function (messageId) {
      set(function (state) {
        const msg = state.messages.find((m) => m._id === messageId);
        if (msg?.abortController) {
          try {
            msg.abortController.abort();
          } catch (e) {
            console.log("Upload aborted:", e);
          }
        }
        const filtered = state.messages.filter((m) => m._id !== messageId);
        return { messages: filtered };
      });
    },

    updateMessageProgress: function (tempId, progress) {
      set(function (state) {
        const updated = state.messages.map((m) => {
          if (m._id === tempId) {
            return { ...m, uploadProgress: progress };
          }
          return m;
        });
        return { messages: updated };
      });
    },

    updateMessageUploadState: function (tempId, updates) {
      set(function (state) {
        const updated = state.messages.map((m) => {
          if (m._id === tempId) {
            return { ...m, ...updates };
          }
          return m;
        });
        return { messages: updated };
      });
    },

    retryUpload: async function (tempId) {
      const state = get();
      const tempMsg = state.messages.find((m) => m._id === tempId);
      if (!tempMsg || !tempMsg.rawFileItems || tempMsg.rawFileItems.length === 0) return;

      const abortController = new AbortController();
      get().updateMessageUploadState(tempId, {
        uploadStatus: "uploading",
        isUploading: true,
        uploadError: null,
        abortController,
      });

      const chatId = tempMsg.chat;
      let serverUploadedFiles = [];

      try {
        for (const item of tempMsg.rawFileItems) {
          const uploaded = await uploadFileResumable(
            item.file,
            chatId,
            (p) => {
              const percent = Math.round((p.loaded * 100) / p.total);
              get().updateMessageUploadState(tempId, {
                uploadProgress: percent,
                isReconnecting: p.isReconnecting,
              });
            },
            tempId,
            abortController.signal
          );
          if (uploaded?.fileUrl) {
            serverUploadedFiles.push(uploaded);
          }
        }
      } catch (err) {
        if (err.name === "CanceledError" || err.message === "ERR_CANCELED") {
          return null;
        }
        get().updateMessageUploadState(tempId, {
          uploadStatus: "upload_failed",
          isUploading: false,
          uploadError: err.response?.data?.message || err.message || "Upload failed",
        });
        return null;
      }

      get().updateMessageUploadState(tempId, {
        attachments: serverUploadedFiles,
        fileUrl: serverUploadedFiles[0]?.fileUrl || tempMsg.fileUrl,
        isUploading: false,
        uploadStatus: "upload_completed",
        uploadProgress: 100,
        status: "sending",
      });

      const socketStore = useSocketStore.getState();
      const firstAttachment = serverUploadedFiles[0] || tempMsg.attachment;

      let gotResponse = false;
      try {
        const response = await new Promise(function (resolve) {
          let timeoutId = setTimeout(function () {
            if (!gotResponse) {
              gotResponse = true;
              resolve({ success: false, error: "Socket timeout" });
            }
          }, 10000);

          socketStore.sendMessageSocket(
            chatId,
            tempMsg.content,
            tempId,
            function (result) {
              if (!gotResponse) {
                gotResponse = true;
                clearTimeout(timeoutId);
                resolve(result);
              }
            },
            firstAttachment,
            serverUploadedFiles
          );
        });

        if (!response.success) {
          if (response.code === "UNAUTHORIZED") {
            if (window.location.pathname !== "/login") window.location.href = "/login";
          }
          throw new Error(response.error || "Unable to send message.");
        }

        const serverMessage = response.message;
        set(function (s) {
          const replaced = s.messages.map((m) => (m._id === tempId ? serverMessage : m));
          return {
            messages: replaced,
            chats: updateLastMessageInChats(s.chats, chatId, serverMessage),
          };
        });
      } catch (sendErr) {
        get().updateMessageUploadState(tempId, {
          status: "failed",
          uploadError: sendErr.message,
        });
      }
    },

    sendMessage: async function (chatId, content, attachments) {
      if (!attachments) attachments = [];
      if (!chatId) return null;

      const text = content?.trim();
      const hasAttachments = attachments.length > 0;
      if (!text && !hasAttachments) return null;

      const { user } = useAuthStore.getState();
      const socketStore = useSocketStore.getState();

      if (!socketStore.connected) {
        set({
          error: "Socket is not connected. Please wait or refresh.",
        });
        return null;
      }

      const rawFileItems = attachments.filter((item) => item.file && item.preview);
      const isFileUpload = rawFileItems.length > 0;

      let finalAttachments = [];
      let abortController = null;
      const tempId = `temp-${Date.now()}`;

      if (isFileUpload) {
        abortController = new AbortController();
        finalAttachments = rawFileItems.map((item) => ({
          type: item.file.type.startsWith("image") ? "image" : "file",
          fileUrl: item.preview,
          fileName: item.file.name,
          fileSize: item.file.size,
        }));
      } else {
        finalAttachments = attachments;
      }

      const firstAttachment = finalAttachments[0] || null;
      const displayContent = text || firstAttachment?.fileName || "Attachment";

      const tempMessage = createTempMessage({
        tempId,
        chatId,
        user,
        content: displayContent,
        attachment: firstAttachment,
        attachments: finalAttachments,
        isUploading: isFileUpload,
        uploadProgress: 0,
        uploadStatus: isFileUpload ? "uploading" : "upload_completed",
        abortController: abortController,
        rawFileItems: rawFileItems,
      });

      set(function (state) {
        return {
          sendingMessage: true,
          error: null,
          messages: [...state.messages, tempMessage],
          chats: updateLastMessageInChats(state.chats, chatId, tempMessage),
        };
      });

      let serverUploadedFiles = [];

      if (isFileUpload) {
        try {
          for (const item of rawFileItems) {
            const uploaded = await uploadFileResumable(
              item.file,
              chatId,
              (p) => {
                const percent = Math.round((p.loaded * 100) / p.total);
                get().updateMessageUploadState(tempId, {
                  uploadProgress: percent,
                  isReconnecting: p.isReconnecting,
                });
              },
              tempId,
              abortController.signal
            );
            if (uploaded?.fileUrl) {
              serverUploadedFiles.push(uploaded);
            }
          }
        } catch (uploadErr) {
          if (uploadErr.name === "CanceledError" || uploadErr.message === "ERR_CANCELED") {
            console.log("Upload cancelled by user");
            return null;
          }
          get().updateMessageUploadState(tempId, {
            uploadStatus: "upload_failed",
            isUploading: false,
            uploadError: uploadErr.response?.data?.message || uploadErr.message || "File upload failed.",
          });
          return null;
        }

        finalAttachments = serverUploadedFiles;
      }

      set(function (state) {
        const updated = state.messages.map((m) => {
          if (m._id === tempId) {
            return {
              ...m,
              attachments: finalAttachments,
              fileUrl: finalAttachments[0]?.fileUrl || m.fileUrl,
              isUploading: false,
              uploadStatus: "upload_completed",
              uploadProgress: 100,
              status: "sending",
            };
          }
          return m;
        });
        return { messages: updated };
      });

      const updatedFirstAttachment = finalAttachments[0] || firstAttachment;
      let gotResponse = false;

      try {
        const response = await new Promise(function (resolve) {
          let timeoutId = setTimeout(function () {
            if (!gotResponse) {
              gotResponse = true;
              resolve({ success: false, error: "Socket timeout" });
            }
          }, 10000);

          socketStore.sendMessageSocket(
            chatId,
            displayContent,
            tempId,
            function (result) {
              if (!gotResponse) {
                gotResponse = true;
                clearTimeout(timeoutId);
                resolve(result);
              }
            },
            updatedFirstAttachment,
            finalAttachments
          );
        });

        if (!response.success) {
          if (response.code === "UNAUTHORIZED") {
            if (window.location.pathname !== "/login") window.location.href = "/login";
          }
          throw new Error(response.error || "Unable to send message.");
        }

        const serverMessage = response.message;

        set(function (state) {
          const replaced = [];
          for (let k = 0; k < state.messages.length; k++) {
            if (state.messages[k]._id === tempId) {
              replaced.push(serverMessage);
            } else {
              replaced.push(state.messages[k]);
            }
          }

          return {
            messages: replaced,
            chats: updateLastMessageInChats(
              state.chats,
              chatId,
              serverMessage
            ),
          };
        });

        return serverMessage;
      } catch (err) {
        set(function (state) {
          const updated = state.messages.map((m) => {
            if (m._id === tempId) {
              return { ...m, status: "failed", uploadError: err.message };
            }
            return m;
          });

          return {
            messages: updated,
            error: err.message,
          };
        });

        return null;
      } finally {
        set({ sendingMessage: false });
      }
    },


    messageStatusUpdate: function (messageId, newStatus) {
      if (!messageId || !newStatus) return;

      set(function (state) {
        const updated = [];
        for (let i = 0; i < state.messages.length; i++) {
          const message = state.messages[i];
          const idMatch = message._id === messageId || message.id === messageId;
          if (idMatch) {
            updated.push({ ...message, status: newStatus });
          } else {
            updated.push(message);
          }
        }

        return { messages: updated };
      });
    },
createGroup: async ({ name, description = "", memberIds = [] }) => {
  try {
    const res = await groupApi.createGroup({
      name: name.trim(),
      description: description.trim(),
      memberIds,
    });

    const newGroup = res.data?.data || res.data;

    set((state) => ({
      chats: [newGroup, ...state.chats],
      selectedChatId:
        newGroup?._id || newGroup?.id || state.selectedChatId,
    }));

    return newGroup;
  } catch (err) {
    throw new Error(
      err.response?.data?.message ||
      err.message ||
      "Failed to create group"
    );
  }
},

addGroupMembers: async (groupId, memberIds) => {
  try {
    const res = await groupApi.addMembers(groupId, memberIds);

    const updatedGroup = res.data?.data || res.data;

    set((state) => ({
      chats: state.chats.map((chat) =>
        chat._id === groupId ? updatedGroup : chat
      ),
    }));

    return updatedGroup;
  } catch (err) {
    console.error("Add group members error:", err);
    throw new Error(
      err.response?.data?.message ||
      err.message ||
      "Failed to add members"
    );
  }
},

removeGroupMember: async (groupId, memberId) => {
  try {
    const res = await groupApi.removeMember(
      groupId,
      memberId
    );

    const updatedGroup = res.data?.data || res.data;

    set((state) => ({
      chats: state.chats.map((chat) =>
        chat._id === groupId ? updatedGroup : chat
      ),
    }));

    return updatedGroup;
  } catch (err) {
    console.error("Remove group member error:", err);
    throw new Error(
      err.response?.data?.message ||
      err.message ||
      "Failed to remove member"
    );
  }
},

updateGroupMemberRole: async (groupId, memberId, role) => {
  try {
    const res = await groupApi.updateMemberRole(
      groupId,
      memberId,
      { role }
    );

    const updatedGroup = res.data?.data || res.data;

    set((state) => ({
      chats: state.chats.map((chat) =>
        chat._id === groupId ? updatedGroup : chat
      ),
    }));

    return updatedGroup;
  } catch (err) {
    console.error("Update member role error:", err);
    throw new Error(
      err.response?.data?.message ||
      err.message ||
      "Failed to update member role"
    );
  }
},

updateGroupInfo: async (groupId, data) => {
  try {
    const res = await groupApi.updateGroup(
      groupId,
      data
    );

    const updatedGroup = res.data?.data || res.data;

    set((state) => ({
      chats: state.chats.map((chat) =>
        chat._id === groupId ? updatedGroup : chat
      ),
    }));

    return updatedGroup;
  } catch (err) {
    console.error("Update group info error:", err);
    throw new Error(
      err.response?.data?.message ||
      err.message ||
      "Failed to update group info"
    );
  }
},

leaveGroup: async (groupId) => {
  try {
    await groupApi.leaveGroup(groupId);

    set((state) => {
      const newChats = state.chats.filter(
        (chat) => chat._id !== groupId
      );

      const isSelected = state.selectedChatId === groupId;

      return {
        chats: newChats,
        selectedChatId: isSelected
          ? newChats[0]?._id || null
          : state.selectedChatId,
      };
    });
  } catch (err) {
    console.error("Leave group error:", err);
    throw new Error(
      err.response?.data?.message ||
      err.message ||
      "Failed to leave group"
    );
  }
},

deleteGroup: async (groupId) => {
  try {
    await groupApi.deleteGroup(groupId);

    set((state) => {
      const newChats = state.chats.filter(
        (chat) => chat._id !== groupId
      );

      const isSelected = state.selectedChatId === groupId;

      return {
        chats: newChats,
        selectedChatId: isSelected
          ? newChats[0]?._id || null
          : state.selectedChatId,
      };
    });
  } catch (err) {
    console.error("Delete group error:", err);
    throw new Error(
      err.response?.data?.message ||
      err.message ||
      "Failed to delete group"
    );
  }
},

  };
});
