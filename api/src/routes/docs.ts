import express from "express";
import { logger } from "@/utils/logger";

const router = express.Router();

// API Documentation endpoint
router.get("/", (req, res) => {
  try {
    const apiDocs = {
      success: true,
      message: "AlumniAccel API Documentation",
      version: "1.0.0",
      baseUrl: `${req.protocol}://${req.get("host")}/api/v1`,
      endpoints: {
        auth: {
          base: "/auth",
          description: "Authentication endpoints",
          endpoints: [
            {
              path: "/login",
              method: "POST",
              description: "User login",
              body: {
                email: "string",
                password: "string",
              },
              response: {
                success: "boolean",
                data: {
                  token: "string",
                  user: "object",
                },
              },
            },
            {
              path: "/register",
              method: "POST",
              description: "User registration",
              body: {
                email: "string",
                password: "string",
                firstName: "string",
                lastName: "string",
                role: "string",
              },
            },
            {
              path: "/logout",
              method: "POST",
              description: "User logout",
              auth: "required",
            },
            {
              path: "/refresh",
              method: "POST",
              description: "Refresh access token",
              auth: "required",
            },
          ],
        },
        users: {
          base: "/users",
          description: "User management endpoints",
          endpoints: [
            {
              path: "/",
              method: "GET",
              description: "Get all users (admin only)",
              auth: "required",
              query: {
                page: "number (optional)",
                limit: "number (optional)",
                role: "string (optional)",
                status: "string (optional)",
                search: "string (optional)",
              },
            },
            {
              path: "/:id",
              method: "GET",
              description: "Get user by ID",
              auth: "required",
              params: {
                id: "string (user ID)",
              },
            },
            {
              path: "/profile",
              method: "PUT",
              description: "Update user profile",
              auth: "required",
              body: {
                firstName: "string (optional)",
                lastName: "string (optional)",
                phone: "string (optional)",
                bio: "string (optional)",
                location: "string (optional)",
                linkedinProfile: "string (optional)",
                twitterHandle: "string (optional)",
                githubProfile: "string (optional)",
                website: "string (optional)",
                preferences: "object (optional)",
              },
            },
            {
              path: "/:id/status",
              method: "PUT",
              description: "Update user status (admin only)",
              auth: "required",
              params: {
                id: "string (user ID)",
              },
              body: {
                status: "string",
              },
            },
            {
              path: "/:id",
              method: "DELETE",
              description: "Delete user (admin only)",
              auth: "required",
              params: {
                id: "string (user ID)",
              },
            },
            {
              path: "/search",
              method: "GET",
              description: "Search users",
              auth: "required",
              query: {
                q: "string (optional)",
                role: "string (optional)",
                status: "string (optional)",
                page: "number (optional)",
                limit: "number (optional)",
              },
            },
          ],
        },
        alumni: {
          base: "/alumni",
          description: "Alumni profile endpoints",
          endpoints: [
            {
              path: "/",
              method: "GET",
              description: "Get all alumni profiles",
              auth: "required",
              query: {
                page: "number (optional)",
                limit: "number (optional)",
                batchYear: "number (optional)",
                department: "string (optional)",
                isHiring: "boolean (optional)",
                availableForMentorship: "boolean (optional)",
              },
            },
            {
              path: "/:id",
              method: "GET",
              description: "Get alumni profile by ID",
              auth: "required",
              params: {
                id: "string (profile ID)",
              },
            },
            {
              path: "/",
              method: "POST",
              description: "Create alumni profile",
              auth: "required",
              body: {
                batchYear: "number (required)",
                graduationYear: "number (required)",
                department: "string (required)",
                specialization: "string (optional)",
                currentCompany: "string (optional)",
                currentPosition: "string (optional)",
                currentLocation: "string (optional)",
                experience: "number (optional)",
                skills: "array (optional)",
                isHiring: "boolean (optional)",
                availableForMentorship: "boolean (optional)",
              },
            },
            {
              path: "/:id",
              method: "PUT",
              description: "Update alumni profile",
              auth: "required",
              params: {
                id: "string (profile ID)",
              },
            },
          ],
        },
        events: {
          base: "/events",
          description: "Event management endpoints",
          endpoints: [
            {
              path: "/",
              method: "GET",
              description: "Get all events",
              auth: "required",
              query: {
                page: "number (optional)",
                limit: "number (optional)",
                type: "string (optional)",
                status: "string (optional)",
                isOnline: "boolean (optional)",
              },
            },
            {
              path: "/:id",
              method: "GET",
              description: "Get event by ID",
              auth: "required",
              params: {
                id: "string (event ID)",
              },
            },
            {
              path: "/",
              method: "POST",
              description: "Create new event",
              auth: "required",
              body: {
                title: "string (required)",
                description: "string (required)",
                type: "string (required)",
                startDate: "date (required)",
                endDate: "date (required)",
                location: "string (required)",
                isOnline: "boolean (optional)",
                maxAttendees: "number (optional)",
                tags: "array (optional)",
              },
            },
            {
              path: "/:id/register",
              method: "POST",
              description: "Register for event",
              auth: "required",
              params: {
                id: "string (event ID)",
              },
            },
          ],
        },
        jobs: {
          base: "/jobs",
          description: "Job posting endpoints",
          endpoints: [
            {
              path: "/",
              method: "GET",
              description: "Get all job posts",
              auth: "required",
              query: {
                page: "number (optional)",
                limit: "number (optional)",
                type: "string (optional)",
                remote: "boolean (optional)",
                location: "string (optional)",
              },
            },
            {
              path: "/:id",
              method: "GET",
              description: "Get job post by ID",
              auth: "required",
              params: {
                id: "string (job ID)",
              },
            },
            {
              path: "/",
              method: "POST",
              description: "Create job post",
              auth: "required",
              body: {
                company: "string (required)",
                position: "string (required)",
                location: "string (required)",
                type: "string (required)",
                remote: "boolean (optional)",
                description: "string (required)",
                requirements: "array (optional)",
                benefits: "array (optional)",
                tags: "array (optional)",
              },
            },
            {
              path: "/:id/apply",
              method: "POST",
              description: "Apply for job",
              auth: "required",
              params: {
                id: "string (job ID)",
              },
              body: {
                resume: "string (optional)",
                coverLetter: "string (optional)",
              },
            },
          ],
        },
        mentorship: {
          base: "/mentorship",
          description: "Mentorship endpoints",
          endpoints: [
            {
              path: "/",
              method: "GET",
              description: "Get mentorship requests",
              auth: "required",
            },
            {
              path: "/",
              method: "POST",
              description: "Request mentorship",
              auth: "required",
              body: {
                mentorId: "string (required)",
                domain: "string (required)",
                description: "string (required)",
                goals: "array (required)",
              },
            },
            {
              path: "/:id/accept",
              method: "PUT",
              description: "Accept mentorship request",
              auth: "required",
              params: {
                id: "string (mentorship ID)",
              },
            },
          ],
        },
        donations: {
          base: "/donations",
          description: "Donation endpoints",
          endpoints: [
            {
              path: "/",
              method: "GET",
              description: "Get donation history",
              auth: "required",
            },
            {
              path: "/",
              method: "POST",
              description: "Make donation",
              auth: "required",
              body: {
                amount: "number (required)",
                currency: "string (required)",
                cause: "string (required)",
                description: "string (optional)",
                isAnonymous: "boolean (optional)",
              },
            },
          ],
        },
      },
      authentication: {
        type: "Bearer Token",
        header: "Authorization: Bearer <token>",
        note: "Include token in Authorization header for protected endpoints",
      },
      errorCodes: {
        "400": "Bad Request - Invalid input data",
        "401": "Unauthorized - Missing or invalid token",
        "403": "Forbidden - Insufficient permissions",
        "404": "Not Found - Resource not found",
        "422": "Validation Error - Data validation failed",
        "500": "Internal Server Error - Server error",
      },
      userRoles: {
        super_admin: "Full system access",
        admin: "Administrative access",
        coordinator: "Event and user coordination",
        alumni: "Graduated alumni access",
        student: "Current student access",
        batch_rep: "Batch representative access",
      },
      statusCodes: {
        active: "User account is active",
        inactive: "User account is inactive",
        pending: "User account pending verification",
        suspended: "User account suspended",
        verified: "User account verified",
      },
    };

    res.json(apiDocs);
  } catch (error) {
    logger.error("Error generating API docs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate API documentation",
    });
  }
});

export default router;
