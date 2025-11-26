import mongoose, { Document, Schema } from "mongoose";

export type RewardType = "badge" | "voucher" | "points" | "perk";
export type RewardStatus =
  | "pending"
  | "in_progress"
  | "earned"
  | "redeemed"
  | "expired";
export type RewardActionType =
  | "event"
  | "donation"
  | "mentorship"
  | "job"
  | "referral"
  | "engagement"
  | "custom";

export interface IRewardTask extends Document {
  _id: string;
  title: string;
  description?: string;
  actionType: RewardActionType;
  metric: "count" | "amount" | "duration";
  targetValue: number;
  points?: number;
  badge?: mongoose.Types.ObjectId;
  isAutomated: boolean;
  autoAward?: boolean;
  metadata?: Record<string, unknown>;
  displayOrder?: number;
}

export interface IReward extends Document {
  name: string;
  description?: string;
  heroImage?: string;
  icon?: string;
  color?: string;
  category: string;
  level?: string;
  rewardType: RewardType;
  points?: number;
  voucherTemplate?: {
    partner?: string;
    value?: number;
    currency?: string;
    terms?: string;
    expiresInDays?: number;
  };
  badge?: mongoose.Types.ObjectId;
  tags: string[];
  tasks: IRewardTask[];
  eligibility?: {
    roles?: string[];
    departments?: string[];
    graduationYears?: number[];
    programs?: string[];
  };
  tenantId?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  startsAt?: Date;
  endsAt?: Date;
  isFeatured: boolean;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRewardActivity extends Document {
  user: mongoose.Types.ObjectId;
  reward: mongoose.Types.ObjectId;
  taskId?: string;
  status: RewardStatus;
  progressValue: number;
  progressTarget: number;
  pointsAwarded?: number;
  voucherCode?: string;
  voucherValue?: number;
  voucherCurrency?: string;
  earnedAt?: Date;
  redeemedAt?: Date;
  issuedBy?: mongoose.Types.ObjectId;
  tenantId?: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  context?: Record<string, unknown>;
  verification?: {
    required: boolean;
    status: "pending" | "approved" | "rejected";
    verifiedBy?: mongoose.Types.ObjectId;
    verifiedAt?: Date;
    rejectionReason?: string;
  };
  history: Array<{
    action: string;
    value?: number;
    note?: string;
    at: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const rewardTaskSchema = new Schema<IRewardTask>(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toHexString(),
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    actionType: {
      type: String,
      enum: [
        "event",
        "donation",
        "mentorship",
        "job",
        "referral",
        "engagement",
        "custom",
      ],
      default: "custom",
    },
    metric: {
      type: String,
      enum: ["count", "amount", "duration"],
      default: "count",
    },
    targetValue: { type: Number, default: 1, min: 0 },
    points: { type: Number, default: 0, min: 0 },
    badge: { type: Schema.Types.ObjectId, ref: "Badge" },
    isAutomated: { type: Boolean, default: true },
    autoAward: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

const rewardSchema = new Schema<IReward>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    heroImage: { type: String, trim: true },
    icon: { type: String, trim: true },
    color: { type: String, trim: true, default: "#2563eb" },
    category: {
      type: String,
      default: "general",
      trim: true,
      index: true,
    },
    level: { type: String, trim: true },
    rewardType: {
      type: String,
      enum: ["badge", "voucher", "points", "perk"],
      default: "points",
      index: true,
    },
    points: { type: Number, default: 0, min: 0 },
    voucherTemplate: {
      partner: { type: String, trim: true },
      value: { type: Number, min: 0 },
      currency: { type: String, default: "USD" },
      terms: { type: String, trim: true },
      expiresInDays: { type: Number, min: 1 },
    },
    badge: { type: Schema.Types.ObjectId, ref: "Badge" },
    tags: { type: [String], default: [] },
    tasks: { type: [rewardTaskSchema], default: [] },
    eligibility: {
      roles: { type: [String], default: [] },
      departments: { type: [String], default: [] },
      graduationYears: { type: [Number], default: [] },
      programs: { type: [String], default: [] },
    },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    startsAt: { type: Date },
    endsAt: { type: Date },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

rewardSchema.index({ category: 1, rewardType: 1, isActive: 1 });
rewardSchema.index({ tags: 1, isActive: 1 });
rewardSchema.index({ tenantId: 1, isActive: 1 });

const rewardActivitySchema = new Schema<IRewardActivity>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reward: { type: Schema.Types.ObjectId, ref: "Reward", required: true },
    taskId: { type: String },
    status: {
      type: String,
      enum: ["pending", "in_progress", "earned", "redeemed", "expired"],
      default: "pending",
      index: true,
    },
    progressValue: { type: Number, default: 0, min: 0 },
    progressTarget: { type: Number, default: 1, min: 0 },
    pointsAwarded: { type: Number, default: 0, min: 0 },
    voucherCode: { type: String, trim: true },
    voucherValue: { type: Number, min: 0 },
    voucherCurrency: { type: String, default: "USD" },
    earnedAt: { type: Date },
    redeemedAt: { type: Date },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User" },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant" },
    metadata: { type: Schema.Types.Mixed, default: {} },
    context: { type: Schema.Types.Mixed, default: {} },
    verification: {
      required: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
      verifiedAt: { type: Date },
      rejectionReason: { type: String, trim: true },
    },
    history: {
      type: [
        {
          action: { type: String, required: true },
          value: { type: Number },
          note: { type: String },
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

rewardActivitySchema.index({ user: 1, reward: 1, taskId: 1 }, { unique: true });
rewardActivitySchema.index({ user: 1, status: 1 });
rewardActivitySchema.index({ tenantId: 1, status: 1 });
rewardActivitySchema.index({ reward: 1, status: 1 });
rewardActivitySchema.index({ "verification.status": 1, "verification.required": 1 });

const Reward = mongoose.model<IReward>("Reward", rewardSchema);
const RewardActivity = mongoose.model<IRewardActivity>(
  "RewardActivity",
  rewardActivitySchema
);

export { Reward, RewardActivity };
export default Reward;

