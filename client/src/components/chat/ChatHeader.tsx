import React from "react";
import { ArrowLeft, Users, Info } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { Chat, User } from "@/types";

export interface ChatHeaderProps {
  chat: Chat | null;
  currentUserId?: string | null;
  onBack?: () => void;
  setShowGroupInfo?: (show: boolean) => void;
  isTyping?: boolean;
}

function ChatHeader({
  chat,
  currentUserId,
  onBack,
  setShowGroupInfo,
  isTyping,
}: ChatHeaderProps) {
  const onlineUserIds = useChatStore((state) => state.onlineUserIds);

  if (!chat) return null;

  const myId = currentUserId?.toString() || "";

  const handleOpen = () => {
    if (setShowGroupInfo) {
      setShowGroupInfo(true);
    }
  };

  const isGroup = chat.type === "group";

  if (isGroup) {
    const memberCount = chat.members?.length || 0;

    return (
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <button
            className="rounded-full p-2 hover:bg-muted md:hidden"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div
            onClick={handleOpen}
            className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity"
            title="Open Group Info"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary group-hover:bg-primary/25 transition-colors">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                {chat.name || "Group"}
              </h3>

              <p className="text-sm text-muted-foreground">
                {memberCount}{" "}
                {memberCount === 1 ? "member" : "members"}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpen}
          className="rounded-full p-2 hover:bg-muted transition-colors"
          title="Group Info"
        >
          <Info className="h-5 w-5 text-muted-foreground" />
        </button>
      </header>
    );
  }

  let otherUser: User | null = null;

  if (Array.isArray(chat.members)) {
    for (const member of chat.members) {
      const userObj = typeof member.user === "object" ? (member.user as User) : null;
      if (!userObj) continue;

      const memberId = (userObj._id || userObj.id || "").toString();

      if (memberId !== myId) {
        otherUser = userObj;
        break;
      }
    }
  }

  const displayUser =
    otherUser ||
    (typeof chat.members?.[0]?.user === "object" ? (chat.members[0].user as User) : null);

  const otherUserId = (displayUser?._id || displayUser?.id || "").toString();
  const isOnline = onlineUserIds.includes(otherUserId);

  let statusText = "Offline";
  if (isOnline) {
    statusText = "Online";
  } else if (displayUser?.lastSeen) {
    const timeStr = new Date(displayUser.lastSeen).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    statusText = `Last seen at ${timeStr}`;
  }

  const avatarUrl = typeof displayUser?.avatar === "string" ? displayUser.avatar : displayUser?.avatar?.url;

  return (
    <header className="flex items-center justify-between border-b p-4 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          className="rounded-full p-2 hover:bg-muted md:hidden"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              className="absolute inset-0 h-full w-full rounded-full object-cover"
              alt={displayUser?.name}
            />
          ) : (
            displayUser?.name?.[0]?.toUpperCase() || "U"
          )}

          {isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse" />
          )}
        </div>

        <div>
          <h3 className="font-semibold">
            {displayUser?.name || "Conversation"}
          </h3>

          <p className="text-xs text-muted-foreground">
            {isTyping ? (
              <span className="flex items-center gap-1.5 text-primary font-medium">
                typing
                <span className="flex gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                </span>
              </span>
            ) : (
              statusText
            )}
          </p>
        </div>
      </div>
    </header>
  );
}

export default ChatHeader;
