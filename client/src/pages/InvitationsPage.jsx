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
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invitations</h1>
          <p className="text-sm text-muted-foreground">
            People who want to chat with you
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/chats/create")}>
          <UserPlus className="mr-2 h-4 w-4" />
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
  );
}

export default InvitationsPage;
