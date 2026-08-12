import React, { useRef, useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useSocketStore } from "@/store/socketStore";
import { MessageSquare } from "lucide-react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

function ChatContainer({ chat, onBack, setShowGroupInfo }) {
  const [isTyping, setIsTyping] = useState(false);
  const currentChatIdRef = useRef(null);

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

  useEffect(() => {
    if (!chat?._id) return;

    currentChatIdRef.current = chat._id;
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

  let firstUnreadId = null;
  let unreadCount = 0;

  if (Array.isArray(messages)) {
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const senderId = (msg.sender?._id || msg.sender?.id || "").toString();
      if (
        senderId &&
        currentUserId &&
        senderId !== currentUserId.toString() &&
        msg.status !== "read"
      ) {
        if (!firstUnreadId) {
          firstUnreadId = msg._id || msg.id;
        }
        unreadCount++;
      }
    }
  }

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <ChatHeader
        chat={chat}
        currentUserId={currentUserId}
        onBack={onBack}
        setShowGroupInfo={setShowGroupInfo}
      />

      {isTyping && (
        <div className="border-b bg-primary/5 px-4 py-1.5 text-xs text-primary flex items-center gap-2">
          <div className="flex gap-1 items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
          </div>
          <span className="font-medium text-[11px]">Someone is typing...</span>
        </div>
      )}

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
    </div>
  );
}

export default ChatContainer;
