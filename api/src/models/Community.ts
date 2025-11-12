import mongoose, { Document, Schema } from "mongoose";

export interface ICommunity extends Document {
  name: string;
  description: string;
  type: "open" | "closed" | "hidden";
  category:
    | "department"
    | "batch"
    | "interest"
    | "professional"
    | "location"
    | "academic_research"
    | "professional_career"
    | "entrepreneurship_startups"
    | "social_hobby"
    | "mentorship_guidance"
    | "events_meetups"
    | "community_support_volunteering"
    | "technology_deeptech"
    | "regional_chapter_based"
    | "other";
  coverImage?: string;
  logo?: string;
  createdBy: mongoose.Types.ObjectId;
  moderators: mongoose.Types.ObjectId[];
  members: mongoose.Types.ObjectId[];
  invitedUsers: mongoose.Types.ObjectId[];
  settings: {
    allowMemberPosts: boolean;
    requirePostApproval: boolean;
    allowMediaUploads: boolean;
    allowComments: boolean;
    allowPolls: boolean;
  };
  status: "active" | "archived" | "suspended";
  tags: string[];
  rules: string[];
  externalLinks: {
    website?: string;
    github?: string;
    slack?: string;
    discord?: string;
    other?: string;
  };
  memberCount: number;
  postCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommunitySchema = new Schema<ICommunity>(
  {
    name: {
      type: String,
      required: [true, "Community name is required"],
      trim: true,
      maxlength: [100, "Community name cannot exceed 100 characters"],
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Community description is required"],
      trim: true,
      maxlength: [500, "Community description cannot exceed 500 characters"],
    },
    type: {
      type: String,
      enum: ["open", "closed", "hidden"],
      default: "open",
      required: true,
    },
    category: {
      type: String,
      enum: [
        "department",
        "batch",
        "interest",
        "professional",
        "location",
        "academic_research",
        "professional_career",
        "entrepreneurship_startups",
        "social_hobby",
        "mentorship_guidance",
        "events_meetups",
        "community_support_volunteering",
        "technology_deeptech",
        "regional_chapter_based",
        "other",
      ],
      required: true,
    },
    coverImage: {
      type: String,
      default: null,
    },
    logo: {
      type: String,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    moderators: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    invitedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    settings: {
      allowMemberPosts: {
        type: Boolean,
        default: true,
      },
      requirePostApproval: {
        type: Boolean,
        default: false,
      },
      allowMediaUploads: {
        type: Boolean,
        default: true,
      },
      allowComments: {
        type: Boolean,
        default: true,
      },
      allowPolls: {
        type: Boolean,
        default: true,
      },
      // Mentorship-specific settings
      mentorshipMatchId: {
        type: Schema.Types.ObjectId,
        ref: "MentorMenteeMatching",
        default: null,
      },
      mentorshipProgramId: {
        type: Schema.Types.ObjectId,
        ref: "MentoringProgram",
        default: null,
      },
    },
    status: {
      type: String,
      enum: ["active", "archived", "suspended"],
      default: "active",
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    rules: [
      {
        type: String,
        trim: true,
      },
    ],
    externalLinks: {
      website: {
        type: String,
        trim: true,
      },
      github: {
        type: String,
        trim: true,
      },
      slack: {
        type: String,
        trim: true,
      },
      discord: {
        type: String,
        trim: true,
      },
      other: {
        type: String,
        trim: true,
      },
    },
    memberCount: {
      type: Number,
      default: 0,
    },
    postCount: {
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
// Note: name index is automatically created by unique: true
CommunitySchema.index({ type: 1 });
CommunitySchema.index({ status: 1 });
CommunitySchema.index({ tags: 1 });
CommunitySchema.index({ createdBy: 1 });
CommunitySchema.index({ members: 1 });

// Virtual for getting community statistics
CommunitySchema.virtual("statistics").get(function () {
  return {
    memberCount: this.memberCount,
    postCount: this.postCount,
    moderatorCount: this.moderators.length,
  };
});

// Pre-save middleware to update member count
CommunitySchema.pre("save", function (next) {
  if (this.isModified("members")) {
    this.memberCount = this.members.length;
  }
  next();
});

// Static method to find communities by type
CommunitySchema.statics.findByType = function (type: string) {
  return this.find({ type, status: "active" });
};

// Static method to find communities by tags
CommunitySchema.statics.findByTags = function (tags: string[]) {
  return this.find({
    tags: { $in: tags },
    status: "active",
  });
};

// Static method to find communities user can join
CommunitySchema.statics.findJoinableCommunities = function (userId: string) {
  return this.find({
    status: "active",
    $or: [
      { type: "open" },
      {
        type: "closed",
        members: { $ne: userId },
      },
    ],
  });
};

// Instance method to check if user is member
CommunitySchema.methods.isMember = function (userId: string) {
  return this.members.includes(userId);
};

// Instance method to check if user is moderator
CommunitySchema.methods.isModerator = function (userId: string) {
  return this.moderators.includes(userId);
};

// Instance method to check if user can post
CommunitySchema.methods.canPost = function (userId: string) {
  if (!this.isMember(userId)) return false;
  if (!this.settings.allowMemberPosts) return false;
  return true;
};

// Instance method to add member
CommunitySchema.methods.addMember = function (userId: string) {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
    this.memberCount = this.members.length;
  }
  return this;
};

// Instance method to remove member
CommunitySchema.methods.removeMember = function (userId: string) {
  this.members = this.members.filter(
    (id: mongoose.Types.ObjectId) => id.toString() !== userId
  );
  this.memberCount = this.members.length;
  return this;
};

// Instance method to add moderator
CommunitySchema.methods.addModerator = function (userId: string) {
  if (!this.moderators.includes(userId)) {
    this.moderators.push(userId);
  }
  return this;
};

// Instance method to remove moderator
CommunitySchema.methods.removeModerator = function (userId: string) {
  this.moderators = this.moderators.filter(
    (id: mongoose.Types.ObjectId) => id.toString() !== userId
  );
  return this;
};

export default mongoose.model<ICommunity>("Community", CommunitySchema);
