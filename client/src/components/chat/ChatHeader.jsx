import React from "react";
import { ArrowLeft } from "lucide-react";

function ChatHeader({ chat, currentUserId, onBack }) {
  if (!chat) return null;

  const myId = currentUserId ? currentUserId.toString() : "";
  let otherUser = null;

  if (chat.members && Array.isArray(chat.members)) {
    for (let i = 0; i < chat.members.length; i++) {
      const member = chat.members[i];
      if (member.user) {
        const memberId = (member.user._id || member.user.id || "").toString();
        if (memberId !== myId) {
          otherUser = member.user;
          break;
        }
      }
    }
  }

  const displayUser = otherUser || (chat.members && chat.members[0] ? chat.members[0].user : null);
  const isOnline = displayUser ? displayUser.isOnline : false;

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
