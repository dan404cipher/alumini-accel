import express from "express";
import rewardController from "../controllers/rewardController";
import { authenticateToken, requireAdmin, blockStudents } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();

// Root route - block students
router.get(
  "/",
  authenticateToken,
  blockStudents,
  asyncHandler(rewardController.listRewards)
);

// Specific routes must come BEFORE parameterized routes like /:id
router.get(
  "/summary",
  authenticateToken,
  blockStudents,
  asyncHandler(rewardController.getUserSummary)
);

router.get(
  "/profile/:userId",
  authenticateToken,
  blockStudents,
  asyncHandler(rewardController.getPublicRewardProfile)
);

router.get(
  "/activities",
  authenticateToken,
  blockStudents,
  asyncHandler(rewardController.getUserActivities)
);

router.get(
  "/tier",
  authenticateToken,
  blockStudents,
  asyncHandler(rewardController.getUserTier)
);

router.get(
  "/badges",
  authenticateToken,
  blockStudents,
  asyncHandler(rewardController.getUserBadges)
);

// Parameterized routes come last
router.get(
  "/:id",
  authenticateToken,
  blockStudents,
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
  blockStudents,
  asyncHandler(rewardController.recordTaskProgress)
);

router.post(
  "/:id/claim",
  authenticateToken,
  blockStudents,
  asyncHandler(rewardController.claimReward)
);

export default router;

