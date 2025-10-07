import mongoose, { Schema, Model } from "mongoose";
import { IMessage, MessageType } from "../types/message";

const messageSchema = new Schema<IMessage>(
  {
    sender: {
      type: mongoose.Types.ObjectId as any,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Types.ObjectId as any,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, "Message content cannot exceed 1000 characters"],
    },
    messageType: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, isRead: 1 });
messageSchema.index({ createdAt: -1 });

// Instance method to mark message as read
messageSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get messages between two users
messageSchema.statics.getMessagesBetween = function (
  userId1: string,
  userId2: string,
  limit: number = 50,
  page: number = 1
) {
  return this.find({
    $or: [
      { sender: userId1, recipient: userId2 },
      { sender: userId2, recipient: userId1 },
    ],
  })
    .populate("sender", "firstName lastName email profilePicture")
    .populate("recipient", "firstName lastName email profilePicture")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);
};

// Static method to get conversations for a user
messageSchema.statics.getConversations = function (userId: string) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { sender: new mongoose.Types.ObjectId(userId) },
          { recipient: new mongoose.Types.ObjectId(userId) },
        ],
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
            "$recipient",
            "$sender",
          ],
        },
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$recipient", new mongoose.Types.ObjectId(userId)] },
                  { $eq: ["$isRead", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        user: {
          id: "$user._id",
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          email: "$user.email",
          profilePicture: "$user.profilePicture",
        },
        lastMessage: {
          content: "$lastMessage.content",
          createdAt: "$lastMessage.createdAt",
          isRead: "$lastMessage.isRead",
        },
        unreadCount: 1,
      },
    },
    {
      $sort: { "lastMessage.createdAt": -1 },
    },
  ]);
};

// Static method to mark messages as read
messageSchema.statics.markMessagesAsRead = function (
  senderId: string,
  recipientId: string
) {
  return this.updateMany(
    {
      sender: senderId,
      recipient: recipientId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );
};

// Static method to get unread message count
messageSchema.statics.getUnreadCount = function (userId: string) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
  });
};

// Static method to get all connected users (including those without messages)
messageSchema.statics.getConnectedUsers = async function (userId: string) {
  try {
    // First, get all accepted connections for this user (case insensitive)
    const connections = await mongoose
      .model("Connection")
      .find({
        status: { $in: ["ACCEPTED", "accepted"] },
        $or: [
          { requester: new mongoose.Types.ObjectId(userId) },
          { recipient: new mongoose.Types.ObjectId(userId) },
        ],
      })
      .populate("requester", "firstName lastName email profilePicture")
      .populate("recipient", "firstName lastName email profilePicture");

    const connectedUsers = [];

    for (const connection of connections) {
      // Determine the other user (not the current user)
      const otherUser =
        connection.requester._id.toString() === userId.toString()
          ? connection.recipient
          : connection.requester;

      // Skip if this is the current user (shouldn't happen but safety check)
      if (otherUser._id.toString() === userId.toString()) {
        continue;
      }

      // Get the last message between these users
      const lastMessage = await this.findOne({
        $or: [
          { sender: userId, recipient: otherUser._id },
          { sender: otherUser._id, recipient: userId },
        ],
      }).sort({ createdAt: -1 });

      // Count unread messages from the other user
      const unreadCount = await this.countDocuments({
        sender: otherUser._id,
        recipient: userId,
        isRead: false,
      });

      connectedUsers.push({
        user: {
          id: otherUser._id,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          email: otherUser.email,
          profilePicture: otherUser.profilePicture,
        },
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              isRead: lastMessage.isRead,
            }
          : null,
        unreadCount: unreadCount,
      });
    }

    // Sort by last message date (newest first) or by name
    connectedUsers.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return (
          new Date(b.lastMessage.createdAt).getTime() -
          new Date(a.lastMessage.createdAt).getTime()
        );
      } else if (a.lastMessage && !b.lastMessage) {
        return -1;
      } else if (!a.lastMessage && b.lastMessage) {
        return 1;
      } else {
        return a.user.firstName.localeCompare(b.user.firstName);
      }
    });

    return connectedUsers;
  } catch (error) {
    console.error("Error in getConnectedUsers:", error);
    throw error;
  }
};

// Interface for Message model
export interface IMessageModel extends Model<IMessage> {
  getMessagesBetween(
    userId1: string,
    userId2: string,
    limit?: number,
    page?: number
  ): Promise<IMessage[]>;
  getConversations(userId: string): Promise<any[]>;
  getConnectedUsers(userId: string): Promise<any[]>;
  markMessagesAsRead(senderId: string, recipientId: string): Promise<any>;
  getUnreadCount(userId: string): Promise<number>;
}

export default mongoose.model<IMessage, IMessageModel>(
  "Message",
  messageSchema
);
