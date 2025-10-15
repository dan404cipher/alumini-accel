import express from "express";
import {
  getAllCommunities,
  getCommunityById,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityMembers,
  getUserCommunities,
  searchCommunities,
} from "../controllers/communityController";
import {
  authenticateToken as authenticate,
  optionalAuth,
} from "../middleware/auth";
import { validateId } from "../middleware/validation";

const router = express.Router();

// Public routes (no authentication required)
router.get("/", optionalAuth, getAllCommunities);
router.get("/search", optionalAuth, searchCommunities);
router.get("/:id", validateId, optionalAuth, getCommunityById);

// Protected routes (authentication required)
router.post("/", authenticate, createCommunity);
router.post("/:id/join", validateId, authenticate, joinCommunity);
router.post("/:id/leave", validateId, authenticate, leaveCommunity);
router.get("/:id/members", validateId, optionalAuth, getCommunityMembers);
router.get("/user/communities", authenticate, getUserCommunities);

export default router;
