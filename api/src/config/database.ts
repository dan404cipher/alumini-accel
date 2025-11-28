import mongoose from "mongoose";
import { logger } from "../utils/logger";

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      logger.error("MONGODB_URI environment variable is not set");
      logger.error("Please set MONGODB_URI in your .env file");
      process.exit(1);
    }

    logger.info("Connecting to MongoDB...");
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // Reduced to 10 seconds
      socketTimeoutMS: 15000,
      connectTimeoutMS: 10000, // Reduced to 10 seconds
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
