import mongoose, { Document, Schema } from "mongoose";

export interface ICommunity extends Document {
  name: string;
  description: string;
  category:
    | "department"
    | "batch"
    | "interest"
    | "professional"
    | "location"
    | "other";
  banner?: string;
  logo?: string;
  isPublic: boolean;
  owner: mongoose.Types.ObjectId;
  admins: mongoose.Types.ObjectId[];
  members: mongoose.Types.ObjectId[];
  pendingRequests: mongoose.Types.ObjectId[];
  rules?: string[];
  tags: string[];
  memberCount: number;
  postCount: number;
  isActive: boolean;
  tenantId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const communitySchema = new Schema<ICommunity>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "department",
        "batch",
        "interest",
        "professional",
        "location",
        "other",
      ],
    },
    banner: {
      type: String,
      default: null,
    },
    logo: {
      type: String,
      default: null,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admins: [
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
    pendingRequests: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    rules: [
      {
        type: String,
        trim: true,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    memberCount: {
      type: Number,
      default: 0,
    },
    postCount: {
      type: Number,
      default: 0,
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
communitySchema.index({ tenantId: 1 });
communitySchema.index({ category: 1 });
communitySchema.index({ isPublic: 1 });
communitySchema.index({ isActive: 1 });
communitySchema.index({ name: "text", description: "text", tags: "text" });

// Pre-save middleware to update member count
communitySchema.pre("save", function (next) {
  this.memberCount = this.members.length;
  next();
});

// Instance methods
communitySchema.methods.isMember = function (
  userId: mongoose.Types.ObjectId
): boolean {
  return this.members.some((id: mongoose.Types.ObjectId) => id.equals(userId));
};

communitySchema.methods.isAdmin = function (
  userId: mongoose.Types.ObjectId
): boolean {
  return (
    this.admins.some((id: mongoose.Types.ObjectId) => id.equals(userId)) ||
    this.owner.equals(userId)
  );
};

communitySchema.methods.canJoin = function (
  userId: mongoose.Types.ObjectId
): boolean {
  if (this.isPublic) return true;
  return this.pendingRequests.some((id: mongoose.Types.ObjectId) =>
    id.equals(userId)
  );
};

communitySchema.methods.addMember = function (
  userId: mongoose.Types.ObjectId
): void {
  if (!this.members.some((id: mongoose.Types.ObjectId) => id.equals(userId))) {
    this.members.push(userId);
    this.pendingRequests = this.pendingRequests.filter(
      (id: mongoose.Types.ObjectId) => !id.equals(userId)
    );
  }
};

communitySchema.methods.removeMember = function (
  userId: mongoose.Types.ObjectId
): void {
  this.members = this.members.filter(
    (id: mongoose.Types.ObjectId) => !id.equals(userId)
  );
  this.admins = this.admins.filter(
    (id: mongoose.Types.ObjectId) => !id.equals(userId)
  );
};

export default mongoose.model<ICommunity>("Community", communitySchema);
