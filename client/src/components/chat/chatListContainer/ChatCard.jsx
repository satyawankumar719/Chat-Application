import React ,{memo} from "react";
import { Circle, Clock } from "lucide-react";

const ChatCard =  ({ chat, currentUserId, selectedChatId, onSelectChat }) => {
    const otherMember = chat.members?.find(
      (member) =>
        member?.user?._id?.toString() !== currentUserId &&
        member?.user?.id?.toString() !== currentUserId
    );

    const displayUser = otherMember?.user || chat.members?.[0]?.user;

    const senderId =chat.lastMessage?.sender?._id?.toString() ||
      chat.lastMessage?.sender?.id?.toString();

    const isMine = senderId === currentUserId;

    const message = isMine
      ? `You: ${chat.lastMessage?.content || ""}`
      : chat.lastMessage?.content || "Start a conversation";

    const time = chat.lastMessage?.createdAt || chat.updatedAt;


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
          {displayUser?.avatar?.url ? (
            <img
              src={displayUser.avatar.url}
              className="absolute inset-0 h-full w-full rounded-full object-cover"
            />
          ) : (
            displayUser?.name?.charAt(0)?.toUpperCase() || "U"
          )}

          {displayUser?.isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-green-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex justify-between">
            <p className="truncate font-medium">
              {displayUser?.name || "Unknown"}
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

          <div className="flex justify-between">
            <p className="truncate text-sm text-muted-foreground">
              {message}
            </p>

            {displayUser?.isOnline ? (
              <Circle className="h-3 w-3 fill-green-500 text-green-500" />
            ) : (
              <Clock className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>
    );
  }


export default memo(ChatCard);