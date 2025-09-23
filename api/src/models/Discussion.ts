import mongoose, { Document, Schema } from "mongoose";

export interface IDiscussion extends Document {
  title: string;
  content: string;
  author: {
    id: mongoose.Types.ObjectId;
    name: string;
    profileImage?: string;
    role: string;
    department?: string;
    graduationYear?: number;
  };
  category: string;
  tags: string[];
  likes: number;
  replies: number;
  views: number;
  isPinned: boolean;
  isFeatured: boolean;
  tenantId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DiscussionSchema = new Schema<IDiscussion>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    author: {
      id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      profileImage: {
        type: String,
      },
      role: {
        type: String,
        required: true,
      },
      department: {
        type: String,
      },
      graduationYear: {
        type: Number,
      },
    },
    category: {
      type: String,
      required: true,
      enum: [
        "career",
        "technology",
        "entrepreneurship",
        "events",
        "academic",
        "networking",
        "general",
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    likes: {
      type: Number,
      default: 0,
    },
    replies: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
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

// Indexes for better performance
DiscussionSchema.index({ tenantId: 1, category: 1 });
DiscussionSchema.index({ tenantId: 1, createdAt: -1 });
DiscussionSchema.index({ tenantId: 1, isPinned: -1, createdAt: -1 });
DiscussionSchema.index({ tenantId: 1, isFeatured: -1, createdAt: -1 });
DiscussionSchema.index({ tenantId: 1, "author.id": 1 });

// Pre-save middleware to update author info
DiscussionSchema.pre("save", async function (next) {
  if (this.isModified("author.id")) {
    try {
      const User = mongoose.model("User");
      const user = await User.findById(this.author.id).select(
        "firstName lastName profileImage role department graduationYear"
      );

      if (user) {
        this.author.name = `${user.firstName} ${user.lastName}`;
        this.author.profileImage = user.profileImage;
        this.author.role = user.role;
        this.author.department = user.department;
        this.author.graduationYear = user.graduationYear;
      }
    } catch (error) {
      console.error("Error updating author info:", error);
    }
  }
  next();
});

export default mongoose.model<IDiscussion>("Discussion", DiscussionSchema);
