import express from "express";
import { authenticateToken as authenticate } from "../middleware/auth";
import {
  validateCommunityMembership,
  validateCommunityMembershipSuspension,
  validateId,
} from "../middleware/validation";
import {
  getMembershipRequests,
  approveMembership,
  rejectMembership,
  suspendMember,
  unsuspendMember,
  promoteToModerator,
  demoteToMember,
  removeMember,
  getCommunityModerators,
  inviteToCommunity,
} from "../controllers/communityMembershipController";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Membership management
router.get(
  "/community/:communityId/requests",
  validateId,
  getMembershipRequests
);
router.get(
  "/community/:communityId/moderators",
  validateId,
  getCommunityModerators
);

// Membership actions
router.post("/:membershipId/approve", validateId, approveMembership);
router.post("/:membershipId/reject", validateId, rejectMembership);
router.post(
  "/:membershipId/suspend",
  validateId,
  validateCommunityMembershipSuspension,
  suspendMember
);
router.post("/:membershipId/unsuspend", validateId, unsuspendMember);
router.post("/:membershipId/promote", validateId, promoteToModerator);
router.post("/:membershipId/demote", validateId, demoteToMember);
router.delete("/:membershipId", validateId, removeMember);

// Invitations
router.post(
  "/community/:communityId/invite",
  validateId,
  validateCommunityMembership,
  inviteToCommunity
);

export default router;
