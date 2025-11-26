import { FilterQuery, Types } from "mongoose";
import { RewardActivity, IRewardActivity } from "../models/Reward";
import User from "../models/User";
import rewardService from "./rewardService";

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
      query.$or = [
        { tenantId: new Types.ObjectId(filters.tenantId) },
        { tenantId: { $exists: false } },
        { tenantId: null },
      ];
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
      const activities = await RewardActivity.find({ _id: { $in: activityIds } })
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

    const now = new Date();

    if (action === "approve") {
      // Approve the task
      activity.verification = {
        ...activity.verification,
        status: "approved",
        verifiedBy: new Types.ObjectId(staffId),
        verifiedAt: now,
      };

      // If task was earned but not yet awarded points due to verification, award them now
      if (activity.status === "earned" && activity.pointsAwarded && activity.pointsAwarded > 0) {
        // Check if points were already added (to avoid double-counting)
        const user = await User.findById(activity.user);
        if (user && user.rewards) {
          // Only add points if they haven't been added yet
          // We can check this by looking at the history or metadata
          const pointsAlreadyAdded = activity.metadata?.pointsAddedToUser === true;
          
          if (!pointsAlreadyAdded) {
            await rewardService.updateUserPoints(
              activity.user.toString(),
              activity.pointsAwarded
            );
            activity.metadata = {
              ...activity.metadata,
              pointsAddedToUser: true,
            };
          }
        }
      }

      activity.history.push({
        action: "verified",
        note: reason || "Task approved by staff",
        at: now,
      });
    } else {
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
    }

    await activity.save();
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
      match.$or = [
        { tenantId: new Types.ObjectId(tenantId) },
        { tenantId: { $exists: false } },
        { tenantId: null },
      ];
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

