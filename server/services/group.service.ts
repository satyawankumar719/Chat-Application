import Chat from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { getSocketByUserId } from "../socket/userManager.js";
import { logger } from "../logger.js";

import type { IMessage } from "../models/Message.js";
import type { Types } from "mongoose";

type UserId = string | Types.ObjectId;

type MemberRole = "owner" | "admin" | "member";

interface GroupMember {
  user: UserId;
  role: MemberRole;
  joinedAt: Date;
}

interface CreateGroupInput {
  name: string;
  description?: string;
  memberIds?: UserId[];
  avatar?: string | null;
}

interface UpdateGroupInput {
  name?: string;
  description?: string;
  avatar?: string | null;
}

interface SocketMessagePayload {
  group?: unknown;
  systemMessage?: unknown;
  groupId?: UserId;
  message?: string;
}

interface GroupDocument {
  _id: Types.ObjectId;
  type: "group" | "direct";
  name?: string;
  description?: string;
  avatar?: any;
  members: GroupMember[];
  createdBy: UserId;
  isActive: boolean;
  save: () => Promise<GroupDocument>;
}

function notifyGroupMembers(
  memberUserIds: UserId[],
  eventName: string,
  payload: SocketMessagePayload
): void {
  memberUserIds.forEach((id) => {
    const socket = getSocketByUserId(id.toString());

    socket?.emit(eventName, payload);
  });
}

async function createSystemMessage(
  groupId: UserId,
  senderId: UserId,
  content: string
): Promise<IMessage | null> {
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

    const populatedMessage = await Message.findById(
      systemMessage._id
    ).populate("sender", "name email avatar");

    return populatedMessage;
  } catch (error) {
    logger.error("Failed to create system message:", error);

    return null;
  }
}

async function getPopulatedGroup(
  groupId: UserId
): Promise<any> {
  return Chat.findById(groupId)
    .populate(
      "members.user",
      "name email phoneNumber avatar isOnline lastSeen bio"
    )
    .populate("createdBy", "name email avatar");
}

async function transferOwnershipIfNeeded(
  group: any,
  isOwnerTarget: boolean
) {
  if (!isOwnerTarget || group.members.length === 0) {
    return null;
  }

  const nextOwner =
    group.members.find((member: any) => member.role === "admin") ||
    group.members[0];

  if (nextOwner) {
    nextOwner.role = "owner";
    group.createdBy = nextOwner.user;
    return User.findById(nextOwner.user);
  }
  return null;
}

export const createGroup = async (
  creatorId: UserId,
  {
    name,
    description,
    memberIds = [],
    avatar,
  }: CreateGroupInput
) => {
  if (!name?.trim()) {
    throw new Error("Group name is required");
  }

  const creatorUser = await User.findById(creatorId);

  if (!creatorUser) {
    throw new Error("Creator user not found");
  }

  const uniqueMemberIds = Array.from(
    new Set(memberIds.map((id) => id.toString()))
  ).filter((id) => id !== creatorId.toString());

  if (uniqueMemberIds.length < 1) {
    throw new Error("A group must have at least 2 members (select at least 1 other contact)");
  }

  const members: GroupMember[] = [
    {
      user: creatorId,
      role: "owner",
      joinedAt: new Date(),
    },
    ...uniqueMemberIds.map((id) => ({
      user: id,
      role: "member" as const,
      joinedAt: new Date(),
    })),
  ];

  const groupChat = await Chat.create({
    type: "group",
    name: name.trim(),
    description: description?.trim() ?? "",
    avatar: (avatar ?? null) as any,
    members,
    createdBy: creatorId,
    isActive: true,
  });

  const populatedGroup = await getPopulatedGroup(groupChat._id);

  const systemMsg = await createSystemMessage(
    groupChat._id,
    creatorId,
    `${creatorUser.name} created group "${name.trim()}"`
  );

  const allMemberIds = members.map((member) =>
    member.user.toString()
  );

  notifyGroupMembers(allMemberIds, "group_created", {
    group: populatedGroup,
    systemMessage: systemMsg,
  });

  return populatedGroup;
};

