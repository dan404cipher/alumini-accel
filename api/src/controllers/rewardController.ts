import { Request, Response } from "express";
import rewardService from "../services/rewardService";
import { AuthenticatedRequest, UserRole } from "../types";
import User from "../models/User";
import notificationService from "../services/notificationService";

const rewardController = {
  async listRewards(req: AuthenticatedRequest, res: Response) {
    const page = req.query.page
      ? parseInt(req.query.page as string, 10)
      : undefined;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : undefined;

    const result = await rewardService.listRewards({
      tenantId: req.tenantId,
      isActive:
        typeof req.query.active === "string"
          ? req.query.active === "true"
          : true,
      rewardType: req.query.rewardType as string,
      categories: req.query.category
        ? String(req.query.category)
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        : undefined,
      featured: req.query.featured === "true",
      enforceSchedule: req.query.scope === "admin" ? false : true,
      page,
      limit,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
    });

    return res.json({
      success: true,
      data: {
        rewards: result.rewards,
        pagination: result.pagination,
      },
    });
  },

  async getRewardById(req: AuthenticatedRequest, res: Response) {
    const reward = await rewardService.getRewardById(
      req.params.id,
      req.tenantId
    );

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Reward not found",
      });
    }

    return res.json({
      success: true,
      data: { reward },
    });
  },

  async createReward(req: AuthenticatedRequest, res: Response) {
    const reward = await rewardService.createRewardTemplate(req.body, req);
    const rewardDoc = reward as any;
    const rewardId =
      rewardDoc?._id?.toString?.() ?? (rewardDoc?._id ? String(rewardDoc._id) : "");
    const rewardTitle: string = rewardDoc?.title ?? "";

    try {
      await notificationService.sendToRoles({
        event: "reward.new",
        roles: [UserRole.ALUMNI, UserRole.STUDENT],
        tenantId: req.tenantId,
        data: {
          title: rewardTitle,
          rewardId,
        },
      });
    } catch (notifyError) {
      console.error("Failed to send new reward notification:", notifyError);
    }

    return res.status(201).json({
      success: true,
      message: "Reward created successfully",
      data: { reward },
    });
  },

  async updateReward(req: AuthenticatedRequest, res: Response) {
    const reward = await rewardService.updateRewardTemplate(
      req.params.id,
      req.body,
      req.tenantId
    );

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Reward not found",
      });
    }

    return res.json({
      success: true,
      message: "Reward updated successfully",
      data: { reward },
    });
  },

  async deleteReward(req: AuthenticatedRequest, res: Response) {
    const deleted = await rewardService.deleteRewardTemplate(
      req.params.id,
      req.tenantId
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Reward not found",
      });
    }

    return res.json({
      success: true,
      message: "Reward deleted successfully",
    });
  },

  async recordTaskProgress(req: AuthenticatedRequest, res: Response) {
    const activity = await rewardService.recordTaskProgress({
      rewardId: req.params.id,
      taskId: req.params.taskId,
      amount:
        typeof req.body.amount === "number"
          ? req.body.amount
          : parseFloat(req.body.amount) || 1,
      context: req.body.context,
      userId: req.body.userId || req.user?._id?.toString(),
      tenantId: req.tenantId,
    });

    return res.json({
      success: true,
      message: "Task progress recorded",
      data: { activity },
    });
  },

  async claimReward(req: AuthenticatedRequest, res: Response) {
    const activity = await rewardService.claimReward(
      req.params.id,
      req.user?._id?.toString() || req.body.userId,
      {
        voucherCode: req.body.voucherCode,
        note: req.body.note,
        issuerId: req.user?._id?.toString(),
      }
    );

    return res.json({
      success: true,
      message: "Reward redeemed successfully",
      data: { activity },
    });
  },

  async getPublicRewardProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const targetUser = await User.findById(userId).select("tenantId");
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const requesterRole = req.user?.role;
      const isSuperAdmin = requesterRole === UserRole.SUPER_ADMIN;
      const isSelf = req.user?._id?.toString() === userId;
      const isSameTenant =
        targetUser.tenantId &&
        req.tenantId &&
        targetUser.tenantId.toString() === req.tenantId.toString();

      if (!isSuperAdmin && !isSelf && !isSameTenant) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to view this reward profile",
        });
      }

      const [tierInfo, summary, badges] = await Promise.all([
        rewardService.getUserTierInfo(userId),
        rewardService.getUserSummary(userId, req.tenantId),
        rewardService.getUserBadges(userId),
      ]);

      return res.json({
        success: true,
        data: {
          tierInfo,
          summary,
          badges,
        },
      });
    } catch (error) {
      console.error("[getPublicRewardProfile] Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch reward profile",
      });
    }
  },

  async getUserSummary(req: AuthenticatedRequest, res: Response) {
    const summary = await rewardService.getUserSummary(
      req.user?._id?.toString() || "",
      req.tenantId
    );

    return res.json({
      success: true,
      data: { summary },
    });
  },

  async getUserActivities(req: AuthenticatedRequest, res: Response) {
    const activities = await rewardService.getUserActivities(
      req.user?._id?.toString() || "",
      req.tenantId
    );

    return res.json({
      success: true,
      data: { activities },
    });
  },

  async getUserTier(req: AuthenticatedRequest, res: Response) {
    try {
      const tierInfo = await rewardService.getUserTierInfo(
        req.user?._id?.toString() || ""
      );

      return res.json({
        success: true,
        data: { tierInfo },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get tier info",
      });
    }
  },

  async getUserBadges(req: AuthenticatedRequest, res: Response) {
    try {
      // Allow viewing other user's badges if userId query param is provided and user is admin
      const userId = 
        req.query.userId && 
        (req.user?.role === "super_admin" || req.user?.role === "college_admin" || req.user?.role === "staff")
          ? req.query.userId as string
          : req.user?._id?.toString() || "";

      console.log("[getUserBadges Controller] Request user:", req.user?._id?.toString());
      console.log("[getUserBadges Controller] Query userId:", req.query.userId);
      console.log("[getUserBadges Controller] Final userId:", userId);

      const badges = await rewardService.getUserBadges(userId);

      console.log("[getUserBadges Controller] Returning badges count:", badges.length);

      return res.json({
        success: true,
        data: { badges },
      });
    } catch (error) {
      console.error("[getUserBadges Controller] Error:", error);
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get badges",
      });
    }
  },
};

export default rewardController;

