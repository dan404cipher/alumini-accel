import mongoose, { Schema } from "mongoose";
import { IEmailTemplate, EmailTemplateType } from "../types";

const emailTemplateSchema = new Schema<IEmailTemplate>(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
      unique: true,
    },
    templateType: {
      type: String,
      enum: Object.values(EmailTemplateType),
      required: [true, "Template type is required"],
    },
    subject: {
      type: String,
      required: [true, "Email subject is required"],
      trim: true,
    },
    body: {
      type: String,
      required: [true, "Email body is required"],
    },
    variables: [
      {
        type: String,
        trim: true,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
emailTemplateSchema.index({ templateType: 1 });
emailTemplateSchema.index({ tenantId: 1 });
emailTemplateSchema.index({ isActive: 1 });
emailTemplateSchema.index({ name: 1, tenantId: 1 }, { unique: true });

export default mongoose.model<IEmailTemplate>(
  "EmailTemplate",
  emailTemplateSchema
);

