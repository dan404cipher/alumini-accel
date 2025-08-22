import express from 'express';
import donationController from '@/controllers/donationController';
import { authenticateToken, requireAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// @route   GET /api/v1/donations
// @desc    Get all donations (admin only)
// @access  Private/Admin
router.get('/', authenticateToken, requireAdmin, asyncHandler(donationController.getAllDonations));

// @route   POST /api/v1/donations
// @desc    Create donation
// @access  Private
router.post('/', authenticateToken, asyncHandler(donationController.createDonation));

// @route   GET /api/v1/donations/my-donations
// @desc    Get user's donations
// @access  Private
router.get('/my-donations', authenticateToken, asyncHandler(donationController.getMyDonations));

// @route   GET /api/v1/donations/stats
// @desc    Get donation statistics
// @access  Private/Admin
router.get('/stats', authenticateToken, requireAdmin, asyncHandler(donationController.getDonationStats));

export default router; 