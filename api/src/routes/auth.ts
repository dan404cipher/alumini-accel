import express from "express";
import authController from "../controllers/authController";
import {
  validateUserRegistration,
  validateUserLogin,
  validateEmail,
  validatePasswordReset,
  validateRequest,
} from "../middleware/validation";
import { authenticateToken } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();

// @route   POST /api/v1/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  ...validateRequest(validateUserRegistration),
  asyncHandler(authController.register)
);

// @route   POST /api/v1/auth/login
// @desc    Login user
// @access  Public
router.post(
  "/login",
  ...validateRequest(validateUserLogin),
  asyncHandler(authController.login)
);

// @route   POST /api/v1/auth/verify-email
// @desc    Verify email address
// @access  Public
router.post("/verify-email", asyncHandler(authController.verifyEmail));

// @route   POST /api/v1/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post(
  "/forgot-password",
  ...validateRequest(validateEmail),
  asyncHandler(authController.forgotPassword)
);

// @route   POST /api/v1/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post(
  "/reset-password",
  ...validateRequest(validatePasswordReset),
  asyncHandler(authController.resetPassword)
);

// @route   POST /api/v1/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post("/refresh-token", asyncHandler(authController.refreshToken));

// @route   GET /api/v1/auth/me
// @desc    Get current user
// @access  Private
router.get(
  "/me",
  authenticateToken,
  asyncHandler(authController.getCurrentUser)
);

// @route   POST /api/v1/auth/logout
// @desc    Logout user
// @access  Private
router.post("/logout", authenticateToken, asyncHandler(authController.logout));

// @route   POST /api/v1/auth/change-password
// @desc    Change password
// @access  Private
router.post(
  "/change-password",
  authenticateToken,
  asyncHandler(authController.changePassword)
);

// @route   POST /api/v1/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post(
  "/resend-verification",
  ...validateRequest(validateEmail),
  asyncHandler(authController.resendVerificationEmail)
);

// @route   POST /api/v1/auth/check-email
// @desc    Check if email is available
// @access  Public
router.post(
  "/check-email",
  ...validateRequest(validateEmail),
  asyncHandler(authController.checkEmailAvailability)
);

export default router;
