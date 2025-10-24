import express from "express";
import { authenticateToken } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getNotificationStats,
} from "../controllers/notificationController";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/v1/notifications
// @desc    Get all notifications for a user
// @access  Private
router.get("/", asyncHandler(getNotifications));

// @route   GET /api/v1/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get("/unread-count", asyncHandler(getUnreadCount));

// @route   GET /api/v1/notifications/stats
// @desc    Get notification statistics
// @access  Private
router.get("/stats", asyncHandler(getNotificationStats));

// @route   POST /api/v1/notifications
// @desc    Create a notification (admin/system use)
// @access  Private
router.post("/", asyncHandler(createNotification));

// @route   PATCH /api/v1/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.patch("/:id/read", asyncHandler(markAsRead));

// @route   PATCH /api/v1/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.patch("/mark-all-read", asyncHandler(markAllAsRead));

// @route   DELETE /api/v1/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete("/:id", asyncHandler(deleteNotification));

export default router;
