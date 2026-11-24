import React, { useRef, useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useSocketStore } from "@/store/socketStore";
import { Lock, ShieldCheck, Laptop } from "lucide-react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import GroupInfoModal from "@/components/groupChat/GroupInfoModal";
import { Chat, User } from "@/types";

export interface ChatContainerProps {
  chat: Chat | null;
  onBack?: () => void;
  setShowGroupInfo?: (show: boolean) => void;
}

function ChatContainer({
  chat,
  onBack,
  setShowGroupInfo: setShowGroupInfoProp,
}: ChatContainerProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const currentChatIdRef = useRef<string | null>(null);

  const handleOpenGroupInfo = (val = true) => {
    if (setShowGroupInfoProp) {
      setShowGroupInfoProp(val);
    }
    setShowGroupInfo(val);
  };

  const { user } = useAuthStore();
  const { socket, markMessagesRead } = useSocketStore();

  const { messages, loadingMessages, sendingMessage, sendMessage, loadMoreMessages } =
    useChatStore();

  const currentUserId = user?._id || user?.id;

  useEffect(() => {
    if (!socket || !chat?._id) return;

    const handleTyping = (data: { chatId?: string; userId?: string; typing?: boolean }) => {
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

  const savedUnreadIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!chat?._id) return;

    currentChatIdRef.current = chat._id;
    savedUnreadIdRef.current = null;

    markMessagesRead(chat._id);

    return () => {
      currentChatIdRef.current = null;
    };
  }, [chat?._id, markMessagesRead]);

  // Mark newly arriving messages as read if this chat container is actively rendered on screen
  useEffect(() => {
    if (!chat?._id || !messages || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    const senderId = (
      typeof lastMsg.sender === "object"
        ? lastMsg.sender?._id || lastMsg.sender?.id
        : lastMsg.sender
    )?.toString();
    if (
      senderId &&
      currentUserId &&
      senderId !== currentUserId.toString() &&
      lastMsg.status !== "read"
    ) {
      markMessagesRead(chat._id);
    }
  }, [messages, chat?._id, currentUserId, markMessagesRead]);

  if (!chat) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-between p-8 text-center bg-muted/20 select-none">
        <div />
        <div className="flex flex-col items-center max-w-sm">
          <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary ring-12 ring-primary/5">
            <Laptop className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">ChatApp Web</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Send and receive messages seamlessly without keeping your phone online.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-4 py-1.5 text-xs text-muted-foreground shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>End-to-end encrypted</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
          <Lock className="h-3 w-3" />
          <span>Your personal messages are end-to-end encrypted</span>
        </div>
      </div>
    );
  }

  let unreadCount = 0;

  if (Array.isArray(messages)) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];

      const senderObj = msg?.sender;
      const senderId =
        (typeof senderObj === "object"
          ? (senderObj as User)?._id || (senderObj as User)?.id
          : senderObj
        )?.toString() || "";

      const isFromOther = senderId && currentUserId && senderId !== currentUserId.toString();

      const isRead =
        msg.status === "read" ||
        (msg.readBy &&
          msg.readBy.some(
            (r: any) =>
              (r.user?._id || r.user || "").toString() ===
              (currentUserId ? currentUserId.toString() : "")
          ));

      const isUnread = isFromOther && !isRead;

      if (isUnread) {
        unreadCount++;
        savedUnreadIdRef.current = msg._id || msg.id || null;
      } else if (unreadCount > 0) {
        break;
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
        isGroup={chat.type === "group"}
      />

      <MessageInput chat={chat} onSendMessage={sendMessage} sendingMessage={sendingMessage} />

      <GroupInfoModal isOpen={showGroupInfo} onClose={() => setShowGroupInfo(false)} chat={chat} />
    </div>
  );
}

export default ChatContainer;
