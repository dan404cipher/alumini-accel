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
  enforceSchedule?: boolean;
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
      .populate("tasks.badge")
      .sort({ isFeatured: -1, createdAt: -1 });

    if (filters.enforceSchedule === false) {
      return rewards;
    }

    const now = new Date();
    return rewards.filter((reward) => {
      if (reward.startsAt && new Date(reward.startsAt) > now) {
        return false;
      }
      if (reward.endsAt && new Date(reward.endsAt) < now) {
        return false;
      }
      return true;
    });
  },

  async getRewardById(id: string, tenantId?: string) {
    const reward = await Reward.findOne({
      _id: id,
      ...(tenantId
        ? { $or: [{ tenantId }, { tenantId: { $exists: false } }] }
        : {}),
    })
      .populate("badge")
      .populate("tasks.badge");

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
    const verificationSatisfied =
      !requiresVerification || activity.verification?.status === "approved";

    const canAwardPoints =
      justEarned &&
      verificationSatisfied &&
      activity.pointsAwarded &&
      activity.pointsAwarded > 0;

    if (canAwardPoints && activity.pointsAwarded) {
      await this.updateUserPoints(userId, activity.pointsAwarded);
    }

    const shouldAwardBadges = justEarned && verificationSatisfied;

    if (shouldAwardBadges) {
      console.log(
        "[recordTaskProgress] Should award badges - checking for badge links"
      );
      // Award badges linked to this reward/task directly (without criteria check)
      if (subTask?.badge) {
        let taskBadgeId: string | null = null;
        const taskBadge = subTask.badge as any;

        // Handle different badge formats: ObjectId, populated object, or string
        if (taskBadge instanceof Types.ObjectId) {
          taskBadgeId = taskBadge.toString();
        } else if (typeof taskBadge === "object" && taskBadge._id) {
          // Badge is populated object
          taskBadgeId =
            taskBadge._id instanceof Types.ObjectId
              ? taskBadge._id.toString()
              : String(taskBadge._id);
        } else if (typeof taskBadge === "string") {
          taskBadgeId = taskBadge;
        }

        if (taskBadgeId) {
          console.log(
            "[recordTaskProgress] Task has badge, awarding:",
            taskBadgeId
          );
          import("./badgeEvaluationService")
            .then(({ badgeEvaluationService }) =>
              badgeEvaluationService.awardBadgeDirectly(
                userId,
                taskBadgeId,
                tenantId,
                `Awarded for completing task: ${subTask.title || "Task"}`
              )
            )
            .catch((error) => {
              console.error(
                "[recordTaskProgress] Error awarding badge from task:",
                error
              );
              logger.warn("Error awarding badge from task:", error);
            });
        } else {
          console.log(
            "[recordTaskProgress] Unable to extract task badge ID from:",
            taskBadge
          );
        }
      }

      if (reward.badge) {
        let rewardBadgeId: string | null = null;
        const rewardBadge = reward.badge as any;

        // Handle different badge formats: ObjectId, populated object, or string
        if (rewardBadge instanceof Types.ObjectId) {
          rewardBadgeId = rewardBadge.toString();
        } else if (typeof rewardBadge === "object" && rewardBadge._id) {
          // Badge is populated object
          rewardBadgeId =
            rewardBadge._id instanceof Types.ObjectId
              ? rewardBadge._id.toString()
              : String(rewardBadge._id);
        } else if (typeof rewardBadge === "string") {
          rewardBadgeId = rewardBadge;
        }

        if (rewardBadgeId) {
          console.log(
            "[recordTaskProgress] Reward has badge, awarding:",
            rewardBadgeId
          );
          import("./badgeEvaluationService")
            .then(({ badgeEvaluationService }) =>
              badgeEvaluationService.awardBadgeDirectly(
                userId,
                rewardBadgeId,
                tenantId,
                `Awarded for completing reward: ${reward.name}`
              )
            )
            .catch((error) => {
              console.error(
                "[recordTaskProgress] Error awarding badge from reward:",
                error
              );
              logger.warn("Error awarding badge from reward:", error);
            });
        } else {
          console.log(
            "[recordTaskProgress] Unable to extract reward badge ID from:",
            rewardBadge
          );
        }
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

    const rewardsData = user.rewards || {
      totalPoints: 0,
      currentTier: "bronze" as const,
      tierPoints: 0,
      badges: [],
    };

    let totalPoints = rewardsData.totalPoints || 0;

    // If totalPoints appears to be stale (e.g., 0) but the user has earned points
    // in reward activities, recalculate from the activity history and sync.
    if (!totalPoints) {
      const activityPoints = await RewardActivity.aggregate([
        {
          $match: {
            user: new Types.ObjectId(userId),
            status: { $in: ["earned", "redeemed"] },
            pointsAwarded: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            totalPoints: { $sum: "$pointsAwarded" },
          },
        },
      ]);

      const aggregatedPoints = activityPoints[0]?.totalPoints || 0;

      if (aggregatedPoints > totalPoints) {
        totalPoints = aggregatedPoints;
        const syncedTierInfo = getTierInfo(totalPoints);

        user.rewards = {
          ...rewardsData,
          totalPoints,
          currentTier: syncedTierInfo.currentTier,
          tierPoints: syncedTierInfo.tierPoints,
          badges: rewardsData.badges || [],
          lastPointsUpdate: new Date(),
        };

        await user.save();
      }
    }

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
    console.log("[getUserBadges Service] Starting - userId:", userId);

    if (!userId) {
      console.log(
        "[getUserBadges Service] No userId provided, returning empty array"
      );
      return [];
    }

    // Query UserBadge collection which is the source of truth for awarded badges
    const { UserBadge } = await import("../models/Badge");

    // First, check if there are ANY UserBadge records for this user
    const totalUserBadges = await UserBadge.countDocuments({
      user: new Types.ObjectId(userId),
    });
    console.log(
      "[getUserBadges Service] Total UserBadge records for user:",
      totalUserBadges
    );

    // Also check all UserBadge records to see what's in the database
    const allUserBadges = await UserBadge.find({}).limit(10).lean();
    console.log(
      "[getUserBadges Service] Sample UserBadge records (first 10):",
      JSON.stringify(allUserBadges, null, 2)
    );

    const userBadges = await UserBadge.find({
      user: new Types.ObjectId(userId),
    })
      .populate("badge")
      .sort({ awardedAt: -1 })
      .lean();

    console.log("[getUserBadges Service] User ID:", userId);
    console.log("[getUserBadges Service] UserBadges found:", userBadges.length);
    console.log(
      "[getUserBadges Service] Raw userBadges:",
      JSON.stringify(userBadges, null, 2)
    );

    // Extract badge details from populated userBadges
    const badges = userBadges
      .map((ub: any) => {
        console.log(
          "[getUserBadges Service] Processing userBadge:",
          ub._id,
          "badge:",
          ub.badge
        );
        return ub.badge;
      })
      .filter((badge: any) => {
        const isValid = badge !== null && badge !== undefined;
        if (!isValid) {
          console.log(
            "[getUserBadges Service] Filtered out null/undefined badge"
          );
        }
        return isValid;
      });

    console.log(
      "[getUserBadges Service] Extracted badges count:",
      badges.length
    );
    console.log(
      "[getUserBadges Service] Badges:",
      JSON.stringify(badges, null, 2)
    );

    return badges;
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
    }).populate("reward");

    if (!activity) {
      throw new Error("Reward not ready for redemption");
    }

    const reward = activity.reward as any;

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

    console.log("[claimReward] Reward type:", reward?.rewardType);
    console.log("[claimReward] Reward badge:", reward?.badge);
    console.log("[claimReward] Reward badge type:", typeof reward?.badge);

    // Award badge if reward type is badge and badge is linked
    if (reward && (reward.rewardType === "badge" || reward.badge)) {
      let badgeId: string | null = null;

      if (reward.badge) {
        // Handle different badge formats: ObjectId, populated object, or string
        if (reward.badge instanceof Types.ObjectId) {
          badgeId = reward.badge.toString();
        } else if (typeof reward.badge === "object" && reward.badge._id) {
          // Badge is populated object
          badgeId =
            reward.badge._id instanceof Types.ObjectId
              ? reward.badge._id.toString()
              : String(reward.badge._id);
        } else if (typeof reward.badge === "string") {
          badgeId = reward.badge;
        } else {
          console.log(
            "[claimReward] Unable to extract badge ID from:",
            reward.badge
          );
        }
      }

      console.log("[claimReward] Extracted badgeId:", badgeId);

      if (badgeId) {
        const tenantId = activity.tenantId
          ? activity.tenantId instanceof Types.ObjectId
            ? activity.tenantId.toString()
            : String(activity.tenantId)
          : undefined;

        console.log(
          "[claimReward] Awarding badge - userId:",
          userId,
          "badgeId:",
          badgeId,
          "tenantId:",
          tenantId
        );

        import("./badgeEvaluationService")
          .then(({ badgeEvaluationService }) =>
            badgeEvaluationService.awardBadgeDirectly(
              userId,
              badgeId,
              tenantId,
              `Awarded for claiming reward: ${reward.name}`
            )
          )
          .then((success) => {
            console.log("[claimReward] Badge award result:", success);
          })
          .catch((error) => {
            console.error("[claimReward] Error awarding badge:", error);
            logger.warn("Error awarding badge on reward claim:", error);
          });
      } else {
        console.log("[claimReward] No badgeId extracted, skipping badge award");
      }
    } else {
      console.log("[claimReward] Reward type is not badge and no badge linked");
    }

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
