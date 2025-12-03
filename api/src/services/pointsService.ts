import mongoose from "mongoose";
import RewardType from "../models/RewardType";
import PointsEntry from "../models/PointsEntry";
import AlumniPoints from "../models/AlumniPoints";
import User from "../models/User";
import { logger } from "../utils/logger";
import { RewardTriggerEvent, PointsEntryStatus } from "../types";
import { emailService } from "./emailService";

interface AwardPointsMetadata {
  programId?: string;
  programName?: string;
  eventId?: string;
  eventName?: string;
  sessionId?: string;
  referralId?: string;
  [key: string]: any;
}

/**
 * Award points for a trigger event
 * @param alumniId - The ID of the alumni to award points to
 * @param triggerEvent - The trigger event type
 * @param metadata - Optional metadata about the event (programId, eventId, etc.)
 * @param tenantId - Optional tenant ID for multi-tenant support
 * @returns Promise with success status and message
 */
export const awardPointsForTrigger = async (
  alumniId: string | mongoose.Types.ObjectId,
  triggerEvent: RewardTriggerEvent,
  metadata?: AwardPointsMetadata,
  tenantId?: string | mongoose.Types.ObjectId
): Promise<{ success: boolean; message?: string; pointsAwarded?: number }> => {
  try {
    // Convert to ObjectId if string
    const alumniObjectId = typeof alumniId === "string" 
      ? new mongoose.Types.ObjectId(alumniId) 
      : alumniId;

    // Verify alumni exists
    const alumni = await User.findById(alumniObjectId);
    if (!alumni) {
      logger.warn(`Alumni not found for points award: ${alumniObjectId}`);
      return { success: false, message: "Alumni not found" };
    }

    // Only award points to alumni users
    if (alumni.role !== "alumni") {
      logger.info(`Skipping points award for non-alumni user: ${alumniObjectId}, role: ${alumni.role}`);
      return { success: false, message: "Points can only be awarded to alumni users" };
    }

    // Find active RewardType with matching triggerEvent
    const filter: any = {
      triggerEvent,
      status: "active",
    };

    // Multi-tenant filtering
    if (tenantId) {
      filter.tenantId = typeof tenantId === "string" 
        ? new mongoose.Types.ObjectId(tenantId) 
        : tenantId;
    } else if (alumni.tenantId) {
      filter.tenantId = alumni.tenantId;
    } else {
      // If no tenant, look for reward types without tenant (global)
      filter.tenantId = { $exists: false };
    }

    const rewardType = await RewardType.findOne(filter);

    if (!rewardType) {
      logger.info(`No active reward type found for trigger: ${triggerEvent}, tenant: ${tenantId || alumni.tenantId || "global"}`);
      return { success: false, message: `No active reward type configured for ${triggerEvent}` };
    }

    // Check if points have already been awarded for this trigger event
    // Use metadata to create a unique identifier for the action
    const activityIdentifier = getActivityIdentifier(triggerEvent, metadata);
    
    // Check for existing PointsEntry to prevent duplicate awards
    const existingEntryFilter: any = {
      alumniId: alumniObjectId,
      activity: activityIdentifier,
      source: rewardType.name,
      status: PointsEntryStatus.AWARDED,
    };

    if (tenantId || alumni.tenantId) {
      existingEntryFilter.tenantId = tenantId || alumni.tenantId;
    }

    // Check if points were already awarded for this specific action
    const existingEntry = await PointsEntry.findOne(existingEntryFilter);

    if (existingEntry) {
      logger.info(`Points already awarded for ${triggerEvent} to alumni ${alumniObjectId} for activity: ${activityIdentifier}`);
      return { 
        success: false, 
        message: "Points have already been awarded for this action",
        pointsAwarded: existingEntry.points 
      };
    }

    // Award points - create PointsEntry and update AlumniPoints
    try {
      const pointsEntry = new PointsEntry({
        alumniId: alumniObjectId,
        points: rewardType.points,
        activity: activityIdentifier,
        date: new Date(),
        source: rewardType.name,
        status: PointsEntryStatus.AWARDED,
        notes: getActivityNotes(triggerEvent, metadata),
        rewardTypeId: rewardType._id,
        tenantId: tenantId || alumni.tenantId,
      });

      await pointsEntry.save();

      // Get or create AlumniPoints document
      let alumniPoints = await AlumniPoints.findOne({ alumniId: alumniObjectId });
      if (!alumniPoints) {
        alumniPoints = new AlumniPoints({
          alumniId: alumniObjectId,
          totalPoints: 0,
          redeemedPoints: 0,
          availablePoints: 0,
          tenantId: tenantId || alumni.tenantId,
        });
      }

      // Update total points (available points will be calculated by pre-save middleware)
      alumniPoints.totalPoints += rewardType.points;
      await alumniPoints.save();
    } catch (pointsError: any) {
      logger.error(`Failed to award points for ${triggerEvent} to alumni ${alumniObjectId}:`, pointsError);
      return { 
        success: false, 
        message: pointsError.message || "Failed to award points" 
      };
    }

    // Send email notification
    // TODO: Implement sendRewardEarnedEmail method in EmailService
    // try {
    //   await emailService.sendRewardEarnedEmail(
    //     alumni.email,
    //     rewardType.points,
    //     activityIdentifier
    //   );
    // } catch (emailError) {
    //   logger.error("Failed to send points earned email:", emailError);
    //   // Don't fail the points award if email fails
    // }

    logger.info(`Successfully awarded ${rewardType.points} points to alumni ${alumniObjectId} for ${triggerEvent}`);
    
    return { 
      success: true, 
      message: `Awarded ${rewardType.points} points for ${rewardType.name}`,
      pointsAwarded: rewardType.points 
    };
  } catch (error: any) {
    logger.error(`Error awarding points for trigger ${triggerEvent}:`, error);
    return { 
      success: false, 
      message: error.message || "Failed to award points" 
    };
  }
};

