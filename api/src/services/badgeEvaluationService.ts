import { Types } from "mongoose";
import Badge, { IBadge, UserBadge } from "../models/Badge";
import User from "../models/User";
import { RewardActivity } from "../models/Reward";
import Mentorship from "../models/Mentorship";
import Donation from "../models/Donation";
import Event from "../models/Event";
import JobPost from "../models/JobPost";
import { logger } from "../utils/logger";

/**
 * Service to evaluate and award badges based on user achievements
 */
export const badgeEvaluationService = {
  /**
   * Check if user meets badge criteria and award if eligible
   */
  async evaluateAndAwardBadge(
    userId: string,
    badgeId: string,
    tenantId?: string
  ): Promise<boolean> {
    try {
      const badge = await Badge.findById(badgeId);
      if (!badge || !badge.isActive) {
        return false;
      }

      // Check if user already has this badge
      const existingBadge = await UserBadge.findOne({
        user: new Types.ObjectId(userId),
        badge: badge._id,
      });

      if (existingBadge) {
        return false; // Already awarded
      }

      // Check if badge has reached max recipients (for rare badges)
      if (badge.isRare && badge.maxRecipients) {
        if (badge.currentRecipients >= badge.maxRecipients) {
          return false; // Badge limit reached
        }
      }

      // Evaluate criteria
      const meetsCriteria = await this.evaluateBadgeCriteria(
        userId,
        badge,
        tenantId
      );

      if (meetsCriteria) {
        await this.awardBadgeToUser(userId, badgeId, tenantId);
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Error evaluating badge:", error);
      return false;
    }
  },

  /**
   * Evaluate if user meets badge criteria
   */
  async evaluateBadgeCriteria(
    userId: string,
    badge: IBadge,
    tenantId?: string
  ): Promise<boolean> {
    const criteria = badge.criteria;
    const targetValue = criteria.value;

    try {
      switch (criteria.type) {
        case "donations":
          const donationMatch: any = {
            donor: new Types.ObjectId(userId),
            paymentStatus: { $in: ["completed", "successful"] },
          };
          if (tenantId) {
            donationMatch.tenantId = new Types.ObjectId(tenantId);
          }

          if (criteria.description?.toLowerCase().includes("amount")) {
            // Check total donation amount
            const totalAmount = await Donation.aggregate([
              { $match: donationMatch },
              { $group: { _id: null, total: { $sum: "$amount" } } },
            ]);
            return (totalAmount[0]?.total || 0) >= targetValue;
          } else {
            // Check donation count
            const donationCount = await Donation.countDocuments(donationMatch);
            return donationCount >= targetValue;
          }

        case "mentorships":
          const mentorshipMatch: any = {
            mentorId: new Types.ObjectId(userId),
            status: { $in: ["active", "completed"] },
          };
          if (tenantId) {
            // Note: Mentorship might not have tenantId, adjust if needed
          }

          if (criteria.description?.toLowerCase().includes("session")) {
            // Count total sessions
            const mentorships = await Mentorship.find(mentorshipMatch);
            const totalSessions = mentorships.reduce(
              (sum, m) => sum + (m.sessions?.length || 0),
              0
            );
            return totalSessions >= targetValue;
          } else {
            // Count completed mentorships
            const completedCount = await Mentorship.countDocuments({
              ...mentorshipMatch,
              status: "completed",
            });
            return completedCount >= targetValue;
          }

        case "events":
          const eventMatch: any = {
            "attendees.userId": new Types.ObjectId(userId),
            "attendees.status": "registered",
          };
          if (tenantId) {
            eventMatch.tenantId = new Types.ObjectId(tenantId);
          }

          const eventCount = await Event.countDocuments(eventMatch);
          return eventCount >= targetValue;

        case "jobs":
          const jobMatch: any = {
            postedBy: new Types.ObjectId(userId),
            status: "active",
          };
          if (tenantId) {
            jobMatch.tenantId = new Types.ObjectId(tenantId);
          }

          const jobCount = await JobPost.countDocuments(jobMatch);
          return jobCount >= targetValue;

        case "engagement":
          // Check total points or reward activities
          const user = await User.findById(userId);
          if (criteria.description?.toLowerCase().includes("point")) {
            const totalPoints = user?.rewards?.totalPoints || 0;
            return totalPoints >= targetValue;
          } else {
            // Count reward activities
            const activityMatch: any = {
              user: new Types.ObjectId(userId),
              status: "earned",
            };
            if (tenantId) {
              activityMatch.tenantId = new Types.ObjectId(tenantId);
            }

            const activityCount = await RewardActivity.countDocuments(
              activityMatch
            );
            return activityCount >= targetValue;
          }

        case "manual":
          // Manual badges are awarded by staff, not automatically
          return false;

        default:
          return false;
      }
    } catch (error) {
      logger.error("Error evaluating badge criteria:", error);
      return false;
    }
  },

  /**
   * Award badge to user
   */
  async awardBadgeToUser(
    userId: string,
    badgeId: string,
    tenantId?: string,
    reason?: string
  ): Promise<void> {
    try {
      const badge = await Badge.findById(badgeId);
      if (!badge) {
        throw new Error("Badge not found");
      }

      // Create user badge record
      const badgeObjectId = badge._id instanceof Types.ObjectId 
        ? badge._id 
        : new Types.ObjectId(String(badgeId));
      
      const userBadge = new UserBadge({
        user: new Types.ObjectId(userId),
        badge: badgeObjectId,
        awardedAt: new Date(),
        reason: reason || `Earned by completing: ${badge.criteria.description}`,
        metadata: {
          tenantId: tenantId ? new Types.ObjectId(tenantId) : undefined,
        },
      });

      await userBadge.save();

      // Update badge recipient count
      badge.currentRecipients += 1;
      await badge.save();

      // Add badge to user's rewards.badges array
      const user = await User.findById(userId);
      if (user) {
        if (!user.rewards) {
          user.rewards = {
            totalPoints: 0,
            currentTier: "bronze",
            tierPoints: 0,
            badges: [],
          };
        }

        const badgeIdString = badgeObjectId.toString();
        if (!user.rewards.badges.some((b) => b.toString() === badgeIdString)) {
          user.rewards.badges.push(badgeObjectId as any);
          await user.save();
        }
      }

      logger.info(`Badge ${badge.name} awarded to user ${userId}`);
    } catch (error) {
      logger.error("Error awarding badge:", error);
      throw error;
    }
  },

  /**
   * Check all badges for a user and award any that are newly eligible
   */
  async checkAndAwardEligibleBadges(
    userId: string,
    tenantId?: string
  ): Promise<string[]> {
    try {
      const badges = await Badge.find({
        isActive: true,
        criteria: { $ne: { type: "manual" } }, // Exclude manual badges
      });

      const awardedBadges: string[] = [];

      for (const badge of badges) {
        const badgeId = (badge._id instanceof Types.ObjectId 
          ? badge._id.toString() 
          : String(badge._id)) as string;
        const wasAwarded = await this.evaluateAndAwardBadge(
          userId,
          badgeId,
          tenantId
        );
        if (wasAwarded) {
          awardedBadges.push(badgeId);
        }
      }

      return awardedBadges;
    } catch (error) {
      logger.error("Error checking eligible badges:", error);
      return [];
    }
  },
};

export default badgeEvaluationService;

