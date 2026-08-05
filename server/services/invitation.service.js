import Invitation from "../models/Invitation.js";
import User from "../models/User.js";
import Chat from "../models/Conversation.js";
import Notification from "../models/Notification.js";

export const sendInvitationService = async (invitedBy, receiverId, message = "") => {
  if (invitedBy.toString() === receiverId.toString()) {
    throw { status: 400, message: "You cannot send an invitation to yourself." };
  }
const receiver = await User.findById(receiverId);
  if (!receiver || !receiver.isVerified) {
    throw { status: 404, message: "User not found or unverified." };
  }
 const sender = await User.findById(invitedBy);
const existingChat = await Chat.findOne({
type: "direct",
    "members.user": { $all: [invitedBy, receiverId] }
  });
 
  if (existingChat) {
    throw { status: 400, message: "You are already connected with this user." };
  }
 
  const existingPending = await Invitation.findOne({
    $or: [
      { invitedBy, receiver: receiverId, status: "pending" },
      { invitedBy: receiverId, receiver: invitedBy, status: "pending" }
    ]
  });

  if (existingPending) {
    if (existingPending.invitedBy.toString() === invitedBy.toString()) {
      throw { status: 400, message: "An invitation has already been sent to this user." };
    } else {
      throw { status: 400, message: "This user has already sent you an invitation." };
    }
  }

 
  const COOLDOWN_MS = 24 * 60 * 60 * 1000;
  const lastRejected = await Invitation.findOne({
    invitedBy,
    receiver: receiverId,
    status: "rejected"
  }).sort({ updatedAt: -1 });

  if (lastRejected) {
    const rejectedAtTime = new Date(lastRejected.rejectedAt || lastRejected.updatedAt).getTime();
    const timeDiff = Date.now() - rejectedAtTime;
    if (timeDiff < COOLDOWN_MS) {
      const remainingHours = Math.ceil((COOLDOWN_MS - timeDiff) / (1000 * 60 * 60));
      throw {
        status: 400,
        message: `You cannot send another invitation to this user for ${remainingHours} more hour(s) after rejection.`
      };
    }
  } 


  let invitation;
  if (lastRejected) {
    lastRejected.status = "pending";
    lastRejected.rejectedAt = null;
    lastRejected.message = message;
    await lastRejected.save();
    invitation = lastRejected;
  } else {
    invitation = await Invitation.create({
      invitedBy,
      receiver: receiverId,
      type: "direct",
      status: "pending",
      message
    });
  }

  const notification = await Notification.create({
    sender: invitedBy,
    receiver: receiverId,
    type: "invitation",
    title: "New Chat Invitation",
    body: `${sender.name} invited you to start a private conversation.`,
    data: {
      invitation: invitation._id
    }
  });

  return {
    invitation: await invitation.populate("invitedBy receiver", "name email avatar bio phoneNumber"),
    notification
  };
};

export const acceptInvitationService = async (invitationId, currentUserId) => {
  const invitation = await Invitation.findById(invitationId);

  if (!invitation || invitation.status !== "pending") {
    throw { status: 404, message: "Pending invitation not found." };
  }

  if (invitation.receiver.toString() !== currentUserId.toString()) {
    throw { status: 403, message: "You are not authorized to respond to this invitation." };
  }

  invitation.status = "accepted";
  await invitation.save();

  let chat = await Chat.findOne({
    type: "direct",
    "members.user": { $all: [invitation.invitedBy, currentUserId] }
  });

  if (!chat) {
    chat = await Chat.create({
      type: "direct",
      members: [
        { user: invitation.invitedBy, role: "member" },
        { user: currentUserId, role: "member" }
      ],
      createdBy: invitation.invitedBy
    });
  }

  const currentUser = await User.findById(currentUserId);

  await Notification.create({
    sender: currentUserId,
    receiver: invitation.invitedBy,
    type: "invitation_accepted",
    title: "Invitation Accepted",
    body: `${currentUser.name} accepted your invitation!`,
    data: {
      chat: chat._id
    }
  });

  const populatedChat = await Chat.findById(chat._id).populate(
    "members.user",
    "name email avatar isOnline lastSeen phoneNumber"
  );

  return {
    invitation,
    chat: populatedChat
  };
};

export const rejectInvitationService = async (invitationId, currentUserId) => {
  const invitation = await Invitation.findById(invitationId);

  if (!invitation || invitation.status !== "pending") {
    throw { status: 404, message: "Pending invitation not found." };
  }

  if (invitation.receiver.toString() !== currentUserId.toString()) {
    throw { status: 403, message: "You are not authorized to respond to this invitation." };
  }

  invitation.status = "rejected";
  invitation.rejectedAt = new Date();
  await invitation.save();

  const currentUser = await User.findById(currentUserId);

  // Notify sender of rejection
  await Notification.create({
    sender: currentUserId,
    receiver: invitation.invitedBy,
    type: "invitation_rejected",
    title: "Invitation Rejected",
    body: `${currentUser.name} declined your chat invitation.`
  });

  return {
    invitation
  };
};

export const getPendingInvitationsService = async (currentUserId) => {
  const pendingInvitations = await Invitation.find({
    receiver: currentUserId,
    status: "pending"
  }).populate("invitedBy", "name email avatar phoneNumber bio");

  return pendingInvitations;
};