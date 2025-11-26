import { Types } from "mongoose";
import User from "../models/User";
import { RewardActivity } from "../models/Reward";
import Mentorship from "../models/Mentorship";
import Donation from "../models/Donation";
import Event from "../models/Event";
import AlumniProfile from "../models/AlumniProfile";

interface LeaderboardFilters {
  tenantId?: string;
  department?: string;
  limit?: number;
  period?: "all" | "month" | "year";
}

export const leaderboardService = {
  /**
   * Get leaderboard by points
   */
  async getPointsLeaderboard(filters: LeaderboardFilters = {}) {
    const limit = filters.limit || 100;
    const dateFilter = getDateFilter(filters.period);

    const match: any = {
      role: { $in: ["alumni", "student"] },
    };

    if (filters.tenantId) {
      match.tenantId = new Types.ObjectId(filters.tenantId);
    }

    // Get users with their points
    const users = await User.find(match)
      .select("_id firstName lastName email profilePicture department rewards")
      .sort({ "rewards.totalPoints": -1 })
      .limit(limit);

    // If period filter, calculate points from activities
    if (dateFilter) {
      const userIds = users.map((u) => u._id);
      const pointsAggregation = await RewardActivity.aggregate([
        {
          $match: {
            user: { $in: userIds },
            status: "earned",
            pointsAwarded: { $gt: 0 },
            ...(dateFilter ? { earnedAt: dateFilter } : {}),
          },
        },
        {
          $group: {
            _id: "$user",
            totalPoints: { $sum: "$pointsAwarded" },
          },
        },
      ]);

      const pointsMap = new Map(
        pointsAggregation.map((item) => [item._id.toString(), item.totalPoints])
      );

      // Add period points to users
      users.forEach((user) => {
        const periodPoints = pointsMap.get(user._id.toString()) || 0;
        (user as any).periodPoints = periodPoints;
      });

      // Sort by period points
      users.sort((a, b) => {
        const aPoints = (a as any).periodPoints || 0;
        const bPoints = (b as any).periodPoints || 0;
        return bPoints - aPoints;
      });
    }

    return users.map((user, index) => ({
      rank: index + 1,
      userId: user._id.toString(),
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      profilePicture: user.profilePicture,
      department: user.department,
      points: dateFilter
        ? (user as any).periodPoints || 0
        : user.rewards?.totalPoints || 0,
      tier: user.rewards?.currentTier || "bronze",
    }));
  },

  /**
   * Get leaderboard by mentorship activity
   */
  async getMentorsLeaderboard(filters: LeaderboardFilters = {}) {
    const limit = filters.limit || 100;
    const dateFilter = getDateFilter(filters.period);

    const match: any = {
      status: { $in: ["active", "completed"] },
    };

    if (dateFilter) {
      match.startDate = dateFilter;
    }

    const mentorshipStats = await Mentorship.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$mentorId",
          totalSessions: { $sum: { $size: "$sessions" } },
          completedMentorships: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          activeMentorships: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
        },
      },
      { $sort: { completedMentorships: -1, totalSessions: -1 } },
      { $limit: limit },
    ]);

    const userIds = mentorshipStats.map((stat) => stat._id);
    const users = await User.find({
      _id: { $in: userIds },
      ...(filters.tenantId ? { tenantId: new Types.ObjectId(filters.tenantId) } : {}),
    })
      .select("_id firstName lastName email profilePicture department")
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    return mentorshipStats
      .map((stat, index) => {
        const user = userMap.get(stat._id.toString());
        if (!user) return null;

        return {
          rank: index + 1,
          userId: user._id.toString(),
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          profilePicture: user.profilePicture,
          department: user.department,
          completedMentorships: stat.completedMentorships,
          activeMentorships: stat.activeMentorships,
          totalSessions: stat.totalSessions,
        };
      })
      .filter(Boolean);
  },

  /**
   * Get leaderboard by donations
   */
  async getDonorsLeaderboard(filters: LeaderboardFilters = {}) {
    const limit = filters.limit || 100;
    const dateFilter = getDateFilter(filters.period);

    const match: any = {
      paymentStatus: { $in: ["completed", "successful"] },
      donor: { $exists: true, $ne: null },
    };

    if (filters.tenantId) {
      match.tenantId = new Types.ObjectId(filters.tenantId);
    }

    if (dateFilter) {
      match.paidAt = dateFilter;
    }

    const donationStats = await Donation.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$donor",
          totalAmount: { $sum: "$amount" },
          donationCount: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: limit },
    ]);

    const userIds = donationStats.map((stat) => stat._id);
    const users = await User.find({
      _id: { $in: userIds },
    })
      .select("_id firstName lastName email profilePicture department")
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    return donationStats
      .map((stat, index) => {
        const user = userMap.get(stat._id.toString());
        if (!user) return null;

        return {
          rank: index + 1,
          userId: user._id.toString(),
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          profilePicture: user.profilePicture,
          department: user.department,
          totalAmount: stat.totalAmount,
          donationCount: stat.donationCount,
        };
      })
      .filter(Boolean);
  },

  /**
   * Get leaderboard by volunteer activity (events + community)
   */
  async getVolunteersLeaderboard(filters: LeaderboardFilters = {}) {
    const limit = filters.limit || 100;
    const dateFilter = getDateFilter(filters.period);

    // Get event registrations/attendance
    const eventMatch: any = {};
    if (filters.tenantId) {
      eventMatch.tenantId = new Types.ObjectId(filters.tenantId);
    }
    if (dateFilter) {
      eventMatch.createdAt = dateFilter;
    }

    const events = await Event.find(eventMatch).select("_id attendees").lean();
    const eventRegistrations = new Map<string, number>();

    events.forEach((event: any) => {
      if (event.attendees && Array.isArray(event.attendees)) {
        event.attendees.forEach((reg: any) => {
          if (reg.userId) {
            const userId = reg.userId.toString();
            eventRegistrations.set(
              userId,
              (eventRegistrations.get(userId) || 0) + 1
            );
          }
        });
      }
    });

    // Combine with community posts and other volunteer activities
    // For now, we'll use event participation as the main metric
    const sortedUsers = Array.from(eventRegistrations.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    const userIds = sortedUsers.map((u) => new Types.ObjectId(u.userId));
    const users = await User.find({
      _id: { $in: userIds },
      ...(filters.tenantId ? { tenantId: new Types.ObjectId(filters.tenantId) } : {}),
    })
      .select("_id firstName lastName email profilePicture department")
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    return sortedUsers
      .map((stat, index) => {
        const user = userMap.get(stat.userId);
        if (!user) return null;

        return {
          rank: index + 1,
          userId: user._id.toString(),
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          profilePicture: user.profilePicture,
          department: user.department,
          eventCount: stat.count,
        };
      })
      .filter(Boolean);
  },

  /**
   * Get department-wise leaderboard
   */
  async getDepartmentLeaderboard(filters: LeaderboardFilters = {}) {
    const match: any = {
      role: { $in: ["alumni", "student"] },
    };

    if (filters.tenantId) {
      match.tenantId = new Types.ObjectId(filters.tenantId);
    }

    if (filters.department) {
      match.department = filters.department;
    }

    const users = await User.find(match)
      .select("_id department rewards")
      .lean();

    // Group by department
    const departmentStats = new Map<
      string,
      { totalPoints: number; userCount: number; avgPoints: number }
    >();

    users.forEach((user) => {
      const dept = user.department || "Unknown";
      const points = (user as any).rewards?.totalPoints || 0;

      if (!departmentStats.has(dept)) {
        departmentStats.set(dept, {
          totalPoints: 0,
          userCount: 0,
          avgPoints: 0,
        });
      }

      const stats = departmentStats.get(dept)!;
      stats.totalPoints += points;
      stats.userCount += 1;
    });

    // Calculate averages
    departmentStats.forEach((stats) => {
      stats.avgPoints = stats.userCount > 0 ? stats.totalPoints / stats.userCount : 0;
    });

    // Convert to array and sort
    return Array.from(departmentStats.entries())
      .map(([department, stats]) => ({
        department,
        ...stats,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((dept, index) => ({
        rank: index + 1,
        ...dept,
      }));
  },
};

/**
 * Helper function to get date filter based on period
 */
function getDateFilter(period?: string): any {
  if (!period || period === "all") return undefined;

  const now = new Date();
  const filter: any = {};

  if (period === "month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    filter.$gte = startOfMonth;
  } else if (period === "year") {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    filter.$gte = startOfYear;
  }

  return filter;
}

export default leaderboardService;

