import express from "express";
import {
  applyForJob,
  getJobApplications,
  getUserApplications,
  updateApplicationStatus,
  getApplicationDetails,
  deleteApplication,
} from "../controllers/jobApplicationController";
import { authenticateToken } from "../middleware/auth";
import { validateJobApplication } from "../middleware/validation";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();

// Apply for a job
router.post(
  "/jobs/:jobId/apply",
  authenticateToken,
  validateJobApplication,
  asyncHandler(applyForJob)
);

// Get applications for a specific job (for job poster)
router.get(
  "/jobs/:jobId/applications",
  authenticateToken,
  asyncHandler(getJobApplications)
);

// Get user's applications (for applicant)
router.get(
  "/my-applications",
  authenticateToken,
  asyncHandler(getUserApplications)
);

// Get application details
router.get(
  "/applications/:applicationId",
  authenticateToken,
  asyncHandler(getApplicationDetails)
);

// Update application status (for job poster)
router.patch(
  "/applications/:applicationId/status",
  authenticateToken,
  asyncHandler(updateApplicationStatus)
);

// Delete application (for applicant)
router.delete(
  "/applications/:applicationId",
  authenticateToken,
  asyncHandler(deleteApplication)
);

export default router;
