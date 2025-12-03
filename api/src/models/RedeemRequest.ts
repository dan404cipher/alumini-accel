import mongoose, { Schema } from "mongoose";
import { IRedeemRequest, RedeemRequestStatus } from "../types";

const redeemRequestSchema = new Schema<IRedeemRequest>(
  {
    alumniId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Alumni ID is required"],
    },
    rewardOption: {
      type: String,
      required: [true, "Reward option is required"],
      trim: true,
      maxlength: [200, "Reward option cannot exceed 200 characters"],
    },
    pointsUsed: {
      type: Number,
      required: [true, "Points used is required"],
      min: [1, "Points used must be at least 1"],
    },
    status: {
      type: String,
      enum: Object.values(RedeemRequestStatus),
      default: RedeemRequestStatus.PENDING,
      required: true,
    },
    deliveryEmail: {
      type: String,
      required: [true, "Delivery email is required"],
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email address"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
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

redeemRequestSchema.index({ alumniId: 1, createdAt: -1 });
redeemRequestSchema.index({ status: 1 });
redeemRequestSchema.index({ tenantId: 1 });
redeemRequestSchema.index({ createdAt: -1 });

redeemRequestSchema.virtual("alumni", {
  ref: "User",
  localField: "alumniId",
  foreignField: "_id",
  justOne: true,
});

redeemRequestSchema.virtual("approver", {
  ref: "User",
  localField: "approvedBy",
  foreignField: "_id",
  justOne: true,
});

redeemRequestSchema.virtual("rejector", {
  ref: "User",
  localField: "rejectedBy",
  foreignField: "_id",
  justOne: true,
});

redeemRequestSchema.set("toJSON", { virtuals: true });

export default mongoose.model<IRedeemRequest>("RedeemRequest", redeemRequestSchema);
