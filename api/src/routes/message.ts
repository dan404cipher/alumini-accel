import express from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { authenticateToken } from "../middleware/auth";
import messageController from "../controllers/messageController";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   POST /api/v1/messages
// @desc    Send a message
// @access  Private
router.post("/", asyncHandler(messageController.sendMessage));

// @route   GET /api/v1/messages/conversations
// @desc    Get all conversations for a user
// @access  Private
router.get("/conversations", asyncHandler(messageController.getConversations));

// @route   GET /api/v1/messages/unread-count
// @desc    Get unread message count
// @access  Private
router.get("/unread-count", asyncHandler(messageController.getUnreadCount));

// @route   GET /api/v1/messages/:recipientId
// @desc    Get messages between two users
// @access  Private
router.get("/:recipientId", asyncHandler(messageController.getMessages));

// @route   PATCH /api/v1/messages/:messageId/read
// @desc    Mark a message as read
// @access  Private
router.patch("/:messageId/read", asyncHandler(messageController.markAsRead));

// @route   DELETE /api/v1/messages/:messageId
// @desc    Delete a message
// @access  Private
router.delete("/:messageId", asyncHandler(messageController.deleteMessage));

export default router;
