import { Router } from "express";
import {
  submitMenteePreferences,
  initiateMatching,
  acceptMatch,
  rejectMatch,
  getMenteeMatchingStatus,
  getMentorMatchRequests,
  autoRejectExpiredMatches,
  manualMatching,
  getUnmatchedMentees,
  getMatchingStatistics,
  getAllMatches,
  sendMenteeSelectionEmails,
  getMyMentees,
} from "../controllers/matchingController";
import { authenticateToken, requireAdmin, optionalAuth, authorize } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

// Submit mentee preferences (Public/Student - can be authenticated or via token)
router.post("/:programId/submit-preferences", optionalAuth, submitMenteePreferences);

// Initiate matching (Staff/Admin only)
router.post("/:programId/initiate", authenticateToken, requireAdmin, initiateMatching);

// Get my mentees for a program (Mentor can view their own mentees)
// NOTE: This route must come BEFORE /:programId/status to avoid route conflicts
router.get("/:programId/my-mentees", authenticateToken, getMyMentees);

// Get matching status
router.get("/:programId/status", authenticateToken, getMenteeMatchingStatus);

// Get mentor match requests
router.get("/my-requests", authenticateToken, getMentorMatchRequests);

// Accept match (Mentor)
router.put("/:matchId/accept", authenticateToken, acceptMatch);

// Reject match (Mentor)
router.put("/:matchId/reject", authenticateToken, rejectMatch);

// Manual matching (Staff/Admin)
router.post("/:programId/manual", authenticateToken, requireAdmin, manualMatching);

// Get unmatched mentees (Staff/Admin)
router.get("/:programId/unmatched", authenticateToken, requireAdmin, getUnmatchedMentees);

// Get matching statistics (Staff/Admin)
router.get("/:programId/statistics", authenticateToken, requireAdmin, getMatchingStatistics);

// Get all matches for a program (Staff/Admin)
router.get("/:programId/matches", authenticateToken, requireAdmin, getAllMatches);

// Send mentee selection emails (Staff/HOD/College Admin)
router.post("/:programId/send-mentee-selection-emails", authenticateToken, authorize(UserRole.STAFF, UserRole.HOD, UserRole.COLLEGE_ADMIN), sendMenteeSelectionEmails);

export default router;

