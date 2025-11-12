import { Router } from "express";
import {
  getApprovalQueue,
  getMentorApprovals,
  getMenteeApprovals,
  approveMentorRegistration,
  rejectMentorRegistration,
  approveMenteeRegistration,
  rejectMenteeRegistration,
  reconsiderRegistration,
  disapproveRegistration,
  fillFormOnBehalf,
  getApprovalStatistics,
} from "../controllers/mentoringApprovalController";
import { authenticateToken, requireAdmin, requireStaff } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// View routes - allow all admin roles (SUPER_ADMIN, COLLEGE_ADMIN, HOD, STAFF)
router.get("/queue", requireAdmin, getApprovalQueue);
router.get("/mentors", requireAdmin, getMentorApprovals);
router.get("/mentees", requireAdmin, getMenteeApprovals);
router.get("/statistics", requireAdmin, getApprovalStatistics);

// Action routes - STAFF, HOD, and College Admin can approve/disapprove
router.put("/mentors/:id/approve", requireAdmin, approveMentorRegistration);
router.put("/mentors/:id/reject", requireAdmin, rejectMentorRegistration);
router.put("/mentees/:id/approve", requireAdmin, approveMenteeRegistration);
router.put("/mentees/:id/reject", requireAdmin, rejectMenteeRegistration);
router.put("/:id/reconsider", requireAdmin, reconsiderRegistration);
router.put("/:id/disapprove", requireAdmin, disapproveRegistration);

// Fill form on behalf - allow all admin roles
router.post("/fill-on-behalf", requireAdmin, fillFormOnBehalf);

export default router;

