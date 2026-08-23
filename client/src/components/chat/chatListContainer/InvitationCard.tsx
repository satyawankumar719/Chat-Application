import React, { useState } from "react";
import { Check, X, Users, Loader2 } from "lucide-react";
import { Invitation } from "@/types";

export interface InvitationCardProps {
  invitation: Invitation;
  isProcessing?: boolean;
  onAccept: (invitationId: string) => Promise<any>;
  onReject: (invitationId: string) => Promise<any>;
}

function InvitationCard({
  invitation,
  isProcessing,
  onAccept,
  onReject,
}: InvitationCardProps) {
  const [actionState, setActionState] = useState<"accept" | "decline" | null>(null);
  const isGroup = invitation.type === "group";
  const groupName = invitation.group?.name;
  const senderName = invitation.invitedBy?.name || invitation.sender?.name || "Someone";

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actionState || isProcessing) return;
    setActionState("accept");
    try {
      await onAccept(invitation._id);
    } catch (err) {
      setActionState(null);
    }
  };

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actionState || isProcessing) return;
    setActionState("decline");
    try {
      await onReject(invitation._id);
    } catch (err) {
      setActionState(null);
    }
  };

  const isAccepting = actionState === "accept" || (Boolean(isProcessing) && actionState === null);
  const isDeclining = actionState === "decline";
  const isDisabled = actionState !== null || Boolean(isProcessing);

  return (
    <div className="rounded-lg border border-amber-300/50 bg-background/80 p-3 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
          {isGroup ? (
            <Users className="h-4 w-4 text-primary" />
          ) : (
            senderName?.charAt(0)?.toUpperCase() || "?"
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                isGroup
                  ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
              }`}
            >
              {isGroup ? "Group Invite" : "Direct Invite"}
            </span>
          </div>

          <p className="mt-1 text-sm font-medium text-foreground">
            {isGroup ? (
              <>
                <span className="font-semibold">{senderName}</span> invited
                you to join group{" "}
                <span className="font-semibold text-primary">
                  "{groupName || "Group"}"
                </span>
              </>
            ) : (
              <>
                <span className="font-semibold">{senderName}</span> invited
                you to chat
              </>
            )}
          </p>

          {invitation.message && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              "{invitation.message}"
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleAccept}
              disabled={isDisabled}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isAccepting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {isAccepting ? "Accepting..." : "Accept"}
            </button>

            <button
              type="button"
              onClick={handleReject}
              disabled={isDisabled}
              className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-muted disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isDeclining ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              {isDeclining ? "Declining..." : "Decline"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvitationCard;
