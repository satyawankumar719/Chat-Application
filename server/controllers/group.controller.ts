import type { Response, NextFunction } from "express";
import type { Request } from "express";
import * as groupService from "../services/group.service.js";
import { sendGroupInvitationService } from "../services/invitation.service.js";

export const handleCreateGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId  = req.user?._id ;
    const group = await groupService.createGroup(currentUserId!, req.body);
    res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetUserGroups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?._id;
    const groups = await groupService.getUserGroups(currentUserId!);
    res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetGroupById = async (req:Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?._id ;
    const { groupId } = req.params;
    if (typeof groupId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }
    const group = await groupService.getGroupById(currentUserId!, groupId);
    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const handleUpdateGroupInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?._id;
    const { groupId } = req.params;
    if (typeof groupId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }
    const group = await groupService.updateGroupInfo(currentUserId!, groupId!, req.body);
    res.status(200).json({
      success: true,
      message: "Group information updated successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const handleAddMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?._id;
    const { groupId } = req.params;
    const { memberIds } = req.body;
    if (typeof groupId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }
    const group = await groupService.addMembers(currentUserId!, groupId!, memberIds);
    res.status(200).json({
      success: true,
      message: "Members added successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const handleRemoveMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const { groupId, memberId } = req.params;
    if (typeof groupId !== "string" || typeof memberId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }
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

export const handleChangeMemberRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const { groupId, memberId } = req.params;
    const { role } = req.body;
       if (typeof groupId !== "string" || typeof memberId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }
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

export const handleLeaveGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const { groupId } = req.params;
     if (typeof groupId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }
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

export const handleDeleteGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const { groupId } = req.params;
       if (typeof groupId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }
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

export const sendGroupInvitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const { groupId, recieverId } = req.params;
    const receiverId = recieverId || req.params.receiverId || req.body?.receiverId;
    const message = req.body?.message || "";
     if (typeof groupId !== "string" ) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }
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