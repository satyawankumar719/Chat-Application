import User from "../models/User.js";
import Invitation from "../models/Invitation.js";
import Chat from "../models/Conversation.js";
import { isUserOnline } from "../socket/userManager.js";
import mongoose, { type Types } from "mongoose";

type UserId = string | Types.ObjectId;

export interface UpdateUserProfileInput {
  name?: string;
  bio?: string;
  avatarUrl?: string | null;
  avatarKey?: string | null;
}

export interface SearchUserResult {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
  phoneNumber?: string;
  avatar?: {
    url: string;
    publicId: string;
  } | string;
  isOnline: boolean;
  lastSeen?: Date;
  bio?: string;
  connectionStatus: "none" | "connected" | "pending_sent" | "pending_received" | "cooldown";
  pendingInvitationId: Types.ObjectId | string | null;
  cooldownUntil: Date | null;
}

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export const searchUsers = async (
  currentUserId: UserId,
  searchQuery?: string
): Promise<SearchUserResult[]> => {
  const currentObjId = mongoose.Types.ObjectId.isValid(currentUserId.toString())
    ? new mongoose.Types.ObjectId(currentUserId.toString())
    : currentUserId;

  const filter: any = {
    _id: { $ne: currentObjId },
  };

  if (searchQuery && searchQuery.trim()) {
    const sanitizedQuery = searchQuery.trim();
    const queryRegex = new RegExp(escapeRegex(sanitizedQuery), "i");
    filter.$or = [
      { name: queryRegex },
      { email: queryRegex },
      { phoneNumber: queryRegex }
    ];
  }

  const users = await User.find(filter)
    .select("name email phoneNumber avatar isOnline lastSeen bio")
    .limit(30);

  if (users.length === 0) {
    return [];
  }

  const userIds = users.map((u) => u._id);

  const chats = await Chat.find({
    type: "direct",
    "members.user": { $all: [currentUserId] },
    members: { $elemMatch: { user: { $in: userIds } } }
  });

  const connectedUserIds = new Set<string>();
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

  const userResults: SearchUserResult[] = users.map((user) => {
    const candidateId = user._id.toString();

    let connectionStatus: SearchUserResult["connectionStatus"] = "none";
    let pendingInvitationId: Types.ObjectId | string | null = null;
    let cooldownUntil: Date | null = null;

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
          pendingInvitationId = invitation._id as Types.ObjectId;
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
      _id: user._id as Types.ObjectId,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      avatar: user.avatar,
      isOnline: isUserOnline(user._id.toString()),
      lastSeen: user.lastSeen,
      bio: user.bio,
      connectionStatus,
      pendingInvitationId,
      cooldownUntil
    };
  });

  return userResults;
};

export const getUserProfileService = async (userId: UserId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw { status: 404, message: "User not found." };
  }
  return user;
};

export const updateUserProfileService = async (
  userId: UserId,
  { name, bio, avatarUrl, avatarKey }: UpdateUserProfileInput
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw { status: 404, message: "User not found." };
  }

  if (name && typeof name === "string" && name.trim()) {
    user.name = name.trim();
  }

  if (bio !== undefined && typeof bio === "string") {
    user.bio = bio.trim();
  }

  if (avatarUrl) {
    user.avatar = {
      url: avatarUrl,
      publicId: avatarKey || user.avatar?.publicId || "",
    };
  }

  await user.save();

  return User.findById(userId).select("-password");
};
