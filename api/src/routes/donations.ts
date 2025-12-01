import express from "express";
import donationController from "../controllers/donationController";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();

// @route   GET /api/v1/donations
// @desc    Get all donations (admin only)
// @access  Private/Admin
router.get(
  "/",
  authenticateToken,
  requireAdmin,
  asyncHandler(donationController.getAllDonations)
);

// @route   POST /api/v1/donations
// @desc    Create donation
// @access  Private
router.post(
  "/",
  authenticateToken,
  asyncHandler(donationController.createDonation)
);

// @route   POST /api/v1/donations/verify-payment
// @desc    Verify donation payment
// @access  Private
router.post(
  "/verify-payment",
  authenticateToken,
  asyncHandler(donationController.verifyDonationPayment)
);

// @route   GET /api/v1/donations/my-donations
// @desc    Get user's donations
// @access  Private
router.get(
  "/my-donations",
  authenticateToken,
  asyncHandler(donationController.getMyDonations)
);

// @route   GET /api/v1/donations/stats
// @desc    Get donation statistics
// @access  Private/Admin
router.get(
  "/stats",
  authenticateToken,
  requireAdmin,
  asyncHandler(donationController.getDonationStats)
);

// @route   GET /api/v1/donations/donor/:donorId
// @desc    Get donations by donor
// @access  Private
router.get(
  "/donor/:donorId",
  authenticateToken,
  asyncHandler(donationController.getDonationsByDonor)
);

// @route   GET /api/v1/donations/recipient/:recipientId
// @desc    Get donations by recipient
// @access  Private
router.get(
  "/recipient/:recipientId",
  authenticateToken,
  asyncHandler(donationController.getDonationsByRecipient)
);

// @route   GET /api/v1/donations/:id/receipt
// @desc    Download donation receipt PDF
// @access  Private
// NOTE: This route must come BEFORE /:id route to avoid route conflicts
router.get(
  "/:id/receipt",
  authenticateToken,
  asyncHandler(donationController.downloadReceipt)
);

// @route   GET /api/v1/donations/:id
// @desc    Get donation by ID
// @access  Private
router.get(
  "/:id",
  authenticateToken,
  asyncHandler(donationController.getDonationById)
);

// @route   PUT /api/v1/donations/:id
// @desc    Update donation
// @access  Private
router.put(
  "/:id",
  authenticateToken,
  asyncHandler(donationController.updateDonation)
);

// @route   DELETE /api/v1/donations/:id
// @desc    Delete donation
// @access  Private
router.delete(
  "/:id",
  authenticateToken,
  asyncHandler(donationController.deleteDonation)
);

export default router;
