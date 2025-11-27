import express from "express";
import rewardController from "../controllers/rewardController";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();

// Root route
router.get(
  "/",
  authenticateToken,
  asyncHandler(rewardController.listRewards)
);

// Specific routes must come BEFORE parameterized routes like /:id
router.get(
  "/summary",
  authenticateToken,
  asyncHandler(rewardController.getUserSummary)
);

router.get(
  "/profile/:userId",
  authenticateToken,
  asyncHandler(rewardController.getPublicRewardProfile)
);

router.get(
  "/activities",
  authenticateToken,
  asyncHandler(rewardController.getUserActivities)
);

router.get(
  "/tier",
  authenticateToken,
  asyncHandler(rewardController.getUserTier)
);

router.get(
  "/badges",
  authenticateToken,
  asyncHandler(rewardController.getUserBadges)
);

// Parameterized routes come last
router.get(
  "/:id",
  authenticateToken,
  asyncHandler(rewardController.getRewardById)
);

router.post(
  "/",
  authenticateToken,
  requireAdmin,
  asyncHandler(rewardController.createReward)
);

router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  asyncHandler(rewardController.updateReward)
);

router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  asyncHandler(rewardController.deleteReward)
);

router.post(
  "/:id/tasks/:taskId/progress",
  authenticateToken,
  asyncHandler(rewardController.recordTaskProgress)
);

router.post(
  "/:id/claim",
  authenticateToken,
  asyncHandler(rewardController.claimReward)
);

export default router;

