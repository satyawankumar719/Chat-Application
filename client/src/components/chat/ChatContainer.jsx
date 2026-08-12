import React, { useRef, useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useSocketStore } from "@/store/socketStore";
import { MessageSquare } from "lucide-react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import GroupInfoModal from "@/components/groupChat/GroupInfoModal";

function ChatContainer({ chat, onBack, setShowGroupInfo: setShowGroupInfoProp }) {
  const [isTyping, setIsTyping] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const currentChatIdRef = useRef(null);

  const handleOpenGroupInfo = (val = true) => {
    if (setShowGroupInfoProp) {
      setShowGroupInfoProp(val);
    }
    setShowGroupInfo(val);
  };


  const { user } = useAuthStore();
  const { socket, markMessagesRead } = useSocketStore();

  const {
    messages,
    loadingMessages,
    sendingMessage,
    sendMessage,
    loadMoreMessages,
  } = useChatStore();

  const currentUserId = user?._id || user?.id;

  useEffect(() => {
    if (!socket || !chat?._id) return;

    const handleTyping = (data) => {
      if (data?.chatId === chat._id && data?.userId !== currentUserId) {
        setIsTyping(Boolean(data?.typing));
      }
    };

    socket.on("typing", handleTyping);

    return () => {
      socket.off("typing", handleTyping);
      setIsTyping(false);
    };
  }, [socket, chat?._id, currentUserId]);

  const savedUnreadIdRef = useRef(null);

  useEffect(() => {
    if (!chat?._id) return;

    currentChatIdRef.current = chat._id;
    savedUnreadIdRef.current = null;

    markMessagesRead(chat._id);

    return () => {
      currentChatIdRef.current = null;
    };
  }, [chat?._id, markMessagesRead]);


  if (!chat) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-muted/10">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-xs">
          <MessageSquare className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight">Your Messages</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          Select a conversation from the left to start chatting in real time.
        </p>
      </div>
    );
  }

  let unreadCount = 0;

  if (Array.isArray(messages)) {
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const senderObj = msg?.sender;
      const senderId = (typeof senderObj === "object" ? (senderObj?._id || senderObj?.id) : senderObj)?.toString() || "";

      const isFromOther = senderId && currentUserId && senderId !== currentUserId.toString();

      const isUnread =
        isFromOther &&
        msg.status !== "read" &&
        (!msg.readBy || !msg.readBy.some((r) => (r.user?._id || r.user || "").toString() === currentUserId.toString()));

      if (isUnread) {
        if (!savedUnreadIdRef.current) {
          savedUnreadIdRef.current = msg._id || msg.id;
        }
        unreadCount++;
      }
    }
  }

  const firstUnreadId = savedUnreadIdRef.current;

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <ChatHeader
        chat={chat}
        currentUserId={currentUserId}
        onBack={onBack}
        setShowGroupInfo={handleOpenGroupInfo}
        isTyping={isTyping}
      />



      <MessageList
        messages={messages}
        loadingMessages={loadingMessages}
        loadingMore={useChatStore.getState().loadingMore}
        onLoadMore={() => loadMoreMessages()}
        currentUserId={currentUserId}
        firstUnreadId={firstUnreadId}
        unreadCount={unreadCount}
      />

      <MessageInput
        chat={chat}
        onSendMessage={sendMessage}
        sendingMessage={sendingMessage}
      />

      <GroupInfoModal
        isOpen={showGroupInfo}
        onClose={() => setShowGroupInfo(false)}
        chat={chat}
      />
    </div>
  );

}

export default ChatContainer;
