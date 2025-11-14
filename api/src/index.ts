// Load environment variables FIRST - before any other imports
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "http";
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
import SocketService from "./services/socketService";

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
import savedNewsRoutes from "./routes/savedNewsRoutes";
import jobApplicationRoutes from "./routes/jobApplicationRoutes";
import mentorshipRoutes from "./routes/mentorship";
import donationRoutes from "./routes/donations";
import invitationRoutes from "./routes/invitations";
import docsRoutes from "./routes/docs";
import galleryRoutes from "./routes/gallery";
import connectionRoutes from "./routes/connection";
import messageRoutes from "./routes/message";
import notificationRoutes from "./routes/notification";
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
import mentoringProgramRoutes from "./routes/mentoringProgram";
import mentorRegistrationRoutes from "./routes/mentorRegistration";
import menteeRegistrationRoutes from "./routes/menteeRegistration";
import mentoringApprovalRoutes from "./routes/mentoringApproval";
import emailTemplateRoutes from "./routes/emailTemplate";
import matchingRoutes from "./routes/matching";
import mentorshipCommunicationRoutes from "./routes/mentorshipCommunication";
import programChatRoutes from "./routes/programChat";

// Load environment variables
dotenv.config();
import paymentRoutes from "./routes/payment";
import reportRoutes from "./routes/reports";
import categoryRoutes from "./routes/category";
import cron from "node-cron";
import Event from "./models/Event";
import Tenant from "./models/Tenant";
import { emailService } from "./services/emailService";

const app = express();
const server = createServer(app);
// Set server timeout to 10 minutes for bulk operations
server.timeout = 600000; // 10 minutes
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // 66 seconds
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Initialize Socket.IO service
let socketService: SocketService;

// Connect to database
const startServer = async () => {
  try {
    // Try to connect to database, but don't block server startup if it fails
    connectDB().catch((error) => {
      logger.error("MongoDB connection failed, but continuing server startup:", error);
      logger.warn("Server will start without database connection. Some features may not work.");
    });

    // Initialize Socket.IO
    socketService = new SocketService(server);

    // Start server
    server.listen(PORT, () => {
      logger.info(
        `🚀 AlumniAccel API server running on port ${PORT} in ${NODE_ENV} mode`
      );
      logger.info(
        `📊 Health check available at http://localhost:${PORT}/health`
      );
      logger.info(
        `🔗 API documentation available at http://localhost:${PORT}/api/v1/docs`
      );
    }).on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        logger.error(`Port ${PORT} is already in use. Please kill the process using this port or use a different port.`);
        logger.info(`To find and kill the process: lsof -ti:${PORT} | xargs kill -9`);
        process.exit(1);
      } else {
        logger.error("Failed to start server:", error);
        process.exit(1);
      logger.info(
        `🔌 Socket.IO server initialized for real-time communication`
      );

      // Schedule daily event reminder emails at 9:00 AM server time
      try {
        cron.schedule("0 9 * * *", async () => {
          try {
            const now = new Date();
            const start = new Date(now);
            start.setDate(now.getDate() + 1);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);

            const events = await Event.find({
              startDate: { $gte: start, $lte: end },
            })
              .populate("attendees.userId", "email firstName lastName")
              .populate("organizer", "firstName lastName");

            for (const evt of events) {
              const attendees = Array.isArray(evt.attendees) ? evt.attendees : [];
              for (const a of attendees) {
                if (!a || a.status !== "registered" || a.reminderSent) continue;
                const user: any = a.userId;
                if (!user?.email) continue;
                const tenant = (evt as any).tenantId
                  ? await Tenant.findById((evt as any).tenantId)
                  : null;
                await emailService.sendEventReminderEmail({
                  to: user.email,
                  attendeeName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
                  eventTitle: (evt as any).title,
                  eventDescription: (evt as any).description,
                  startDate: (evt as any).startDate,
                  endDate: (evt as any).endDate,
                  location: (evt as any).location,
                  isOnline: (evt as any).isOnline,
                  meetingLink: (evt as any).meetingLink,
                  price: (evt as any).price,
                  image: (evt as any).image,
                  collegeName: tenant?.name,
                  organizerName: (evt as any).organizer ? `${(evt as any).organizer.firstName || ""} ${(evt as any).organizer.lastName || ""}`.trim() : undefined,
                  speakers: Array.isArray((evt as any).speakers) ? ((evt as any).speakers as any) : undefined,
                  agenda: Array.isArray((evt as any).agenda) ? ((evt as any).agenda as any) : undefined,
                });
                a.reminderSent = true;
              }
              await (evt as any).save();
            }
          } catch (err) {
            logger.warn("Reminder email job failed", err);
          }
        });
        logger.info("⏰ Daily reminder email job scheduled for 09:00");
      } catch (e) {
        logger.warn("Failed to schedule reminder job", e);
      }
    });
  } catch (error: any) {
    logger.error("Failed to start server:", {
      error: error?.message || error,
      stack: error?.stack,
    });
    // Only exit if it's a critical startup error
    if (error?.code === "EADDRINUSE" || error?.code === "ECONNREFUSED") {
      process.exit(1);
    }
    // For other errors, log and try to continue
    logger.warn("Non-critical startup error, attempting to continue...");
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
            "http://localhost:5173",
            "http://localhost:8080",
            "http://localhost:8081",
            "http://localhost:8082",
            "http://localhost:8083",
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

// Preview welcome email template
app.get("/preview-welcome-email", (req, res) => {
  const { emailService } = require("./services/emailService");
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";

  const sampleData = {
    firstName: req.query.firstName || "Benjamin",
    lastName: req.query.lastName || "Johnson",
    email: req.query.email || "benjamin.johnson@example.com",
    collegeName: req.query.collegeName || "Alumni Accel",
    activationLink: `${frontendUrl}/verify-email?token=sample_token`,
    portalUrl: frontendUrl,
    password: req.query.password || "TempPassword123!",
    senderName: req.query.senderName || "Alumni Relations Team",
    senderTitle: req.query.senderTitle || "Alumni Relations Manager",
    senderEmail:
      req.query.senderEmail ||
      process.env.SMTP_USER ||
      "alumni@alumniaccel.com",
    senderPhone: req.query.senderPhone || "1234567890",
  };

  const html = emailService.generateWelcomeEmailHTML(sampleData);
  res.send(html);
});

// Check SMTP configuration
app.get("/check-smtp-config", (req, res) => {
  const hasUser = !!process.env.SMTP_USER;
  const hasPass = !!process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = process.env.SMTP_PORT || "587";

  return res.json({
    success: true,
    configured: hasUser && hasPass,
    details: {
      hasUser,
      hasPass,
      smtpHost,
      smtpPort,
      user: hasUser
        ? process.env.SMTP_USER?.replace(/(.{2}).*(@.*)/, "$1****$2")
        : "Not set",
    },
    message:
      hasUser && hasPass
        ? "SMTP is configured"
        : "SMTP is not configured. Please set SMTP_USER and SMTP_PASS in your .env file.",
  });
});

// Test SMTP connection
app.post("/test-smtp-connection", async (req, res) => {
  try {
    const nodemailer = require("nodemailer");
    const { logger } = require("./utils/logger");

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(400).json({
        success: false,
        message: "SMTP credentials not configured",
      });
    }

    const isGmail = (process.env.SMTP_HOST || "smtp.gmail.com").includes(
      "gmail"
    );
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");

    const testTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: smtpPort,
      secure: smtpPort === 465,
      requireTLS: isGmail && smtpPort === 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Test the connection
    await testTransporter.verify();

    return res.json({
      success: true,
      message: "SMTP connection successful! Your credentials are working.",
    });
  } catch (error: any) {
    const { logger } = require("./utils/logger");
    logger.error("SMTP connection test failed:", error);

    let errorMessage = error.message || "Unknown error";

    if (
      errorMessage.includes("Invalid login") ||
      errorMessage.includes("authentication") ||
      errorMessage.includes("credentials")
    ) {
      errorMessage =
        "Authentication failed. Please verify:\n1. You're using an App Password (not regular password)\n2. 2-Step Verification is enabled\n3. The App Password is correct (16 characters, no spaces)\n4. Try generating a NEW App Password at https://myaccount.google.com/apppasswords";
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.toString(),
    });
  }
});

