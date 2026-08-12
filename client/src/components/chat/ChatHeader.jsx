import React from "react";
import { ArrowLeft, Users, Info } from "lucide-react";

function ChatHeader({
  chat,
  currentUserId,
  onBack,
  isopen,
}) {
  if (!chat) return null;

  const myId = currentUserId?.toString() || "";

  const isGroup = chat.type === "group";

  // GROUP CHAT
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

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Users className="h-5 w-5" />
          </div>

          <div>
            <h3 className="font-semibold">
              {chat.name || "Group"}
            </h3>

            <p className="text-sm text-muted-foreground">
              {memberCount}{" "}
              {memberCount === 1 ? "member" : "members"}
            </p>
          </div>
        </div>

       
        <button
          type="button"
          onClick={()=>{isopen(true)}}
          className="rounded-full p-2 hover:bg-muted transition-colors"
          title="Group Info"
        >
          <Info className="h-5 w-5 text-muted-foreground" />
        </button>
      </header>
    );
  }

  // DIRECT CHAT
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

  const isOnline = displayUser?.isOnline || false;

  return (
    <header className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-3">
        <button
          className="rounded-full p-2 hover:bg-muted md:hidden"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
          {displayUser?.name?.[0]?.toUpperCase() || "U"}
        </div>

        <div>
          <h3 className="font-semibold">
            {displayUser?.name || "Conversation"}
          </h3>

          <p className="text-sm text-muted-foreground">
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>
    </header>
  );
}

export default ChatHeader;