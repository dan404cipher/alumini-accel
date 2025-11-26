import { Types } from "mongoose";
import Reward from "../models/Reward";
import rewardService from "./rewardService";
import { logger } from "../utils/logger";

/**
 * Service to automatically track reward progress when users perform actions
 */
export const rewardIntegrationService = {
  /**
   * Track community post creation
   */
  async trackCommunityPost(
    userId: string,
    postId: string,
    communityId: string,
    tenantId?: string
  ) {
    try {
      // Find active rewards with engagement tasks that track community posts
      const rewards = await Reward.find({
        isActive: true,
        "tasks.actionType": { $in: ["engagement", "custom"] },
        "tasks.isAutomated": true,
        ...(tenantId ? { tenantId: new Types.ObjectId(tenantId) } : {}),
      });

      for (const reward of rewards) {
        for (const task of reward.tasks) {
          // Check if this task matches community post criteria
          if (
            task.actionType === "engagement" &&
            task.isAutomated &&
            (task.metadata?.trackCommunityPosts === true ||
              task.title?.toLowerCase().includes("post") ||
              task.title?.toLowerCase().includes("community"))
          ) {
                    const rewardId = reward._id instanceof Types.ObjectId 
                      ? reward._id.toString() 
                      : String(reward._id);
                    await rewardService.recordTaskProgress({
                      rewardId: rewardId,
              taskId: task._id,
              amount: 1,
              context: {
                communityId,
                postId,
                note: `Posted in community`,
                requiresVerification: task.metadata?.requiresVerification === true,
              },
              userId,
              tenantId,
            });
          }
        }
      }
    } catch (error) {
      logger.error("Error tracking community post reward:", error);
      // Don't throw - we don't want to break post creation if reward tracking fails
    }
  },

  /**
   * Track event RSVP/attendance
   */
  async trackEventRSVP(
    userId: string,
    eventId: string,
    tenantId?: string
  ) {
    try {
      const rewards = await Reward.find({
        isActive: true,
        "tasks.actionType": "event",
        "tasks.isAutomated": true,
        ...(tenantId ? { tenantId: new Types.ObjectId(tenantId) } : {}),
      });

      for (const reward of rewards) {
        for (const task of reward.tasks) {
          if (task.actionType === "event" && task.isAutomated) {
                    const rewardId = reward._id instanceof Types.ObjectId 
                      ? reward._id.toString() 
                      : String(reward._id);
                    await rewardService.recordTaskProgress({
                      rewardId: rewardId,
              taskId: task._id,
              amount: 1,
              context: {
                eventId,
                note: `Attended event`,
                requiresVerification: task.metadata?.requiresVerification === true,
              },
              userId,
              tenantId,
            });
          }
        }
      }
    } catch (error) {
      logger.error("Error tracking event RSVP reward:", error);
    }
  },

  /**
   * Track profile completion
   */
  async trackProfileCompletion(
    userId: string,
    completionPercentage: number,
    tenantId?: string
  ) {
    try {
      // Only track if profile is 100% complete
      if (completionPercentage < 100) return;

      const rewards = await Reward.find({
        isActive: true,
        "tasks.actionType": { $in: ["engagement", "custom"] },
        "tasks.isAutomated": true,
        ...(tenantId ? { tenantId: new Types.ObjectId(tenantId) } : {}),
      });

      for (const reward of rewards) {
        for (const task of reward.tasks) {
          if (
            task.isAutomated &&
            (task.title?.toLowerCase().includes("profile") ||
              task.title?.toLowerCase().includes("complete") ||
              task.metadata?.trackProfileCompletion === true)
          ) {
                    const rewardId = reward._id instanceof Types.ObjectId 
                      ? reward._id.toString() 
                      : String(reward._id);
                    await rewardService.recordTaskProgress({
                      rewardId: rewardId,
              taskId: task._id,
              amount: 1,
              context: {
                note: `Profile completed (${completionPercentage}%)`,
                requiresVerification: task.metadata?.requiresVerification === true,
              },
              userId,
              tenantId,
            });
          }
        }
      }
    } catch (error) {
      logger.error("Error tracking profile completion reward:", error);
    }
  },

  /**
   * Track job posting
   */
  async trackJobPost(
    userId: string,
    jobId: string,
    tenantId?: string
  ) {
    try {
      const rewards = await Reward.find({
        isActive: true,
        "tasks.actionType": "job",
        "tasks.isAutomated": true,
        ...(tenantId ? { tenantId: new Types.ObjectId(tenantId) } : {}),
      });

      for (const reward of rewards) {
        for (const task of reward.tasks) {
          if (task.actionType === "job" && task.isAutomated) {
                    const rewardId = reward._id instanceof Types.ObjectId 
                      ? reward._id.toString() 
                      : String(reward._id);
                    await rewardService.recordTaskProgress({
                      rewardId: rewardId,
              taskId: task._id,
              amount: 1,
              context: {
                jobId,
                note: `Posted job opportunity`,
                requiresVerification: task.metadata?.requiresVerification === true,
              },
              userId,
              tenantId,
            });
          }
        }
      }
    } catch (error) {
      logger.error("Error tracking job post reward:", error);
    }
  },

  /**
   * Track donation
   */
  async trackDonation(
    userId: string,
    donationId: string,
    amount: number,
    tenantId?: string
  ) {
    try {
      const rewards = await Reward.find({
        isActive: true,
        "tasks.actionType": "donation",
        "tasks.isAutomated": true,
        ...(tenantId ? { tenantId: new Types.ObjectId(tenantId) } : {}),
      });

      for (const reward of rewards) {
        for (const task of reward.tasks) {
          if (task.actionType === "donation" && task.isAutomated) {
            // For amount-based tasks, use the donation amount
            // For count-based tasks, use 1
            const progressAmount =
              task.metric === "amount" ? amount : 1;

                    const rewardId = reward._id instanceof Types.ObjectId 
                      ? reward._id.toString() 
                      : String(reward._id);
                    await rewardService.recordTaskProgress({
                      rewardId: rewardId,
              taskId: task._id,
              amount: progressAmount,
              context: {
                donationId,
                amount,
                note: `Donated $${amount}`,
                requiresVerification: task.metadata?.requiresVerification === true,
              },
              userId,
              tenantId,
            });
          }
        }
      }
    } catch (error) {
      logger.error("Error tracking donation reward:", error);
    }
  },

  /**
   * Track mentorship session
   */
  async trackMentorshipSession(
    userId: string,
    sessionId: string,
    mentorshipId: string,
    tenantId?: string
  ) {
    try {
      const rewards = await Reward.find({
        isActive: true,
        "tasks.actionType": "mentorship",
        "tasks.isAutomated": true,
        ...(tenantId ? { tenantId: new Types.ObjectId(tenantId) } : {}),
      });

      for (const reward of rewards) {
        for (const task of reward.tasks) {
          if (task.actionType === "mentorship" && task.isAutomated) {
                    const rewardId = reward._id instanceof Types.ObjectId 
                      ? reward._id.toString() 
                      : String(reward._id);
                    await rewardService.recordTaskProgress({
                      rewardId: rewardId,
              taskId: task._id,
              amount: 1,
              context: {
                sessionId,
                mentorshipId,
                note: `Completed mentorship session`,
                requiresVerification: task.metadata?.requiresVerification === true,
              },
              userId,
              tenantId,
            });
          }
        }
      }
    } catch (error) {
      logger.error("Error tracking mentorship session reward:", error);
    }
  },

  /**
   * Track community join
   */
  async trackCommunityJoin(
    userId: string,
    communityId: string,
    tenantId?: string
  ) {
    try {
      const rewards = await Reward.find({
        isActive: true,
        "tasks.actionType": { $in: ["engagement", "custom"] },
        "tasks.isAutomated": true,
        ...(tenantId ? { tenantId: new Types.ObjectId(tenantId) } : {}),
      });

      for (const reward of rewards) {
        for (const task of reward.tasks) {
          if (
            task.isAutomated &&
            (task.title?.toLowerCase().includes("join") ||
              task.title?.toLowerCase().includes("community") ||
              task.metadata?.trackCommunityJoin === true)
          ) {
                    const rewardId = reward._id instanceof Types.ObjectId 
                      ? reward._id.toString() 
                      : String(reward._id);
                    await rewardService.recordTaskProgress({
                      rewardId: rewardId,
              taskId: task._id,
              amount: 1,
              context: {
                communityId,
                note: `Joined community`,
                requiresVerification: task.metadata?.requiresVerification === true,
              },
              userId,
              tenantId,
            });
          }
        }
      }
    } catch (error) {
      logger.error("Error tracking community join reward:", error);
    }
  },
};

export default rewardIntegrationService;

