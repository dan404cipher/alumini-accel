import express from "express";
import { authenticateToken as authenticate } from "../middleware/auth";
import {
  validateCommunity,
  validateCommunitySearch,
  validateId,
} from "../middleware/validation";
import {
  createCommunity,
  getAllCommunities,
  getCommunityById,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityMembers,
  getUserCommunities,
  searchCommunities,
  getUserMembershipStatus,
  getTopCommunities,
} from "../controllers/communityController";

const router = express.Router();

// Public routes (no authentication required)
router.get("/top", getTopCommunities);

// Apply authentication to all other routes
router.use(authenticate);

// All other routes are now protected
router.get("/", getAllCommunities);
router.get("/search", validateCommunitySearch, searchCommunities);
router.get("/:id", validateId, getCommunityById);

// Community management
router.post("/", validateCommunity, createCommunity);
router.put("/:id", validateId, validateCommunity, updateCommunity);
router.delete("/:id", validateId, deleteCommunity);

// Membership management
router.post("/:id/join", validateId, joinCommunity);
router.delete("/:id/leave", validateId, leaveCommunity);
router.get("/:id/members", validateId, getCommunityMembers);
router.get("/:id/membership-status", validateId, getUserMembershipStatus);
router.get("/user/communities", getUserCommunities);

export default router;