/**
 * Generate a unique activity identifier for the points entry
 */
const getActivityIdentifier = (
  triggerEvent: RewardTriggerEvent,
  metadata?: AwardPointsMetadata
): string => {
  switch (triggerEvent) {
    case RewardTriggerEvent.MENTOR_REGISTRATION:
      return metadata?.programName 
        ? `Mentor Registration - ${metadata.programName}`
        : "Mentor Registration";
    
    case RewardTriggerEvent.MENTEE_REGISTRATION:
      return metadata?.programName 
        ? `Mentee Registration - ${metadata.programName}`
        : "Mentee Registration";
    
    case RewardTriggerEvent.MENTOR_APPROVAL:
      return metadata?.programName 
        ? `Mentor Approval - ${metadata.programName}`
        : "Mentor Approval";
    
    case RewardTriggerEvent.MENTEE_APPROVAL:
      return metadata?.programName 
        ? `Mentee Approval - ${metadata.programName}`
        : "Mentee Approval";
    
    case RewardTriggerEvent.SESSION_COMPLETED:
      return metadata?.sessionId 
        ? `Session Completed - ${metadata.sessionId}`
        : "Session Completed";
    
    case RewardTriggerEvent.EVENT_PARTICIPATION:
      return metadata?.eventName 
        ? `Event Participation - ${metadata.eventName}`
        : "Event Participation";
    
    case RewardTriggerEvent.REFERRAL_SUCCESS:
      return metadata?.referralId 
        ? `Referral Success - ${metadata.referralId}`
        : "Referral Success";
    
    case RewardTriggerEvent.MANUAL_ADJUSTMENT:
      return metadata?.activity || "Manual Adjustment";
    
    default:
      return triggerEvent;
  }
};

/**
 * Generate activity notes for the points entry
 */
const getActivityNotes = (
  triggerEvent: RewardTriggerEvent,
  metadata?: AwardPointsMetadata
): string | undefined => {
  if (!metadata) return undefined;

  const notes: string[] = [];

  if (metadata.programId) {
    notes.push(`Program ID: ${metadata.programId}`);
  }
  if (metadata.programName) {
    notes.push(`Program: ${metadata.programName}`);
  }
  if (metadata.eventId) {
    notes.push(`Event ID: ${metadata.eventId}`);
  }
  if (metadata.eventName) {
    notes.push(`Event: ${metadata.eventName}`);
  }
  if (metadata.sessionId) {
    notes.push(`Session ID: ${metadata.sessionId}`);
  }

  return notes.length > 0 ? notes.join(", ") : undefined;
};


