import React, { memo } from "react";
import { Circle, Clock } from "lucide-react";
import { useChatStore } from "@/store/chatStore";

const ChatCard = ({ chat, currentUserId, selectedChatId, onSelectChat }) => {
  const onlineUserIds = useChatStore((state) => state.onlineUserIds) || [];

  const otherMember = chat.members?.find(
    (member) =>
      member?.user?._id?.toString() !== currentUserId &&
      member?.user?.id?.toString() !== currentUserId
  );

  const displayUser = otherMember?.user || chat.members?.[0]?.user;
  const displayUserId = (displayUser?._id || displayUser?.id || "").toString();

  const isOnline = onlineUserIds.includes(displayUserId);

  const lastSender = chat.lastMessage?.sender;
  const senderId = (typeof lastSender === "object" ? (lastSender?._id || lastSender?.id) : lastSender)?.toString() || "";

  const isMine = Boolean(senderId && currentUserId && senderId === currentUserId.toString());


  const isSystemMsg = chat.lastMessage?.type === "system";

  const message = isSystemMsg
    ? chat.lastMessage?.content || ""
    : isMine
    ? `You: ${chat.lastMessage?.content || ""}`
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
  const title = isGroup ? chat.name || "Group Chat" : (displayUser?.name || "Unknown User");

  return (
    <button
      onClick={() => onSelectChat(chat._id)}
      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
        selectedChatId === chat._id
          ? "border-primary bg-primary/10"
          : "border-transparent bg-card hover:border-border"
      }`}
    >
      <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
        {isGroup ? (
          <span className="font-bold text-sm">GRP</span>
        ) : displayUser?.avatar?.url ? (
          <img
            src={displayUser.avatar.url}
            className="absolute inset-0 h-full w-full rounded-full object-cover"
          />
        ) : (
          displayUser?.name?.charAt(0)?.toUpperCase() || "U"
        )}

        {!isGroup && isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex justify-between">
          <p className="truncate font-medium">
            {title}
          </p>


          <div className="flex gap-2">
            {time && (
              <span className="text-[10px] text-muted-foreground">
                {new Date(time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="truncate text-sm text-muted-foreground flex-1 pr-2">
            {message}
          </p>

          <div className="flex items-center gap-1.5 shrink-0">
            {unread > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-xs animate-bounce">
                {unread > 99 ? "99+" : unread}
              </span>
            ) : isOnline ? (
              <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" />
            ) : (
              <Clock className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

export default memo(ChatCard);