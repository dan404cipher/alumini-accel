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
import connectDB from "@/config/database";
import { logger } from "@/utils/logger";

// Import middleware
import { globalErrorHandler, notFound } from "@/middleware/errorHandler";
import { rateLimit as customRateLimit } from "@/middleware/auth";

// Import routes
import authRoutes from "@/routes/auth";
import userRoutes from "@/routes/users";
import alumniRoutes from "@/routes/alumni";
import jobRoutes from "@/routes/jobs";
import eventRoutes from "@/routes/events";
import mentorshipRoutes from "@/routes/mentorship";
import donationRoutes from "@/routes/donations";
import docsRoutes from "@/routes/docs";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Connect to database
connectDB();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"]
        : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// Custom rate limiting for specific endpoints
app.use("/api/auth/", customRateLimit(5, 900000)); // 5 requests per 15 minutes for auth
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

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/alumni", alumniRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/mentorship", mentorshipRoutes);
app.use("/api/v1/donations", donationRoutes);
app.use("/api/v1/docs", docsRoutes);

// Serve static files
app.use("/uploads", express.static("uploads"));

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

// Start server
const server = app.listen(PORT, () => {
  logger.info(
    `🚀 AlumniAccel API server running on port ${PORT} in ${NODE_ENV} mode`
  );
  logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
  logger.info(
    `🔗 API documentation available at http://localhost:${PORT}/api/v1/docs`
  );
});

// Handle server errors
server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof PORT === "string" ? "Pipe " + PORT : "Port " + PORT;

  switch (error.code) {
    case "EACCES":
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

export default app;
