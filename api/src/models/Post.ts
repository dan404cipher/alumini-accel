import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  title: string;
  content: string;
  tenantId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  type:
    | "announcement"
    | "update"
    | "achievement"
    | "help_request"
    | "event"
    | "job"
    | "general";
  category?: string;
  tags: string[];
  images: string[];
  documents: string[];
  isPublic: boolean;
  allowComments: boolean;
  pinned: boolean;
  featured: boolean;
  status: "draft" | "published" | "archived" | "deleted";
  visibility: "public" | "alumni_only" | "staff_only" | "admin_only";
  targetAudience: {
    roles: string[];
    batches: number[];
    departments: string[];
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  scheduledAt?: Date;
  publishedAt?: Date;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Post title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: true,
      maxlength: [10000, "Post content cannot exceed 10000 characters"],
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "announcement",
        "update",
        "achievement",
        "help_request",
        "event",
        "job",
        "general",
      ],
      required: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: [50, "Category cannot exceed 50 characters"],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [30, "Tag cannot exceed 30 characters"],
      },
    ],
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    documents: [
      {
        type: String,
        trim: true,
      },
    ],
    isPublic: {
      type: Boolean,
      default: true,
    },
    allowComments: {
      type: Boolean,
      default: true,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived", "deleted"],
      default: "draft",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "alumni_only", "staff_only", "admin_only"],
      default: "public",
    },
    targetAudience: {
      roles: [
        {
          type: String,
          enum: ["alumni", "staff", "admin", "hod", "coordinator"],
        },
      ],
      batches: [
        {
          type: Number,
          min: 1950,
          max: 2030,
        },
      ],
      departments: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    engagement: {
      likes: {
        type: Number,
        default: 0,
        min: 0,
      },
      comments: {
        type: Number,
        default: 0,
        min: 0,
      },
      shares: {
        type: Number,
        default: 0,
        min: 0,
      },
      views: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    scheduledAt: {
      type: Date,
    },
    publishedAt: {
      type: Date,
    },
    archivedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
postSchema.index({ tenantId: 1, status: 1, publishedAt: -1 });
postSchema.index({ authorId: 1, status: 1 });
postSchema.index({ type: 1, status: 1 });
postSchema.index({ pinned: 1, featured: 1, publishedAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ scheduledAt: 1 });

// Virtual for engagement score
postSchema.virtual("engagementScore").get(function () {
  return (
    this.engagement.likes * 1 +
    this.engagement.comments * 2 +
    this.engagement.shares * 3 +
    this.engagement.views * 0.1
  );
});

// Virtual for isPublished
postSchema.virtual("isPublished").get(function () {
  return (
    this.status === "published" &&
    (!this.scheduledAt || new Date() >= this.scheduledAt)
  );
});

// Methods
postSchema.methods.incrementViews = async function () {
  this.engagement.views += 1;
  await this.save();
};

postSchema.methods.incrementLikes = async function () {
  this.engagement.likes += 1;
  await this.save();
};

postSchema.methods.incrementComments = async function () {
  this.engagement.comments += 1;
  await this.save();
};

postSchema.methods.incrementShares = async function () {
  this.engagement.shares += 1;
  await this.save();
};

postSchema.methods.publish = async function () {
  this.status = "published";
  this.publishedAt = new Date();
  await this.save();
};

postSchema.methods.archive = async function () {
  this.status = "archived";
  this.archivedAt = new Date();
  await this.save();
};

// Pre-save middleware
postSchema.pre("save", function (next) {
  // Auto-publish if scheduled time reached
  if (
    this.scheduledAt &&
    this.status === "draft" &&
    new Date() >= this.scheduledAt
  ) {
    this.status = "published";
    this.publishedAt = new Date();
  }

  next();
});

export default mongoose.model<IPost>("Post", postSchema);
