import mongoose from "mongoose";
import dotenv from "dotenv";
import { logger } from "@/utils/logger";

// Load environment variables
dotenv.config();

// Connect to database
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/alumni_accel";
    await mongoose.connect(mongoURI);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

// Run migrations
const runMigrations = async () => {
  try {
    await connectDB();

    logger.info("Starting database migrations...");

    // Get database instance
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection not established");
    }

    // Example migration: Create indexes if they don't exist
    logger.info("Creating database indexes...");

    // Users collection indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ role: 1, status: 1 });
    await db.collection("users").createIndex({ createdAt: -1 });

    // Alumni profiles collection indexes
    await db
      .collection("alumniprofiles")
      .createIndex({ userId: 1 }, { unique: true });
    await db.collection("alumniprofiles").createIndex({ batchYear: 1 });
    await db.collection("alumniprofiles").createIndex({ currentCompany: 1 });

    // Events collection indexes
    await db.collection("events").createIndex({ startDate: 1 });
    await db.collection("events").createIndex({ organizer: 1 });
    await db.collection("events").createIndex({ status: 1 });

    // Job posts collection indexes
    await db.collection("jobposts").createIndex({ postedBy: 1 });
    await db.collection("jobposts").createIndex({ status: 1 });
    await db.collection("jobposts").createIndex({ deadline: 1 });

    logger.info("Database migrations completed successfully! 🎉");

    process.exit(0);
  } catch (error) {
    logger.error("Database migration failed:", error);
    process.exit(1);
  }
};

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

export default runMigrations;
