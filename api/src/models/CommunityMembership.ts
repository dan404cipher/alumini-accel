import mongoose, { Document, Schema } from "mongoose";

export interface ICommunityMembership extends Document {
  communityId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: "member" | "moderator" | "admin";
  status: "pending" | "approved" | "rejected" | "suspended" | "left";
  joinedAt?: Date;
  leftAt?: Date;
  invitedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  suspendedBy?: mongoose.Types.ObjectId;
  suspensionReason?: string;
  suspensionEndDate?: Date;
  permissions: {
    canPost: boolean;
    canComment: boolean;
    canInvite: boolean;
    canModerate: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CommunityMembershipSchema = new Schema<ICommunityMembership>(
  {
    communityId: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["member", "moderator", "admin"],
      default: "member",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended", "left"],
      default: "pending",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: null,
    },
    leftAt: {
      type: Date,
      default: null,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    suspendedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    suspensionReason: {
      type: String,
      maxlength: [200, "Suspension reason cannot exceed 200 characters"],
    },
    suspensionEndDate: {
      type: Date,
      validate: {
        validator: function (v: Date) {
          return !v || v > new Date();
        },
        message: "Suspension end date must be in the future",
      },
    },
    permissions: {
      canPost: {
        type: Boolean,
        default: true,
      },
      canComment: {
        type: Boolean,
        default: true,
      },
      canInvite: {
        type: Boolean,
        default: false,
      },
      canModerate: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to ensure unique membership per user per community
CommunityMembershipSchema.index(
  { communityId: 1, userId: 1 },
  { unique: true }
);

// Indexes for better performance
CommunityMembershipSchema.index({ communityId: 1, status: 1 });
CommunityMembershipSchema.index({ userId: 1, status: 1 });
CommunityMembershipSchema.index({ role: 1 });
CommunityMembershipSchema.index({ status: 1 });

// Pre-save middleware to set permissions based on role
CommunityMembershipSchema.pre("save", function (next) {
  if (this.isModified("role")) {
    switch (this.role) {
      case "admin":
        this.permissions.canPost = true;
        this.permissions.canComment = true;
        this.permissions.canInvite = true;
        this.permissions.canModerate = true;
        break;
      case "moderator":
        this.permissions.canPost = true;
        this.permissions.canComment = true;
        this.permissions.canInvite = true;
        this.permissions.canModerate = true;
        break;
      case "member":
        this.permissions.canPost = true;
        this.permissions.canComment = true;
        this.permissions.canInvite = false;
        this.permissions.canModerate = false;
        break;
    }
  }

  // Set joinedAt when status changes to approved
  if (
    this.isModified("status") &&
    this.status === "approved" &&
    !this.joinedAt
  ) {
    this.joinedAt = new Date();
  }

  // Set leftAt when status changes to left
  if (this.isModified("status") && this.status === "left" && !this.leftAt) {
    this.leftAt = new Date();
  }

  next();
});

// Static method to find memberships by community
CommunityMembershipSchema.statics.findByCommunity = function (
  communityId: string,
  options: any = {}
) {
  const query: any = { communityId };

  if (options.status) {
    query.status = options.status;
  }

  if (options.role) {
    query.role = options.role;
  }

  return this.find(query)
    .populate("userId", "firstName lastName email profileImage")
    .populate("invitedBy", "firstName lastName")
    .populate("approvedBy", "firstName lastName")
    .populate("suspendedBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to find user memberships
CommunityMembershipSchema.statics.findByUser = function (
  userId: string,
  options: any = {}
) {
  const query: any = { userId };

  if (options.status) {
    query.status = options.status;
  }

  if (options.role) {
    query.role = options.role;
  }

  return this.find(query)
    .populate("communityId", "name description type coverImage memberCount")
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to find pending requests
CommunityMembershipSchema.statics.findPendingRequests = function (
  communityId: string
) {
  return this.find({
    communityId,
    status: "pending",
  })
    .populate("userId", "firstName lastName email profileImage")
    .populate("invitedBy", "firstName lastName")
    .sort({ createdAt: -1 });
};

// Static method to find moderators and admins
CommunityMembershipSchema.statics.findModerators = function (
  communityId: string
) {
  return this.find({
    communityId,
    role: { $in: ["moderator", "admin"] },
    status: "approved",
  })
    .populate("userId", "firstName lastName email profileImage")
    .sort({ role: 1, createdAt: 1 });
};

// Instance method to approve membership
CommunityMembershipSchema.methods.approveMembership = function (
  approvedBy: string
) {
  this.status = "approved";
  this.approvedBy = approvedBy;
  this.joinedAt = new Date();
  return this;
};

// Instance method to reject membership
CommunityMembershipSchema.methods.rejectMembership = function () {
  this.status = "rejected";
  return this;
};

// Instance method to suspend membership
CommunityMembershipSchema.methods.suspendMembership = function (
  suspendedBy: string,
  reason: string,
  endDate?: Date
) {
  this.status = "suspended";
  this.suspendedBy = suspendedBy;
  this.suspensionReason = reason;
  this.suspensionEndDate = endDate;
  return this;
};

// Instance method to unsuspend membership
CommunityMembershipSchema.methods.unsuspendMembership = function () {
  this.status = "approved";
  this.suspensionReason = undefined;
  this.suspensionEndDate = undefined;
  this.suspendedBy = undefined;
  return this;
};

// Instance method to leave community
CommunityMembershipSchema.methods.leaveCommunity = function () {
  this.status = "left";
  this.leftAt = new Date();
  return this;
};

// Instance method to promote to moderator
CommunityMembershipSchema.methods.promoteToModerator = function () {
  this.role = "moderator";
  return this;
};

// Instance method to demote to member
CommunityMembershipSchema.methods.demoteToMember = function () {
  this.role = "member";
  return this;
};

// Instance method to check if user can moderate
CommunityMembershipSchema.methods.canModerate = function () {
  return this.permissions.canModerate && this.status === "approved";
};

// Instance method to check if user can invite
CommunityMembershipSchema.methods.canInvite = function () {
  return this.permissions.canInvite && this.status === "approved";
};

export default mongoose.model<ICommunityMembership>(
  "CommunityMembership",
  CommunityMembershipSchema
);
