import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  blockUser,
  unblockUser,
  cancelConnection,
  getUserConnections,
  getPendingRequests,
  getSentRequests,
  getConnectionStats,
  checkConnectionStatus,
  removeConnection,
} from "../controllers/connectionController";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Send connection request
router.post("/send", sendConnectionRequest);

// Accept connection request
router.patch("/:connectionId/accept", acceptConnection);

// Reject connection request
router.patch("/:connectionId/reject", rejectConnection);

// Block user
router.patch("/:connectionId/block", blockUser);

// Unblock user
router.patch("/:connectionId/unblock", unblockUser);

// Cancel connection request
router.patch("/:connectionId/cancel", cancelConnection);

// Remove connection (unfriend)
router.delete("/:connectionId/remove", removeConnection);

// Get user connections
router.get("/", getUserConnections);

// Get pending requests
router.get("/pending", getPendingRequests);

// Get sent requests
router.get("/sent", getSentRequests);

// Get connection statistics
router.get("/stats", getConnectionStats);

// Check connection status between two users
router.get("/check/:userId", checkConnectionStatus);

export default router;
