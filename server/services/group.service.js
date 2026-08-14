import Chat from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { getSocketByUserId } from "../socket/userManager.js";
import { logger } from "../logger.js";

function notifyGroupMembers(memberUserIds, eventName, payload) {
  memberUserIds.forEach((id) => {
    const socket = getSocketByUserId(id.toString());
    socket?.emit(eventName, payload);
  });
}

async function createSystemMessage(groupId, senderId, content) {
  try {
    const systemMessage = await Message.create({
      chat: groupId,
      sender: senderId,
      type: "system",
      content,
      status: "read",
    });

    await Chat.findByIdAndUpdate(groupId, {
      lastMessage: systemMessage._id,
      updatedAt: new Date(),
    });

    const populatedMessage = await Message.findById(systemMessage._id).populate(
      "sender",
      "name email avatar"
    );

    return populatedMessage;
  } catch (error) {
    logger.error("Failed to create system message:", error);
    return null;
  }
}

// Helper to get fully populated group document
async function getPopulatedGroup(groupId) {
  return Chat.findById(groupId)
    .populate("members.user", "name email phoneNumber avatar isOnline lastSeen bio")
    .populate("createdBy", "name email avatar");
}

// Helper to transfer group ownership to admin or first member if owner leaves or is removed
async function transferOwnershipIfNeeded(group, isOwnerTarget) {
  if (!isOwnerTarget || group.members.length === 0) return null;

  const nextOwner = group.members.find((m) => m.role === "admin") || group.members[0];
  nextOwner.role = "owner";
  group.createdBy = nextOwner.user;
  return User.findById(nextOwner.user);
}

export const createGroup = async (creatorId, { name, description, memberIds = [], avatar }) => {
  if (!name || !name.trim()) {
    throw new Error("Group name is required");
  }

  const creatorUser = await User.findById(creatorId);
  if (!creatorUser) {
    throw new Error("Creator user not found");
  }

  // Ensure unique member IDs excluding creator
  const uniqueMemberIds = Array.from(
    new Set(memberIds.map((id) => id.toString()))
  ).filter((id) => id !== creatorId.toString());

  const members = [
    { user: creatorId, role: "owner", joinedAt: new Date() },
    ...uniqueMemberIds.map((id) => ({
      user: id,
      role: "member",
      joinedAt: new Date(),
    })),
  ];

  const groupChat = await Chat.create({
    type: "group",
    name: name.trim(),
    description: description ? description.trim() : "",
    avatar: avatar || null,
    members,
    createdBy: creatorId,
    isActive: true,
  });

  const populatedGroup = await Chat.findById(groupChat._id)
    .populate("members.user", "name email phoneNumber avatar isOnline lastSeen bio")
    .populate("createdBy", "name email avatar");

  // Create system message
  const systemMsg = await createSystemMessage(
    groupChat._id,
    creatorId,
    `${creatorUser.name} created group "${name.trim()}"`
  );

  // Real-time notification to all members
  const allMemberIds = members.map((m) => m.user.toString());
  notifyGroupMembers(allMemberIds, "group_created", {
    group: populatedGroup,
    systemMessage: systemMsg,
  });

  return populatedGroup;
};

export const getUserGroups = async (userId) => {
  const groups = await Chat.find({
    type: "group",
    "members.user": userId,
    isActive: true,
  })
    .populate("members.user", "name email phoneNumber avatar isOnline lastSeen bio")
    .populate("createdBy", "name email avatar")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "name email avatar" },
    })
    .sort({ updatedAt: -1 });

  return groups;
};

export const getGroupById = async (userId, groupId) => {
  const group = await Chat.findOne({
    _id: groupId,
    type: "group",
    "members.user": userId,
    isActive: true,
  })
    .populate("members.user", "name email phoneNumber avatar isOnline lastSeen bio")
    .populate("createdBy", "name email avatar")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "name email avatar" },
    });

  if (!group) {
    throw new Error("Group not found or access denied");
  }

  return group;
};

export const updateGroupInfo = async (userId, groupId, { name, description, avatar }) => {
  const group = await Chat.findOne({
    _id: groupId,
    type: "group",
    isActive: true,
  });

  if (!group) {
    throw new Error("Group not found");
  }

  const memberObj = group.members.find((m) => m.user.toString() === userId.toString());
  if (!memberObj || !["owner", "admin"].includes(memberObj.role)) {
    throw new Error("Only group owner or admins can update group details");
  }

  const currentUser = await User.findById(userId);
  const changes = [];

  if (name && name.trim() && name.trim() !== group.name) {
    changes.push(`name to "${name.trim()}"`);
    group.name = name.trim();
  }

  if (description !== undefined && description !== group.description) {
    group.description = description.trim();
    changes.push("description");
  }

  if (avatar !== undefined) {
    group.avatar = avatar;
  }

  await group.save();

  const populatedGroup = await Chat.findById(group._id)
    .populate("members.user", "name email phoneNumber avatar isOnline lastSeen bio")
    .populate("createdBy", "name email avatar");

  let systemMsg = null;
  if (changes.length > 0) {
    systemMsg = await createSystemMessage(
      group._id,
      userId,
      `${currentUser.name} updated group ${changes.join(" and ")}`
    );
  }

  const memberIds = group.members.map((m) => m.user.toString());
  notifyGroupMembers(memberIds, "group_updated", {
    group: populatedGroup,
    systemMessage: systemMsg,
  });

  return populatedGroup;
};

