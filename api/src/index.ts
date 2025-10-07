import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
// import xss from 'xss-clean';
// import hpp from 'hpp';
import "express-async-errors";

// Import configurations
import connectDB from "./config/database";
import { logger } from "./utils/logger";

// Import middleware
import { globalErrorHandler, notFound } from "./middleware/errorHandler";
import { rateLimit as customRateLimit } from "./middleware/auth";

// Import routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import alumniRoutes from "./routes/alumni";
import jobRoutes from "./routes/jobs";
import eventRoutes from "./routes/events";
import newsRoutes from "./routes/news";
import mentorshipRoutes from "./routes/mentorship";
import donationRoutes from "./routes/donations";
import invitationRoutes from "./routes/invitations";
import docsRoutes from "./routes/docs";
import galleryRoutes from "./routes/gallery";
import connectionRoutes from "./routes/connection";
import messageRoutes from "./routes/message";
import tenantRoutes from "./routes/tenantRoutes";
import campaignRoutes from "./routes/campaignRoutes";
import communityRoutes from "./routes/community";
import communitiesRoutes from "./routes/communities";
import communityPostsRoutes from "./routes/communityPosts";
import communityMembershipsRoutes from "./routes/communityMemberships";
import communityCommentsRoutes from "./routes/communityComments";
import uploadRoutes from "./routes/upload";
import likesRoutes from "./routes/likes";
import commentsRoutes from "./routes/comments";
import sharesRoutes from "./routes/shares";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Connect to database
const startServer = async () => {
  try {
    await connectDB();

    // Start server
    app.listen(PORT, () => {
      logger.info(
        `🚀 AlumniAccel API server running on port ${PORT} in ${NODE_ENV} mode`
      );
      logger.info(
        `📊 Health check available at http://localhost:${PORT}/health`
      );
      logger.info(
        `🔗 API documentation available at http://localhost:${PORT}/api/v1/docs`
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "http://localhost:3000"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"]
        : [
            "http://localhost:8080",
            "http://localhost:8081",
            "http://localhost:3000",
          ], // Explicitly allow frontend and backend origins
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static file serving for uploads
app.use("/uploads", express.static("uploads"));

// Compression middleware
app.use(compression());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
// app.use(xss());

// Prevent parameter pollution
// app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "200"), // limit each IP to 200 requests per minute
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for authentication, connection, and community endpoints
    return (
      req.path === "/v1/auth/me" ||
      req.path.endsWith("/auth/me") ||
      req.path === "/v1/auth/login" ||
      req.path.endsWith("/auth/login") ||
      req.path === "/v1/auth/register" ||
      req.path.endsWith("/auth/register") ||
      req.path === "/v1/auth/refresh" ||
      req.path.endsWith("/auth/refresh") ||
      req.path.startsWith("/v1/connections/check/") ||
      req.path.includes("/connections/check/") ||
      req.path.startsWith("/v1/community/") ||
      req.path.includes("/community/") ||
      req.path.startsWith("/v1/communities/") ||
      req.path.includes("/communities/") ||
      req.path.startsWith("/v1/community-posts/") ||
      req.path.includes("/community-posts/") ||
      req.path.startsWith("/v1/community-memberships/") ||
      req.path.includes("/community-memberships/") ||
      req.path.startsWith("/v1/community-comments/") ||
      req.path.includes("/community-comments/")
    );
  },
});

app.use("/api/", limiter);

// Custom rate limiting for specific endpoints
app.use("/api/auth/", customRateLimit(100, 900000)); // 100 requests per 15 minutes for auth
app.use("/api/users/", customRateLimit(50, 900000)); // 50 requests per 15 minutes for users

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  });
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AlumniAccel API is running",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  });
});

// Test endpoint for static files
app.get("/test-uploads", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Static files are accessible",
    uploadsPath: "/uploads",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/alumni", alumniRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/news", newsRoutes);
app.use("/api/v1/mentorship", mentorshipRoutes);
app.use("/api/v1/donations", donationRoutes);
app.use("/api/v1/invitations", invitationRoutes);
app.use("/api/v1/docs", docsRoutes);
app.use("/api/v1/gallery", galleryRoutes);
app.use("/api/v1/connections", connectionRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/tenants", tenantRoutes);
app.use("/api/v1/campaigns", campaignRoutes);
app.use("/api/v1/community", communityRoutes);
app.use("/api/v1/communities", communitiesRoutes);
app.use("/api/v1/community-posts", communityPostsRoutes);
app.use("/api/v1/community-memberships", communityMembershipsRoutes);
app.use("/api/v1/community-comments", communityCommentsRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1", likesRoutes);
app.use("/api/v1", commentsRoutes);
app.use("/api/v1", sharesRoutes);

// Serve static files with CORS headers
app.use(
  "/uploads",
  (req, res, next) => {
    // Set CORS headers for static files
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    next();
  },
  express.static("uploads")
);

// 404 handler
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  logger.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

// Start the server
startServer();

export default app;
