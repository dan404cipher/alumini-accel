import express from "express";
import jobController from "../controllers/jobController";
import {
  validateJobPost,
  validateId,
  validateRequest,
} from "../middleware/validation";
import { authenticateToken, requireAlumni } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();

// @route   GET /api/v1/jobs
// @desc    Get all job posts
// @access  Private
router.get("/", authenticateToken, asyncHandler(jobController.getAllJobs));

// @route   GET /api/v1/jobs/search
// @desc    Search jobs
// @access  Private
router.get(
  "/search",
  authenticateToken,
  asyncHandler(jobController.searchJobs)
);

// @route   GET /api/v1/jobs/saved
// @desc    Get saved jobs for current user
// @access  Private
router.get(
  "/saved",
  authenticateToken,
  asyncHandler(jobController.getSavedJobs)
);

// @route   GET /api/v1/jobs/pending
// @desc    Get pending jobs for admin approval
// @access  Private/Admin
router.get(
  "/pending",
  authenticateToken,
  asyncHandler(jobController.getPendingJobs)
);

// @route   GET /api/v1/jobs/:id
// @desc    Get job post by ID
// @access  Private
router.get(
  "/:id",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(jobController.getJobById)
);

// @route   POST /api/v1/jobs
// @desc    Create job post
// @access  Private/Alumni
router.post(
  "/",
  authenticateToken,
  requireAlumni,
  ...validateRequest(validateJobPost),
  asyncHandler(jobController.createJob)
);

// @route   PUT /api/v1/jobs/:id
// @desc    Update job post
// @access  Private/Alumni
router.put(
  "/:id",
  authenticateToken,
  requireAlumni,
  ...validateRequest([...validateId, ...validateJobPost]),
  asyncHandler(jobController.updateJob)
);

// @route   DELETE /api/v1/jobs/:id
// @desc    Delete job post
// @access  Private (Alumni can delete their own jobs, Admins can delete any job in their tenant)
router.delete(
  "/:id",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(jobController.deleteJob)
);

// @route   POST /api/v1/jobs/:id/apply
// @desc    Apply for job
// @access  Private
router.post(
  "/:id/apply",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(jobController.applyForJob)
);

// @route   GET /api/v1/jobs/company/:company
// @desc    Get jobs by company
// @access  Private
router.get(
  "/company/:company",
  authenticateToken,
  asyncHandler(jobController.getJobsByCompany)
);

// @route   GET /api/v1/jobs/location/:location
// @desc    Get jobs by location
// @access  Private
router.get(
  "/location/:location",
  authenticateToken,
  asyncHandler(jobController.getJobsByLocation)
);

// @route   GET /api/v1/jobs/type/:type
// @desc    Get jobs by type
// @access  Private
router.get(
  "/type/:type",
  authenticateToken,
  asyncHandler(jobController.getJobsByType)
);

// @route   POST /api/v1/jobs/:id/save
// @desc    Save a job
// @access  Private
router.post(
  "/:id/save",
  authenticateToken,
  validateId,
  asyncHandler(jobController.saveJob)
);

// @route   DELETE /api/v1/jobs/:id/save
// @desc    Unsave a job
// @access  Private
router.delete(
  "/:id/save",
  authenticateToken,
  validateId,
  asyncHandler(jobController.unsaveJob)
);

// @route   POST /api/v1/jobs/:id/approve
// @desc    Approve a pending job post
// @access  Private/Admin
router.post(
  "/:id/approve",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(jobController.approveJob)
);

// @route   POST /api/v1/jobs/:id/reject
// @desc    Reject a pending job post
// @access  Private/Admin
router.post(
  "/:id/reject",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(jobController.rejectJob)
);

export default router;
