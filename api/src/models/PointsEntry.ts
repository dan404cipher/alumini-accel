import mongoose, { Schema } from "mongoose";
import { IPointsEntry, PointsEntryStatus } from "../types";

const pointsEntrySchema = new Schema<IPointsEntry>(
  {
    alumniId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Alumni ID is required"],
    },
    points: {
      type: Number,
      required: [true, "Points are required"],
      min: [0, "Points cannot be negative"],
    },
    activity: {
      type: String,
      required: [true, "Activity name is required"],
      trim: true,
      maxlength: [200, "Activity name cannot exceed 200 characters"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    source: {
      type: String,
      required: [true, "Source is required"],
      trim: true,
      maxlength: [200, "Source cannot exceed 200 characters"],
    },
    status: {
      type: String,
      enum: Object.values(PointsEntryStatus),
      default: PointsEntryStatus.AWARDED,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    rewardTypeId: {
      type: Schema.Types.ObjectId,
      ref: "RewardType",
      required: false,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only track createdAt
  }
);

// Indexes for better query performance
pointsEntrySchema.index({ alumniId: 1, date: -1 });
pointsEntrySchema.index({ alumniId: 1 });
pointsEntrySchema.index({ status: 1 });
pointsEntrySchema.index({ date: -1 });
pointsEntrySchema.index({ rewardTypeId: 1 });
pointsEntrySchema.index({ tenantId: 1 });

// Virtual for alumni details
pointsEntrySchema.virtual("alumni", {
  ref: "User",
  localField: "alumniId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for reward type details
pointsEntrySchema.virtual("rewardType", {
  ref: "RewardType",
  localField: "rewardTypeId",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtual fields are serialized
pointsEntrySchema.set("toJSON", { virtuals: true });

export default mongoose.model<IPointsEntry>("PointsEntry", pointsEntrySchema);

