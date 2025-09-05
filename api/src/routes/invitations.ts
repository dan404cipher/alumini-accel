import express from "express";
import {
  sendInvitation,
  getInvitationByToken,
  acceptInvitation,
  getInvitations,
  checkInvitationExists,
} from "../controllers/invitationController";
import { authenticateToken } from "../middleware/auth";
import { validateInvitation } from "../middleware/validation";

const router = express.Router();

// Send invitation (authenticated users only)
router.post("/", authenticateToken, validateInvitation, sendInvitation);

// Get invitations (authenticated users only)
router.get("/", authenticateToken, getInvitations);

// Check if invitation exists for email (authenticated users only)
router.get("/check/:email", authenticateToken, checkInvitationExists);

// Get invitation by token (public - for registration)
router.get("/:token", getInvitationByToken);

// Accept invitation (public - for registration)
router.post("/:token/accept", acceptInvitation);

export default router;
