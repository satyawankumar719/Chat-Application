import React from "react";
import { UserPlus } from "lucide-react";
import { User } from "@/types";
import { useChatStore } from "@/store/chatStore";
import { Button } from "@/components/ui/button";

export interface SearchResultCardProps {
  person: User & { connectionStatus?: string };
  onInvite: (id: string) => void;
}

function SearchResultCard({ person, onInvite }: SearchResultCardProps) {
  const id = (person._id || person.id || "").toString();
  const isOnline = useChatStore((state) => (id ? state.onlineUserIds?.includes(id) : false));
  const status = person.connectionStatus;
  const avatarUrl = typeof person.avatar === "string" ? person.avatar : person.avatar?.url;

  const disabled =
    status === "connected" ||
    status === "pending_sent" ||
    status === "pending_received" ||
    status === "cooldown";

  let label = "Invite";

  if (status === "connected") label = "Connected";
  else if (status === "pending_sent") label = "Pending";
  else if (status === "pending_received") label = "Check invites";
  else if (status === "cooldown") label = "Cooldown";

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-foreground/25 bg-background px-3 py-3 transition-colors hover:bg-muted/50 sm:px-4 dark:border-foreground/35">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="size-full rounded-full object-cover" />
          ) : (
            person.name?.charAt(0)?.toUpperCase() || "U"
          )}
          {isOnline && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-green-500" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{person.name}</p>
          <p className="truncate text-xs text-muted-foreground">{person.email}</p>
        </div>
      </div>

      {disabled ? (
        <span className="shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      ) : (
        <Button
          type="button"
          onClick={() => onInvite(id)}
          className="h-10 px-3"
          aria-label={`Invite ${person.name}`}
        >
          <UserPlus aria-hidden="true" className="size-4" />
          Invite
        </Button>
      )}
    </li>
  );
}

export default React.memo(SearchResultCard);
