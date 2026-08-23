import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/express.js";
import {
  searchUsers,
  getUserProfileService,
  updateUserProfileService,
} from "../services/user.service.js";

export const handleSearchUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string) || "";
    const currentUserId = req.user?.id || req.user?._id;
    const users = await searchUsers(currentUserId, q);

    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.id || req.user?._id;
    const user = await getUserProfileService(currentUserId);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const handleUpdateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.id || req.user?._id;
    const { name, bio } = req.body;
    let avatarUrl: string | null = null;

    if (req.file) {
      const subfolder = req.file.subfolder || "avatars";
      avatarUrl = `${req.protocol}://${req.get("host")}/uploads/${subfolder}/${req.file.filename}`;
    }

    const updatedUser = await updateUserProfileService(currentUserId, {
      name,
      bio,
      avatarUrl,
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
