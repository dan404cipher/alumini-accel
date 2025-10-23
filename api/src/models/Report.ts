import mongoose, { Document, Schema, Model } from "mongoose";

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  reportedEntityId: mongoose.Types.ObjectId;
  reportedEntityType: "post" | "comment";
  reason: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReportModel extends Model<IReport> {
  getReportsByEntity(
    entityId: string,
    entityType: "post" | "comment"
  ): Promise<IReport[]>;
  getReportsByStatus(status: string): Promise<IReport[]>;
  getReportsByReporter(reporterId: string): Promise<IReport[]>;
}

const ReportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reportedEntityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    reportedEntityType: {
      type: String,
      enum: ["post", "comment"],
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "spam",
        "harassment",
        "inappropriate_content",
        "hate_speech",
        "violence",
        "misinformation",
        "copyright_violation",
        "other",
      ],
    },
    description: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    resolution: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient queries
ReportSchema.index({ reportedEntityId: 1, reportedEntityType: 1 });
ReportSchema.index({ reporterId: 1, createdAt: -1 });
ReportSchema.index({ status: 1, createdAt: -1 });

// Static methods
ReportSchema.statics.getReportsByEntity = function (
  entityId: string,
  entityType: "post" | "comment"
) {
  return this.find({
    reportedEntityId: entityId,
    reportedEntityType: entityType,
  })
    .populate("reporterId", "firstName lastName email")
    .populate("reviewedBy", "firstName lastName")
    .sort({ createdAt: -1 });
};

ReportSchema.statics.getReportsByStatus = function (status: string) {
  return this.find({ status })
    .populate("reporterId", "firstName lastName email")
    .populate("reviewedBy", "firstName lastName")
    .sort({ createdAt: -1 });
};

ReportSchema.statics.getReportsByReporter = function (reporterId: string) {
  return this.find({ reporterId })
    .populate("reportedEntityId")
    .sort({ createdAt: -1 });
};

export const Report = mongoose.model<IReport, IReportModel>(
  "Report",
  ReportSchema
);
