import mongoose, { Document, Schema, Model } from "mongoose";

export interface ILike extends Document {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ILikeModel extends Model<ILike> {
  getLikeCount(postId: string | mongoose.Types.ObjectId): Promise<number>;
  hasUserLiked(
    postId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId
  ): Promise<boolean>;
  getLikesWithUsers(
    postId: string | mongoose.Types.ObjectId,
    limit?: number,
    skip?: number
  ): Promise<ILike[]>;
  toggleLike(
    postId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId
  ): Promise<{ liked: boolean; likeCount: number }>;
}

const LikeSchema = new Schema<ILike>(
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
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to ensure one like per user per post
LikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

// Virtual for user details
LikeSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

// Static method to get like count for a post
LikeSchema.statics.getLikeCount = async function (
  postId: string | mongoose.Types.ObjectId
) {
  return await this.countDocuments({ postId });
};

// Static method to check if user liked a post
LikeSchema.statics.hasUserLiked = async function (
  postId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId
) {
  return await this.exists({ postId, userId });
};

// Static method to get likes with user details
LikeSchema.statics.getLikesWithUsers = async function (
  postId: string | mongoose.Types.ObjectId,
  limit: number = 10,
  skip: number = 0
) {
  return await this.find({ postId })
    .populate("user", "firstName lastName profileImage")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

// Static method to toggle like
LikeSchema.statics.toggleLike = async function (
  postId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId
) {
  const existingLike = await this.findOne({ postId, userId });

  if (existingLike) {
    await this.deleteOne({ _id: existingLike._id });
    return { liked: false, likeCount: await this.countDocuments({ postId }) };
  } else {
    await this.create({ postId, userId });
    return { liked: true, likeCount: await this.countDocuments({ postId }) };
  }
};

export default mongoose.model<ILike, ILikeModel>("Like", LikeSchema);