export const addMembers = async (userId, groupId, newMemberIds = []) => {
  const group = await Chat.findOne({
    _id: groupId,
    type: "group",
    isActive: true,
  });

  if (!group) {
    throw new Error("Group not found");
  }

  const requester = group.members.find((m) => m.user.toString() === userId.toString());
  if (!requester || !["owner", "admin"].includes(requester.role)) {
    throw new Error("Only group owner or admins can add members");
  }

  const existingMemberIds = new Set(group.members.map((m) => m.user.toString()));
  const toAddIds = newMemberIds.filter((id) => !existingMemberIds.has(id.toString()));

  if (toAddIds.length === 0) {
    throw new Error("Selected users are already members of this group");
  }

  toAddIds.forEach((id) => {
    group.members.push({ user: id, role: "member", joinedAt: new Date() });
  });

  await group.save();

  const populatedGroup = await Chat.findById(group._id)
    .populate("members.user", "name email phoneNumber avatar isOnline lastSeen bio")
    .populate("createdBy", "name email avatar");

  const addedUsers = await User.find({ _id: { $in: toAddIds } }).select("name");
  const addedNames = addedUsers.map((u) => u.name).join(", ");
  const requesterUser = await User.findById(userId);

  const systemMsg = await createSystemMessage(
    group._id,
    userId,
    `${requesterUser.name} added ${addedNames} to the group`
  );

  const allMemberIds = group.members.map((m) => m.user.toString());
  notifyGroupMembers(allMemberIds, "group_updated", {
    group: populatedGroup,
    systemMessage: systemMsg,
  });

  return populatedGroup;
};

export const removeMember = async (userId, groupId, targetMemberId) => {
  const group = await Chat.findOne({
    _id: groupId,
    type: "group",
    isActive: true,
  });

  if (!group) {
    throw new Error("Group not found");
  }

  const requester = group.members.find((m) => m.user.toString() === userId.toString());
  const target = group.members.find((m) => m.user.toString() === targetMemberId.toString());

  if (!requester || !target) {
    throw new Error("User or target member not found in group");
  }

  const isSelf = userId.toString() === targetMemberId.toString();
  if (!isSelf) {
    if (requester.role === "member") {
      throw new Error("Only admins and owner can remove members");
    }
    if (requester.role === "admin" && target.role !== "member") {
      throw new Error("Admins can only remove regular members");
    }
  }

  const isTargetOwner = target.role === "owner";
  group.members = group.members.filter((m) => m.user.toString() !== targetMemberId.toString());

  const newOwnerUser = await transferOwnershipIfNeeded(group, isTargetOwner);

  const isGroupDeactivated = group.members.length === 0;
  if (isGroupDeactivated) {
    group.isActive = false;
  }

  await group.save();

  const requesterUser = await User.findById(userId);
  const targetUser = await User.findById(targetMemberId);

  let actionText;
  if (isSelf) {
    actionText = isTargetOwner && newOwnerUser
      ? `${targetUser?.name || "Owner"} left the group. Ownership transferred to ${newOwnerUser.name}`
      : `${targetUser?.name || "User"} left the group`;
  } else {
    actionText = isTargetOwner && newOwnerUser
      ? `${requesterUser?.name || "Admin"} removed owner ${targetUser?.name}. Ownership transferred to ${newOwnerUser.name}`
      : `${requesterUser?.name || "Admin"} removed ${targetUser?.name} from the group`;
  }

  const systemMsg = await createSystemMessage(group._id, userId, actionText);

  const populatedGroup = await getPopulatedGroup(group._id);

  if (isGroupDeactivated) {
    notifyGroupMembers([targetMemberId, userId], "group_removed", {
      groupId: group._id,
      message: "Group has been closed because no members remain.",
    });
  } else {
    const remainingMemberIds = group.members.map((m) => m.user.toString());
    notifyGroupMembers(remainingMemberIds, "group_updated", {
      group: populatedGroup,
      systemMessage: systemMsg,
    });

    notifyGroupMembers([targetMemberId], "group_removed", {
      groupId: group._id,
    });
  }

  return populatedGroup;
};

