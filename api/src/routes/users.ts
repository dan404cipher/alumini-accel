import express from "express";
import userController from "../controllers/userController";
import {
  validateProfileUpdate,
  validateUserCreation,
  validateId,
  validateRequest,
} from "../middleware/validation";
import {
  authenticateToken,
  requireAdmin,
  requireSuperAdmin,
  requireCollegeAdmin,
  requireHOD,
  requireUserCreation,
} from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { uploadProfileImage } from "../config/multer";

const router = express.Router();

// @route   GET /api/v1/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get(
  "/",
  authenticateToken,
  requireAdmin,
  asyncHandler(userController.getAllUsers)
);

// @route   POST /api/v1/users
// @desc    Create new user (Super Admin, College Admin, HOD, and Staff)
// @access  Private/Super Admin, College Admin, HOD, Staff
router.post(
  "/",
  authenticateToken,
  requireUserCreation, // Super Admin, College Admin, HOD, and Staff can create users
  ...validateRequest(validateUserCreation),
  asyncHandler(userController.createUser)
);

// @route   GET /api/v1/users/:id
// @desc    Get user by ID
// @access  Private
router.get(
  "/:id",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(userController.getUserById)
);

// @route   PUT /api/v1/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  authenticateToken,
  ...validateRequest(validateProfileUpdate),
  asyncHandler(userController.updateProfile)
);

// @route   PUT /api/v1/users/:id
// @desc    Update any user by ID (Super Admin only)
// @access  Private/Super Admin
router.put(
  "/:id",
  authenticateToken,
  requireSuperAdmin,
  ...validateRequest([...validateId, ...validateProfileUpdate]),
  asyncHandler(userController.updateUserById)
);

// @route   POST /api/v1/users/profile-image
// @desc    Upload profile image
// @access  Private
router.post(
  "/profile-image",
  authenticateToken,
  uploadProfileImage.single("profileImage") as any,
  asyncHandler(userController.uploadProfileImage)
);

// @route   DELETE /api/v1/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  ...validateRequest(validateId),
  asyncHandler(userController.deleteUser)
);

// @route   PUT /api/v1/users/:id/status
// @desc    Update user status (admin only)
// @access  Private/Admin
router.put(
  "/:id/status",
  authenticateToken,
  requireAdmin,
  ...validateRequest(validateId),
  asyncHandler(userController.updateUserStatus)
);

// @route   GET /api/v1/users/search
// @desc    Search users
// @access  Private
router.get(
  "/search",
  authenticateToken,
  asyncHandler(userController.searchUsers)
);

// @route   POST /api/v1/users/bulk-alumni
// @desc    Bulk create alumni from CSV/Excel data
// @access  Private/Super Admin, College Admin, HOD, Staff
router.post(
  "/bulk-alumni",
  authenticateToken,
  requireUserCreation, // Super Admin, College Admin, HOD, and Staff can create users
  asyncHandler(userController.bulkCreateAlumni)
);

export default router;
