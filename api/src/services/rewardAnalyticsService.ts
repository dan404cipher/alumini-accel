import { FilterQuery, Types } from "mongoose";
import { RewardActivity, IRewardActivity, Reward } from "../models/Reward";
import User from "../models/User";
import AlumniProfile from "../models/AlumniProfile";

interface AnalyticsFilters {
  tenantId?: string;
  startDate?: Date;
  endDate?: Date;
  category?: string;
  department?: string;
}

export const rewardAnalyticsService = {
  /**
   * Get points distribution by category
   */
  async getPointsDistribution(filters: AnalyticsFilters = {}) {
    const match: FilterQuery<IRewardActivity> = {
      status: { $in: ["earned", "redeemed"] },
      pointsAwarded: { $gt: 0 },
    };

    if (filters.tenantId) {
      match.$or = [
        { tenantId: new Types.ObjectId(filters.tenantId) },
        { tenantId: { $exists: false } },
        { tenantId: null },
      ];
    }

    if (filters.startDate || filters.endDate) {
      match.createdAt = {};
      if (filters.startDate) match.createdAt.$gte = filters.startDate;
      if (filters.endDate) match.createdAt.$lte = filters.endDate;
    }

    // Get points by category
    const pointsByCategory = await RewardActivity.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "rewards",
          localField: "reward",
          foreignField: "_id",
          as: "rewardDetails",
        },
      },
      { $unwind: "$rewardDetails" },
      {
        $group: {
          _id: "$rewardDetails.category",
          totalPoints: { $sum: "$pointsAwarded" },
          count: { $sum: 1 },
          avgPoints: { $avg: "$pointsAwarded" },
        },
      },
      { $sort: { totalPoints: -1 } },
    ]);

    // Get total points
    const totalStats = await RewardActivity.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: "$pointsAwarded" },
          totalActivities: { $sum: 1 },
          avgPointsPerActivity: { $avg: "$pointsAwarded" },
        },
      },
    ]);

    return {
      byCategory: pointsByCategory.map((item) => ({
        category: item._id || "uncategorized",
        totalPoints: item.totalPoints,
        count: item.count,
        avgPoints: Math.round(item.avgPoints || 0),
      })),
      total: totalStats[0] || {
        totalPoints: 0,
        totalActivities: 0,
        avgPointsPerActivity: 0,
      },
    };
  },

  /**
   * Get task completion statistics
   */
  async getTaskCompletionStats(filters: AnalyticsFilters = {}) {
    const match: FilterQuery<IRewardActivity> = {};

    if (filters.tenantId) {
      match.$or = [
        { tenantId: new Types.ObjectId(filters.tenantId) },
        { tenantId: { $exists: false } },
        { tenantId: null },
      ];
    }

    if (filters.category) {
      // Need to lookup reward to filter by category
      const rewards = await Reward.find({ category: filters.category }).select("_id");
      match.reward = { $in: rewards.map((r) => r._id) };
    }

    if (filters.startDate || filters.endDate) {
      match.createdAt = {};
      if (filters.startDate) match.createdAt.$gte = filters.startDate;
      if (filters.endDate) match.createdAt.$lte = filters.endDate;
    }

    const stats = await RewardActivity.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "rewards",
          localField: "reward",
          foreignField: "_id",
          as: "rewardDetails",
        },
      },
      { $unwind: "$rewardDetails" },
      {
        $group: {
          _id: {
            category: "$rewardDetails.category",
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.category": 1, "_id.status": 1 } },
    ]);

    // Get top tasks
    const topTasks = await RewardActivity.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "rewards",
          localField: "reward",
          foreignField: "_id",
          as: "rewardDetails",
        },
      },
      { $unwind: "$rewardDetails" },
      {
        $group: {
          _id: "$rewardDetails.name",
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "earned"] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
        },
      },
      { $sort: { completed: -1 } },
      { $limit: 10 },
    ]);

    return {
      byCategory: stats.reduce((acc: any, item: any) => {
        const category = item._id.category || "uncategorized";
        const status = item._id.status;
        if (!acc[category]) {
          acc[category] = { pending: 0, in_progress: 0, earned: 0, redeemed: 0 };
        }
        acc[category][status] = item.count;
        return acc;
      }, {}),
      topTasks: topTasks.map((task) => ({
        name: task._id,
        completed: task.completed,
        inProgress: task.inProgress,
        pending: task.pending,
      })),
    };
  },

  /**
   * Get reward claims analytics
   */
  async getRewardClaimsAnalytics(filters: AnalyticsFilters = {}) {
    const match: FilterQuery<IRewardActivity> = {
      status: "redeemed",
    };

    if (filters.tenantId) {
      match.$or = [
        { tenantId: new Types.ObjectId(filters.tenantId) },
        { tenantId: { $exists: false } },
        { tenantId: null },
      ];
    }

    if (filters.startDate || filters.endDate) {
      match.redeemedAt = {};
      if (filters.startDate) match.redeemedAt.$gte = filters.startDate;
      if (filters.endDate) match.redeemedAt.$lte = filters.endDate;
    }

    // Claims over time
    const claimsOverTime = await RewardActivity.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: "$redeemedAt" },
            month: { $month: "$redeemedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Popular rewards
    const popularRewards = await RewardActivity.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "rewards",
          localField: "reward",
          foreignField: "_id",
          as: "rewardDetails",
        },
      },
      { $unwind: "$rewardDetails" },
      {
        $group: {
          _id: "$rewardDetails.name",
          count: { $sum: 1 },
          rewardType: { $first: "$rewardDetails.rewardType" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Total claims
    const totalClaims = await RewardActivity.countDocuments(match);

    return {
      claimsOverTime: claimsOverTime.map((item) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
        count: item.count,
      })),
      popularRewards: popularRewards.map((reward) => ({
        name: reward._id,
        count: reward.count,
        type: reward.rewardType,
      })),
      totalClaims,
    };
  },

  /**
   * Get department-wise analytics
   */
  async getDepartmentAnalytics(filters: AnalyticsFilters = {}) {
    const match: FilterQuery<IRewardActivity> = {};

    if (filters.tenantId) {
      match.$or = [
        { tenantId: new Types.ObjectId(filters.tenantId) },
        { tenantId: { $exists: false } },
        { tenantId: null },
      ];
    }

    if (filters.startDate || filters.endDate) {
      match.createdAt = {};
      if (filters.startDate) match.createdAt.$gte = filters.startDate;
      if (filters.endDate) match.createdAt.$lte = filters.endDate;
    }

    const departmentStats = await RewardActivity.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $lookup: {
          from: "alumniprofiles",
          localField: "userDetails._id",
          foreignField: "userId",
          as: "alumniProfile",
        },
      },
      {
        $group: {
          _id: {
            $ifNull: [
              { $arrayElemAt: ["$alumniProfile.department", 0] },
              "$userDetails.department",
              "Unknown",
            ],
          },
          totalPoints: { $sum: "$pointsAwarded" },
          totalActivities: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "earned"] }, 1, 0] },
          },
          uniqueUsers: { $addToSet: "$user" },
        },
      },
      {
        $project: {
          department: "$_id",
          totalPoints: 1,
          totalActivities: 1,
          completedTasks: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
        },
      },
      { $sort: { totalPoints: -1 } },
    ]);

    return {
      departments: departmentStats.map((dept) => ({
        department: dept.department || "Unknown",
        totalPoints: dept.totalPoints || 0,
        totalActivities: dept.totalActivities || 0,
        completedTasks: dept.completedTasks || 0,
        uniqueUsers: dept.uniqueUsers || 0,
      })),
    };
  },

  /**
   * Get alumni activity history
   */
  async getAlumniActivityHistory(userId: string, filters: AnalyticsFilters = {}) {
    const match: FilterQuery<IRewardActivity> = {
      user: new Types.ObjectId(userId),
    };

    if (filters.tenantId) {
      match.$or = [
        { tenantId: new Types.ObjectId(filters.tenantId) },
        { tenantId: { $exists: false } },
        { tenantId: null },
      ];
    }

    if (filters.startDate || filters.endDate) {
      match.createdAt = {};
      if (filters.startDate) match.createdAt.$gte = filters.startDate;
      if (filters.endDate) match.createdAt.$lte = filters.endDate;
    }

    const activities = await RewardActivity.find(match)
      .populate("reward", "name category icon color")
      .sort({ createdAt: -1 })
      .limit(100);

    // Get points timeline
    const pointsTimeline = await RewardActivity.aggregate([
      { $match: { ...match, pointsAwarded: { $gt: 0 } } },
      {
        $group: {
          _id: {
            year: { $year: "$earnedAt" },
            month: { $month: "$earnedAt" },
          },
          points: { $sum: "$pointsAwarded" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get category breakdown
    const categoryBreakdown = await RewardActivity.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "rewards",
          localField: "reward",
          foreignField: "_id",
          as: "rewardDetails",
        },
      },
      { $unwind: "$rewardDetails" },
      {
        $group: {
          _id: "$rewardDetails.category",
          totalPoints: { $sum: "$pointsAwarded" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalPoints: -1 } },
    ]);

    return {
      activities,
      pointsTimeline: pointsTimeline.map((item) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
        points: item.points,
        count: item.count,
      })),
      categoryBreakdown: categoryBreakdown.map((cat) => ({
        category: cat._id || "uncategorized",
        totalPoints: cat.totalPoints || 0,
        count: cat.count || 0,
      })),
    };
  },

  /**
   * Get reward statistics (earned and claimed counts per reward)
   */
  async getRewardStatistics(filters: AnalyticsFilters = {}) {
    const match: FilterQuery<IRewardActivity> = {
      status: { $in: ["earned", "redeemed"] },
    };

    if (filters.tenantId) {
      match.$or = [
        { tenantId: new Types.ObjectId(filters.tenantId) },
        { tenantId: { $exists: false } },
        { tenantId: null },
      ];
    }

    if (filters.startDate || filters.endDate) {
      match.createdAt = {};
      if (filters.startDate) match.createdAt.$gte = filters.startDate;
      if (filters.endDate) match.createdAt.$lte = filters.endDate;
    }

    // Aggregate by reward to get earned and claimed counts
    const rewardStats = await RewardActivity.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "rewards",
          localField: "reward",
          foreignField: "_id",
          as: "rewardDetails",
        },
      },
      { $unwind: "$rewardDetails" },
      {
        $group: {
          _id: "$reward",
          rewardName: { $first: "$rewardDetails.name" },
          rewardId: { $first: "$reward" },
          earned: {
            $sum: {
              $cond: [
                { $in: ["$status", ["earned", "redeemed"]] },
                1,
                0,
              ],
            },
          },
          claimed: {
            $sum: {
              $cond: [{ $eq: ["$status", "redeemed"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { earned: -1 } },
    ]);

    // Calculate totals
    const totals = rewardStats.reduce(
      (acc, stat) => {
        acc.totalEarned += stat.earned;
        acc.totalClaimed += stat.claimed;
        return acc;
      },
      { totalEarned: 0, totalClaimed: 0 }
    );

    return {
      topRewards: rewardStats.slice(0, 10).map((stat) => ({
        _id: stat.rewardId?.toString() || stat._id?.toString(),
        name: stat.rewardName,
        earned: stat.earned,
        claimed: stat.claimed,
      })),
      totals,
      rewardsByCategory: [], // Can be added later if needed
    };
  },
};

export default rewardAnalyticsService;

