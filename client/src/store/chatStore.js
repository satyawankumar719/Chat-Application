import { create } from "zustand";
import { messageApi } from "@/api/messageApi";
import { useAuthStore } from "./authStore";
import { useSocketStore } from "./socketStore";
import { createTempMessage } from "@/lib/messageHelpers";
import { toast } from "sonner";

const PAGE_SIZE = 50;

function getCurrentUserId() {
  const user = useAuthStore.getState().user;
  return user?._id?.toString() || user?.id?.toString() || null;
}

function savePendingUpload(chatId, uploadId, tempId, file) {
  try {
    const storage = JSON.parse(localStorage.getItem("pending_uploads") || "{}");
    storage[tempId] = { tempId, uploadId, chatId, fileName: file.name, fileSize: file.size, fileType: file.type, sender: getCurrentUserId(), status: "upload_interrupted", createdAt: new Date().toISOString() };
    localStorage.setItem("pending_uploads", JSON.stringify(storage));
  } catch { }
}

function removePendingUpload(tempId) {
  try {
    const storage = JSON.parse(localStorage.getItem("pending_uploads") || "{}");
    delete storage[tempId];
    localStorage.setItem("pending_uploads", JSON.stringify(storage));
  } catch { }
}

function getPendingUploadsForChat(chatId) {
  try {
    const storage = JSON.parse(localStorage.getItem("pending_uploads") || "{}");
    const currentUserId = getCurrentUserId();
    const result = [];
    for (const tempId in storage) {
      const item = storage[tempId];
      if (item.chatId === chatId && item.sender === currentUserId) result.push(item);
    }
    return result;
  } catch {
    return [];
  }
}

async function uploadFileResumable(file, chatId, onProgress, uploadId, signal) {
  const CHUNK_SIZE = 1 * 1024 * 1024;
  const fileType = file.type.startsWith("image") ? "image" : "file";
  let startByte = 0;
  let currentUploadId = uploadId;

  try {
    const initRes = await messageApi.initUpload({ uploadId, chatId, fileName: file.name, fileSize: file.size, fileType });
    const session = initRes.data?.data;
    startByte = session?.uploadedBytes || 0;
    currentUploadId = session?.uploadId || uploadId;

    if (session?.status === "upload_completed" && session?.finalUrl) {
      return { fileUrl: session.finalUrl, fileName: file.name, fileSize: file.size, type: fileType };
    }
  } catch (e) { }

  const handleUnload = () => {
    try {
      const payload = JSON.stringify({ uploadId: currentUploadId });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/messages/upload/interrupt", payload);
    } catch { }
  };

  window.addEventListener("beforeunload", handleUnload);

  try {
    while (startByte < file.size) {
      if (signal?.aborted) throw new Error("ERR_CANCELED");

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
        } catch { }
      }

      const endByte = Math.min(file.size, startByte + CHUNK_SIZE);
      const chunkBlob = file.slice(startByte, endByte);
      const formData = new FormData();

      formData.append("uploadId", currentUploadId);
      formData.append("startByte", startByte.toString());
      formData.append("chunk", chunkBlob, file.name);

      const chunkRes = await messageApi.uploadChunk(formData, (pEvent) => {
        const currentLoaded = pEvent.loaded || 0;
        const totalLoaded = Math.min(file.size, startByte + currentLoaded);
        onProgress({ loaded: totalLoaded, total: file.size, isReconnecting: false });
      }, signal);

      const chunkData = chunkRes.data?.data;

      if (chunkData?.completed && chunkData?.fileUrl) {
        return { fileUrl: chunkData.fileUrl, fileName: file.name, fileSize: file.size, type: fileType };
      }

      startByte = chunkData?.uploadedBytes || endByte;
    }
  } finally {
    window.removeEventListener("beforeunload", handleUnload);
  }

  throw new Error("Upload ended without URL.");
}

