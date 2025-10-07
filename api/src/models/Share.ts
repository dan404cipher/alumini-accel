import mongoose, { Document, Schema, Model } from "mongoose";

export interface IShare extends Document {
  postId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // Optional for anonymous shares
  platform:
    | "internal"
    | "facebook"
    | "twitter"
    | "linkedin"
    | "copy_link"
    | "whatsapp"
    | "telegram";
  metadata?: {
    userAgent?: string;
    referrer?: string;
    ipAddress?: string;
    [key: string]: any;
  };
  createdAt: Date;
}

export interface IShareModel extends Model<IShare> {
  getShareCount(postId: string | mongoose.Types.ObjectId): Promise<number>;
  getShareAnalytics(postId: string | mongoose.Types.ObjectId): Promise<any[]>;
  getRecentShares(
    postId: string | mongoose.Types.ObjectId,
    limit?: number
  ): Promise<IShare[]>;
  trackShare(
    postId: string | mongoose.Types.ObjectId,
    platform: string,
    userId?: string | mongoose.Types.ObjectId,
    metadata?: any
  ): Promise<{ share: IShare; shareCount: number }>;
  getTrendingByShares(
    timeRange?: "day" | "week" | "month",
    limit?: number
  ): Promise<any[]>;
}

const ShareSchema = new Schema<IShare>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "CommunityPost",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    platform: {
      type: String,
      required: true,
      enum: [
        "internal",
        "facebook",
        "twitter",
        "linkedin",
        "copy_link",
        "whatsapp",
        "telegram",
      ],
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for analytics queries
ShareSchema.index({ postId: 1, platform: 1 });
ShareSchema.index({ postId: 1, createdAt: -1 });

// Virtual for user details
ShareSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

// Static method to get share count for a post
ShareSchema.statics.getShareCount = async function (
  postId: string | mongoose.Types.ObjectId
) {
  return await this.countDocuments({ postId });
};

// Static method to get share analytics for a post
ShareSchema.statics.getShareAnalytics = async function (
  postId: string | mongoose.Types.ObjectId
) {
  const pipeline = [
    { $match: { postId: new mongoose.Types.ObjectId(postId) } },
    {
      $group: {
        _id: "$platform",
        count: { $sum: 1 },
        lastShared: { $max: "$createdAt" },
      },
    },
    {
      $project: {
        platform: "$_id",
        count: 1,
        lastShared: 1,
        _id: 0,
      },
    },
    { $sort: { count: -1 as 1 | -1 } },
  ];

  return await this.aggregate(pipeline);
};

// Static method to get recent shares
ShareSchema.statics.getRecentShares = async function (
  postId: string | mongoose.Types.ObjectId,
  limit: number = 10
) {
  return await this.find({ postId })
    .populate("user", "firstName lastName profileImage")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to track a share
ShareSchema.statics.trackShare = async function (
  postId: string | mongoose.Types.ObjectId,
  platform: string,
  userId?: string | mongoose.Types.ObjectId,
  metadata?: any
) {
  const shareData: any = {
    postId,
    platform,
    metadata: metadata || {},
  };

  if (userId) {
    shareData.userId = userId;
  }

  const share = await this.create(shareData);

  // Get updated share count
  const shareCount = await this.countDocuments({ postId });

  return {
    share,
    shareCount,
  };
};

// Static method to get trending posts by shares
ShareSchema.statics.getTrendingByShares = async function (
  timeRange: "day" | "week" | "month" = "week",
  limit: number = 10
) {
  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case "day":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  const pipeline = [
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: "$postId",
        shareCount: { $sum: 1 },
        platforms: { $addToSet: "$platform" },
        lastShared: { $max: "$createdAt" },
      },
    },
    {
      $lookup: {
        from: "communityposts",
        localField: "_id",
        foreignField: "_id",
        as: "post",
      },
    },
    { $unwind: "$post" },
    {
      $project: {
        postId: "$_id",
        shareCount: 1,
        platforms: 1,
        lastShared: 1,
        postTitle: "$post.title",
        postContent: "$post.content",
        postCreatedAt: "$post.createdAt",
      },
    },
    { $sort: { shareCount: -1 as 1 | -1, lastShared: -1 as 1 | -1 } },
    { $limit: limit },
  ];

  return await this.aggregate(pipeline);
};

export default mongoose.model<IShare, IShareModel>("Share", ShareSchema);
