import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import Message from "../models/Message";
import Connection from "../models/Connection";
import { ConnectionStatus } from "../types/connection";
import { MessageRequest, MessageResponse, MessageType } from "../types/message";

// Send a message
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const {
    recipientId,
    content,
    messageType = MessageType.TEXT,
  } = req.body as MessageRequest;
  const senderId = req.user?._id;

  if (!senderId) {
    return res.status(401).json({
      success: false,
      message: "User not authenticated",
    });
  }

  if (!recipientId || !content) {
    return res.status(400).json({
      success: false,
      message: "Recipient ID and content are required",
    });
  }

  if (senderId === recipientId) {
    return res.status(400).json({
      success: false,
      message: "Cannot send message to yourself",
    });
  }

  // Check if users are connected (case insensitive)
  const connection = await Connection.findOne({
    $or: [
      { requester: senderId, recipient: recipientId },
      { requester: recipientId, recipient: senderId },
    ],
    status: { $in: [ConnectionStatus.ACCEPTED, "accepted"] },
  });

  if (!connection) {
    return res.status(403).json({
      success: false,
      message: "You can only send messages to connected users",
    });
  }

  // Create the message
  const message = new Message({
    sender: senderId,
    recipient: recipientId,
    content: content.trim(),
    messageType,
  });

  await message.save();

  // Populate sender and recipient details
  await message.populate([
    { path: "sender", select: "firstName lastName email profilePicture" },
    { path: "recipient", select: "firstName lastName email profilePicture" },
  ]);

  logger.info(`Message sent from ${senderId} to ${recipientId}`);

  return res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: {
      id: message._id,
      sender: {
        id: (message.sender as any)._id,
        firstName: (message.sender as any).firstName,
        lastName: (message.sender as any).lastName,
        email: (message.sender as any).email,
        profilePicture: (message.sender as any).profilePicture,
      },
      recipient: {
        id: (message.recipient as any)._id,
        firstName: (message.recipient as any).firstName,
        lastName: (message.recipient as any).lastName,
        email: (message.recipient as any).email,
        profilePicture: (message.recipient as any).profilePicture,
      },
      content: message.content,
      messageType: message.messageType,
      isRead: message.isRead,
      readAt: message.readAt?.toISOString(),
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    } as MessageResponse,
  });
});

// Get messages between two users
export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const { recipientId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const senderId = req.user?._id;

  if (!senderId) {
    return res.status(401).json({
      success: false,
      message: "User not authenticated",
    });
  }

  if (!recipientId) {
    return res.status(400).json({
      success: false,
      message: "Recipient ID is required",
    });
  }

  // Check if users are connected (case insensitive)
  const connection = await Connection.findOne({
    $or: [
      { requester: senderId, recipient: recipientId },
      { requester: recipientId, recipient: senderId },
    ],
    status: { $in: [ConnectionStatus.ACCEPTED, "accepted"] },
  });

  if (!connection) {
    return res.status(403).json({
      success: false,
      message: "You can only view messages with connected users",
    });
  }

  const messages = await Message.getMessagesBetween(
    senderId,
    recipientId,
    Number(limit),
    Number(page)
  );

  // Mark messages as read for the current user
  await Message.markMessagesAsRead(recipientId, senderId);

  const total = await Message.countDocuments({
    $or: [
      { sender: senderId, recipient: recipientId },
      { sender: recipientId, recipient: senderId },
    ],
  });

  return res.status(200).json({
    success: true,
    data: {
      messages: messages.map((message) => ({
        id: message._id,
        sender: {
          id: (message.sender as any)._id,
          firstName: (message.sender as any).firstName,
          lastName: (message.sender as any).lastName,
          email: (message.sender as any).email,
          profilePicture: (message.sender as any).profilePicture,
        },
        recipient: {
          id: (message.recipient as any)._id,
          firstName: (message.recipient as any).firstName,
          lastName: (message.recipient as any).lastName,
          email: (message.recipient as any).email,
          profilePicture: (message.recipient as any).profilePicture,
        },
        content: message.content,
        messageType: message.messageType,
        isRead: message.isRead,
        readAt: message.readAt?.toISOString(),
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
      })) as MessageResponse[],
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
      },
    },
  });
});

// Get conversations for a user
export const getConversations = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get all connected users (including those without messages)
    const connectedUsers = await Message.getConnectedUsers(userId);

    return res.status(200).json({
      success: true,
      data: connectedUsers,
    });
  }
);

// Mark messages as read
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User not authenticated",
    });
  }

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: "Message not found",
    });
  }

  if (message.recipient.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: "You can only mark your own messages as read",
    });
  }

  message.isRead = true;
  message.readAt = new Date();
  await message.save();

  return res.status(200).json({
    success: true,
    message: "Message marked as read",
  });
});

// Get unread message count
export const getUnreadCount = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const unreadCount = await Message.getUnreadCount(userId);

    return res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  }
);

// Delete a message
export const deleteMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    await Message.findByIdAndDelete(messageId);

    logger.info(`Message ${messageId} deleted by user ${userId}`);

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  }
);

export default {
  sendMessage,
  getMessages,
  getConversations,
  markAsRead,
  getUnreadCount,
  deleteMessage,
};
