import express from "express";
import campaignController from "../controllers/campaignController";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { uploadCampaignImage as multerUploadCampaignImage } from "../config/multer";

const router = express.Router();

// @route   GET /api/v1/campaigns
// @desc    Get all campaigns
// @access  Private
router.get(
  "/",
  authenticateToken,
  asyncHandler(campaignController.getAllCampaigns)
);

// @route   GET /api/v1/campaigns/my-campaigns
// @desc    Get user's campaigns
// @access  Private
router.get(
  "/my-campaigns",
  authenticateToken,
  asyncHandler(campaignController.getMyCampaigns)
);

// @route   GET /api/v1/campaigns/stats
// @desc    Get campaign statistics
// @access  Private/Admin
router.get(
  "/stats",
  authenticateToken,
  requireAdmin,
  asyncHandler(campaignController.getCampaignStats)
);

// @route   GET /api/v1/campaigns/:id
// @desc    Get campaign by ID
// @access  Private
router.get(
  "/:id",
  authenticateToken,
  asyncHandler(campaignController.getCampaignById)
);

// @route   POST /api/v1/campaigns
// @desc    Create new campaign
// @access  Private
router.post(
  "/",
  authenticateToken,
  asyncHandler(campaignController.createCampaign)
);

// @route   PUT /api/v1/campaigns/:id
// @desc    Update campaign
// @access  Private
router.put(
  "/:id",
  authenticateToken,
  asyncHandler(campaignController.updateCampaign)
);

// @route   DELETE /api/v1/campaigns/:id
// @desc    Delete campaign
// @access  Private
router.delete(
  "/:id",
  authenticateToken,
  asyncHandler(campaignController.deleteCampaign)
);

// @route   POST /api/v1/campaigns/:id/image
// @desc    Upload campaign image
// @access  Private
router.post(
  "/:id/image",
  authenticateToken,
  multerUploadCampaignImage.single("image") as any,
  asyncHandler(campaignController.uploadCampaignImage)
);

export default router;