// Test endpoint to send welcome email
app.post("/test-send-welcome-email", async (req, res) => {
  try {
    const { emailService } = require("./services/emailService");
    const { logger } = require("./utils/logger");

    // Check SMTP configuration first
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(400).json({
        success: false,
        message:
          "SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in your .env file.",
        help: "Add these to your .env file:\nSMTP_USER=your-email@gmail.com\nSMTP_PASS=your-app-password\nSMTP_HOST=smtp.gmail.com\nSMTP_PORT=587",
      });
    }

    const {
      email,
      firstName = "Test",
      lastName = "User",
      collegeName = "AlumniAccel College",
      password = "TestPassword123!",
    } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const activationToken = "test_token_" + Date.now();
    const activationLink = `${frontendUrl}/verify-email?token=${activationToken}`;

    const emailData = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      collegeName: collegeName,
      activationLink: activationLink,
      portalUrl: frontendUrl,
      password: password,
      senderName: "Alumni Relations Team",
      senderTitle: "Alumni Relations Manager",
      senderEmail: "alumni@alumniaccel.com",
      senderPhone: "1234567890",
    };

    logger.info(`Sending test welcome email to ${email}`);
    const result = await emailService.sendAlumniWelcomeEmail(emailData);

    if (result) {
      return res.json({
        success: true,
        message: `Welcome email sent successfully to ${email}`,
        data: {
          email: email,
          activationLink: activationLink,
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to send email. Check SMTP configuration.",
      });
    }
  } catch (error: any) {
    const { logger } = require("./utils/logger");
    logger.error("Error sending test welcome email:", error);

    let errorMessage = error.message || "Error sending email";

    // Provide helpful error messages
    if (
      errorMessage.includes("credentials") ||
      errorMessage.includes("authentication") ||
      errorMessage.includes("PLAIN")
    ) {
      errorMessage =
        "SMTP authentication failed. For Gmail, you MUST use an App Password (not your regular password). Steps: 1) Enable 2-Step Verification, 2) Go to https://myaccount.google.com/apppasswords, 3) Generate an App Password for 'Mail', 4) Use that 16-character password in SMTP_PASS";
    } else if (
      errorMessage.includes("connect") ||
      errorMessage.includes("ECONNREFUSED")
    ) {
      errorMessage =
        "Cannot connect to SMTP server. Please check SMTP_HOST and SMTP_PORT.";
    } else if (
      errorMessage.includes("ETIMEDOUT") ||
      errorMessage.includes("timeout")
    ) {
      errorMessage =
        "SMTP connection timeout. Check your network or firewall settings.";
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
    });
  }
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/alumni", alumniRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/job-applications", jobApplicationRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/news", newsRoutes);
app.use("/api/v1/news", savedNewsRoutes);
app.use("/api/v1/mentorship", mentorshipRoutes);
app.use("/api/v1/donations", donationRoutes);
app.use("/api/v1/invitations", invitationRoutes);
app.use("/api/v1/docs", docsRoutes);
app.use("/api/v1/gallery", galleryRoutes);
app.use("/api/v1/connections", connectionRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/tenants", tenantRoutes);
app.use("/api/v1/college", tenantRoutes);
app.use("/api/v1/campaigns", campaignRoutes);
app.use("/api/v1/community", communityRoutes);
app.use("/api/v1/communities", communitiesRoutes);
app.use("/api/v1/community-posts", communityPostsRoutes);
app.use("/api/v1/community-memberships", communityMembershipsRoutes);
app.use("/api/v1/community-comments", communityCommentsRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/mentoring-programs", mentoringProgramRoutes);
app.use("/api/v1/mentor-registrations", mentorRegistrationRoutes);
app.use("/api/v1/mentee-registrations", menteeRegistrationRoutes);
app.use("/api/v1/mentoring-approvals", mentoringApprovalRoutes);
app.use("/api/v1/email-templates", emailTemplateRoutes);
app.use("/api/v1/matching", matchingRoutes);
app.use("/api/v1/mentorship-communications", mentorshipCommunicationRoutes);
app.use("/api/v1/program-chat", programChatRoutes);
app.use("/api/v1", likesRoutes);
app.use("/api/v1", commentsRoutes);
app.use("/api/v1", sharesRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/categories", categoryRoutes);

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
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logger.error("Unhandled Promise Rejection:", {
    error: err.message,
    stack: err.stack,
    reason: String(reason),
  });
  // Don't exit immediately - log and continue
  // Only exit if it's a critical error
  if (err.message?.includes("ECONNREFUSED") || err.message?.includes("EADDRINUSE")) {
    logger.error("Critical error detected, exiting...");
    process.exit(1);
  }
});

// Uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  logger.error("Uncaught Exception:", {
    error: err.message,
    stack: err.stack,
  });
  // Only exit for critical errors
  if (err.message?.includes("ECONNREFUSED") || err.message?.includes("EADDRINUSE")) {
    logger.error("Critical error detected, exiting...");
    process.exit(1);
  }
  // For other errors, log and continue
  logger.warn("Non-critical error, continuing...");
});

