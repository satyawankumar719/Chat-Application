import { Router } from "express";
import {
  handleSearchUsers,
  handleGetProfile,
  handleUpdateProfile,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/search", handleSearchUsers);
router.get("/profile", handleGetProfile);
router.put("/profile", handleUpdateProfile);

export default router;
