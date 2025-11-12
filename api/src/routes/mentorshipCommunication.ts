import { Router } from "express";
import {
  sendEmailToMentee,
  sendEmailToMentor,
  getCommunicationHistory,
  getMenteeCommunicationHistory,
  markAsRead,
  deleteCommunication,
  getUnreadCount,
} from "../controllers/mentorshipCommunicationController";
import { authenticateToken } from "../middleware/auth";
import { uploadOptionalDocument } from "../middleware/fileUpload";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Send email to mentee (mentor only)
router.post("/send", uploadOptionalDocument("attachments"), sendEmailToMentee);

// Send email to mentor (mentee only) - using same endpoint, controller determines direction
router.post("/send-to-mentor", uploadOptionalDocument("attachments"), sendEmailToMentor);

// Get communication history for community
router.get("/community/:communityId", getCommunicationHistory);

// Get mentee communication history
router.get("/mentee/:menteeId", getMenteeCommunicationHistory);

// Mark as read
router.put("/:id/mark-read", markAsRead);

// Delete communication (sender only)
router.delete("/:id", deleteCommunication);

// Get unread count
router.get("/unread-count", getUnreadCount);

export default router;