// Setup cron job for auto-rejecting expired matches
const setupMatchingCronJob = () => {
  // Run every hour to check for expired matches
  setInterval(async () => {
    try {
      const { autoRejectExpiredMatches } = await import("./controllers/matchingController");
      const count = await autoRejectExpiredMatches();
      if (count > 0) {
        logger.info(`Auto-rejected ${count} expired match requests`);
      }
    } catch (error) {
      logger.error("Cron job error:", error);
    }
  }, 60 * 60 * 1000); // Every hour

  logger.info("Matching cron job scheduled (runs every hour)");
};

// Setup cron job for auto-sending mentee selection emails
const setupMenteeSelectionEmailCronJob = () => {
  // Run every 6 hours to check for programs where registration end dates have passed
  setInterval(async () => {
    try {
      const { autoSendMenteeSelectionEmails } = await import("./controllers/matchingController");
      const result = await autoSendMenteeSelectionEmails();
      if (result.programsProcessed > 0) {
        logger.info(
          `Auto-sent mentee selection emails: ${result.programsProcessed} programs processed, ${result.emailsSent} emails sent, ${result.errors} errors`
        );
      }
    } catch (error) {
      logger.error("Mentee selection email cron job error:", error);
    }
  }, 6 * 60 * 60 * 1000); // Every 6 hours

  logger.info("Mentee selection email cron job scheduled (runs every 6 hours)");
};

// Start the server
startServer().then(() => {
  // Setup cron jobs after server starts (with delay to ensure DB is connected)
  setTimeout(() => {
    setupMatchingCronJob();
    setupMenteeSelectionEmailCronJob();
  }, 5000); // 5 second delay to ensure everything is initialized
});

// Export socket service for use in other modules
export { socketService };
export default app;
