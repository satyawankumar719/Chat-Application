import Invitation from "../models/Invitation.js";
import User from "../models/User.js";
import Chat from "../models/Conversation.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import { getSocketByUserId } from "../socket/userManager.js";

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
    type: "direct",
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
    type: "direct",
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

  const populatedInvitation = await invitation.populate("invitedBy receiver", "name email avatar bio phoneNumber");

  const receiverSocket = getSocketByUserId(receiverId.toString());
  if (receiverSocket) {
    receiverSocket.emit("invitation_received", { invitation: populatedInvitation });
  }

  return {
    invitation: populatedInvitation,
    notification
  };
};

export const sendGroupInvitationService = async (invitedBy, groupId, receiverId, message = "") => {
  if (invitedBy.toString() === receiverId.toString()) {
    throw { status: 400, message: "You cannot invite yourself to a group." };
  }

  const receiver = await User.findById(receiverId);
  if (!receiver || !receiver.isVerified) {
    throw { status: 404, message: "User not found or unverified." };
  }

  const sender = await User.findById(invitedBy);

  const group = await Chat.findOne({
    _id: groupId,
    type: "group",
    isActive: true
  });

  if (!group) {
    throw { status: 404, message: "Group chat not found." };
  }

  const isSenderMember = group.members.some((m) => m.user.toString() === invitedBy.toString());
  if (!isSenderMember) {
    throw { status: 403, message: "You must be a member of this group to send invitations." };
  }

  const isReceiverMember = group.members.some((m) => m.user.toString() === receiverId.toString());
  if (isReceiverMember) {
    throw { status: 400, message: "This user is already a member of the group." };
  }

  const existingPending = await Invitation.findOne({
    invitedBy,
    receiver: receiverId,
    type: "group",
    group: groupId,
    status: "pending"
  });

  if (existingPending) {
    throw { status: 400, message: "An invitation to this group has already been sent to this user." };
  }

  const invitation = await Invitation.create({
    invitedBy,
    receiver: receiverId,
    type: "group",
    group: groupId,
    status: "pending",
    message: message || `Join group "${group.name}"`
  });

  await Notification.create({
    sender: invitedBy,
    receiver: receiverId,
    type: "invitation",
    title: "Group Chat Invitation",
    body: `${sender.name} invited you to join group "${group.name}".`,
    data: {
      invitation: invitation._id,
      chat: group._id
    }
  });

  const populatedInvitation = await Invitation.findById(invitation._id)
    .populate("invitedBy receiver", "name email avatar bio phoneNumber")
    .populate("group", "name description avatar type");

  const receiverSocket = getSocketByUserId(receiverId.toString());
  if (receiverSocket) {
    receiverSocket.emit("invitation_received", { invitation: populatedInvitation });
  }

  return populatedInvitation;
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

  const currentUser = await User.findById(currentUserId);
  let populatedChat = null;

  if (invitation.type === "group" && invitation.group) {
    const group = await Chat.findOne({
      _id: invitation.group,
      type: "group",
      isActive: true
    });

    if (!group) {
      throw { status: 404, message: "Group chat no longer exists." };
    }

    const isMember = group.members.some(
      (m) => m.user.toString() === currentUserId.toString()
    );

    if (!isMember) {
      group.members.push({
        user: currentUserId,
        role: "member",
        joinedAt: new Date()
      });
      await group.save();

      const systemMsg = await Message.create({
        chat: group._id,
        sender: currentUserId,
        type: "system",
        content: `${currentUser.name} joined the group via invitation`,
        status: "read"
      });

      await Chat.findByIdAndUpdate(group._id, {
        lastMessage: systemMsg._id,
        updatedAt: new Date()
      });

      const populatedSystemMsg = await Message.findById(systemMsg._id).populate(
        "sender",
        "name email avatar"
      );

      populatedChat = await Chat.findById(group._id)
        .populate("members.user", "name email phoneNumber avatar isOnline lastSeen bio")
        .populate("createdBy", "name email avatar");

      const allMemberIds = group.members.map((m) => m.user.toString());
      allMemberIds.forEach((id) => {
        const socket = getSocketByUserId(id.toString());
        socket?.emit("group_updated", {
          group: populatedChat,
          systemMessage: populatedSystemMsg
        });
      });
    } else {
      populatedChat = await Chat.findById(group._id)
        .populate("members.user", "name email phoneNumber avatar isOnline lastSeen bio")
        .populate("createdBy", "name email avatar");
    }
  } else {
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

    populatedChat = await Chat.findById(chat._id).populate(
      "members.user",
      "name email avatar isOnline lastSeen phoneNumber"
    );
  }

  await Notification.create({
    sender: currentUserId,
    receiver: invitation.invitedBy,
    type: "invitation_accepted",
    title: "Invitation Accepted",
    body: `${currentUser.name} accepted your invitation!`,
    data: {
      chat: populatedChat._id
    }
  });

  const inviterSocket = getSocketByUserId(invitation.invitedBy.toString());
  if (inviterSocket) {
    inviterSocket.emit("invitation_accepted", { invitation, chat: populatedChat });
  }

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

  await Notification.create({
    sender: currentUserId,
    receiver: invitation.invitedBy,
    type: "invitation_rejected",
    title: "Invitation Rejected",
    body: `${currentUser.name} declined your invitation.`
  });

  const inviterSocket = getSocketByUserId(invitation.invitedBy.toString());
  if (inviterSocket) {
    inviterSocket.emit("invitation_rejected", { invitation });
  }

  return {
    invitation
  };
};

export const getPendingInvitationsService = async (currentUserId) => {
  const pendingInvitations = await Invitation.find({
    receiver: currentUserId,
    status: "pending"
  })
    .populate("invitedBy", "name email avatar phoneNumber bio")
    .populate("group", "name description avatar type");

  return pendingInvitations;
};