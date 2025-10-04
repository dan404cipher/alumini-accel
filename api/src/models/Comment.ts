import mongoose, { Document, Schema, Model } from "mongoose";

export interface IComment extends Document {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  parentCommentId?: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  toggleLike(
    userId: string | mongoose.Types.ObjectId
  ): Promise<{ liked: boolean; likeCount: number }>;
  softDelete(): Promise<void>;
}

export interface ICommentModel extends Model<IComment> {
  getCommentsForPost(
    postId: string | mongoose.Types.ObjectId,
    page?: number,
    limit?: number,
    includeReplies?: boolean
  ): Promise<IComment[]>;
  getReplies(
    parentCommentId: string | mongoose.Types.ObjectId,
    page?: number,
    limit?: number
  ): Promise<IComment[]>;
  getCommentCount(postId: string | mongoose.Types.ObjectId): Promise<number>;
}

const CommentSchema = new Schema<IComment>(
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
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
CommentSchema.index({ postId: 1, createdAt: -1 });
CommentSchema.index({ parentCommentId: 1, createdAt: 1 });
CommentSchema.index({ userId: 1 });

// Virtual for user details
CommentSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for replies
CommentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentCommentId",
});

// Virtual for replies count
CommentSchema.virtual("repliesCount", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentCommentId",
  count: true,
});

// Virtual for like count
CommentSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

// Static method to get comments for a post with pagination
CommentSchema.statics.getCommentsForPost = async function (
  postId: string | mongoose.Types.ObjectId,
  page: number = 1,
  limit: number = 10,
  includeReplies: boolean = true
) {
  const skip = (page - 1) * limit;

  const query: any = {
    postId,
    isDeleted: false,
    parentCommentId: includeReplies ? null : { $exists: true, $ne: null },
  };

  const comments = await this.find(query)
    .populate("user", "firstName lastName profileImage")
    .populate({
      path: "replies",
      match: { isDeleted: false },
      options: { sort: { createdAt: 1 }, limit: 3 },
      populate: {
        path: "user",
        select: "firstName lastName profileImage",
      },
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  return comments;
};

// Static method to get replies for a comment
CommentSchema.statics.getReplies = async function (
  parentCommentId: string | mongoose.Types.ObjectId,
  page: number = 1,
  limit: number = 5
) {
  const skip = (page - 1) * limit;

  return await this.find({
    parentCommentId,
    isDeleted: false,
  })
    .populate("user", "firstName lastName profileImage")
    .sort({ createdAt: 1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

// Static method to get comment count for a post
CommentSchema.statics.getCommentCount = async function (
  postId: string | mongoose.Types.ObjectId
) {
  return await this.countDocuments({
    postId,
    isDeleted: false,
    parentCommentId: null, // Only count top-level comments
  });
};

// Instance method to toggle like on comment
CommentSchema.methods.toggleLike = async function (
  userId: string | mongoose.Types.ObjectId
) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const likeIndex = this.likes.indexOf(userObjectId);

  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
  } else {
    this.likes.push(userObjectId);
  }

  await this.save();
  return { liked: likeIndex === -1, likeCount: this.likes.length };
};

// Instance method to soft delete comment
CommentSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.content = "[This comment has been deleted]";
  await this.save();
};

// Pre-save middleware to set isEdited flag
CommentSchema.pre("save", function (next) {
  if (this.isModified("content") && !this.isNew) {
    this.isEdited = true;
  }
  next();
});

export default mongoose.model<IComment, ICommentModel>(
  "Comment",
  CommentSchema
);
