import { FilterQuery, Types } from "mongoose";
import { RewardActivity, IRewardActivity } from "../models/Reward";
import User from "../models/User";
import Reward from "../models/Reward";
import rewardService from "./rewardService";
import notificationService from "./notificationService";
import { logger } from "../utils/logger";

interface VerificationFilters {
  tenantId?: string;
  status?: "pending" | "approved" | "rejected";
  category?: string;
  userId?: string;
  rewardId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const getActivityUserId = (
  userRef:
    | Types.ObjectId
    | string
    | (Record<string, any> & { _id?: Types.ObjectId | string })
) => {
  if (!userRef) {
    throw new Error("Activity is missing user reference");
  }

  if (typeof userRef === "string") {
    return userRef;
  }

  if (userRef instanceof Types.ObjectId) {
    return userRef.toHexString();
  }

  if (typeof userRef === "object" && "_id" in userRef) {
    const nestedId = (userRef as any)._id;
    if (typeof nestedId === "string") {
      return nestedId;
    }
    if (nestedId instanceof Types.ObjectId) {
      return nestedId.toHexString();
    }
  }

  throw new Error("Unable to determine user ID from activity user reference");
};

export const rewardVerificationService = {
  /**
   * Get pending verifications with filters
   */
  async getPendingVerifications(filters: VerificationFilters = {}) {
    const query: FilterQuery<IRewardActivity> = {
      "verification.required": true,
      ...(filters.status
        ? { "verification.status": filters.status }
        : { "verification.status": "pending" }),
    };

    if (filters.tenantId) {
      // Add tenantId filter - activities must match tenantId OR have no tenantId (global)
      const tenantIdFilter = {
        $or: [
          { tenantId: new Types.ObjectId(filters.tenantId) },
          { tenantId: { $exists: false } },
          { tenantId: null },
        ],
      };
      // Combine with existing query using $and
      query.$and = query.$and || [];
      query.$and.push(tenantIdFilter);
    }

    if (filters.userId) {
      query.user = new Types.ObjectId(filters.userId);
    }

    if (filters.rewardId) {
      query.reward = new Types.ObjectId(filters.rewardId);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // If search is provided, use aggregation pipeline
    if (filters.search && filters.search.trim()) {
      const searchRegex = { $regex: filters.search.trim(), $options: "i" };
      const pipeline: any[] = [
        { $match: query },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $lookup: {
            from: "rewards",
            localField: "reward",
            foreignField: "_id",
            as: "rewardData",
          },
        },
        { $unwind: "$userData" },
        { $unwind: "$rewardData" },
        {
          $match: {
            $or: [
              { "userData.firstName": searchRegex },
              { "userData.lastName": searchRegex },
              { "userData.email": searchRegex },
              { "rewardData.name": searchRegex },
            ],
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ];

      const countPipeline = [
        ...pipeline.slice(0, -2), // Remove skip and limit
        { $count: "total" },
      ];

      const [activitiesResult, countResult] = await Promise.all([
        RewardActivity.aggregate(pipeline),
        RewardActivity.aggregate(countPipeline),
      ]);

      // Get full documents with populate
      const activityIds = activitiesResult.map((item) => item._id);
      const activities = await RewardActivity.find({
        _id: { $in: activityIds },
      })
        .populate("user", "firstName lastName email profilePicture")
        .populate("reward", "name category icon color tasks")
        .populate("verification.verifiedBy", "firstName lastName email")
        .sort({ createdAt: -1 });

      const total = countResult[0]?.total || 0;

      return {
        activities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }

    // Standard query without search
    const [activities, total] = await Promise.all([
      RewardActivity.find(query)
        .populate("user", "firstName lastName email profilePicture")
        .populate("reward", "name category icon color tasks")
        .populate("verification.verifiedBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      RewardActivity.countDocuments(query),
    ]);

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Verify a task (approve or reject)
   */
  async verifyTask(
    activityId: string,
    action: "approve" | "reject",
    staffId: string,
    reason?: string,
    tenantId?: string
  ) {
    const activity = await RewardActivity.findOne({
      _id: activityId,
      "verification.required": true,
      ...(tenantId ? { tenantId: new Types.ObjectId(tenantId) } : {}),
    })
      .populate("reward")
      .populate("user")
      .populate("verification.verifiedBy", "firstName lastName email");

    if (!activity) {
      throw new Error("Verification task not found");
    }

    if (activity.verification?.status !== "pending") {
      throw new Error("Task has already been verified");
    }

    const activityUserId = getActivityUserId(activity.user);
    const now = new Date();

    if (action === "approve") {
      // Validate staffId is a valid ObjectId string
      if (!staffId || !Types.ObjectId.isValid(staffId)) {
        throw new Error("Invalid staff ID provided");
      }

      // Approve the task
      activity.verification = {
        ...activity.verification,
        status: "approved",
        verifiedBy: new Types.ObjectId(staffId),
        verifiedAt: now,
      };

      // If task was earned but not yet awarded points due to verification, award them now
      if (
        activity.status === "earned" &&
        activity.pointsAwarded &&
        activity.pointsAwarded > 0
      ) {
        // Check if points were already added (to avoid double-counting)
        const user = await User.findById(activityUserId);
        if (user && user.rewards) {
          // Only add points if they haven't been added yet
          // We can check this by looking at the history or metadata
          const pointsAlreadyAdded =
            activity.metadata?.pointsAddedToUser === true;

          if (!pointsAlreadyAdded) {
            await rewardService.updateUserPoints(
              activityUserId,
              activity.pointsAwarded
            );
            activity.metadata = {
              ...activity.metadata,
              pointsAddedToUser: true,
            };
          }
        }
      }

      // Award badges after approval (if not already awarded)
      const badgesAlreadyAwarded = activity.metadata?.badgesAwarded === true;
      if (!badgesAlreadyAwarded && activity.status === "earned") {
        const reward = activity.reward as any;
        const tenantId = activity.tenantId
          ? activity.tenantId instanceof Types.ObjectId
            ? activity.tenantId.toString()
            : String(activity.tenantId)
          : undefined;

        // Award badge from reward if present
        if (reward?.badge) {
          let rewardBadgeId: string | null = null;

          if (reward.badge instanceof Types.ObjectId) {
            rewardBadgeId = reward.badge.toString();
          } else if (typeof reward.badge === "object" && reward.badge._id) {
            rewardBadgeId =
              reward.badge._id instanceof Types.ObjectId
                ? reward.badge._id.toString()
                : String(reward.badge._id);
          } else if (typeof reward.badge === "string") {
            rewardBadgeId = reward.badge;
          }

          if (rewardBadgeId) {
            import("./badgeEvaluationService")
              .then(({ badgeEvaluationService }) =>
                badgeEvaluationService.awardBadgeDirectly(
                  activityUserId,
                  rewardBadgeId,
                  tenantId,
                  `Awarded for completing reward: ${reward.name || "Reward"}`
                )
              )
              .catch((error) => {
                console.error(
                  "[verifyTask] Error awarding reward badge:",
                  error
                );
              });
          }
        }

        // Award badge from task if present
        if (activity.taskId && reward?.tasks) {
          const task = Array.isArray(reward.tasks)
            ? reward.tasks.find(
                (t: any) => t._id?.toString() === activity.taskId?.toString()
              )
            : null;

          if (task?.badge) {
            let taskBadgeId: string | null = null;

            if (task.badge instanceof Types.ObjectId) {
              taskBadgeId = task.badge.toString();
            } else if (typeof task.badge === "object" && task.badge._id) {
              taskBadgeId =
                task.badge._id instanceof Types.ObjectId
                  ? task.badge._id.toString()
                  : String(task.badge._id);
            } else if (typeof task.badge === "string") {
              taskBadgeId = task.badge;
            }

            if (taskBadgeId) {
              import("./badgeEvaluationService")
                .then(({ badgeEvaluationService }) =>
                  badgeEvaluationService.awardBadgeDirectly(
                    activityUserId,
                    taskBadgeId,
                    tenantId,
                    `Awarded for completing task: ${task.title || "Task"}`
                  )
                )
                .catch((error) => {
                  console.error(
                    "[verifyTask] Error awarding task badge:",
                    error
                  );
                });
            }
          }
        }

        // Mark badges as awarded to prevent duplicate awards
        activity.metadata = {
          ...activity.metadata,
          badgesAwarded: true,
        };
      }

      activity.history.push({
        action: "verified",
        note: reason || "Task approved by staff",
        at: now,
      });

      // Send reward earned notification (was skipped while awaiting verification)
      const rewardDoc = activity.reward as any;
      const rewardName = rewardDoc?.name || "Reward";
      const rewardPoints =
        activity.pointsAwarded ??
        rewardDoc?.points ??
        activity.metadata?.pointsAwarded ??
        0;
      const rewardBadgeName =
        typeof rewardDoc?.badge?.name === "string"
          ? rewardDoc.badge.name
          : undefined;
      const task =
        rewardDoc?.tasks?.find(
          (t: any) => t._id?.toString() === activity.taskId?.toString()
        ) || null;
      const taskBadgeName =
        typeof task?.badge?.name === "string" ? task.badge.name : undefined;
      const rewardNotificationSent =
        activity.metadata && activity.metadata.rewardEarnedNotified;

      if (!rewardNotificationSent) {
        try {
          await notificationService.send({
            recipients: [activityUserId],
            event: "reward.earned",
            data: {
              title: rewardName,
              points: rewardPoints,
              badgeName: rewardBadgeName || taskBadgeName,
            },
          });
          activity.metadata = {
            ...(activity.metadata || {}),
            rewardEarnedNotified: true,
          };
        } catch (notifyError) {
          logger.warn(
            "Failed to send reward earned notification after verification:",
            notifyError
          );
        }
      }
    } else {
      // Validate staffId is a valid ObjectId string
      if (!staffId || !Types.ObjectId.isValid(staffId)) {
        throw new Error("Invalid staff ID provided");
      }

      // Reject the task
      activity.verification = {
        ...activity.verification,
        status: "rejected",
        verifiedBy: new Types.ObjectId(staffId),
        verifiedAt: now,
        rejectionReason: reason || "Task rejected by staff",
      };

      // If points were already awarded, we might want to deduct them
      // For now, we'll just mark it as rejected
      activity.history.push({
        action: "rejected",
        note: reason || "Task rejected by staff",
        at: now,
      });

      // Send notification to user about rejection
      try {
        const reward = await Reward.findById(activity.reward).select(
          "name tasks"
        );
        const task = reward?.tasks?.find(
          (t: any) => t._id?.toString() === activity.taskId?.toString()
        );
        const taskTitle = task?.title || reward?.name || "Task";

        await notificationService.send({
          recipients: [activityUserId],
          event: "task.rejected",
          data: {
            taskTitle,
            rejectionReason: reason || "Task rejected by staff",
            rewardId: activity.reward.toString(),
            activityId: (activity._id as Types.ObjectId).toString(),
          },
          metadata: {
            rejectedBy: staffId,
            rejectedAt: now.toISOString(),
          },
        });
      } catch (notifyError) {
        logger.error(
          "Failed to send task rejection notification:",
          notifyError
        );
        // Don't throw - rejection should still succeed even if notification fails
      }
    }

    await activity.save();
    return activity;
  },

  /**
   * Resubmit a rejected task (user can resubmit after making modifications)
   */
  async resubmitTask(activityId: string, userId: string, tenantId?: string) {
    const activity = await RewardActivity.findOne({
      _id: activityId,
      user: new Types.ObjectId(userId),
      "verification.required": true,
      "verification.status": "rejected",
      ...(tenantId ? { tenantId: new Types.ObjectId(tenantId) } : {}),
    })
      .populate("reward")
      .populate("user");

    if (!activity) {
      throw new Error(
        "Rejected task not found or you don't have permission to resubmit it"
      );
    }

    // Reset verification status to pending
    activity.verification = {
      required: true,
      status: "pending",
      // Clear rejection-related fields
      verifiedBy: undefined,
      verifiedAt: undefined,
      rejectionReason: undefined,
    };

    // Add resubmission to history
    activity.history.push({
      action: "resubmitted",
      note: "Task resubmitted by user after rejection",
      at: new Date(),
    });

    await activity.save();

    // Send notification about resubmission
    try {
      const reward = activity.reward as any;
      const task = reward?.tasks?.find(
        (t: any) => t._id?.toString() === activity.taskId?.toString()
      );
      const taskTitle = task?.title || reward?.name || "Task";

      await notificationService.send({
        recipients: [userId],
        event: "task.resubmitted",
        data: {
          taskTitle,
          rewardId: activity.reward.toString(),
          activityId: (activity._id as Types.ObjectId).toString(),
        },
      });
    } catch (notifyError) {
      logger.error(
        "Failed to send task resubmission notification:",
        notifyError
      );
      // Don't throw - resubmission should still succeed even if notification fails
    }

    return activity;
  },

  /**
   * Get verification statistics
   */
  async getVerificationStats(tenantId?: string) {
    const match: FilterQuery<IRewardActivity> = {
      "verification.required": true,
    };

    if (tenantId) {
      // Add tenantId filter - activities must match tenantId OR have no tenantId (global)
      const tenantIdFilter = {
        $or: [
          { tenantId: new Types.ObjectId(tenantId) },
          { tenantId: { $exists: false } },
          { tenantId: null },
        ],
      };
      // Combine with existing query using $and
      match.$and = match.$and || [];
      match.$and.push(tenantIdFilter);
    }

    const stats = await RewardActivity.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$verification.status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0,
    };

    stats.forEach((stat) => {
      const status = stat._id || "pending";
      result[status as keyof typeof result] = stat.count;
      result.total += stat.count;
    });

    // Get recent verifications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMatch = {
      ...match,
      "verification.verifiedAt": { $gte: sevenDaysAgo },
    };

    const recentStats = await RewardActivity.aggregate([
      { $match: recentMatch },
      {
        $group: {
          _id: "$verification.status",
          count: { $sum: 1 },
        },
      },
    ]);

    const recent = {
      approved: 0,
      rejected: 0,
    };

    recentStats.forEach((stat: { _id: string; count: number }) => {
      const status = stat._id as "approved" | "rejected";
      if (status === "approved" || status === "rejected") {
        recent[status] = stat.count;
      }
    });

    return {
      ...result,
      recent,
    };
  },
};

export default rewardVerificationService;
