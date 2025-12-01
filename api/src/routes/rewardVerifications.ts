import express from "express";
import rewardVerificationController from "../controllers/rewardVerificationController";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();

// All verification routes require admin access
router.get(
  "/pending",
  authenticateToken,
  requireAdmin,
  asyncHandler(rewardVerificationController.getPendingVerifications)
);

router.post(
  "/:activityId/verify",
  authenticateToken,
  requireAdmin,
  asyncHandler(rewardVerificationController.verifyTask)
);

router.get(
  "/stats",
  authenticateToken,
  requireAdmin,
  asyncHandler(rewardVerificationController.getVerificationStats)
);

// Resubmit rejected task (user can resubmit their own rejected tasks)
router.post(
  "/:activityId/resubmit",
  authenticateToken,
  asyncHandler(rewardVerificationController.resubmitTask)
);

export default router;
