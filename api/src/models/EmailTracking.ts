import mongoose, { Schema } from "mongoose";
import { IEmailTracking } from "../types";

const emailTrackingSchema = new Schema<IEmailTracking>(
  {
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "EmailTemplate",
    },
    recipientEmail: {
      type: String,
      required: [true, "Recipient email is required"],
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: [true, "Email subject is required"],
      trim: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    openedAt: {
      type: Date,
    },
    clickedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "opened", "clicked", "failed"],
      default: "sent",
    },
    errorMessage: {
      type: String,
      trim: true,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
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
emailTrackingSchema.index({ recipientEmail: 1 });
emailTrackingSchema.index({ templateId: 1 });
emailTrackingSchema.index({ status: 1 });
emailTrackingSchema.index({ sentAt: -1 });
emailTrackingSchema.index({ tenantId: 1 });

export default mongoose.model<IEmailTracking>(
  "EmailTracking",
  emailTrackingSchema
);