export const getUserGroups = async (
  userId: UserId
): Promise<any[]> => {
  return Chat.find({
    type: "group",
    "members.user": userId,
    isActive: true,
  })
    .populate(
      "members.user",
      "name email phoneNumber avatar isOnline lastSeen bio"
    )
    .populate("createdBy", "name email avatar")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "name email avatar",
      },
    })
    .sort({
      updatedAt: -1,
    });
};

export const getGroupById = async (
  userId: UserId,
  groupId: UserId
): Promise<GroupDocument> => {
  const group = await Chat.findOne({
    _id: groupId,
    type: "group",
    "members.user": userId,
    isActive: true,
  })
    .populate(
      "members.user",
      "name email phoneNumber avatar isOnline lastSeen bio"
    )
    .populate("createdBy", "name email avatar")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "name email avatar",
      },
    });

  if (!group) {
    throw new Error("Group not found or access denied");
  }

  return group;
};

export const updateGroupInfo = async (
  userId: UserId,
  groupId: UserId,
  { name, description, avatar }: UpdateGroupInput
): Promise<GroupDocument | null> => {
  const group = await Chat.findOne({
    _id: groupId,
    type: "group",
    isActive: true,
  });

  if (!group) {
    throw new Error("Group not found");
  }

  const memberObj = group.members.find(
    (member: GroupMember) =>
      member.user.toString() === userId.toString()
  );

  if (
    !memberObj ||
    !["owner", "admin"].includes(memberObj.role)
  ) {
    throw new Error(
      "Only group owner or admins can update group details"
    );
  }

  const currentUser = await User.findById(userId);

  if (!currentUser) {
    throw new Error("User not found");
  }

  const changes: string[] = [];

  if (
    name?.trim() &&
    name.trim() !== group.name
  ) {
    changes.push(`name to "${name.trim()}"`);

    group.name = name.trim();
  }

  if (
    description !== undefined &&
    description.trim() !== group.description
  ) {
    group.description = description.trim();

    changes.push("description");
  }

  if (avatar !== undefined) {
    group.avatar = avatar as any;
  }

  await group.save();

  const populatedGroup = await getPopulatedGroup(group._id);

  let systemMsg: IMessage | null = null;

  if (changes.length > 0) {
    systemMsg = await createSystemMessage(
      group._id,
      userId,
      `${currentUser.name} updated group ${changes.join(
        " and "
      )}`
    );
  }

  const memberIds = group.members.map(
    (member: GroupMember) =>
      member.user.toString()
  );

  notifyGroupMembers(memberIds, "group_updated", {
    group: populatedGroup,
    systemMessage: systemMsg,
  });

  return populatedGroup;
};

export const addMembers = async (
  userId: UserId,
  groupId: UserId,
  newMemberIds: UserId[] = []
): Promise<GroupDocument | null> => {
  const group = await Chat.findOne({
    _id: groupId,
    type: "group",
    isActive: true,
  });

  if (!group) {
    throw new Error("Group not found");
  }

  const requester = group.members.find(
    (member: GroupMember) =>
      member.user.toString() === userId.toString()
  );

  if (
    !requester ||
    !["owner", "admin"].includes(requester.role)
  ) {
    throw new Error(
      "Only group owner or admins can add members"
    );
  }

  const existingMemberIds = new Set(
    group.members.map((member: GroupMember) =>
      member.user.toString()
    )
  );

  const toAddIds = newMemberIds.filter(
    (id) => !existingMemberIds.has(id.toString())
  );

  if (toAddIds.length === 0) {
    throw new Error(
      "Selected users are already members of this group"
    );
  }

  toAddIds.forEach((id) => {
    group.members.push({
      user: id as Types.ObjectId,
      role: "member",
      joinedAt: new Date(),
    });
  });

  await group.save();

  const populatedGroup = await getPopulatedGroup(group._id);

  const addedUsers = await User.find({
    _id: {
      $in: toAddIds,
    },
  }).select("name");

  const addedNames = addedUsers
    .map((user) => user.name)
    .join(", ");

  const requesterUser = await User.findById(userId);

  if (!requesterUser) {
    throw new Error("Requester not found");
  }

  const systemMsg = await createSystemMessage(
    group._id,
    userId,
    `${requesterUser.name} added ${addedNames} to the group`
  );

  const allMemberIds = group.members.map(
    (member: GroupMember) =>
      member.user.toString()
  );

  notifyGroupMembers(allMemberIds, "group_updated", {
    group: populatedGroup,
    systemMessage: systemMsg,
  });

  return populatedGroup;
};

