import express from "express";
import rewardController from "../controllers/rewardController";
import {
  validateId,
  validateAlumniId,
  validateRequest,
  validateRewardType,
  validateRewardTypeUpdate,
} from "../middleware/validation";
import { authenticateToken, requireAdmin, requireAdminButNotSuperAdmin } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();

// Reward Types Routes
// @route   POST /api/v1/rewards/types
// @desc    Create reward type
// @access  Private/Admin (Superadmin view-only)
router.post(
  "/types",
  authenticateToken,
  requireAdminButNotSuperAdmin,
  ...validateRequest(validateRewardType),
  asyncHandler(rewardController.createRewardType)
);

// @route   GET /api/v1/rewards/types
// @desc    Get all reward types
// @access  Private/Admin (Superadmin can view)
router.get(
  "/types",
  authenticateToken,
  requireAdmin,
  asyncHandler(rewardController.getAllRewardTypes)
);

// @route   PUT /api/v1/rewards/types/:id
// @desc    Update reward type
// @access  Private/Admin (Superadmin view-only)
router.put(
  "/types/:id",
  authenticateToken,
  requireAdminButNotSuperAdmin,
  ...validateRequest([...validateId, ...validateRewardTypeUpdate]),
  asyncHandler(rewardController.updateRewardType)
);

// @route   DELETE /api/v1/rewards/types/:id
// @desc    Delete reward type
// @access  Private/Admin (Superadmin view-only)
router.delete(
  "/types/:id",
  authenticateToken,
  requireAdminButNotSuperAdmin,
  ...validateRequest(validateId),
  asyncHandler(rewardController.deleteRewardType)
);

// Points Routes
// @route   GET /api/v1/rewards/points/me
// @desc    Get my points (authenticated alumni)
// @access  Private
router.get(
  "/points/me",
  authenticateToken,
  asyncHandler(rewardController.getMyPoints)
);

// @route   GET /api/v1/rewards/points/:alumniId
// @desc    Get alumni points
// @access  Private
router.get(
  "/points/:alumniId",
  authenticateToken,
  ...validateRequest(validateAlumniId),
  asyncHandler(rewardController.getAlumniPoints)
);

// @route   GET /api/v1/rewards/points
// @desc    Get all alumni points (admin only)
// @access  Private/Admin
router.get(
  "/points",
  authenticateToken,
  requireAdmin,
  asyncHandler(rewardController.getAllAlumniPoints)
);

// @route   POST /api/v1/rewards/points/manual
// @desc    Add manual points (admin only, superadmin view-only)
// @access  Private/Admin
router.post(
  "/points/manual",
  authenticateToken,
  requireAdminButNotSuperAdmin,
  asyncHandler(rewardController.addManualPoints)
);

// @route   GET /api/v1/rewards/points/history/me
// @desc    Get my points history (authenticated alumni)
// @access  Private
router.get(
  "/points/history/me",
  authenticateToken,
  asyncHandler(rewardController.getMyPointsHistory)
);

// @route   GET /api/v1/rewards/points/history/:alumniId
// @desc    Get alumni points history
// @access  Private
router.get(
  "/points/history/:alumniId",
  authenticateToken,
  ...validateRequest(validateAlumniId),
  asyncHandler(rewardController.getAlumniPointsHistory)
);

// Redemption Routes
// @route   POST /api/v1/rewards/redeem
// @desc    Create redeem request
// @access  Private
router.post(
  "/redeem",
  authenticateToken,
  asyncHandler(rewardController.createRedeemRequest)
);

// @route   GET /api/v1/rewards/redeem/requests
// @desc    Get all redeem requests (admin only)
// @access  Private/Admin
router.get(
  "/redeem/requests",
  authenticateToken,
  requireAdmin,
  asyncHandler(rewardController.getRedeemRequests)
);

// @route   POST /api/v1/rewards/redeem/:id/approve
// @desc    Approve redeem request (admin only, superadmin view-only)
// @access  Private/Admin
router.post(
  "/redeem/:id/approve",
  authenticateToken,
  requireAdminButNotSuperAdmin,
  ...validateRequest(validateId),
  asyncHandler(rewardController.approveRedeemRequest)
);

// @route   POST /api/v1/rewards/redeem/:id/reject
// @desc    Reject redeem request (admin only, superadmin view-only)
// @access  Private/Admin
router.post(
  "/redeem/:id/reject",
  authenticateToken,
  requireAdminButNotSuperAdmin,
  ...validateRequest(validateId),
  asyncHandler(rewardController.rejectRedeemRequest)
);

export default router;

