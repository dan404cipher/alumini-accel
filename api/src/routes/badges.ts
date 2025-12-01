import express from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import badgeController from "../controllers/badgeController";

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  requireAdmin,
  asyncHandler(badgeController.list)
);

router.post(
  "/",
  authenticateToken,
  requireAdmin,
  asyncHandler(badgeController.create)
);

router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  asyncHandler(badgeController.update)
);

router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  asyncHandler(badgeController.delete)
);

export default router;
