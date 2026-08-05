import { searchUsers } from "../services/user.service.js";

export const handleSearchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.id;
console.log("Searching users with query:", q, "for user ID:", currentUserId);
    const users = await searchUsers(currentUserId, q);

    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};
