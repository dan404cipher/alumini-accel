import express from 'express';
import userController from '@/controllers/userController';
import { validateProfileUpdate, validateId } from '@/middleware/validation';
import { authenticateToken, requireAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// @route   GET /api/v1/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', authenticateToken, requireAdmin, asyncHandler(userController.getAllUsers));

// @route   GET /api/v1/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authenticateToken, validateId, asyncHandler(userController.getUserById));

// @route   PUT /api/v1/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, validateProfileUpdate, asyncHandler(userController.updateProfile));

// @route   DELETE /api/v1/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', authenticateToken, requireAdmin, validateId, asyncHandler(userController.deleteUser));

// @route   PUT /api/v1/users/:id/status
// @desc    Update user status (admin only)
// @access  Private/Admin
router.put('/:id/status', authenticateToken, requireAdmin, validateId, asyncHandler(userController.updateUserStatus));

// @route   GET /api/v1/users/search
// @desc    Search users
// @access  Private
router.get('/search', authenticateToken, asyncHandler(userController.searchUsers));

export default router; 