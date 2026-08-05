import React from "react";
import InvitationCard from "./InvitationCard";
import {useChatStore} from "../../../store/chatStore";
import { MailOpen } from "lucide-react";
function InvitationList({
  invitations,
  loading,
  onAccept,
  onReject,
}) {

 
  if (!invitations.length) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <MailOpen className="h-6 w-6 text-muted-foreground" />
      </div>

      <h3 className="text-base font-semibold">
        No new invitations
      </h3>

      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        You don't have any pending invitations right now. New invitations
        will appear here when someone invites you.
      </p>
    </div>
  );
}
  return (
    <div className="rounded-xl border border-amber-400/40 bg-amber-50 p-2 dark:bg-amber-950/30">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-400">
          New invitations
        </p>

        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          {invitations.length}
        </span>
      </div>


      <div className="space-y-2">
        {invitations.map((item) => (
          <InvitationCard
            key={item._id}
            invitation={item}
            loading={loading}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))}
      </div>
    </div>
  );
}

export default InvitationList;