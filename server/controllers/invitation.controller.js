import {
  sendInvitationService,
  acceptInvitationService,
  rejectInvitationService,
  getPendingInvitationsService
} from "../services/invitation.service.js";
import { getSocketByUserId } from "../socket/socketHandler.js";

export const handleSendInvitation = async (req, res, next) => {
  try {
        const { receiverId, message } = req.body;
    const invitedBy = req.user.id;

    const result = await sendInvitationService(invitedBy, receiverId, message);

    const receiverSocket = getSocketByUserId(receiverId);
    if (receiverSocket) {
      receiverSocket.emit("invitation_received", {
        invitation: result.invitation,
        notification: result.notification
      });
    }

    return res.status(201).json({
      success: true,
      message: "Invitation sent successfully.",
      data: result.invitation
    });
  } catch (error) {
    next(error);
  }
};

export const handleAcceptInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    const result = await acceptInvitationService(id, currentUserId);

    const senderSocket = getSocketByUserId(result.invitation.invitedBy);
    if (senderSocket) {
      senderSocket.emit("invitation_accepted", {
        invitation: result.invitation,
        chat: result.chat
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invitation accepted successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const handleRejectInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    const result = await rejectInvitationService(id, currentUserId);

    // Socket notification to sender if online
    const senderSocket = getSocketByUserId(result.invitation.invitedBy);
    if (senderSocket) {
      senderSocket.emit("invitation_rejected", {
        invitation: result.invitation
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invitation rejected.",
      data: result.invitation
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetPendingInvitations = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const invitations = await getPendingInvitationsService(currentUserId);

    return res.status(200).json({
      success: true,
      data: invitations
    });
  } catch (error) {
    next(error);
  }
};
