import mongoose from "mongoose";
import { Notification } from "@/models/Notification";
import User from "@/models/User";
import { logger } from "@/utils/logger";
import connectDB from "@/config/database";

const createSampleNotifications = async () => {
  try {
    await connectDB();
    logger.info("🚀 Starting to create sample notifications...");

    // Find all users
    const users = await User.find({});
    logger.info(`Found ${users.length} users`);

    if (users.length === 0) {
      logger.warn("No users found. Please create users first.");
      return;
    }

    const sampleNotifications = [
      {
        title: "Welcome to AlumniAccel!",
        message:
          "Welcome to our alumni platform. Complete your profile to get started.",
        type: "info" as const,
        category: "system",
        priority: "medium" as const,
        actionUrl: "/profile",
      },
      {
        title: "New Job Posted",
        message:
          "A new job opportunity has been posted that matches your skills.",
        type: "success" as const,
        category: "job",
        priority: "high" as const,
        actionUrl: "/jobs",
      },
      {
        title: "Event Reminder",
        message: "Don't forget about the alumni meetup this weekend!",
        type: "warning" as const,
        category: "event",
        priority: "medium" as const,
        actionUrl: "/events",
      },
      {
        title: "Connection Request",
        message:
          "You have received a new connection request from a fellow alumnus.",
        type: "info" as const,
        category: "connection",
        priority: "medium" as const,
        actionUrl: "/connections",
      },
      {
        title: "Profile Update Required",
        message: "Your profile is incomplete. Please update your information.",
        type: "warning" as const,
        category: "system",
        priority: "low" as const,
        actionUrl: "/profile",
      },
    ];

    let createdCount = 0;

    for (const user of users) {
      // Create 2-3 random notifications for each user
      const numNotifications = Math.floor(Math.random() * 3) + 2;
      const selectedNotifications = sampleNotifications
        .sort(() => 0.5 - Math.random())
        .slice(0, numNotifications);

      for (const notificationData of selectedNotifications) {
        const notification = new Notification({
          userId: user._id,
          ...notificationData,
          // Randomly set some as read
          isRead: Math.random() > 0.7,
        });

        await notification.save();
        createdCount++;
        logger.info(
          `Created notification for ${user.firstName} ${user.lastName}: ${notification.title}`
        );
      }
    }

    logger.info(
      `✅ Successfully created ${createdCount} sample notifications!`
    );

    // Show statistics
    const totalNotifications = await Notification.countDocuments();
    const unreadNotifications = await Notification.countDocuments({
      isRead: false,
    });

    logger.info(`📊 Statistics:`);
    logger.info(`   Total notifications: ${totalNotifications}`);
    logger.info(`   Unread notifications: ${unreadNotifications}`);
    logger.info(
      `   Read notifications: ${totalNotifications - unreadNotifications}`
    );
  } catch (error) {
    logger.error("❌ Error creating sample notifications:", error);
  } finally {
    await mongoose.disconnect();
    logger.info("🔌 Disconnected from database");
  }
};

// Run the script
createSampleNotifications();
