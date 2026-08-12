import React from "react";
import { ArrowLeft, Users, Info } from "lucide-react";
import { useChatStore } from "@/store/chatStore";

function ChatHeader({
  chat,
  currentUserId,
  onBack,
  setShowGroupInfo,
}) {
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

  let otherUser = null;

  if (Array.isArray(chat.members)) {
    for (const member of chat.members) {
      if (!member.user) continue;

      const memberId = (
        member.user._id ||
        member.user.id ||
        ""
      ).toString();

      if (memberId !== myId) {
        otherUser = member.user;
        break;
      }
    }
  }

  const displayUser =
    otherUser ||
    chat.members?.[0]?.user ||
    null;

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
          {displayUser?.avatar?.url ? (
            <img
              src={displayUser.avatar.url}
              className="absolute inset-0 h-full w-full rounded-full object-cover"
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

          <p className="text-xs text-muted-foreground transition-all">
            {statusText}
          </p>
        </div>
      </div>
    </header>
  );
}

export default ChatHeader;