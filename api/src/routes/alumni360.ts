import express from "express";
import * as alumni360Controller from "../controllers/alumni360Controller";
import { authenticateToken } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/v1/alumni-360/:id
// @desc    Get complete 360 view data for an alumnus
// @access  Private (Staff, HOD, College Admin, Super Admin)
router.get("/:id", asyncHandler(alumni360Controller.getAlumni360Data));

// @route   POST /api/v1/alumni-360/:id/notes
// @desc    Add a note for an alumnus
// @access  Private (Staff, HOD, College Admin, Super Admin)
router.post("/:id/notes", asyncHandler(alumni360Controller.addNote));

// @route   GET /api/v1/alumni-360/:id/notes
// @desc    Get all notes for an alumnus
// @access  Private (Staff, HOD, College Admin, Super Admin)
router.get("/:id/notes", asyncHandler(alumni360Controller.getNotes));

// @route   PUT /api/v1/alumni-360/:id/notes/:noteId
// @desc    Update a note
// @access  Private (Staff, HOD, College Admin, Super Admin)
router.put("/:id/notes/:noteId", asyncHandler(alumni360Controller.updateNote));

// @route   DELETE /api/v1/alumni-360/:id/notes/:noteId
// @desc    Delete a note
// @access  Private (Staff, HOD, College Admin, Super Admin)
router.delete("/:id/notes/:noteId", asyncHandler(alumni360Controller.deleteNote));

// @route   POST /api/v1/alumni-360/:id/issues
// @desc    Create a new issue for an alumnus
// @access  Private (Staff, HOD, College Admin, Super Admin)
router.post("/:id/issues", asyncHandler(alumni360Controller.createIssue));

// @route   PUT /api/v1/alumni-360/:id/issues/:issueId
// @desc    Update an issue (status, priority, add response)
// @access  Private (Staff, HOD, College Admin, Super Admin)
router.put("/:id/issues/:issueId", asyncHandler(alumni360Controller.updateIssue));

// @route   GET /api/v1/alumni-360/:id/issues
// @desc    Get all issues for an alumnus
// @access  Private (Staff, HOD, College Admin, Super Admin)
router.get("/:id/issues", asyncHandler(alumni360Controller.getIssues));

// @route   DELETE /api/v1/alumni-360/:id/issues/:issueId
// @desc    Delete an issue
// @access  Private (Staff, HOD, College Admin, Super Admin)
router.delete("/:id/issues/:issueId", asyncHandler(alumni360Controller.deleteIssue));

// @route   POST /api/v1/alumni-360/:id/flags
// @desc    Add or update a flag for an alumnus
// @access  Private (Staff, HOD, College Admin, Super Admin)
router.post("/:id/flags", asyncHandler(alumni360Controller.addFlag));

// @route   DELETE /api/v1/alumni-360/:id/flags/:flagType
// @desc    Remove a flag from an alumnus
// @access  Private (Staff, HOD, College Admin, Super Admin)
router.delete("/:id/flags/:flagType", asyncHandler(alumni360Controller.removeFlag));

// @route   GET /api/v1/alumni-360/:id/flags
// @desc    Get all flags for an alumnus
// @access  Private (Staff, HOD, College Admin, Super Admin)
router.get("/:id/flags", asyncHandler(alumni360Controller.getFlags));

// @route   GET /api/v1/alumni-360/:id/communication
// @desc    Get communication history for an alumnus
// @access  Private (Staff, HOD, College Admin, Super Admin)
router.get("/:id/communication", asyncHandler(alumni360Controller.getCommunicationHistory));

// @route   GET /api/v1/alumni-360/:id/engagement
// @desc    Get engagement metrics for an alumnus
// @access  Private (Staff, HOD, College Admin, Super Admin)
router.get("/:id/engagement", asyncHandler(alumni360Controller.getEngagementMetrics));

// @route   GET /api/v1/alumni-360/:id/analytics
// @desc    Get analytics data for reports dashboard
// @access  Private (Staff, HOD, College Admin, Super Admin)
router.get("/:id/analytics", asyncHandler(alumni360Controller.getAlumniAnalytics));

export default router;

