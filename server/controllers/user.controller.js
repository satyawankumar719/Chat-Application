import {
  searchUsers,
  getUserProfileService,
  updateUserProfileService,
} from "../services/user.service.js";

export const handleSearchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.id;
    const users = await searchUsers(currentUserId, q);

    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetProfile = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const user = await getUserProfileService(currentUserId);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const handleUpdateProfile = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { name, bio } = req.body;
    let avatarUrl = null;

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
