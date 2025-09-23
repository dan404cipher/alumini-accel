import express from "express";
import mentorshipController from "@/controllers/mentorshipController";
import {
  validateMentorship,
  validateId,
  validateRequest,
} from "@/middleware/validation";
import { authenticateToken } from "@/middleware/auth";
import { asyncHandler } from "@/middleware/errorHandler";

const router = express.Router();

// @route   GET /api/v1/mentorship
// @desc    Get all mentorships
// @access  Private
router.get(
  "/",
  authenticateToken,
  asyncHandler(mentorshipController.getAllMentorships)
);

// @route   GET /api/v1/mentorship/:id
// @desc    Get mentorship by ID
// @access  Private
router.get(
  "/:id",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(mentorshipController.getMentorshipById)
);

// @route   POST /api/v1/mentorship
// @desc    Create mentorship request
// @access  Private
router.post(
  "/",
  authenticateToken,
  ...validateRequest(validateMentorship),
  asyncHandler(mentorshipController.createMentorship)
);

// @route   PUT /api/v1/mentorship/:id/accept
// @desc    Accept mentorship request
// @access  Private
router.put(
  "/:id/accept",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(mentorshipController.acceptMentorship)
);

// @route   PUT /api/v1/mentorship/:id/reject
// @desc    Reject mentorship request
// @access  Private
router.put(
  "/:id/reject",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(mentorshipController.rejectMentorship)
);

// @route   PUT /api/v1/mentorship/:id/complete
// @desc    Complete mentorship
// @access  Private
router.put(
  "/:id/complete",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(mentorshipController.completeMentorship)
);

// @route   POST /api/v1/mentorship/:id/sessions
// @desc    Add mentorship session
// @access  Private
router.post(
  "/:id/sessions",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(mentorshipController.addSession)
);

// @route   PUT /api/v1/mentorship/:id/sessions/:sessionId
// @desc    Update mentorship session
// @access  Private
router.put(
  "/:id/sessions/:sessionId",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(mentorshipController.updateSession)
);

// @route   POST /api/v1/mentorship/:id/feedback
// @desc    Submit mentorship feedback
// @access  Private
router.post(
  "/:id/feedback",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(mentorshipController.submitFeedback)
);

// @route   GET /api/v1/mentorship/my-mentorships
// @desc    Get user's mentorships
// @access  Private
router.get(
  "/my-mentorships",
  authenticateToken,
  asyncHandler(mentorshipController.getMyMentorships)
);

// @route   GET /api/v1/mentorship/active
// @desc    Get active mentorships
// @access  Private
router.get(
  "/active",
  authenticateToken,
  asyncHandler(mentorshipController.getActiveMentorships)
);

// @route   GET /api/v1/mentorship/pending
// @desc    Get pending mentorship requests
// @access  Private
router.get(
  "/pending",
  authenticateToken,
  asyncHandler(mentorshipController.getPendingMentorships)
);

export default router;
