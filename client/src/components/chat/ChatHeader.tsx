import { useEffect, useState, type RefObject } from "react";
import { Menu } from "@base-ui/react/menu";
import { ArrowLeft, Ellipsis, Users } from "lucide-react";
import type { Chat, User } from "@/types";

export interface ChatHeaderProps {
  chat: Chat | null;
  displayUser: User | null;
  isOnline: boolean;
  statusText: string;
  onBack?: () => void;
  onOpenInfo: (trigger?: HTMLButtonElement) => void;
  infoTriggerRef: RefObject<HTMLButtonElement | null>;
  isTyping?: boolean;
}

function ChatHeader({
  chat,
  displayUser,
  isOnline,
  statusText,
  onBack,
  onOpenInfo,
  infoTriggerRef,
  isTyping,
}: ChatHeaderProps) {
  const chatId = chat?._id;
  const [menuChatId, setMenuChatId] = useState<string | null>(null);

  useEffect(() => {
    setMenuChatId((openChatId) => (openChatId === chatId ? openChatId : null));
  }, [chatId]);

  if (!chat) return null;

  const isGroup = chat.type === "group";
  const infoMenu = (
    <Menu.Root
      modal={false}
      open={menuChatId === chat._id}
      onOpenChange={(open) => setMenuChatId(open ? chat._id : null)}
    >
      <Menu.Trigger
        ref={infoTriggerRef}
        aria-label="Chat options"
        className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-muted"
      >
        <Ellipsis className="h-5 w-5" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={6} className="z-40">
          <Menu.Popup className="min-w-36 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md">
            <Menu.Item
              onClick={() => onOpenInfo()}
              className="cursor-pointer rounded-md px-3 py-2 text-sm outline-none data-highlighted:bg-muted"
            >
              {isGroup ? "Group Info" : "Contact Info"}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );

  if (isGroup) {
    const memberCount = chat.members?.length || 0;

    return (
      <header className="flex items-center justify-between gap-2 border-b p-4">
        <div className="flex min-w-0 items-center gap-3">
          <button className="shrink-0 rounded-full p-2 hover:bg-muted md:hidden" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={(event) => onOpenInfo(event.currentTarget)}
            className="group flex min-w-0 cursor-pointer items-center gap-3 text-left transition-opacity hover:opacity-90"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary group-hover:bg-primary/25 transition-colors">
              <Users className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-semibold group-hover:text-primary transition-colors">
                {chat.name || "Group"}
              </h3>

              <p className="text-sm text-muted-foreground">
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </p>
            </div>
          </button>
        </div>

        {infoMenu}
      </header>
    );
  }

  const avatarUrl =
    typeof displayUser?.avatar === "string" ? displayUser.avatar : displayUser?.avatar?.url;

  return (
    <header className="flex items-center justify-between gap-2 border-b p-4 bg-card/50 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3">
        <button className="shrink-0 rounded-full p-2 hover:bg-muted md:hidden" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          aria-label={
            displayUser?.name ? `View profile for ${displayUser.name}` : "View contact profile"
          }
          aria-haspopup="dialog"
          onClick={(event) => onOpenInfo(event.currentTarget)}
          className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary/15 font-semibold text-primary hover:ring-2 hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-primary"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              className="absolute inset-0 h-full w-full rounded-full object-cover"
              alt=""
            />
          ) : (
            displayUser?.name?.[0]?.toUpperCase() || "U"
          )}

          {isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse" />
          )}
        </button>

        <div className="min-w-0">
          <h3 className="truncate font-semibold">{displayUser?.name || "Conversation"}</h3>

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
      {infoMenu}
    </header>
  );
}

export default ChatHeader;
