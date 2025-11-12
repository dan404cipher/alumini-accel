import { Router } from "express";
import {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
  sendMentorInvitations,
  generateMenteeInvitations,
  sendAcknowledgementEmail,
} from "../controllers/emailTemplateController";
import {
  selectAlumniForInvitation,
  sendBulkMentorInvitations,
  exportInvitationList,
} from "../controllers/mentoringInvitationController";
import { testEmail } from "../controllers/emailTestController";
import { authenticateToken, requireAdmin, authorize } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// IMPORTANT: Specific routes must come BEFORE parameterized routes like /:id
// Otherwise Express will match /programs/:programId as /:id with id="programs"

// Send invitations (Staff only) - MUST come before /:id routes
router.post(
  "/programs/:programId/send-mentor-invitations",
  authorize(UserRole.STAFF),
  sendMentorInvitations
);
router.post(
  "/programs/:programId/generate-mentee-links",
  authorize(UserRole.STAFF),
  generateMenteeInvitations
);

// Alumni selection and export (Staff only) - MUST come before /:id routes
router.get("/alumni/select", authorize(UserRole.STAFF), selectAlumniForInvitation);
router.post("/alumni/bulk-invite", authorize(UserRole.STAFF), sendBulkMentorInvitations);
router.get("/alumni/export", authorize(UserRole.STAFF), exportInvitationList);

// Other specific routes
router.post("/send-acknowledgement", requireAdmin, sendAcknowledgementEmail);
router.post("/test-email", requireAdmin, testEmail);

// Template CRUD routes (Admin only) - Parameterized routes come last
router.post("/", requireAdmin, createTemplate);
router.get("/", getAllTemplates);
router.get("/:id", getTemplateById);
router.put("/:id", requireAdmin, updateTemplate);
router.delete("/:id", requireAdmin, deleteTemplate);
router.post("/:id/preview", previewTemplate);

export default router;

