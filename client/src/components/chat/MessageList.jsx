import React, { memo, useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import { ArrowDown } from "lucide-react";


function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function MessageList({
  messages,
  loadingMessages,
  loadingMore,
  onLoadMore,
  currentUserId,
  firstUnreadId,
  unreadCount = 0,
}) {
  const messagesEndRef = useRef(null);
  const unreadRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const initialScrolledRef = useRef(false);
  const isScrolledUpRef = useRef(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const rawChat = messages.length > 0 ? messages[0]?.chat : null;
  const currentChatId = (
    rawChat && typeof rawChat === "object"
      ? (rawChat._id || rawChat.id || "")
      : (rawChat || "")
  ).toString();


  useEffect(() => {
    initialScrolledRef.current = false;
    isScrolledUpRef.current = false;
    setShowScrollBottom(false);
  }, [currentChatId]);

  useEffect(() => {
    if (!messages.length) return;

    if (loadingMoreRef.current) return;

    if (!initialScrolledRef.current) {
      initialScrolledRef.current = true;

      const timer = setTimeout(() => {
        if (firstUnreadId && unreadRef.current) {
          unreadRef.current.scrollIntoView({ behavior: "auto", block: "start" });
        } else if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "auto" });
        }
      }, 50);

      return () => clearTimeout(timer);
    }

    const lastMessage = messages[messages.length - 1];
    const lastSender = lastMessage?.sender;
    const senderId = (typeof lastSender === "object" ? (lastSender?._id || lastSender?.id) : lastSender)?.toString() || "";

    const isMine = Boolean(senderId && currentUserId && senderId === currentUserId.toString());

    if (!isScrolledUpRef.current || isMine) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, firstUnreadId, currentUserId]);

  const handleScroll = async () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const isScrolledUp = distanceFromBottom > 120;

    setShowScrollBottom(isScrolledUp);
    isScrolledUpRef.current = isScrolledUp;

    if (container.scrollTop <= 50 && onLoadMore && !loadingMore && !loadingMoreRef.current) {
      loadingMoreRef.current = true;
      const previousHeight = container.scrollHeight;

      try {
        await onLoadMore();
        requestAnimationFrame(() => {
          const newHeight = container.scrollHeight;
          container.scrollTop = newHeight - previousHeight;
        });
      } finally {
        loadingMoreRef.current = false;
      }
    }
  };

  const handleScrollToBottom = () => {
    if (firstUnreadId && unreadRef.current) {
      unreadRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loadingMessages) {
    return (
      <div className="flex-1 space-y-4 p-4 overflow-hidden">
        <div className="flex justify-start">
          <div className="h-10 w-48 animate-pulse rounded-2xl bg-muted/60" />
        </div>
        <div className="flex justify-end">
          <div className="h-12 w-56 animate-pulse rounded-2xl bg-primary/20" />
        </div>
        <div className="flex justify-start">
          <div className="h-16 w-64 animate-pulse rounded-2xl bg-muted/60" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-40 animate-pulse rounded-2xl bg-primary/20" />
        </div>
        <div className="flex justify-start">
          <div className="h-12 w-52 animate-pulse rounded-2xl bg-muted/60" />
        </div>
      </div>
    );
  }

  let lastDateString = null;

  return (
    <div className="relative flex-1 overflow-hidden">
      <main
        className="h-full overflow-y-auto p-4"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {loadingMore && (
          <div className="py-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading older messages...</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {messages.map((message) => {
            const mSender = message.sender;
            const mSenderId = (typeof mSender === "object" ? (mSender?._id || mSender?.id) : mSender)?.toString() || "";
            const isMine = mSenderId && currentUserId && mSenderId === currentUserId.toString();

            const msgId = (message._id || message.id)?.toString();
            const isFirstUnread = Boolean(firstUnreadId && msgId === firstUnreadId.toString());

            const messageDate = message.createdAt
              ? new Date(message.createdAt).toDateString()
              : null;
            let showDateDivider = false;

            if (messageDate && messageDate !== lastDateString) {
              showDateDivider = true;
              lastDateString = messageDate;
            }

            return (
              <React.Fragment key={msgId}>
                {showDateDivider && (
                  <div className="my-2 flex items-center justify-center">
                    <span className="rounded-full border bg-card/80 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-2xs backdrop-blur-xs">
                      {formatDateLabel(message.createdAt)}
                    </span>
                  </div>
                )}

                {isFirstUnread && (
                  <div
                    ref={unreadRef}
                    className="my-3 flex items-center justify-center gap-2 scroll-mt-6"
                  >
                    <div className="h-[1px] flex-1 bg-primary/30" />
                    <span className="rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-semibold text-primary shadow-2xs backdrop-blur-xs flex items-center gap-1.5 animate-pulse">
                      <span>Unread Messages</span>
                    </span>
                    <div className="h-[1px] flex-1 bg-primary/30" />
                  </div>
                )}

                <MessageBubble message={message} isMine={isMine} />
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>


      {showScrollBottom && (
        <button
          type="button"
          onClick={handleScrollToBottom}
          className="absolute bottom-4 right-6 flex items-center gap-2 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95 z-20 cursor-pointer"
          title="Scroll to latest message"
        >
          <ArrowDown className="h-4 w-4" />
          <span>Latest messages</span>
          {unreadCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-background px-1 text-[10px] font-bold text-foreground">
              {unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );

}

export default memo(MessageList);
