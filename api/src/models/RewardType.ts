import mongoose, { Schema } from "mongoose";
import { IRewardType, RewardTriggerEvent, RewardTypeStatus } from "../types";

const rewardTypeSchema = new Schema<IRewardType>(
  {
    name: {
      type: String,
      required: [true, "Reward name is required"],
      trim: true,
      maxlength: [200, "Reward name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    points: {
      type: Number,
      required: [true, "Points per action is required"],
      min: [1, "Points must be at least 1"],
    },
    triggerEvent: {
      type: String,
      enum: Object.values(RewardTriggerEvent),
      required: [true, "Trigger event is required"],
    },
    status: {
      type: String,
      enum: Object.values(RewardTypeStatus),
      default: RewardTypeStatus.ACTIVE,
      required: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
rewardTypeSchema.index({ triggerEvent: 1 });
rewardTypeSchema.index({ status: 1 });
rewardTypeSchema.index({ tenantId: 1 });
rewardTypeSchema.index({ createdAt: -1 });

// Compound index to prevent duplicate reward types for same trigger event per tenant
rewardTypeSchema.index(
  { triggerEvent: 1, tenantId: 1 },
  { unique: true, sparse: true }
);

export default mongoose.model<IRewardType>("RewardType", rewardTypeSchema);

