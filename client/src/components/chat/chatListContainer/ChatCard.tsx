import React, { memo } from "react";
import { Check, CheckCheck } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { Chat } from "@/types";
import { getOtherUser, getResolvedCurrentUserId } from "@/lib/chatHelpers";

export interface ChatCardProps {
  chat: Chat;
  currentUserId?: string | null;
  selectedChatId?: string | null;
  onSelectChat: (chatId: string) => void;
}

const ChatCard = ({
  chat,
  currentUserId: currentUserIdProp,
  selectedChatId,
  onSelectChat,
}: ChatCardProps) => {
  const currentUserId = getResolvedCurrentUserId(currentUserIdProp);

  const displayUser = getOtherUser(chat, currentUserId);
  const displayUserId = (displayUser?._id || displayUser?.id || "").toString();

  const isOnlineInStore = useChatStore(
    React.useCallback(
      (state) => (displayUserId ? state.onlineUserIds?.includes(displayUserId) : false),
      [displayUserId]
    )
  );
  const isOnline = Boolean(isOnlineInStore);

  const lastSender = chat.lastMessage?.sender;
  const senderId =
    (typeof lastSender === "object" ? lastSender?._id || lastSender?.id : lastSender)?.toString() ||
    "";

  const isMine = Boolean(senderId && currentUserId && senderId === currentUserId);
  const isSystemMsg = chat.lastMessage?.type === "system";

  const message = isSystemMsg
    ? chat.lastMessage?.content || ""
    : chat.lastMessage?.content || "Start a conversation";

  const time = chat.lastMessage?.createdAt || chat.updatedAt;

  let unread = 0;
  if (chat.unreadCount && currentUserId) {
    if (typeof chat.unreadCount.get === "function") {
      unread = chat.unreadCount.get(currentUserId) || 0;
    } else if (typeof chat.unreadCount === "object") {
      unread = chat.unreadCount[currentUserId] || 0;
    }
  }

  const isGroup = chat.type === "group";
  const title = isGroup ? chat.name || "Group Chat" : displayUser?.name || "Unknown User";
  const avatarUrl =
    typeof displayUser?.avatar === "string" ? displayUser.avatar : displayUser?.avatar?.url;
  const isSelected = selectedChatId === chat._id;

  return (
    <button
      onClick={() => onSelectChat(chat._id)}
      className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors cursor-pointer select-none ${
        isSelected
          ? "bg-muted/80 dark:bg-muted/50 border-l-4 border-primary pl-2.5"
          : "hover:bg-muted/40"
      }`}
    >
      {/* WhatsApp Circular Avatar with Online Indicator */}
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
        {isGroup ? (
          <span className="font-bold text-xs">GRP</span>
        ) : avatarUrl ? (
          <img
            src={avatarUrl}
            className="absolute inset-0 h-full w-full rounded-full object-cover"
            alt={title}
          />
        ) : (
          displayUser?.name?.charAt(0)?.toUpperCase() || "U"
        )}

        {!isGroup && isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500 ring-2 ring-emerald-500/20" />
        )}
      </div>

      {/* WhatsApp Message Metadata & Snippet */}
      <div className="min-w-0 flex-1">
        <div className="flex justify-between items-baseline mb-0.5">
          <p className="truncate font-semibold text-sm text-foreground">{title}</p>

          {time && (
            <span
              className={`text-[11px] shrink-0 font-medium ${unread > 0 ? "text-primary font-bold" : "text-muted-foreground"}`}
            >
              {new Date(time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {isMine &&
              !isSystemMsg &&
              (chat.lastMessage?.status === "read" ? (
                <CheckCheck className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              ) : chat.lastMessage?.status === "delivered" ? (
                <CheckCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ))}
            <p className="truncate text-xs text-muted-foreground">{message}</p>
          </div>

          {unread > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-xs shrink-0">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default memo(ChatCard);
