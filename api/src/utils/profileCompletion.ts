import User from "../models/User";
import AlumniProfile from "../models/AlumniProfile";
import { Notification } from "../models/Notification";
import { logger } from "./logger";

/**
 * Calculate profile completion percentage for a user
 */
export const calculateProfileCompletion = async (
  userId: string
): Promise<number> => {
  try {
    const user = await User.findById(userId);
    if (!user) return 0;

    let completionScore = 0;
    const totalFields = 10; // Total number of fields we're checking

    // Basic profile fields (40% weight)
    if (user.firstName) completionScore += 1;
    if (user.lastName) completionScore += 1;
    if (user.email) completionScore += 1;
    if (user.phone) completionScore += 1;
    if (user.profilePicture) completionScore += 1;
    if (user.bio) completionScore += 1;
    if (user.location) completionScore += 1;
    if (user.dateOfBirth) completionScore += 1;
    if (user.gender) completionScore += 1;
    if (user.university) completionScore += 1;

    // Additional fields for alumni (20% weight)
    if (user.role === "alumni") {
      const alumniProfile = await AlumniProfile.findOne({ userId });
      if (alumniProfile) {
        if (alumniProfile.currentCompany) completionScore += 1;
        if (alumniProfile.currentPosition) completionScore += 1;
        if (alumniProfile.experience) completionScore += 1;
        if (alumniProfile.specialization) completionScore += 1;
        if (alumniProfile.skills && alumniProfile.skills.length > 0)
          completionScore += 1;
      }
    }

    const percentage = Math.round((completionScore / totalFields) * 100);
    return Math.min(100, percentage);
  } catch (error) {
    logger.error("Error calculating profile completion:", error);
    return 0;
  }
};

/**
 * Update user's profile completion status
 */
export const updateProfileCompletion = async (
  userId: string
): Promise<void> => {
  try {
    const completionPercentage = await calculateProfileCompletion(userId);
    const isComplete = completionPercentage >= 80; // Consider 80%+ as complete

    await User.findByIdAndUpdate(userId, {
      profileCompletionPercentage: completionPercentage,
      isProfileComplete: isComplete,
    });

    logger.info(
      `Profile completion updated for user ${userId}: ${completionPercentage}%`
    );
  } catch (error) {
    logger.error("Error updating profile completion:", error);
  }
};

/**
 * Check if user needs a "Complete Profile" notification and create it if needed
 */
export const checkAndCreateProfileCompletionNotification = async (
  userId: string
): Promise<void> => {
  try {
    const user = await User.findById(userId);
    if (!user || user.role !== "alumni") return;

    // Check if profile completion is below 60%
    if (user.profileCompletionPercentage >= 60) return;

    // Check if user already has a recent "Complete Profile" notification
    const existingNotification = await Notification.findOne({
      userId,
      category: "system",
      title: "Complete Your Profile",
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    });

    if (existingNotification) {
      logger.info(
        `User ${userId} already has a recent profile completion notification`
      );
      return;
    }

    // Create the notification
    await Notification.createNotification({
      userId,
      title: "Complete Your Profile",
      message: `Your profile is only ${user.profileCompletionPercentage}% complete. Complete your profile to connect with other alumni and unlock more features.`,
      type: "warning",
      category: "system",
      priority: "medium",
      actionUrl: "/profile",
      metadata: {
        profileCompletionPercentage: user.profileCompletionPercentage,
        triggeredBy: "login",
      },
    });

    logger.info(`Created profile completion notification for user ${userId}`);
  } catch (error) {
    logger.error("Error creating profile completion notification:", error);
  }
};
