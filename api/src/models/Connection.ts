import mongoose, { Schema, Model } from "mongoose";
import {
  IConnection,
  ConnectionStatus,
  ConnectionType,
} from "@/types/connection";

const connectionSchema = new Schema<IConnection>(
  {
    requester: {
      type: mongoose.Types.ObjectId as any,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Types.ObjectId as any,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ConnectionStatus),
      default: ConnectionStatus.PENDING,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(ConnectionType),
      default: ConnectionType.CONNECTION,
      required: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    acceptedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    blockedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });
connectionSchema.index({ requester: 1, status: 1 });
connectionSchema.index({ recipient: 1, status: 1 });
connectionSchema.index({ status: 1 });
connectionSchema.index({ type: 1 });
connectionSchema.index({ createdAt: -1 });

// Virtual for requester user
connectionSchema.virtual("requesterUser", {
  ref: "User",
  localField: "requester",
  foreignField: "_id",
  justOne: true,
});

// Virtual for recipient user
connectionSchema.virtual("recipientUser", {
  ref: "User",
  localField: "recipient",
  foreignField: "_id",
  justOne: true,
});

// Instance method to accept connection
connectionSchema.methods.accept = function () {
  this.status = ConnectionStatus.ACCEPTED;
  this.acceptedAt = new Date();
  return this.save();
};

// Instance method to reject connection
connectionSchema.methods.reject = function () {
  this.status = ConnectionStatus.REJECTED;
  this.rejectedAt = new Date();
  return this.save();
};

// Instance method to block connection
connectionSchema.methods.block = function () {
  this.status = ConnectionStatus.BLOCKED;
  this.blockedAt = new Date();
  return this.save();
};

// Instance method to cancel connection
connectionSchema.methods.cancel = function () {
  this.status = ConnectionStatus.CANCELLED;
  return this.save();
};

// Static method to find connections for a user
connectionSchema.statics.findUserConnections = function (
  userId: string,
  status?: ConnectionStatus
) {
  const query: any = {
    $or: [{ requester: userId }, { recipient: userId }],
  };

  if (status) {
    query.status = status;
  }

  return this.find(query)
    .populate("requesterUser", "firstName lastName email profilePicture role")
    .populate("recipientUser", "firstName lastName email profilePicture role")
    .sort({ createdAt: -1 });
};

// Static method to find pending requests for a user
connectionSchema.statics.findPendingRequests = function (userId: string) {
  return this.find({
    recipient: userId,
    status: ConnectionStatus.PENDING,
  })
    .populate("requesterUser", "firstName lastName email profilePicture role")
    .sort({ createdAt: -1 });
};

// Static method to find sent requests by a user
connectionSchema.statics.findSentRequests = function (userId: string) {
  return this.find({
    requester: userId,
    status: ConnectionStatus.PENDING,
  })
    .populate("recipientUser", "firstName lastName email profilePicture role")
    .sort({ createdAt: -1 });
};

// Static method to check if connection exists between two users
connectionSchema.statics.findConnectionBetween = function (
  userId1: string,
  userId2: string
) {
  console.log("findConnectionBetween called with:", { userId1, userId2 });
  const query = {
    $or: [
      { requester: userId1, recipient: userId2 },
      { requester: userId2, recipient: userId1 },
    ],
  };
  console.log("Query:", JSON.stringify(query, null, 2));
  return this.findOne(query);
};

// Static method to get connection statistics for a user
connectionSchema.statics.getConnectionStats = async function (userId: string) {
  const stats = await this.aggregate([
    {
      $match: {
        $or: [
          { requester: new mongoose.Types.ObjectId(userId) },
          { recipient: new mongoose.Types.ObjectId(userId) },
        ],
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    totalConnections: 0,
    pendingRequests: 0,
    sentRequests: 0,
    receivedRequests: 0,
    blockedUsers: 0,
  };

  stats.forEach((stat) => {
    switch (stat._id) {
      case ConnectionStatus.ACCEPTED:
        result.totalConnections = stat.count;
        break;
      case ConnectionStatus.PENDING:
        result.pendingRequests = stat.count;
        break;
      case ConnectionStatus.BLOCKED:
        result.blockedUsers = stat.count;
        break;
    }
  });

  // Get sent requests count
  const sentRequests = await this.countDocuments({
    requester: userId,
    status: ConnectionStatus.PENDING,
  });
  result.sentRequests = sentRequests;

  // Get received requests count
  const receivedRequests = await this.countDocuments({
    recipient: userId,
    status: ConnectionStatus.PENDING,
  });
  result.receivedRequests = receivedRequests;

  return result;
};

// Ensure virtual fields are serialized
connectionSchema.set("toJSON", { virtuals: true });

// Define interface for static methods
interface IConnectionModel extends Model<IConnection> {
  findUserConnections(
    userId: string,
    status?: ConnectionStatus
  ): Promise<IConnection[]>;
  findPendingRequests(userId: string): Promise<IConnection[]>;
  findSentRequests(userId: string): Promise<IConnection[]>;
  findConnectionBetween(
    userId1: string,
    userId2: string
  ): Promise<IConnection | null>;
  getConnectionStats(userId: string): Promise<any>;
}

export default mongoose.model<IConnection, IConnectionModel>(
  "Connection",
  connectionSchema
);
