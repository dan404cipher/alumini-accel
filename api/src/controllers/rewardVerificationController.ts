import { Request, Response } from "express";
import rewardVerificationService from "../services/rewardVerificationService";
import { AuthenticatedRequest } from "../types";
import { asyncHandler } from "../middleware/errorHandler";

const rewardVerificationController = {
  async getPendingVerifications(req: AuthenticatedRequest, res: Response) {
    try {
      const filters = {
        tenantId: req.tenantId,
        status: req.query.status as "pending" | "approved" | "rejected" | undefined,
        category: req.query.category as string | undefined,
        userId: req.query.userId as string | undefined,
        rewardId: req.query.rewardId as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await rewardVerificationService.getPendingVerifications(filters);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get verifications",
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
      // Fallback to extracting from req.user if userId is not available
      let staffId: string = req.userId || "";
      
      if (!staffId && req.user) {
        // Fallback: extract from req.user object
        if (req.user._id) {
          const userId = req.user._id as any;
          staffId = typeof userId === "string" 
            ? userId 
            : (userId?.toString ? userId.toString() : String(userId));
        } else if ((req.user as any).id) {
          const userId = (req.user as any).id;
          staffId = typeof userId === "string" 
            ? userId 
            : (userId?.toString ? userId.toString() : String(userId));
        }
      }

      // Validate staffId is a valid ObjectId string format
      if (!staffId || !/^[0-9a-fA-F]{24}$/.test(staffId)) {
        return res.status(401).json({
          success: false,
          message: "Invalid user ID in request",
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
        message: error instanceof Error ? error.message : "Failed to verify task",
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
        message: error instanceof Error ? error.message : "Failed to get verification stats",
      });
    }
  },
};

export default rewardVerificationController;

