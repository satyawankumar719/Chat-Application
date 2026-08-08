import React from "react";
import { Check, X } from "lucide-react";
import { Loader } from "lucide-react";
function InvitationCard({
  invitation,
  loading,
  onAccept,
  onReject,
}) {
  return (
    <div className="rounded-lg border border-amber-300/50 bg-background/80 p-2">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
          {invitation.invitedBy?.name
            ?.charAt(0)
            ?.toUpperCase() || "?"}
        </div>

        <p className="truncate text-sm font-medium">
          {invitation.invitedBy?.name || "Someone"} invited you to chat
        </p>
      </div>

      {invitation.message && (
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {invitation.message}
        </p>
      )}

      <div className="mt-2 flex gap-2">
        <button
          onClick={() => onAccept(invitation._id)}
          disabled={loading}
          className="flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          Accept
        </button>

        <button
          onClick={() => onReject(invitation._id)}
          disabled={loading}
          className="flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs font-semibold disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
          Decline
        </button>
      </div>
    </div>
  );
}

export default InvitationCard;