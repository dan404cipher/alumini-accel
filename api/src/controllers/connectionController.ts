import { Request, Response } from "express";
import Connection from "../models/Connection";
import { ConnectionStatus, ConnectionType } from "../types/connection";
import { logger } from "../utils/logger";
import { AppError } from "../middleware/errorHandler";

// Send connection request
export const sendConnectionRequest = async (req: Request, res: Response) => {
  try {
    const { recipientId, type, message } = req.body;
    const requesterId = req.user?._id;

    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (requesterId === recipientId) {
      return res.status(400).json({
        success: false,
        message: "Cannot send connection request to yourself",
      });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findConnectionBetween(
      requesterId,
      recipientId
    );

    if (existingConnection) {
      logger.info(`Found existing connection:`, {
        connectionId: existingConnection._id,
        status: existingConnection.status,
        requester: existingConnection.requester,
        recipient: existingConnection.recipient,
        requesterId,
        recipientId,
      });

      // Allow new requests if the existing connection is cancelled or rejected
      if (
        existingConnection.status === ConnectionStatus.CANCELLED ||
        existingConnection.status === ConnectionStatus.REJECTED
      ) {
        // Delete the old connection to allow a new one
        await Connection.findByIdAndDelete(existingConnection._id);
        logger.info(
          `Deleted ${existingConnection.status} connection between ${requesterId} and ${recipientId} to allow new request`
        );
      } else {
        logger.info(
          `Blocking new request due to existing ${existingConnection.status} connection`
        );
        return res.status(400).json({
          success: false,
          message: `Connection already exists with status: ${existingConnection.status}`,
        });
      }
    }

    // Create new connection request
    const connection = new Connection({
      requester: requesterId,
      recipient: recipientId,
      type: type || ConnectionType.CONNECTION,
      message: message?.trim(),
    });

    await connection.save();

    // Populate user details
    await connection.populate([
      {
        path: "requesterUser",
        select: "firstName lastName email profilePicture role",
      },
      {
        path: "recipientUser",
        select: "firstName lastName email profilePicture role",
      },
    ]);

    logger.info(
      `Connection request sent from ${requesterId} to ${recipientId}`
    );

    return res.status(201).json({
      success: true,
      message: "Connection request sent successfully",
      data: connection,
    });
  } catch (error) {
    logger.error("Error sending connection request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send connection request",
    });
  }
};

// Accept connection request
export const acceptConnection = async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found",
      });
    }

    if (connection.recipient.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only accept requests sent to you",
      });
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: "Connection request is not pending",
      });
    }

    await connection.accept();

    // Populate user details
    await connection.populate([
      {
        path: "requesterUser",
        select: "firstName lastName email profilePicture role",
      },
      {
        path: "recipientUser",
        select: "firstName lastName email profilePicture role",
      },
    ]);

    logger.info(`Connection request ${connectionId} accepted by ${userId}`);

    return res.status(200).json({
      success: true,
      message: "Connection request accepted successfully",
      data: connection,
    });
  } catch (error) {
    logger.error("Error accepting connection request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to accept connection request",
    });
  }
};

// Reject connection request
export const rejectConnection = async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found",
      });
    }

    if (connection.recipient.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only reject requests sent to you",
      });
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: "Connection request is not pending",
      });
    }

    await connection.reject();

    logger.info(`Connection request ${connectionId} rejected by ${userId}`);

    return res.status(200).json({
      success: true,
      message: "Connection request rejected successfully",
      data: connection,
    });
  } catch (error) {
    logger.error("Error rejecting connection request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject connection request",
    });
  }
};

// Block user
export const blockUser = async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    // Check if user is either requester or recipient
    if (
      connection.requester.toString() !== userId.toString() &&
      connection.recipient.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only block users you have connections with",
      });
    }

    await connection.block(userId);

    logger.info(`User ${userId} blocked connection ${connectionId}`);

    return res.status(200).json({
      success: true,
      message: "User blocked successfully",
      data: connection,
    });
  } catch (error) {
    logger.error("Error blocking user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to block user",
    });
  }
};

