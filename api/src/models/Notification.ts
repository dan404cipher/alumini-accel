import mongoose, { Document, Schema, Model } from "mongoose";
import { INotification } from "../types";

// Define the static methods interface
interface NotificationModel extends Model<INotification> {
  getUserNotifications(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      category?: string;
      type?: string;
      isRead?: boolean;
    }
  ): Promise<{
    notifications: INotification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  markAllAsRead(userId: string): Promise<any>;
  getUnreadCount(userId: string): Promise<number>;
  createNotification(data: any): Promise<INotification>;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    type: {
      type: String,
      required: true,
      enum: ["info", "success", "warning", "error"],
      default: "info",
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    actionUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Allow empty
          return /^https?:\/\/.+/.test(v) || v.startsWith("/");
        },
        message: "Action URL must be a valid URL or path",
      },
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    // Additional fields for better organization
    category: {
      type: String,
      enum: [
        "connection",
        "message",
        "job",
        "event",
        "donation",
        "achievement",
        "system",
        "announcement",
        "reminder",
      ],
      default: "system",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    expiresAt: {
      type: Date,
    },
    // Reference to related entity (optional)
    relatedEntity: {
      type: {
        type: String,
        enum: ["user", "job", "event", "message", "connection", "donation"],
      },
      id: {
        type: Schema.Types.ObjectId,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, category: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for expired notifications

// Virtual for formatted time
notificationSchema.virtual("timeAgo").get(function () {
  const now = new Date();
  const diffInSeconds = Math.floor(
    (now.getTime() - this.createdAt.getTime()) / 1000
  );

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return this.createdAt.toLocaleDateString();
});

// Static method to create notification
notificationSchema.statics.createNotification = async function (data: {
  userId: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  category?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  actionUrl?: string;
  metadata?: Record<string, any>;
  relatedEntity?: { type: string; id: string };
  expiresAt?: Date;
}) {
  const notification = new this(data);
  return await notification.save();
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = async function (userId: string) {
  return await this.updateMany({ userId, isRead: false }, { isRead: true });
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function (userId: string) {
  return await this.countDocuments({
    userId,
    isRead: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  });
};

// Static method to get notifications for a user with pagination
notificationSchema.statics.getUserNotifications = async function (
  userId: string,
  options: {
    page?: number;
    limit?: number;
    category?: string;
    type?: string;
    isRead?: boolean;
  } = {}
): Promise<{
  notifications: INotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const { page = 1, limit = 20, category, type, isRead } = options;

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const query: any = {
    userId,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
    createdAt: { $gte: ninetyDaysAgo },
  };

  if (category) query.category = category;
  if (type) query.type = type;
  if (typeof isRead === "boolean") query.isRead = isRead;

  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    this.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    this.countDocuments(query),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const Notification = mongoose.model<INotification, NotificationModel>(
  "Notification",
  notificationSchema
);
