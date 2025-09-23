import mongoose, { Document, Schema } from "mongoose";

export interface ICommunityComment extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  parentComment?: mongoose.Types.ObjectId; // For threaded replies
  likes: mongoose.Types.ObjectId[];
  replies: mongoose.Types.ObjectId[];
  mentions: mongoose.Types.ObjectId[]; // Tagged users
  isActive: boolean;
  tenantId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const communityCommentSchema = new Schema<ICommunityComment>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "CommunityPost",
      required: true,
    },
    parentComment: {
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
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
communityCommentSchema.index({ post: 1, createdAt: 1 });
communityCommentSchema.index({ author: 1 });
communityCommentSchema.index({ parentComment: 1 });
communityCommentSchema.index({ tenantId: 1 });
communityCommentSchema.index({ isActive: 1 });

// Instance methods
communityCommentSchema.methods.like = function (
  userId: mongoose.Types.ObjectId
): boolean {
  const index = this.likes.findIndex((id: mongoose.Types.ObjectId) =>
    id.equals(userId)
  );
  if (index === -1) {
    this.likes.push(userId);
    return true; // Liked
  } else {
    this.likes.splice(index, 1);
    return false; // Unliked
  }
};

communityCommentSchema.methods.isLikedBy = function (
  userId: mongoose.Types.ObjectId
): boolean {
  return this.likes.some((id: mongoose.Types.ObjectId) => id.equals(userId));
};

communityCommentSchema.methods.addReply = function (
  replyId: mongoose.Types.ObjectId
): void {
  if (!this.replies.some((id: mongoose.Types.ObjectId) => id.equals(replyId))) {
    this.replies.push(replyId);
  }
};

// Pre-save middleware to extract mentions from content
communityCommentSchema.pre("save", function (next) {
  // Extract @mentions from content (simple regex for @username)
  const mentionRegex = /@(\w+)/g;
  const matches = this.content.match(mentionRegex);

  if (matches) {
    // In a real implementation, you'd look up users by username
    // For now, we'll just store the extracted usernames
    // this.mentions = matches.map(match => match.substring(1));
  }

  next();
});

export default mongoose.model<ICommunityComment>(
  "CommunityComment",
  communityCommentSchema
);
