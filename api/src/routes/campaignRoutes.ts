import express from "express";
import {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  addCampaignUpdate,
  getCampaignDonations,
  updateCampaignStats,
} from "@/controllers/campaignController";
import {
  authenticateToken,
  requireAdmin,
  requireHOD,
  requireStaff,
} from "@/middleware/auth";
import { asyncHandler } from "@/middleware/errorHandler";

const router = express.Router();

// @route   GET /api/v1/campaigns
// @desc    Get all campaigns
// @access  Private
router.get("/", authenticateToken, asyncHandler(getAllCampaigns));

// @route   GET /api/v1/campaigns/:id
// @desc    Get campaign by ID
// @access  Private
router.get("/:id", authenticateToken, asyncHandler(getCampaignById));

// @route   POST /api/v1/campaigns
// @desc    Create new campaign
// @access  Private/Admin/HOD/Staff
router.post("/", authenticateToken, requireAdmin, asyncHandler(createCampaign));

// @route   PUT /api/v1/campaigns/:id
// @desc    Update campaign
// @access  Private/Admin/HOD/Staff
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  asyncHandler(updateCampaign)
);

// @route   DELETE /api/v1/campaigns/:id
// @desc    Delete campaign
// @access  Private/Admin/HOD/Staff
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  asyncHandler(deleteCampaign)
);

// @route   POST /api/v1/campaigns/:id/updates
// @desc    Add campaign update
// @access  Private/Admin/HOD/Staff
router.post(
  "/:id/updates",
  authenticateToken,
  requireAdmin,
  asyncHandler(addCampaignUpdate)
);

// @route   GET /api/v1/campaigns/:id/donations
// @desc    Get campaign donations
// @access  Private
router.get(
  "/:id/donations",
  authenticateToken,
  asyncHandler(getCampaignDonations)
);

// @route   PUT /api/v1/campaigns/:id/stats
// @desc    Update campaign statistics
// @access  Private
router.put("/:id/stats", authenticateToken, asyncHandler(updateCampaignStats));

export default router;