export const removeMember = async (
  userId: UserId,
  groupId: UserId,
  targetMemberId: UserId
): Promise<GroupDocument | null> => {
  const group = await Chat.findOne({
    _id: groupId,
    type: "group",
    isActive: true,
  });

  if (!group) {
    throw new Error("Group not found");
  }

  const requester = group.members.find(
    (member: GroupMember) =>
      member.user.toString() === userId.toString()
  );

  const target = group.members.find(
    (member: GroupMember) =>
      member.user.toString() ===
      targetMemberId.toString()
  );

  if (!requester || !target) {
    throw new Error(
      "User or target member not found in group"
    );
  }

  const isSelf =
    userId.toString() === targetMemberId.toString();

  if (!isSelf) {
    if (requester.role === "member") {
      throw new Error(
        "Only admins and owner can remove members"
      );
    }

    if (
      requester.role === "admin" &&
      target.role !== "member"
    ) {
      throw new Error(
        "Admins can only remove regular members"
      );
    }
  }

  const isTargetOwner = target.role === "owner";

  group.members = group.members.filter(
    (member: GroupMember) =>
      member.user.toString() !==
      targetMemberId.toString()
  );

  const newOwnerUser =
    await transferOwnershipIfNeeded(
      group,
      isTargetOwner
    );

  const isGroupDeactivated =
    group.members.length <= 1;

  if (isGroupDeactivated) {
    group.isActive = false;
  }

  await group.save();

  const requesterUser = await User.findById(userId);

  const targetUser = await User.findById(
    targetMemberId
  );

  const actionText = isSelf
    ? isTargetOwner && newOwnerUser
      ? `${targetUser?.name ?? "Owner"} left the group. Ownership transferred to ${newOwnerUser.name}`
      : `${targetUser?.name ?? "User"} left the group`
    : isTargetOwner && newOwnerUser
      ? `${requesterUser?.name ?? "Admin"} removed owner ${targetUser?.name}. Ownership transferred to ${newOwnerUser.name}`
      : `${requesterUser?.name ?? "Admin"} removed ${targetUser?.name} from the group`;

  const systemMsg = await createSystemMessage(
    group._id,
    userId,
    actionText
  );

  const populatedGroup = await getPopulatedGroup(
    group._id
  );

  if (isGroupDeactivated) {
    const allAffectedMemberIds = Array.from(
      new Set([
        ...group.members.map((member: GroupMember) => member.user.toString()),
        targetMemberId.toString(),
        userId.toString(),
      ])
    );

    notifyGroupMembers(
      allAffectedMemberIds,
      "group_removed",
      {
        groupId: group._id,
        message:
          "Group has been closed because 1 or fewer members remain.",
      }
    );

    return null;
  } else {
    const remainingMemberIds = group.members.map(
      (member: GroupMember) =>
        member.user.toString()
    );

    notifyGroupMembers(
      remainingMemberIds,
      "group_updated",
      {
        group: populatedGroup,
        systemMessage: systemMsg,
      }
    );

    notifyGroupMembers(
      [targetMemberId],
      "group_removed",
      {
        groupId: group._id,
      }
    );
  }

  return populatedGroup;
};

export const changeMemberRole = async (
  userId: UserId,
  groupId: UserId,
  targetMemberId: UserId,
  newRole: "admin" | "member"
): Promise<GroupDocument | null> => {
  const group = await Chat.findOne({
    _id: groupId,
    type: "group",
    isActive: true,
  });

  if (!group) {
    throw new Error("Group not found");
  }

  const requester = group.members.find(
    (member: GroupMember) =>
      member.user.toString() === userId.toString()
  );

  if (!requester || requester.role !== "owner") {
    throw new Error(
      "Only group owner can manage member roles"
    );
  }

  const target = group.members.find(
    (member: GroupMember) =>
      member.user.toString() ===
      targetMemberId.toString()
  );

  if (!target) {
    throw new Error("Member not found in group");
  }

  target.role = newRole;

  await group.save();

  const requesterUser = await User.findById(userId);

  const targetUser = await User.findById(
    targetMemberId
  );

  if (!requesterUser || !targetUser) {
    throw new Error("User not found");
  }

  const systemMsg = await createSystemMessage(
    group._id,
    userId,
    `${requesterUser.name} changed ${targetUser.name}'s role to ${newRole}`
  );

  const populatedGroup = await getPopulatedGroup(
    group._id
  );

  const memberIds = group.members.map(
    (member: GroupMember) =>
      member.user.toString()
  );

  notifyGroupMembers(memberIds, "group_updated", {
    group: populatedGroup,
    systemMessage: systemMsg,
  });

  return populatedGroup;
};

