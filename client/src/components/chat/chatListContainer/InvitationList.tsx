import React from "react";
import InvitationCard from "./InvitationCard";
import { MailOpen, Loader2 } from "lucide-react";
import { Invitation } from "@/types";

export interface InvitationListProps {
  invitations: Invitation[];
  loading?: boolean;
  actionLoadingId?: string | null;
  onAccept: (invitationId: string) => Promise<any>;
  onReject: (invitationId: string) => Promise<any>;
}

function InvitationList({
  invitations,
  loading,
  actionLoadingId,
  onAccept,
  onReject,
}: InvitationListProps) {
  if (loading && (!invitations || invitations.length === 0)) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center"
      >
        <Loader2 className="mb-2 h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">Loading invitations...</p>
      </div>
    );
  }

  if (!invitations || !invitations.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border bg-card px-5 py-10 text-center">
        <div className="mb-3 grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <MailOpen aria-hidden="true" className="size-5" />
        </div>

        <h3 className="text-base font-semibold">No new invitations</h3>

        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Incoming chat invitations will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">New invitations</p>

        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {invitations.length}
        </span>
      </div>

      <div className="space-y-2">
        {invitations.map((item) => (
          <InvitationCard
            key={item._id}
            invitation={item}
            isProcessing={actionLoadingId === item._id}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))}
      </div>
    </div>
  );
}

export default InvitationList;
