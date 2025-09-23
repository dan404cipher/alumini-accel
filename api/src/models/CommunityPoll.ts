import mongoose, { Document, Schema } from "mongoose";

export interface IPollOption {
  id: string;
  text: string;
  votes: number;
}

export interface ICommunityPoll extends Document {
  question: string;
  description?: string;
  options: IPollOption[];
  author: {
    id: mongoose.Types.ObjectId;
    name: string;
    profileImage?: string;
    role: string;
  };
  category: string;
  totalVotes: number;
  isActive: boolean;
  expiresAt?: Date;
  tenantId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PollOptionSchema = new Schema<IPollOption>({
  id: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  votes: {
    type: Number,
    default: 0,
  },
});

const CommunityPollSchema = new Schema<ICommunityPoll>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    options: [PollOptionSchema],
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
    totalVotes: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
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
CommunityPollSchema.index({ tenantId: 1, isActive: 1, createdAt: -1 });
CommunityPollSchema.index({ tenantId: 1, category: 1 });
CommunityPollSchema.index({ tenantId: 1, "author.id": 1 });
CommunityPollSchema.index({ expiresAt: 1 });

// Pre-save middleware to update author info
CommunityPollSchema.pre("save", async function (next) {
  if (this.isModified("author.id")) {
    try {
      const User = mongoose.model("User");
      const user = await User.findById(this.author.id).select(
        "firstName lastName profileImage role"
      );

      if (user) {
        this.author.name = `${user.firstName} ${user.lastName}`;
        this.author.profileImage = user.profileImage;
        this.author.role = user.role;
      }
    } catch (error) {
      console.error("Error updating author info:", error);
    }
  }
  next();
});

// Method to calculate percentage for each option
CommunityPollSchema.methods.getOptionPercentage = function (optionId: string) {
  const option = this.options.find((opt: IPollOption) => opt.id === optionId);
  if (!option || this.totalVotes === 0) return 0;
  return (option.votes / this.totalVotes) * 100;
};

// Method to check if poll is expired
CommunityPollSchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
};

// Method to vote on an option
CommunityPollSchema.methods.vote = function (optionId: string, userId: string) {
  const option = this.options.find((opt: IPollOption) => opt.id === optionId);
  if (!option) {
    throw new Error("Option not found");
  }

  if (this.isExpired()) {
    throw new Error("Poll has expired");
  }

  if (!this.isActive) {
    throw new Error("Poll is not active");
  }

  // In a real implementation, you'd want to track who voted to prevent duplicate votes
  option.votes += 1;
  this.totalVotes += 1;

  return this.save();
};

// Validation for options
CommunityPollSchema.pre("validate", function (next) {
  if (this.options.length < 2) {
    next(new Error("Poll must have at least 2 options"));
  } else if (this.options.length > 10) {
    next(new Error("Poll cannot have more than 10 options"));
  } else {
    next();
  }
});

export default mongoose.model<ICommunityPoll>(
  "CommunityPoll",
  CommunityPollSchema
);
