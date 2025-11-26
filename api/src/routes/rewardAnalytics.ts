import express from "express";
import rewardAnalyticsController from "../controllers/rewardAnalyticsController";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();

// All analytics routes require admin access
router.get(
  "/points-distribution",
  authenticateToken,
  requireAdmin,
  asyncHandler(rewardAnalyticsController.getPointsDistribution)
);

router.get(
  "/tasks",
  authenticateToken,
  requireAdmin,
  asyncHandler(rewardAnalyticsController.getTaskCompletion)
);

router.get(
  "/claims",
  authenticateToken,
  requireAdmin,
  asyncHandler(rewardAnalyticsController.getRewardClaims)
);

router.get(
  "/departments",
  authenticateToken,
  requireAdmin,
  asyncHandler(rewardAnalyticsController.getDepartmentAnalytics)
);

router.get(
  "/activity/:userId",
  authenticateToken,
  requireAdmin,
  asyncHandler(rewardAnalyticsController.getAlumniActivity)
);

export default router;

