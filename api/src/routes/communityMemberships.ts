import express from "express";
import { authenticateToken as authenticate } from "../middleware/auth";
import {
  validateCommunityMembership,
  validateCommunityMembershipSuspension,
  validateId,
  validateCommunityId,
  validateMembershipId,
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
  updateModeratorPermissions,
} from "../controllers/communityMembershipController";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Membership management
router.get(
  "/community/:communityId/requests",
  validateCommunityId,
  getMembershipRequests
);
router.get(
  "/community/:communityId/moderators",
  validateCommunityId,
  getCommunityModerators
);

// Membership actions
router.post("/:membershipId/approve", validateMembershipId, approveMembership);
router.post("/:membershipId/reject", validateMembershipId, rejectMembership);
router.post(
  "/:membershipId/suspend",
  validateMembershipId,
  validateCommunityMembershipSuspension,
  suspendMember
);
router.post("/:membershipId/unsuspend", validateMembershipId, unsuspendMember);
router.post("/:membershipId/promote", validateMembershipId, promoteToModerator);
router.post("/:membershipId/demote", validateMembershipId, demoteToMember);
router.delete("/:membershipId", validateMembershipId, removeMember);

// Invitations
router.post(
  "/community/:communityId/invite",
  validateCommunityId,
  validateCommunityMembership,
  inviteToCommunity
);

// Moderator permissions
router.put(
  "/:membershipId/permissions",
  validateMembershipId,
  updateModeratorPermissions
);

export default router;
