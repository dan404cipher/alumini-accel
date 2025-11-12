import mongoose from "mongoose";
import { logger } from "../utils/logger";

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/alumni-accel";

    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // Increased from 5000ms to 30000ms
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000, // Added connection timeout
      bufferCommands: false,
    });

    logger.info("MongoDB connected successfully");

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    logger.error("MongoDB connection failed:", error);
    // Don't exit process - let server continue and try to reconnect
    // Don't throw error - let server start without database connection
    logger.warn("Server will continue without database connection. Some features may not work.");
  }
};

export default connectDB;
