import * as groupService from "../services/group.service.js";
import { sendGroupInvitationService } from "../services/invitation.service.js";

export const handleCreateGroup = async (req, res, next) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const group = await groupService.createGroup(currentUserId, req.body);
    res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetUserGroups = async (req, res, next) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const groups = await groupService.getUserGroups(currentUserId);
    res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetGroupById = async (req, res, next) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const { groupId } = req.params;
    const group = await groupService.getGroupById(currentUserId, groupId);
    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const handleUpdateGroupInfo = async (req, res, next) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const { groupId } = req.params;
    const group = await groupService.updateGroupInfo(currentUserId, groupId, req.body);
    res.status(200).json({
      success: true,
      message: "Group information updated successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const handleAddMembers = async (req, res, next) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const { groupId } = req.params;
    const { memberIds } = req.body;
    const group = await groupService.addMembers(currentUserId, groupId, memberIds);
    res.status(200).json({
      success: true,
      message: "Members added successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const handleRemoveMember = async (req, res, next) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const { groupId, memberId } = req.params;
    const group = await groupService.removeMember(currentUserId, groupId, memberId);
    res.status(200).json({
      success: true,
      message: "Member removed successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const handleChangeMemberRole = async (req, res, next) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const { groupId, memberId } = req.params;
    const { role } = req.body;
    const group = await groupService.changeMemberRole(currentUserId, groupId, memberId, role);
    res.status(200).json({
      success: true,
      message: "Member role updated successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const handleLeaveGroup = async (req, res, next) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const { groupId } = req.params;
    const group = await groupService.leaveGroup(currentUserId, groupId);
    res.status(200).json({
      success: true,
      message: "Left group successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const handleDeleteGroup = async (req, res, next) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const { groupId } = req.params;
    const result = await groupService.deleteGroup(currentUserId, groupId);
    res.status(200).json({
      success: true,
      message: "Group deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const sendGroupInvitation = async (req, res, next) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const { groupId, recieverId } = req.params;
    const receiverId = recieverId || req.params.receiverId || req.body?.receiverId;
    const message = req.body?.message || "";

    const invitation = await sendGroupInvitationService(currentUserId, groupId, receiverId, message);

    res.status(201).json({
      success: true,
      message: "Group invitation sent successfully.",
      data: invitation,
    });
  } catch (error) {
    next(error);
  }
};