import mongoose, { Document, Schema } from "mongoose";

export interface ICommunityComment extends Document {
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  parentCommentId?: mongoose.Types.ObjectId; // For nested comments/replies
  likes: mongoose.Types.ObjectId[];
  replies: mongoose.Types.ObjectId[];
  status: "approved" | "pending" | "rejected" | "deleted";
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommunityCommentSchema = new Schema<ICommunityComment>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "CommunityPost",
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      maxlength: [500, "Comment content cannot exceed 500 characters"],
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "CommunityComment",
      default: null,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    replies: [
      {
        type: Schema.Types.ObjectId,
        ref: "CommunityComment",
      },
    ],
    status: {
      type: String,
      enum: ["approved", "pending", "rejected", "deleted"],
      default: "approved",
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
CommunityCommentSchema.index({ postId: 1, createdAt: 1 });
CommunityCommentSchema.index({ authorId: 1 });
CommunityCommentSchema.index({ parentCommentId: 1 });
CommunityCommentSchema.index({ status: 1 });

// Virtual for like count
CommunityCommentSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

// Virtual for reply count
CommunityCommentSchema.virtual("replyCount").get(function () {
  return this.replies.length;
});

// Pre-save middleware to set editedAt when content changes
CommunityCommentSchema.pre("save", function (next) {
  if (this.isModified("content") && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

// Static method to find comments by post
CommunityCommentSchema.statics.findByPost = function (
  postId: string,
  options: any = {}
) {
  const query = {
    postId,
    parentCommentId: null, // Only top-level comments
    status: "approved",
  };

  return this.find(query)
    .populate("authorId", "firstName lastName profileImage")
    .populate("likes", "firstName lastName")
    .populate({
      path: "replies",
      populate: {
        path: "authorId",
        select: "firstName lastName profileImage",
      },
    })
    .sort({ createdAt: 1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to find replies to a comment
CommunityCommentSchema.statics.findReplies = function (
  parentCommentId: string
) {
  return this.find({
    parentCommentId,
    status: "approved",
  })
    .populate("authorId", "firstName lastName profileImage")
    .populate("likes", "firstName lastName")
    .sort({ createdAt: 1 });
};

// Instance method to like comment
CommunityCommentSchema.methods.likeComment = function (userId: string) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
  }
  return this;
};

// Instance method to unlike comment
CommunityCommentSchema.methods.unlikeComment = function (userId: string) {
  this.likes = this.likes.filter(
    (id: mongoose.Types.ObjectId) => id.toString() !== userId
  );
  return this;
};

// Instance method to add reply
CommunityCommentSchema.methods.addReply = function (replyId: string) {
  if (!this.replies.includes(replyId)) {
    this.replies.push(replyId);
  }
  return this;
};

// Instance method to approve comment
CommunityCommentSchema.methods.approveComment = function () {
  this.status = "approved";
  return this;
};

// Instance method to reject comment
CommunityCommentSchema.methods.rejectComment = function () {
  this.status = "rejected";
  return this;
};

// Instance method to delete comment
CommunityCommentSchema.methods.deleteComment = function () {
  this.status = "deleted";
  return this;
};

export default mongoose.model<ICommunityComment>(
  "CommunityComment",
  CommunityCommentSchema
);
