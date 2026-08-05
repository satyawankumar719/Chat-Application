import User from "../models/User.js";
import Invitation from "../models/Invitation.js";
import Chat from "../models/Conversation.js";

export const searchUsers = async (currentUserId, searchQuery) => {
  if (!searchQuery || !searchQuery.trim()) {
    return [];
  }

  const queryRegex = new RegExp(searchQuery.trim(), "i");

  const users = await User.find({
    _id: { $ne: currentUserId },
    isVerified: true,
    $or: [
      { name: queryRegex },
      { email: queryRegex },
      { phoneNumber: queryRegex }
    ]
  }).select("name email phoneNumber avatar isOnline lastSeen bio").limit(20);

  if (users.length === 0) {
    return [];
  }

  const userIds = users.map((u) => u._id);

  const chats = await Chat.find({
    type: "direct",
    "members.user": { $all: [currentUserId] },
    members: { $elemMatch: { user: { $in: userIds } } }
  });

  const connectedUserIds = new Set();
  chats.forEach((chat) => {
    chat.members.forEach((m) => {
      if (m.user.toString() !== currentUserId.toString()) {
        connectedUserIds.add(m.user.toString());
      }
    });
  });

  const invitations = await Invitation.find({
    $or: [
      { invitedBy: currentUserId, receiver: { $in: userIds } },
      { invitedBy: { $in: userIds }, receiver: currentUserId }
    ]
  }).sort({ updatedAt: -1 });

  const now = new Date();
  const ExpiryTime = 24 * 60 * 60 * 1000;

  const userResults = users.map((user) => {
    const candidateId = user._id.toString();

    let connectionStatus = "none";
    let pendingInvitationId = null;
    let cooldownUntil = null;

    if (connectedUserIds.has(candidateId)) {
      connectionStatus = "connected";
    } else {
      
      const invitation = invitations.find(
        (inv) =>
          inv.invitedBy.toString() === candidateId ||
          inv.receiver.toString() === candidateId
      );

      if (invitation) {
        if (invitation.status === "pending") {
          if (invitation.invitedBy.toString() === currentUserId.toString()) {
            connectionStatus = "pending_sent";
          } else {
            connectionStatus = "pending_received";
          }
          pendingInvitationId = invitation._id;
        } else if (invitation.status === "rejected" && invitation.invitedBy.toString() === currentUserId.toString()) {
          const rejectedAtTime = new Date(invitation.rejectedAt || invitation.updatedAt).getTime();
          if (now.getTime() - rejectedAtTime < ExpiryTime) {
            connectionStatus = "cooldown";
            cooldownUntil = new Date(rejectedAtTime + ExpiryTime);
          }
        }
      }
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      avatar: user.avatar,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      bio: user.bio,
      connectionStatus,
      pendingInvitationId,
      cooldownUntil
    };
  });

  return userResults;
};
