import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { getSocketService } from "../services/socketServiceInstance";

// Test endpoint to manually trigger socket events
export const testSocketMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const { conversationId, message } = req.body;

    if (!conversationId || !message) {
      return res.status(400).json({
        success: false,
        message: "conversationId and message are required",
      });
    }

    logger.info(
      `🧪 Testing socket message emission to conversation: ${conversationId}`
    );

    try {
      const socketService = getSocketService();
      const testMessage = {
        id: `test_${Date.now()}`,
        conversationId: conversationId,
        sender: {
          _id: "test_sender",
          firstName: "Test",
          lastName: "Sender",
          email: "test@example.com",
        },
        recipient: {
          _id: "test_recipient",
          firstName: "Test",
          lastName: "Recipient",
          email: "recipient@example.com",
        },
        content: message,
        messageType: "text",
        isRead: false,
        createdAt: new Date(),
        replyTo: null,
      };

      socketService.emitNewMessage(testMessage);

      return res.json({
        success: true,
        message: "Test message emitted",
        data: testMessage,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Socket service not available",
      });
    }
  }
);

// Test endpoint to check socket room status
export const checkSocketRooms = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const socketService = getSocketService();
      const rooms = Array.from(socketService["io"].sockets.adapter.rooms.keys())
        .filter((room) => room.startsWith("conversation:"))
        .map((room) => ({
          roomName: room,
          userCount:
            socketService["io"].sockets.adapter.rooms.get(room)?.size || 0,
        }));

      return res.json({
        success: true,
        message: "Socket rooms status",
        data: {
          totalRooms: rooms.length,
          rooms: rooms,
        },
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Socket service not available",
      });
    }
  }
);
