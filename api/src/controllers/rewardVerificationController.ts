import { Request, Response } from "express";
import rewardVerificationService from "../services/rewardVerificationService";
import { AuthenticatedRequest } from "../types";
import { asyncHandler } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const rewardVerificationController = {
  async getPendingVerifications(req: AuthenticatedRequest, res: Response) {
    try {
      const filters = {
        tenantId: req.tenantId,
        status: req.query.status as
          | "pending"
          | "approved"
          | "rejected"
          | undefined,
        category: req.query.category as string | undefined,
        userId: req.query.userId as string | undefined,
        rewardId: req.query.rewardId as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
      };

      const result =
        await rewardVerificationService.getPendingVerifications(filters);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get verifications",
      });
    }
  },

  async verifyTask(req: AuthenticatedRequest, res: Response) {
    try {
      const { action, reason } = req.body;
      const { activityId } = req.params;

      if (!action || (action !== "approve" && action !== "reject")) {
        return res.status(400).json({
          success: false,
          message: "Action must be 'approve' or 'reject'",
        });
      }

      // Use req.userId which is already set as a string by auth middleware
      // This is the safest way to get the user ID
      let staffId: string = "";

      // First, try req.userId (set by auth middleware as a string)
      if (req.userId && typeof req.userId === "string") {
        staffId = req.userId;
      }
      // Fallback: extract from req.user object
      else if (req.user) {
        // Check if req.user is already a string (shouldn't happen, but handle it)
        if (typeof req.user === "string") {
          const userString = req.user as string;
          // Try to extract ObjectId from string representation
          const match = userString.match(
            /ObjectId\(['"]([a-fA-F0-9]{24})['"]\)/
          );
          if (match && match[1]) {
            staffId = match[1];
          } else {
            // If it looks like a valid ObjectId string, use it
            const cleaned = userString.trim();
            if (/^[0-9a-fA-F]{24}$/.test(cleaned)) {
              staffId = cleaned;
            }
          }
        }
        // Normal case: req.user is an object
        else if (typeof req.user === "object" && req.user !== null) {
          // Try _id first
          if (req.user._id) {
            const userId = req.user._id as any;
            if (userId && typeof userId !== "string") {
              staffId = userId.toString ? userId.toString() : String(userId);
            } else if (typeof userId === "string") {
              staffId = userId;
            }
          }
          // Fallback to id property
          else if ((req.user as any).id) {
            const userId = (req.user as any).id;
            if (userId && typeof userId !== "string") {
              staffId = userId.toString ? userId.toString() : String(userId);
            } else if (typeof userId === "string") {
              staffId = userId;
            }
          }
        }
      }

      // Validate staffId is a valid ObjectId string format (24 hex characters)
      if (!staffId || !/^[0-9a-fA-F]{24}$/.test(staffId)) {
        logger.error("Invalid staffId extracted:", {
          staffId,
          hasUserId: !!req.userId,
          userIdType: typeof req.userId,
          hasUser: !!req.user,
          userType: typeof req.user,
        });
        return res.status(401).json({
          success: false,
          message: "Invalid user ID in request. Please log in again.",
        });
      }

      const activity = await rewardVerificationService.verifyTask(
        activityId,
        action,
        staffId,
        reason,
        req.tenantId
      );

      return res.json({
        success: true,
        message: `Task ${action === "approve" ? "approved" : "rejected"} successfully`,
        data: { activity },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to verify task",
      });
    }
  },

  async getVerificationStats(req: AuthenticatedRequest, res: Response) {
    try {
      const stats = await rewardVerificationService.getVerificationStats(
        req.tenantId
      );

      return res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get verification stats",
      });
    }
  },

  async resubmitTask(req: AuthenticatedRequest, res: Response) {
    try {
      const { activityId } = req.params;
      const userId = req.userId || req.user?._id?.toString() || "";

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User ID not found in request",
        });
      }

      // Validate userId is a valid ObjectId string format
      if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
        return res.status(401).json({
          success: false,
          message: "Invalid user ID in request",
        });
      }

      const activity = await rewardVerificationService.resubmitTask(
        activityId,
        userId,
        req.tenantId
      );

      return res.json({
        success: true,
        message:
          "Task resubmitted successfully. It is now pending verification again.",
        data: { activity },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to resubmit task",
      });
    }
  },
};

export default rewardVerificationController;