function sortChatsByRecent(chatsArray) {
  return [...chatsArray].sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.lastMessage?.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.lastMessage?.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

function makeUniqueAndSortMessages(messagesArray) {
  const seen = new Set();
  return messagesArray
    .filter((msg) => msg?._id && !seen.has(msg._id) && seen.add(msg._id))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function getSenderId(sender) {
  if (!sender) return "";
  if (typeof sender === "object") return (sender._id || sender.id || "").toString();
  return sender.toString();
}

function updateLastMessageInChats(chatsArray, chatId, newMessage, isCurrentlySelected, currentUserId) {
  const result = chatsArray.map((chat) => {
    if (chat._id === chatId) {
      const senderId = getSenderId(newMessage?.sender);
      const isFromOther = senderId && currentUserId && senderId !== currentUserId.toString();
      const newUnreadCount = { ...(chat.unreadCount || {}) };

      if (isCurrentlySelected) {
        if (currentUserId) newUnreadCount[currentUserId] = 0;
      } else if (isFromOther && currentUserId) {
        const prev = typeof newUnreadCount[currentUserId] === "number" ? newUnreadCount[currentUserId] : 0;
        newUnreadCount[currentUserId] = prev + 1;
      }

      return { ...chat, lastMessage: newMessage, updatedAt: newMessage.createdAt, unreadCount: newUnreadCount };
    }
    return chat;
  });

  return sortChatsByRecent(result);
}

function updateUserStatusInChats(chatsArray, userId, isOnline, lastSeen) {
  if (!userId || !Array.isArray(chatsArray)) return chatsArray || [];
  const userIdStr = userId.toString();

  return chatsArray.map((chat) => {
    if (!chat || !chat.members) return chat;
    const newMembers = chat.members.map((member) => {
      const userObj = typeof member.user === "object" && member.user !== null ? member.user : null;
      const memberId = (userObj?._id || userObj?.id || member.user || "").toString();

      if (memberId === userIdStr && userObj) {
        return { ...member, user: { ...userObj, isOnline, lastSeen: lastSeen || userObj.lastSeen } };
      }
      return member;
    });
    return { ...chat, members: newMembers };
  });
}

export const useChatStore = create((set, get) => ({
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
      if (current.selectedChatId) useSocketStore.getState().leaveChat(current.selectedChatId);
    } catch { }

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
      onlineUserIds: []
    });
  },

  addChat: function (newChat) {
    if (!newChat || !newChat._id) return;
    set((state) => {
      let exists = false;
      const updatedChats = state.chats.map((c) => {
        if (c._id === newChat._id) {
          exists = true;
          return { ...c, ...newChat };
        }
        return c;
      });

      if (exists) {
        return { chats: updatedChats };
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

    if (oldChatId) socketStore.leaveChat(oldChatId);

    set((state) => {
      const updatedChats = state.chats.map((c) => {
        if (c._id === chatId) {
          const newUnread = { ...(c.unreadCount || {}) };
          if (currentUserId) newUnread[currentUserId] = 0;
          return { ...c, unreadCount: newUnread };
        }

        return c;
      });

      return { chats: updatedChats, selectedChatId: chatId, previousSelectedChatId: oldChatId, messages: [], page: 1, hasMore: true };
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
    socket.off("group_updated");
    socket.off("group_removed");

    socket.on("receive_message", get().handleIncomingMessage);

    socket.on("group_updated", function (data) {
      const updatedGroup = data?.group;
      if (!updatedGroup) return;

      set((state) => ({
        chats: state.chats.map((c) => (c._id === updatedGroup._id ? updatedGroup : c)),
      }));

      if (data?.systemMessage && data.systemMessage.chat === get().selectedChatId) {
        set((state) => ({
          messages: [...state.messages, data.systemMessage],
        }));
      }
    });

    socket.on("group_removed", function (data) {
      const targetGroupId = data?.groupId;
      if (!targetGroupId) return;

      set((state) => {
        const remainingChats = state.chats.filter((c) => c._id !== targetGroupId);
        const isSelected = state.selectedChatId === targetGroupId;
        const newSelectedId = isSelected ? remainingChats[0]?._id || null : state.selectedChatId;

        return {
          chats: remainingChats,
          selectedChatId: newSelectedId,
          messages: isSelected ? [] : state.messages,
        };
      });
    });


    socket.on("get_online_users", function (onlineUserIds) {
      if (!Array.isArray(onlineUserIds)) return;

      const stringIds = onlineUserIds.map((id) => id.toString());

      set((state) => {
        let updatedChats = state.chats;

        for (let i = 0; i < stringIds.length; i++) {
          updatedChats = updateUserStatusInChats(updatedChats, stringIds[i], true);
        }

        return { onlineUserIds: stringIds, chats: updatedChats };
      });
    });

    socket.on("message_status_update", function (data) {
      if (!data) data = {};

      let messageIdsList = [];

      if (data.messageIds) messageIdsList = data.messageIds;
      else if (data.messageId) messageIdsList = [data.messageId];

      for (let i = 0; i < messageIdsList.length; i++) {
        get().messageStatusUpdate(messageIdsList[i], data.status);
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

    set((state) => {
      let newOnlineIds = state.onlineUserIds || [];

      if (isOnline) {
        if (!newOnlineIds.includes(targetId)) newOnlineIds = [...newOnlineIds, targetId];
      } else {
        newOnlineIds = newOnlineIds.filter((id) => id !== targetId);
      }

      return { onlineUserIds: newOnlineIds, chats: updateUserStatusInChats(state.chats, targetId, isOnline, lastSeen) };
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

      let savedSelectedChatId = get().selectedChatId;
      if (!savedSelectedChatId && typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const urlChatId = urlParams.get("chatId");
        if (urlChatId && chats.some((c) => c._id === urlChatId)) {
          savedSelectedChatId = urlChatId;
        }
      }

      if (savedSelectedChatId) {
        const chatExists = chats.some((c) => c._id === savedSelectedChatId);
        if (chatExists) {
          set({ selectedChatId: savedSelectedChatId });
          useSocketStore.getState().joinChat(savedSelectedChatId);
        } else {
          set({ selectedChatId: null, messages: [] });
        }
      }
    } catch (err) {
      set({ error: err.response?.data?.message || "Unable to load chats." });
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

    if (page === 1) set({ loadingMessages: true, error: null });
    else set({ loadingMore: true });

    try {
      const response = await messageApi.getChatMessages(chatId, page, PAGE_SIZE);
      const payload = response.data?.data ?? [];
      const newMessages = Array.isArray(payload) ? payload : payload.messages || [];
      const hasMoreFromServer = typeof response.data?.hasMore === "boolean" ? response.data.hasMore : newMessages.length === PAGE_SIZE;

      set((state) => {
        let finalMessages;

        if (page === 1) {
          const pending = getPendingUploadsForChat(chatId).map((p) => ({
            _id: p.tempId,
            tempId: p.tempId,
            uploadId: p.uploadId,
            chat: p.chatId,
            content: p.fileName,
            sender: p.sender,
            type: p.fileType?.startsWith("image") ? "image" : "file",
            isUploading: false,
            uploadStatus: "upload_interrupted",
            uploadError: "Upload interrupted. Click Resume to continue.",
            isFailed: true,
            fileSize: p.fileSize,
            fileName: p.fileName,
            createdAt: p.createdAt
          }));

          finalMessages = makeUniqueAndSortMessages([...pending, ...newMessages]);
        } else {
          finalMessages = makeUniqueAndSortMessages([...newMessages, ...state.messages]);
        }

        return { messages: finalMessages, page, hasMore: hasMoreFromServer };
      });
    } catch (err) {
      set({ error: err.response?.data?.message || "Unable to load messages." });
    } finally {
      set({ loadingMessages: false, loadingMore: false });
    }
  },

  loadMoreMessages: async function () {
    const current = get();

    if (!current.selectedChatId || !current.hasMore || current.loadingMore) return;

    await get().fetchMessages(current.selectedChatId, current.page + 1);
  },

  getTotalUnreadCount: function () {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return 0;
    const chats = get().chats || [];
    let total = 0;
    for (let i = 0; i < chats.length; i++) {
      const chat = chats[i];
      if (chat.unreadCount) {
        if (typeof chat.unreadCount.get === "function") {
          total += chat.unreadCount.get(currentUserId) || 0;
        } else if (typeof chat.unreadCount === "object") {
          total += chat.unreadCount[currentUserId] || 0;
        }
      }
    }
    return total;
  },

  handleIncomingMessage: function (data) {
    const incomingMessage = data?.message;
    if (!incomingMessage) return;

    const current = get();
    const currentUserId = getCurrentUserId();
    const senderId = getSenderId(incomingMessage.sender);
    const isMyOwnMessage = senderId && currentUserId && senderId === currentUserId.toString();
    const isForCurrentlySelectedChat = Boolean(current.selectedChatId && incomingMessage.chat === current.selectedChatId);
    const isChatActiveOnScreen = isForCurrentlySelectedChat && typeof window !== "undefined" && document.hasFocus();

    if (isChatActiveOnScreen && !isMyOwnMessage) {
      useSocketStore.getState().markMessagesRead(current.selectedChatId);
    }
    if (!isMyOwnMessage && !isChatActiveOnScreen) {
      const senderObj = typeof incomingMessage.sender === "object" ? incomingMessage.sender : null;
      const targetChat = current.chats.find((c) => c._id === incomingMessage.chat);
      const isGroup = targetChat?.type === "group";
      const title = isGroup
        ? (targetChat.name || "Group Chat")
        : (senderObj?.name || "New Message");

      const snippet = incomingMessage.content || (incomingMessage.attachments?.length ? "Sent an attachment" : "Sent a message");

      toast(title, {
        description: isGroup && senderObj?.name ? `${senderObj.name}: ${snippet}` : snippet,
        action: {
          label: "View Chat",
          onClick: () => {
            get().setSelectedChatId(incomingMessage.chat);
            if (typeof window !== "undefined") {
              if (window.location.pathname === "/chats") {
                window.history.pushState({}, "", `/chats?chatId=${incomingMessage.chat}`);
                window.dispatchEvent(new Event("popstate"));
              } else {
                window.location.href = `/chats?chatId=${incomingMessage.chat}`;
              }
            }
          },
        },
      });
    }

    set(() => {
      let updatedMessages = current.messages;

      if (isForCurrentlySelectedChat) {
        let existingIndex = -1;

        for (let i = 0; i < current.messages.length; i++) {
          const m = current.messages[i];
          const idMatch = m._id === incomingMessage._id;
          const sendingTempMatch = (m.status === "sending" || m.isUploading) && m.content === incomingMessage.content && getSenderId(m.sender) === senderId;

          if (idMatch || sendingTempMatch) {
            existingIndex = i;
            break;
          }
        }

        if (existingIndex !== -1) {
          updatedMessages = current.messages.map((message, index) => index === existingIndex ? incomingMessage : message);
        } else {
          updatedMessages = [...current.messages, incomingMessage];
        }
      }

      return {
        messages: makeUniqueAndSortMessages(updatedMessages),
        chats: updateLastMessageInChats(current.chats, incomingMessage.chat, incomingMessage, isForCurrentlySelectedChat, currentUserId)
      };
    });
  },

  cancelUpload: function (messageId) {
    set((state) => {
      const msg = state.messages.find((m) => m._id === messageId);

      if (msg?.abortController) {
        try {
          msg.abortController.abort();
        } catch (e) {
          console.log("Upload aborted:", e);
        }
      }

      return { messages: state.messages.filter((m) => m._id !== messageId) };
    });
  },

  updateMessageProgress: function (tempId, progress) {
    set((state) => {
      const updated = state.messages.map((m) => m._id === tempId ? { ...m, uploadProgress: progress } : m);
      return { messages: updated };
    });
  },

  updateMessageUploadState: function (tempId, updates) {
    set((state) => {
      const updated = state.messages.map((m) => m._id === tempId ? { ...m, ...updates } : m);
      return { messages: updated };
    });
  },

  retryUpload: async function (tempId, chosenFile = null) {
    const state = get();
    const tempMsg = state.messages.find((m) => m._id === tempId);

    if (!tempMsg) return;

    let fileToUpload = chosenFile;

    if (!fileToUpload) {
      if (tempMsg.rawFileItems?.length > 0) {
        fileToUpload = tempMsg.rawFileItems[0].file;
      } else {
        fileToUpload = await new Promise((resolve) => {
          const input = document.createElement("input");
          input.type = "file";
          input.onchange = (e) => resolve(e.target.files?.[0] || null);
          input.click();
        });
      }
    }

    if (!fileToUpload) return;

    const uploadId = tempMsg.uploadId || tempId;
    const chatId = tempMsg.chat;
    const abortController = new AbortController();

    get().updateMessageUploadState(tempId, { uploadStatus: "uploading", isUploading: true, uploadError: null, abortController });

    let serverUploadedFiles = [];

    try {
      const uploaded = await uploadFileResumable(fileToUpload, chatId, (p) => {
        const percent = Math.round((p.loaded * 100) / p.total);
        get().updateMessageUploadState(tempId, { uploadProgress: percent, isReconnecting: p.isReconnecting });
      }, uploadId, abortController.signal);

      if (uploaded?.fileUrl) serverUploadedFiles.push(uploaded);
    } catch (err) {
      if (err.name === "CanceledError" || err.message === "ERR_CANCELED") return null;

      savePendingUpload(chatId, uploadId, tempId, fileToUpload);
      get().updateMessageUploadState(tempId, {
        uploadStatus: "upload_failed",
        isUploading: false,
        uploadError: err.response?.data?.message || err.message || "Upload failed. Click to resume."
      });

      return null;
    }

    removePendingUpload(tempId);

    get().updateMessageUploadState(tempId, {
      attachments: serverUploadedFiles,
      fileUrl: serverUploadedFiles[0]?.fileUrl || tempMsg.fileUrl,
      isUploading: false,
      uploadStatus: "upload_completed",
      uploadProgress: 100,
      status: "sending"
    });

    const socketStore = useSocketStore.getState();
    const firstAttachment = serverUploadedFiles[0] || tempMsg.attachment;
    let gotResponse = false;

    try {
      const response = await new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          if (!gotResponse) {
            gotResponse = true;
            resolve({ success: false, error: "Socket timeout" });
          }
        }, 10000);

        socketStore.sendMessageSocket(chatId, tempMsg.content || fileToUpload.name, tempId, (result) => {
          if (!gotResponse) {
            gotResponse = true;
            clearTimeout(timeoutId);
            resolve(result);
          }
        }, firstAttachment, serverUploadedFiles);
      });

      if (!response.success) {
        if ((response.code === "UNAUTHORIZED" || response.error?.toLowerCase().includes("unauthorized")) && typeof window !== "undefined" && window.location.pathname !== "/login") {
          useSocketStore.getState().disconnectSocket();
          useAuthStore.getState().setUser(null);
          window.location.href = "/login";
          return;
        }
        throw new Error(response.error || "Unable to send message.");
      }

      const serverMessage = response.message;

      set((s) => ({
        messages: s.messages.map((m) => m._id === tempId ? serverMessage : m),
        chats: updateLastMessageInChats(s.chats, chatId, serverMessage)
      }));
    } catch (sendErr) {
      savePendingUpload(chatId, uploadId, tempId, fileToUpload);
      get().updateMessageUploadState(tempId, { status: "failed", uploadError: sendErr.message });
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
      set({ error: "Socket is not connected. Please wait or refresh." });
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
        fileSize: item.file.size
      }));

      savePendingUpload(chatId, tempId, tempId, rawFileItems[0].file);
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
      abortController,
      rawFileItems
    });

    set((state) => ({
      sendingMessage: true,
      error: null,
      messages: [...state.messages, tempMessage],
      chats: updateLastMessageInChats(state.chats, chatId, tempMessage)
    }));

    let serverUploadedFiles = [];

    if (isFileUpload) {
      try {
        for (const item of rawFileItems) {
          const uploaded = await uploadFileResumable(item.file, chatId, (p) => {
            const percent = Math.round((p.loaded * 100) / p.total);
            get().updateMessageUploadState(tempId, { uploadProgress: percent, isReconnecting: p.isReconnecting });
          }, tempId, abortController.signal);

          if (uploaded?.fileUrl) serverUploadedFiles.push(uploaded);
        }
      } catch (uploadErr) {
        if (uploadErr.name === "CanceledError" || uploadErr.message === "ERR_CANCELED") {
          console.log("Upload cancelled by user");
          removePendingUpload(tempId);
          return null;
        }

        get().updateMessageUploadState(tempId, {
          uploadStatus: "upload_failed",
          isUploading: false,
          uploadError: uploadErr.response?.data?.message || uploadErr.message || "File upload failed."
        });

        return null;
      }

      finalAttachments = serverUploadedFiles;
    }

    set((state) => ({
      messages: state.messages.map((m) => m._id === tempId ? {
        ...m,
        attachments: finalAttachments,
        fileUrl: finalAttachments[0]?.fileUrl || m.fileUrl,
        isUploading: false,
        uploadStatus: "upload_completed",
        uploadProgress: 100,
        status: "sending"
      } : m)
    }));

    const updatedFirstAttachment = finalAttachments[0] || firstAttachment;
    let gotResponse = false;

    try {
      const response = await new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          if (!gotResponse) {
            gotResponse = true;
            resolve({ success: false, error: "Socket timeout" });
          }
        }, 10000);

        socketStore.sendMessageSocket(chatId, displayContent, tempId, (result) => {
          if (!gotResponse) {
            gotResponse = true;
            clearTimeout(timeoutId);
            resolve(result);
          }
        }, updatedFirstAttachment, finalAttachments);
      });

      if (!response.success) {
        if ((response.code === "UNAUTHORIZED" || response.error?.toLowerCase().includes("unauthorized")) && typeof window !== "undefined" && window.location.pathname !== "/login") {
          useSocketStore.getState().disconnectSocket();
          useAuthStore.getState().setUser(null);
          window.location.href = "/login";
          return null;
        }
        throw new Error(response.error || "Unable to send message.");
      }

      removePendingUpload(tempId);

      const serverMessage = response.message;

      set((state) => ({
        messages: state.messages.map((m) => m._id === tempId ? serverMessage : m),
        chats: updateLastMessageInChats(state.chats, chatId, serverMessage)
      }));

      return serverMessage;
    } catch (err) {
      set((state) => ({
        messages: state.messages.map((m) => m._id === tempId ? { ...m, status: "failed", uploadError: err.message } : m),
        error: err.message
      }));

      return null;
    } finally {
      set({ sendingMessage: false });
    }
  },

  messageStatusUpdate: function (messageId, newStatus) {
    if (!messageId || !newStatus) return;

    set((state) => {
      let changed = false;

      const updated = state.messages.map((message) => {
        const idMatch = message._id === messageId || message.id === messageId;

        if (!idMatch || message.status === newStatus) return message;

        changed = true;
        return { ...message, status: newStatus };
      });

      return changed ? { messages: updated } : state;
    });
  }
}));