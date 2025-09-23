import mongoose, { Document, Schema } from "mongoose";

export interface ICommunityPost extends Document {
  title?: string;
  content: string;
  type: "text" | "image" | "file" | "link" | "poll" | "event";
  attachments?: {
    type: "image" | "file" | "link";
    url: string;
    filename?: string;
    size?: number;
  }[];
  poll?: {
    question: string;
    options: {
      text: string;
      votes: mongoose.Types.ObjectId[];
    }[];
    expiresAt?: Date;
    allowMultiple: boolean;
  };
  event?: {
    title: string;
    description: string;
    startDate: Date;
    endDate?: Date;
    location?: string;
    isOnline: boolean;
    maxAttendees?: number;
    attendees: mongoose.Types.ObjectId[];
  };
  author: mongoose.Types.ObjectId;
  community: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  shares: mongoose.Types.ObjectId[];
  tags: string[];
  isPinned: boolean;
  isAnnouncement: boolean;
  isActive: boolean;
  tenantId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const communityPostSchema = new Schema<ICommunityPost>(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["text", "image", "file", "link", "poll", "event"],
      default: "text",
    },
    attachments: [
      {
        type: {
          type: String,
          enum: ["image", "file", "link"],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        filename: String,
        size: Number,
      },
    ],
    poll: {
      question: {
        type: String,
        required: function () {
          return this.type === "poll";
        },
      },
      options: [
        {
          text: {
            type: String,
            required: true,
            trim: true,
          },
          votes: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
            },
          ],
        },
      ],
      expiresAt: Date,
      allowMultiple: {
        type: Boolean,
        default: false,
      },
    },
    event: {
      title: {
        type: String,
        required: function () {
          return this.type === "event";
        },
        trim: true,
      },
      description: {
        type: String,
        required: function () {
          return this.type === "event";
        },
        trim: true,
      },
      startDate: {
        type: Date,
        required: function () {
          return this.type === "event";
        },
      },
      endDate: Date,
      location: String,
      isOnline: {
        type: Boolean,
        default: false,
      },
      maxAttendees: Number,
      attendees: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
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
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
    isAnnouncement: {
      type: Boolean,
      default: false,
    },
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
communityPostSchema.index({ community: 1, createdAt: -1 });
communityPostSchema.index({ author: 1 });
communityPostSchema.index({ tenantId: 1 });
communityPostSchema.index({ isPinned: -1, createdAt: -1 });
communityPostSchema.index({ isActive: 1 });
communityPostSchema.index({ title: "text", content: "text", tags: "text" });

// Instance methods
communityPostSchema.methods.like = function (
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

communityPostSchema.methods.isLikedBy = function (
  userId: mongoose.Types.ObjectId
): boolean {
  return this.likes.some((id: mongoose.Types.ObjectId) => id.equals(userId));
};

communityPostSchema.methods.votePoll = function (
  userId: mongoose.Types.ObjectId,
  optionIndex: number
): boolean {
  if (this.type !== "poll" || !this.poll) return false;

  const option = this.poll.options[optionIndex];
  if (!option) return false;

  // Remove user's vote from all options first
  this.poll.options.forEach((opt: any) => {
    opt.votes = opt.votes.filter(
      (id: mongoose.Types.ObjectId) => !id.equals(userId)
    );
  });

  // Add vote to selected option
  option.votes.push(userId);
  return true;
};

communityPostSchema.methods.joinEvent = function (
  userId: mongoose.Types.ObjectId
): boolean {
  if (this.type !== "event" || !this.event) return false;

  const index = this.event.attendees.findIndex((id: mongoose.Types.ObjectId) =>
    id.equals(userId)
  );
  if (index === -1) {
    // Check if event has max attendees limit
    if (
      this.event.maxAttendees &&
      this.event.attendees.length >= this.event.maxAttendees
    ) {
      return false; // Event is full
    }
    this.event.attendees.push(userId);
    return true; // Joined
  } else {
    this.event.attendees.splice(index, 1);
    return false; // Left
  }
};

export default mongoose.model<ICommunityPost>(
  "CommunityPost",
  communityPostSchema
);
