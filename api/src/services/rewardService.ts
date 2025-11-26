import { FilterQuery, Types } from "mongoose";
import Reward, {
  IReward,
  IRewardActivity,
  RewardActivity,
  RewardStatus,
} from "../models/Reward";
import User from "../models/User";
import { AuthenticatedRequest } from "../types";
import { calculateTier, getTierInfo, TierInfo } from "../utils/tierCalculation";
import { logger } from "../utils/logger";

interface RewardFilters {
  tenantId?: string;
  isActive?: boolean;
  categories?: string[];
  rewardType?: string;
  featured?: boolean;
}

interface TaskProgressPayload {
  rewardId: string;
  taskId?: string;
  amount?: number;
  context?: Record<string, unknown>;
  userId: string;
  tenantId?: string;
}

export const rewardService = {
  async createRewardTemplate(
    payload: Partial<IReward>,
    req: AuthenticatedRequest
  ) {
    const reward = new Reward({
      ...payload,
      tenantId: req.tenantId || payload.tenantId,
      createdBy: req.user?._id,
    });

    return reward.save();
  },

  async updateRewardTemplate(
    rewardId: string,
    payload: Partial<IReward>,
    tenantId?: string
  ) {
    const reward = await Reward.findOneAndUpdate(
      {
        _id: rewardId,
        ...(tenantId ? { tenantId } : {}),
      },
      { $set: payload },
      { new: true }
    );

    return reward;
  },

  async listRewards(filters: RewardFilters = {}) {
    const query: FilterQuery<IReward> = {};

    if (filters.tenantId) {
      query.$or = [
        { tenantId: filters.tenantId },
        { tenantId: { $exists: false } },
        { tenantId: null },
      ];
    }

    if (typeof filters.isActive === "boolean") {
      query.isActive = filters.isActive;
    }

    if (filters.categories?.length) {
      query.category = { $in: filters.categories };
    }

    if (filters.rewardType) {
      query.rewardType = filters.rewardType;
    }

    if (filters.featured) {
      query.isFeatured = true;
    }

    const rewards = await Reward.find(query)
      .populate("badge")
      .sort({ isFeatured: -1, createdAt: -1 });

    return rewards;
  },

  async getRewardById(id: string, tenantId?: string) {
    const reward = await Reward.findOne({
      _id: id,
      ...(tenantId
        ? { $or: [{ tenantId }, { tenantId: { $exists: false } }] }
        : {}),
    }).populate("badge");

    return reward;
  },

  async deleteRewardTemplate(id: string, tenantId?: string) {
    const deleted = await Reward.findOneAndDelete({
      _id: id,
      ...(tenantId ? { tenantId } : {}),
    });

    if (deleted) {
      await RewardActivity.deleteMany({ reward: deleted._id });
    }

    return deleted;
  },

  async recordTaskProgress({
    rewardId,
    taskId,
    amount = 1,
    context = {},
    userId,
    tenantId,
  }: TaskProgressPayload) {
    const reward = await Reward.findById(rewardId);
    if (!reward) {
      throw new Error("Reward template not found");
    }

    const subTask =
      (taskId &&
        reward.tasks.find((t) => t._id?.toString() === taskId.toString())) ||
      reward.tasks[0];

    const progressTarget =
      subTask?.targetValue ??
      reward.tasks?.[0]?.targetValue ??
      (reward.points ? 1 : 0);

    const query: FilterQuery<IRewardActivity> = {
      user: new Types.ObjectId(userId),
      reward: reward._id,
      ...(taskId ? { taskId } : {}),
    };

    let activity = await RewardActivity.findOne(query);
    if (!activity) {
      activity = new RewardActivity({
        ...query,
        status: reward.tasks.length ? "in_progress" : "earned",
        progressTarget: progressTarget || 1,
        progressValue: 0,
        tenantId: tenantId || reward.tenantId,
      });
    }

    activity.progressValue += amount;
    activity.history.push({
      action: "progress",
      value: amount,
      note: (context.note as string) || undefined,
      at: new Date(),
    });

    const previousStatus = activity.status;
    const wasAlreadyEarned = activity.status === "earned";

    // Check if task requires verification (from task metadata or reward settings)
    const requiresVerification =
      subTask?.metadata?.requiresVerification === true ||
      context.requiresVerification === true ||
      false;

    if (
      activity.progressValue >= activity.progressTarget &&
      activity.status !== "redeemed"
    ) {
      activity.status = "earned";
      if (!activity.earnedAt) {
        activity.earnedAt = new Date();
      }
      activity.pointsAwarded =
        subTask?.points ?? reward.points ?? activity.pointsAwarded;

      // Set up verification if required
      if (requiresVerification) {
        if (!activity.verification) {
          activity.verification = {
            required: true,
            status: "pending",
          };
        } else {
          activity.verification.required = true;
          // Only reset to pending if it hasn't been verified yet
          if (
            activity.verification.status === "approved" ||
            activity.verification.status === "rejected"
          ) {
            // Don't change existing verification status
          } else {
            activity.verification.status = "pending";
          }
        }
      }
    } else if (activity.status === "pending") {
      activity.status = "in_progress";
    }

    activity.metadata = { ...(activity.metadata || {}), ...context };

    await activity.save();

    // Update user points and tier when reward is newly earned
    // Only update if status just changed to "earned" (wasn't already earned)
    // AND verification is not required (or already approved)
    const justEarned =
      activity.status === "earned" &&
      !wasAlreadyEarned &&
      previousStatus !== "earned";
    const canAwardPoints =
      justEarned &&
      activity.pointsAwarded &&
      activity.pointsAwarded > 0 &&
      (!requiresVerification || activity.verification?.status === "approved");

    if (canAwardPoints && activity.pointsAwarded) {
      await this.updateUserPoints(userId, activity.pointsAwarded);

      // Check and award badges linked to this reward/task (async, don't await to avoid blocking)
      if (subTask?.badge) {
        const taskBadgeId =
          subTask.badge instanceof Types.ObjectId
            ? subTask.badge.toString()
            : String(subTask.badge);
        import("./badgeEvaluationService")
          .then(({ badgeEvaluationService }) =>
            badgeEvaluationService.evaluateAndAwardBadge(
              userId,
              taskBadgeId,
              tenantId
            )
          )
          .catch((error) => {
            logger.warn("Error awarding badge from task:", error);
          });
      }

      if (reward.badge) {
        const rewardBadgeId =
          reward.badge instanceof Types.ObjectId
            ? reward.badge.toString()
            : String(reward.badge);
        import("./badgeEvaluationService")
          .then(({ badgeEvaluationService }) =>
            badgeEvaluationService.evaluateAndAwardBadge(
              userId,
              rewardBadgeId,
              tenantId
            )
          )
          .catch((error) => {
            logger.warn("Error awarding badge from reward:", error);
          });
      }

      // Check all eligible badges (in case user now meets criteria for other badges)
      import("./badgeEvaluationService")
        .then(({ badgeEvaluationService }) =>
          badgeEvaluationService.checkAndAwardEligibleBadges(userId, tenantId)
        )
        .catch((error) => {
          logger.warn("Error checking eligible badges:", error);
        });
    }

    return activity;
  },

  /**
   * Update user's total points and recalculate tier
   */
  async updateUserPoints(userId: string, pointsDelta: number): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Initialize rewards object if it doesn't exist
    if (!user.rewards) {
      user.rewards = {
        totalPoints: 0,
        currentTier: "bronze",
        tierPoints: 0,
        badges: [],
      };
    }

    // Update total points
    const newTotalPoints = (user.rewards.totalPoints || 0) + pointsDelta;
    user.rewards.totalPoints = Math.max(0, newTotalPoints); // Ensure non-negative

    // Calculate new tier
    const newTier = calculateTier(user.rewards.totalPoints);
    const tierInfo = getTierInfo(user.rewards.totalPoints);

    // Update tier information
    user.rewards.currentTier = newTier;
    user.rewards.tierPoints = tierInfo.tierPoints;
    user.rewards.lastPointsUpdate = new Date();

    await user.save();
  },

  /**
   * Get user tier information
   */
  async getUserTierInfo(
    userId: string
  ): Promise<TierInfo & { totalPoints: number }> {
    const user = await User.findById(userId).select("rewards");
    if (!user) {
      throw new Error("User not found");
    }

    const totalPoints = user.rewards?.totalPoints || 0;
    const tierInfo = getTierInfo(totalPoints);

    return {
      ...tierInfo,
      totalPoints,
    };
  },

  /**
   * Award badge to user
   */
  async awardBadge(userId: string, badgeId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Initialize rewards object if it doesn't exist
    if (!user.rewards) {
      user.rewards = {
        totalPoints: 0,
        currentTier: "bronze",
        tierPoints: 0,
        badges: [],
      };
    }

    // Check if badge already awarded
    const badgeObjectId = new Types.ObjectId(badgeId);
    if (
      !user.rewards.badges.some(
        (b) => b.toString() === badgeObjectId.toString()
      )
    ) {
      user.rewards.badges.push(badgeObjectId as any);
      await user.save();
    }
  },

  /**
   * Get user badges
   */
  async getUserBadges(userId: string) {
    const user = await User.findById(userId).select("rewards").populate({
      path: "rewards.badges",
      model: "Badge",
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user.rewards?.badges || [];
  },

  async claimReward(
    rewardId: string,
    userId: string,
    payload: {
      voucherCode?: string;
      note?: string;
      issuerId?: string;
    }
  ) {
    const activity = await RewardActivity.findOne({
      reward: rewardId,
      user: userId,
      status: "earned",
    });

    if (!activity) {
      throw new Error("Reward not ready for redemption");
    }

    activity.status = "redeemed";
    activity.redeemedAt = new Date();
    activity.voucherCode =
      payload.voucherCode ||
      activity.voucherCode ||
      `RV-${Date.now().toString(36).toUpperCase()}`;
    activity.issuedBy = payload.issuerId
      ? new Types.ObjectId(payload.issuerId)
      : activity.issuedBy;
    activity.history.push({
      action: "redeemed",
      note: payload.note,
      at: new Date(),
    });

    await activity.save();
    return activity;
  },

  async getUserActivities(userId: string, tenantId?: string) {
    const activities = await RewardActivity.find({
      user: userId,
      ...(tenantId ? { tenantId } : {}),
    })
      .populate("reward")
      .sort({ updatedAt: -1 });

    return activities;
  },

  async getUserSummary(userId: string, tenantId?: string) {
    const match: FilterQuery<IRewardActivity> = {
      user: new Types.ObjectId(userId),
    };
    if (tenantId) {
      match.$or = [
        { tenantId: new Types.ObjectId(tenantId) },
        { tenantId: { $exists: false } },
        { tenantId: null },
      ];
    }

    const aggregation = await RewardActivity.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          points: { $sum: "$pointsAwarded" },
        },
      },
    ]);

    const summary = {
      totalRewards: 0,
      earnedRewards: 0,
      redeemedRewards: 0,
      pendingRewards: 0,
      totalPoints: 0,
    };

    aggregation.forEach((item) => {
      summary.totalRewards += item.count;
      summary.totalPoints += item.points || 0;
      if (item._id === "earned") {
        summary.earnedRewards = item.count;
      }
      if (item._id === "redeemed") {
        summary.redeemedRewards = item.count;
      }
      if (item._id === "pending" || item._id === "in_progress") {
        summary.pendingRewards += item.count;
      }
    });

    return summary;
  },
};

export default rewardService;
