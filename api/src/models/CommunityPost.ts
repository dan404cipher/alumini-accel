import mongoose, { Document, Schema } from "mongoose";

export interface ICommunityPost extends Document {
  communityId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  type: "text" | "image" | "video" | "poll" | "announcement";
  priority?: "high" | "medium" | "low";
  category?: string;
  mediaUrls?: string[];
  pollOptions?: {
    option: string;
    votes: mongoose.Types.ObjectId[];
  }[];
  pollEndDate?: Date;
  likes: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  shares: mongoose.Types.ObjectId[];
  status: "pending" | "approved" | "rejected" | "deleted";
  isPinned: boolean;
  isAnnouncement: boolean;
  tags: string[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    communityId: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      maxlength: [100, "Post title cannot exceed 100 characters"],
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
      trim: true,
      maxlength: [2000, "Post content cannot exceed 2000 characters"],
    },
    type: {
      type: String,
      enum: ["text", "image", "video", "poll", "announcement"],
      default: "text",
      required: true,
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    category: {
      type: String,
      trim: true,
      maxlength: [50, "Category cannot exceed 50 characters"],
    },
    mediaUrls: [
      {
        type: String,
        validate: {
          validator: function (v: string) {
            return /^https?:\/\/.+\.(jpg|jpeg|png|gif|mp4|mov|avi)$/i.test(v);
          },
          message: "Invalid media URL format",
        },
      },
    ],
    pollOptions: [
      {
        option: {
          type: String,
          required: true,
          trim: true,
          maxlength: [100, "Poll option cannot exceed 100 characters"],
        },
        votes: [
          {
            type: Schema.Types.ObjectId,
            ref: "User",
          },
        ],
      },
    ],
    pollEndDate: {
      type: Date,
      validate: {
        validator: function (v: Date) {
          return !v || v > new Date();
        },
        message: "Poll end date must be in the future",
      },
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "CommunityComment",
      },
    ],
    shares: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "deleted"],
      default: "approved",
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isAnnouncement: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
CommunityPostSchema.index({ communityId: 1, createdAt: -1 });
CommunityPostSchema.index({ authorId: 1 });
CommunityPostSchema.index({ status: 1 });
CommunityPostSchema.index({ isPinned: 1 });
CommunityPostSchema.index({ isAnnouncement: 1 });
CommunityPostSchema.index({ tags: 1 });
CommunityPostSchema.index({ type: 1 });

// Virtual for like count
CommunityPostSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

// Virtual for comment count
CommunityPostSchema.virtual("commentCount").get(function () {
  return this.comments.length;
});

// Virtual for share count
CommunityPostSchema.virtual("shareCount").get(function () {
  return this.shares.length;
});

// Virtual for poll total votes
CommunityPostSchema.virtual("pollTotalVotes").get(function () {
  if (this.type !== "poll") return 0;
  return (
    this.pollOptions?.reduce(
      (total, option) => total + option.votes.length,
      0
    ) || 0
  );
});

// Pre-save middleware to validate poll
CommunityPostSchema.pre("save", function (next) {
  if (this.type === "poll") {
    if (!this.pollOptions || this.pollOptions.length < 2) {
      return next(new Error("Poll must have at least 2 options"));
    }
    if (this.pollOptions.length > 10) {
      return next(new Error("Poll cannot have more than 10 options"));
    }
  }
  next();
});

// Static method to find posts by community
CommunityPostSchema.statics.findByCommunity = function (
  communityId: string,
  options: any = {}
) {
  const query: any = {
    communityId,
    status: { $in: ["approved", "pending"] },
  };

  if (options.type) {
    query.type = options.type;
  }

  if (options.authorId) {
    query.authorId = options.authorId;
  }

  if (options.category) {
    query.category = options.category;
  }

  return this.find(query)
    .populate({
      path: "authorId",
      select: "firstName lastName profilePicture",
      transform: function (doc: any) {
        return doc
          ? {
              _id: doc._id,
              firstName: doc.firstName,
              lastName: doc.lastName,
              profilePicture: doc.profilePicture,
            }
          : null;
      },
    })
    .populate("likes", "firstName lastName")
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0)
    .lean()
    .then((posts: any[]) =>
      posts.map((post: any) => ({
        ...post,
        author: post.authorId,
      }))
    );
};

// Static method to find pinned posts
CommunityPostSchema.statics.findPinnedPosts = function (communityId: string) {
  return this.find({
    communityId,
    isPinned: true,
    status: "approved",
  })
    .populate("authorId", "firstName lastName profileImage")
    .sort({ createdAt: -1 });
};

// Static method to find announcements
CommunityPostSchema.statics.findAnnouncements = function (communityId: string) {
  return this.find({
    communityId,
    isAnnouncement: true,
    status: "approved",
  })
    .populate("authorId", "firstName lastName profileImage")
    .sort({ createdAt: -1 });
};

// Instance method to like post
CommunityPostSchema.methods.likePost = function (userId: string) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
  }
  return this;
};

// Instance method to unlike post
CommunityPostSchema.methods.unlikePost = function (userId: string) {
  this.likes = this.likes.filter(
    (id: mongoose.Types.ObjectId) => id.toString() !== userId
  );
  return this;
};

// Instance method to vote on poll
CommunityPostSchema.methods.votePoll = function (
  userId: string,
  optionIndex: number
) {
  if (this.type !== "poll") {
    throw new Error("This post is not a poll");
  }

  if (this.pollEndDate && this.pollEndDate < new Date()) {
    throw new Error("Poll has ended");
  }

  // Remove existing vote
  this.pollOptions.forEach((option: any) => {
    option.votes = option.votes.filter(
      (id: mongoose.Types.ObjectId) => id.toString() !== userId
    );
  });

  // Add new vote
  if (optionIndex >= 0 && optionIndex < this.pollOptions.length) {
    this.pollOptions[optionIndex].votes.push(userId);
  }

  return this;
};

// Instance method to pin post
CommunityPostSchema.methods.pinPost = function () {
  this.isPinned = true;
  return this;
};

// Instance method to unpin post
CommunityPostSchema.methods.unpinPost = function () {
  this.isPinned = false;
  return this;
};

// Instance method to approve post
CommunityPostSchema.methods.approvePost = function () {
  this.status = "approved";
  return this;
};

// Instance method to reject post
CommunityPostSchema.methods.rejectPost = function () {
  this.status = "rejected";
  return this;
};

export default mongoose.model<ICommunityPost>(
  "CommunityPost",
  CommunityPostSchema
);