export const changeMemberRole = async (userId, groupId, targetMemberId, newRole) => {
  if (!["admin", "member"].includes(newRole)) {
    throw new Error("Invalid role specified");
  }

  const group = await Chat.findOne({
    _id: groupId,
    type: "group",
    isActive: true,
  });

  if (!group) {
    throw new Error("Group not found");
  }

  const requester = group.members.find((m) => m.user.toString() === userId.toString());
  if (!requester || requester.role !== "owner") {
    throw new Error("Only group owner can manage member roles");
  }

  const target = group.members.find((m) => m.user.toString() === targetMemberId.toString());
  if (!target) {
    throw new Error("Member not found in group");
  }

  target.role = newRole;
  await group.save();

  const requesterUser = await User.findById(userId);
  const targetUser = await User.findById(targetMemberId);

  const systemMsg = await createSystemMessage(
    group._id,
    userId,
    `${requesterUser.name} changed ${targetUser.name}'s role to ${newRole}`
  );

  const populatedGroup = await Chat.findById(group._id)
    .populate("members.user", "name email phoneNumber avatar isOnline lastSeen bio")
    .populate("createdBy", "name email avatar");

  const memberIds = group.members.map((m) => m.user.toString());
  notifyGroupMembers(memberIds, "group_updated", {
    group: populatedGroup,
    systemMessage: systemMsg,
  });

  return populatedGroup;
};

export const leaveGroup = async (userId, groupId) => {
  const group = await Chat.findOne({
    _id: groupId,
    type: "group",
    isActive: true,
  });

  if (!group) {
    throw new Error("Group not found");
  }

  const memberObj = group.members.find((m) => m.user.toString() === userId.toString());
  if (!memberObj) {
    throw new Error("You are not a member of this group");
  }

  const isOwner = memberObj.role === "owner";
  const leavingUser = await User.findById(userId);

  group.members = group.members.filter((m) => m.user.toString() !== userId.toString());

  const newOwnerUser = await transferOwnershipIfNeeded(group, isOwner);

  const isGroupDeactivated = group.members.length === 0;
  if (isGroupDeactivated) {
    group.isActive = false;
  }

  await group.save();

  if (isGroupDeactivated) {
    notifyGroupMembers([userId], "group_removed", {
      groupId: group._id,
      message: "Group has been closed because no members remain.",
    });
    return null;
  }

  const populatedGroup = await getPopulatedGroup(group._id);

  const systemMsgContent = isOwner && newOwnerUser
    ? `${leavingUser?.name || "Owner"} left the group. Ownership transferred to ${newOwnerUser.name}`
    : `${leavingUser?.name || "User"} left the group`;

  const systemMsg = await createSystemMessage(
    group._id,
    userId,
    systemMsgContent
  );

  const remainingMemberIds = group.members.map((m) => m.user.toString());
  notifyGroupMembers(remainingMemberIds, "group_updated", {
    group: populatedGroup,
    systemMessage: systemMsg,
  });

  notifyGroupMembers([userId], "group_removed", {
    groupId: group._id,
  });

  return populatedGroup;
};

export const deleteGroup = async (userId, groupId) => {
  const group = await Chat.findOne({
    _id: groupId,
    type: "group",
    isActive: true,
  });

  if (!group) {
    throw new Error("Group not found");
  }

  const memberObj = group.members.find((m) => m.user.toString() === userId.toString());
  if (!memberObj || memberObj.role !== "owner") {
    throw new Error("Only the group owner can delete the group");
  }

  const isOwner = memberObj.role === "owner";
  const leavingUser = await User.findById(userId);

  group.members = group.members.filter((m) => m.user.toString() !== userId.toString());

  const newOwnerUser = await transferOwnershipIfNeeded(group, isOwner);

  const isDeactivated = group.members.length === 0;
  if (isDeactivated) {
    group.isActive = false;
  }

  await group.save();

  if (isDeactivated) {
    notifyGroupMembers([userId], "group_removed", {
      groupId: group._id,
      message: "Group has been deleted.",
    });
    return { groupId: group._id, message: "Group deleted successfully" };
  }

  const populatedGroup = await getPopulatedGroup(group._id);

  const systemMsgContent = isOwner && newOwnerUser
    ? `${leavingUser?.name || "Group owner"} deleted group membership. Ownership transferred to ${newOwnerUser.name}`
    : `${leavingUser?.name || "Member"} deleted group membership`;

  const systemMsg = await createSystemMessage(group._id, userId, systemMsgContent);

  // Remove group from deleted user's screen
  notifyGroupMembers([userId], "group_removed", {
    groupId: group._id,
  });

  // Update group for all remaining members
  const remainingMemberIds = group.members.map((m) => m.user.toString());
  notifyGroupMembers(remainingMemberIds, "group_updated", {
    group: populatedGroup,
    systemMessage: systemMsg,
  });

  return { groupId: group._id, message: "Group deleted from your list and ownership transferred", group: populatedGroup };
};