// Cancel connection request
export const cancelConnection = async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found",
      });
    }

    if (connection.requester.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel requests you sent",
      });
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: "Connection request is not pending",
      });
    }

    await connection.cancel();

    logger.info(`Connection request ${connectionId} cancelled by ${userId}`);

    return res.status(200).json({
      success: true,
      message: "Connection request cancelled successfully",
      data: connection,
    });
  } catch (error) {
    logger.error("Error cancelling connection request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel connection request",
    });
  }
};

// Get user connections
export const getUserConnections = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { status, type, page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const query: any = {
      $or: [{ requester: userId }, { recipient: userId }],
    };

    if (status) {
      query.status = status;

      // For blocked status, only show connections blocked by the current user
      if (status === "blocked") {
        query.blockedBy = userId;
      }
    }

    if (type) {
      query.type = type;
    }

    const connections = await Connection.find(query)
      .populate(
        "requester",
        "firstName lastName email profilePicture role bio location university"
      )
      .populate(
        "recipient",
        "firstName lastName email profilePicture role bio location university"
      )
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Connection.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        connections,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching user connections:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch connections",
    });
  }
};

// Get pending requests
export const getPendingRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const requests = await Connection.findPendingRequests(userId);

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    logger.error("Error fetching pending requests:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending requests",
    });
  }
};

// Get sent requests
export const getSentRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const requests = await Connection.findSentRequests(userId);

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    logger.error("Error fetching sent requests:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sent requests",
    });
  }
};

// Get connection statistics
export const getConnectionStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const stats = await Connection.getConnectionStats(userId);

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error fetching connection statistics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch connection statistics",
    });
  }
};

// Check connection status between two users
export const checkConnectionStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (currentUserId === userId) {
      return res.status(400).json({
        success: false,
        message: "Cannot check connection status with yourself",
      });
    }

    const connection = await Connection.findConnectionBetween(
      currentUserId,
      userId
    );

    logger.info(`Connection check between ${currentUserId} and ${userId}:`, {
      connectionExists: !!connection,
      connectionStatus: connection?.status,
      connectionId: connection?._id,
      requesterId: connection?.requester,
      recipientId: connection?.recipient,
    });

    // Also log the raw query for debugging
    const rawQuery = await Connection.find({
      $or: [
        { requester: currentUserId, recipient: userId },
        { requester: userId, recipient: currentUserId },
      ],
    });
    logger.info(`Raw query result:`, rawQuery);

    return res.status(200).json({
      success: true,
      data: {
        exists: !!connection,
        connection: connection || null,
      },
    });
  } catch (error) {
    logger.error("Error checking connection status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check connection status",
    });
  }
};

// Unblock user
export const unblockUser = async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    // Only the user who blocked can unblock
    if (connection.blockedBy?.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the user who blocked can unblock",
      });
    }

    if (connection.status !== ConnectionStatus.BLOCKED) {
      return res.status(400).json({
        success: false,
        message: "User is not blocked",
      });
    }

    // Restore the connection to its previous status
    await connection.unblock();

    logger.info(`User ${userId} unblocked connection ${connectionId}`);

    return res.status(200).json({
      success: true,
      message: "User unblocked successfully",
    });
  } catch (error) {
    logger.error("Error unblocking user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to unblock user",
    });
  }
};

// Remove connection (unfriend)
export const removeConnection = async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    // Check if user is either requester or recipient
    if (
      connection.requester.toString() !== userId.toString() &&
      connection.recipient.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only remove your own connections",
      });
    }

    if (connection.status !== ConnectionStatus.ACCEPTED) {
      return res.status(400).json({
        success: false,
        message: "Can only remove accepted connections",
      });
    }

    await Connection.findByIdAndDelete(connectionId);

    logger.info(`Connection ${connectionId} removed by ${userId}`);

    return res.status(200).json({
      success: true,
      message: "Connection removed successfully",
    });
  } catch (error) {
    logger.error("Error removing connection:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove connection",
    });
  }
};
