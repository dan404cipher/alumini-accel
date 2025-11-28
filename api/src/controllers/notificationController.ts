import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { Notification } from "../models/Notification";
import { INotification } from "../types";
import { getSocketService } from "../services/socketServiceInstance";

// Get all notifications for a user
export const getNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { page = 1, limit = 20, category, type, isRead } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    try {
      const options = {
        page: parseInt(page as string) || 1,
        limit: Math.min(parseInt(limit as string) || 20, 50), // Max 50 per page
        category: category as string,
        type: type as string,
        isRead:
          isRead === "true" ? true : isRead === "false" ? false : undefined,
      };

      const result = await Notification.getUserNotifications(
        userId.toString(),
        options
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Error fetching notifications:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch notifications",
      });
    }
  }
);

// Get unread notification count
export const getUnreadCount = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    try {
      const count = await Notification.getUnreadCount(userId.toString());

      return res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      logger.error("Error fetching unread count:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch unread count",
      });
    }
  }
);

// Mark a notification as read
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User not authenticated",
    });
  }

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Emit socket event for notification update
    try {
      const socketService = getSocketService();
      socketService.emitNotificationUpdate(
        userId.toString(),
        notification._id.toString(),
        "read"
      );
    } catch (err) {
      logger.warn("Socket service not available", err);
    }

    return res.json({
      success: true,
      data: notification,
      message: "Notification marked as read",
    });
  } catch (error) {
    logger.error("Error marking notification as read:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    try {
      const result = await Notification.markAllAsRead(userId.toString());

      // Emit socket event for notification count update
      try {
        const socketService = getSocketService();
        socketService.emitNotificationCountUpdate(userId.toString(), 0);
      } catch (err) {
        logger.warn("Socket service not available", err);
      }

      return res.json({
        success: true,
        data: { modifiedCount: result.modifiedCount },
        message: "All notifications marked as read",
      });
    } catch (error) {
      logger.error("Error marking all notifications as read:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to mark all notifications as read",
      });
    }
  }
);

// Delete a notification
export const deleteNotification = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    try {
      const notification = await Notification.findOneAndDelete({
        _id: id,
        userId,
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      // Emit socket event for notification deletion
      try {
        const socketService = getSocketService();
        socketService.emitNotificationUpdate(
          userId.toString(),
          notification._id.toString(),
          "deleted"
        );
      } catch (err) {
        logger.warn("Socket service not available", err);
      }

      return res.json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting notification:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete notification",
      });
    }
  }
);

// Create a notification (admin/system use)
export const createNotification = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      userId,
      title,
      message,
      type = "info",
      category = "system",
      priority = "medium",
      actionUrl,
      metadata,
      relatedEntity,
      expiresAt,
    } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "User ID, title, and message are required",
      });
    }

    try {
      const notification = await Notification.createNotification({
        userId,
        title,
        message,
        type,
        category,
        priority,
        actionUrl,
        metadata,
        relatedEntity,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      // Emit socket event for new notification
      try {
        const socketService = getSocketService();
        socketService.emitNewNotification(notification);
      } catch (err) {
        logger.warn("Socket service not available", err);
      }

      return res.status(201).json({
        success: true,
        data: notification,
        message: "Notification created successfully",
      });
    } catch (error) {
      logger.error("Error creating notification:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create notification",
      });
    }
  }
);

// Get notification statistics (admin use)
export const getNotificationStats = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    try {
      const [
        totalNotifications,
        unreadNotifications,
        notificationsByType,
        notificationsByCategory,
      ] = await Promise.all([
        Notification.countDocuments({ userId }),
        Notification.countDocuments({ userId, isRead: false }),
        Notification.aggregate([
          { $match: { userId: userId } },
          { $group: { _id: "$type", count: { $sum: 1 } } },
        ]),
        Notification.aggregate([
          { $match: { userId: userId } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
        ]),
      ]);

      return res.json({
        success: true,
        data: {
          total: totalNotifications,
          unread: unreadNotifications,
          read: totalNotifications - unreadNotifications,
          byType: notificationsByType,
          byCategory: notificationsByCategory,
        },
      });
    } catch (error) {
      logger.error("Error fetching notification stats:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch notification statistics",
      });
    }
  }
);
