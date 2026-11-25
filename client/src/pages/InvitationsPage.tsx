import React, { useEffect } from "react";
import { UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import InvitationList from "@/components/chat/chatListContainer/InvitationList";
import { useInvitationStore } from "@/store/invitationStore";

function InvitationsPage() {
  const navigate = useNavigate();
  const {
    pendingInvitations,
    loadingInvitations,
    actionLoadingId,
    acceptInvitation,
    rejectInvitation,
    fetchPendingInvitations,
  } = useInvitationStore();

  useEffect(() => {
    fetchPendingInvitations();
  }, [fetchPendingInvitations]);

  return (
    <div className="h-full w-full overflow-y-auto px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Invitations</h1>
            <p className="mt-1 text-sm text-muted-foreground">People who want to chat with you</p>
          </div>
          <Button
            className="min-h-11 gap-2 rounded-xl px-4"
            onClick={() => navigate("/chats/create")}
          >
            <UserPlus aria-hidden="true" className="size-4" />
            Invite someone
          </Button>
        </div>

        <InvitationList
          invitations={pendingInvitations}
          loading={loadingInvitations}
          actionLoadingId={actionLoadingId}
          onAccept={acceptInvitation}
          onReject={rejectInvitation}
        />
      </div>
    </div>
  );
}

export default InvitationsPage;
