import React, { memo,useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";

function MessageList({
  messages,
  loadingMessages,
  loadingMore,
  onLoadMore,
  currentUserId,
}) {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const initialScrollRef = useRef(false);
 

  useEffect(() => {
    if (!messages.length) return;

    if (loadingMoreRef.current) return;

    messagesEndRef.current?.scrollIntoView({
      behavior: initialScrollRef.current ? "auto" : "smooth",
    });

    initialScrollRef.current = false;
  }, [messages]);

  useEffect(() => {
    return () => {
      initialScrollRef.current = true;
    };
  }, []);

  const handleScroll = async () => {
    const container = messagesContainerRef.current;

    if (!container || loadingMoreRef.current) return;

    if (container.scrollTop <= 50 && onLoadMore && !loadingMore) {
      loadingMoreRef.current = true;

      const previousHeight = container.scrollHeight;
    
      await onLoadMore();

      requestAnimationFrame(() => {
        const newHeight = container.scrollHeight;
        container.scrollTop = newHeight - previousHeight;
        loadingMoreRef.current = false;
      });
    }
  };

  if (loadingMessages) {
    return (<>
      
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading messages...
      </div></>
    );
  }

  return (
    <main
      className="flex-1 overflow-y-auto p-4"
      ref={messagesContainerRef}
      onScroll={handleScroll}
    >
      <div className="py-2 text-center text-xs text-muted-foreground">
        Loading older messages...
      </div>
      <div className="flex flex-col gap-3">
        {messages.map((message) => {
          const isMine =
            message.sender?._id === currentUserId ||
            message.sender?.id === currentUserId;

          return (
            <MessageBubble
              key={message._id || message.id}
              message={message}
              isMine={isMine}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </main>
  );
}

export default MessageList;
