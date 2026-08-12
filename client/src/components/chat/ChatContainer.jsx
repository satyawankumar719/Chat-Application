import React, { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useSocketStore } from "@/store/socketStore";
import { useInvitationStore } from "@/store/invitationStore";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

function ChatContainer({ chat, onBack,isopen }) {
  const [isTyping, setIsTyping] = useState(false);
  const currentChatIdRef = React.useRef(null);

  const { user } = useAuthStore();
  const { socket, markMessagesRead } = useSocketStore();

  const {
    messages,
    loadingMessages,
    sendingMessage,
    fetchMessages,
    sendMessage,
    loadMoreMessages,
  
  } = useChatStore();


  const currentUserId = user?._id || user?.id;

  // Global socket connection and listeners are handled at AppLayout level

  useEffect(() => {
    if (!socket) return;

    const handleTyping = (status) => {
      setIsTyping(status);
    };

    socket.on("typing", handleTyping);

    return () => {
      socket.off("typing", handleTyping);
    };
  }, [socket]);

  useEffect(() => {
    if (!chat?._id) return;

    currentChatIdRef.current = chat._id;

    const load = async () => {
      await fetchMessages(chat._id);

      if (currentChatIdRef.current === chat._id) {
        markMessagesRead(chat._id);
      }
    };

    load();

    return () => {
      currentChatIdRef.current = null;
    };
  }, [chat?._id, fetchMessages, markMessagesRead]);

  if (!chat) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Select a conversation to start chatting
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <ChatHeader
        chat={chat}
        currentUserId={currentUserId}
        onBack={onBack}
        isopen={isopen}
      />

      {isTyping ? (
        <div className="border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          Typing...
        </div>
      ) : null}

      <MessageList
        messages={messages}
        loadingMessages={loadingMessages}
        loadingMore={useChatStore.getState().loadingMore}
        onLoadMore={() => loadMoreMessages()}
        currentUserId={currentUserId}
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