/* =========================================================
   LEAVE GROUP
========================================================= */

export const leaveGroup = async (
  userId: UserId,
  groupId: UserId
): Promise<GroupDocument | null> => {
  const group = await Chat.findOne({
    _id: groupId,
    type: "group",
    isActive: true,
  });

  if (!group) {
    throw new Error("Group not found");
  }

  const memberObj = group.members.find(
    (member: GroupMember) =>
      member.user.toString() === userId.toString()
  );

  if (!memberObj) {
    throw new Error(
      "You are not a member of this group"
    );
  }

  const isOwner = memberObj.role === "owner";

  const leavingUser = await User.findById(userId);

  group.members = group.members.filter(
    (member: GroupMember) =>
      member.user.toString() !== userId.toString()
  );

  const newOwnerUser =
    await transferOwnershipIfNeeded(
      group,
      isOwner
    );

  const isGroupDeactivated =
    group.members.length <= 1;

  if (isGroupDeactivated) {
    group.isActive = false;
  }

  await group.save();

  if (isGroupDeactivated) {
    const allAffectedMemberIds = Array.from(
      new Set([
        ...group.members.map((member: GroupMember) => member.user.toString()),
        userId.toString(),
      ])
    );

    notifyGroupMembers(
      allAffectedMemberIds,
      "group_removed",
      {
        groupId: group._id,
        message:
          "Group has been closed because 1 or fewer members remain.",
      }
    );

    return null;
  }

  const populatedGroup = await getPopulatedGroup(
    group._id
  );

  const systemMsgContent =
    isOwner && newOwnerUser
      ? `${leavingUser?.name ?? "Owner"} left the group. Ownership transferred to ${newOwnerUser.name}`
      : `${leavingUser?.name ?? "User"} left the group`;

  const systemMsg = await createSystemMessage(
    group._id,
    userId,
    systemMsgContent
  );

  const remainingMemberIds = group.members.map(
    (member: GroupMember) =>
      member.user.toString()
  );

  notifyGroupMembers(
    remainingMemberIds,
    "group_updated",
    {
      group: populatedGroup,
      systemMessage: systemMsg,
    }
  );

  notifyGroupMembers(
    [userId],
    "group_removed",
    {
      groupId: group._id,
    }
  );

  return populatedGroup;
};

/* =========================================================
   DELETE GROUP
========================================================= */

export const deleteGroup = async (
  userId: UserId,
  groupId: UserId
): Promise<{
  groupId: Types.ObjectId;
  message: string;
}> => {
  const group = await Chat.findOne({
    _id: groupId,
    type: "group",
    isActive: true,
  });

  if (!group) {
    throw new Error("Group not found");
  }

  const memberObj = group.members.find(
    (member: GroupMember) =>
      member.user.toString() === userId.toString()
  );

  if (
    !memberObj ||
    memberObj.role !== "owner"
  ) {
    throw new Error(
      "Only the group owner can delete the group"
    );
  }

  /*
    IMPORTANT:

    deleteGroup means the entire group
    should be deleted/deactivated.

    Ownership transfer should NOT happen here.
  */

  group.isActive = false;

  await group.save();

  const memberIds = group.members.map(
    (member: GroupMember) =>
      member.user.toString()
  );

  notifyGroupMembers(
    memberIds,
    "group_removed",
    {
      groupId: group._id,
      message: "Group has been deleted.",
    }
  );

  return {
    groupId: group._id,
    message: "Group deleted successfully",
  };
};