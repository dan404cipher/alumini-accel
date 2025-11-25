import mongoose, { Schema, Document } from "mongoose";

export interface IAlumniFlag extends Document {
  _id: string;
  alumniId: mongoose.Types.ObjectId;
  flagType: string;
  flagValue: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const alumniFlagSchema = new Schema<IAlumniFlag>(
  {
    alumniId: {
      type: mongoose.Types.ObjectId as any,
      ref: "AlumniProfile",
      required: [true, "Alumni ID is required"],
    },
    flagType: {
      type: String,
      required: [true, "Flag type is required"],
      trim: true,
      enum: [
        "vip",
        "major_donor",
        "inactive",
        "at_risk",
        "high_engagement",
        "mentor",
        "speaker",
        "volunteer",
        "custom",
      ],
    },
    flagValue: {
      type: String,
      required: [true, "Flag value is required"],
      trim: true,
      maxlength: [100, "Flag value cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    createdBy: {
      type: mongoose.Types.ObjectId as any,
      ref: "User",
      required: [true, "Created by is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
// Prevent duplicate flags of the same type for the same alumni (unique compound index)
alumniFlagSchema.index({ alumniId: 1, flagType: 1 }, { unique: true });
alumniFlagSchema.index({ flagType: 1 });
alumniFlagSchema.index({ createdBy: 1 });

export default mongoose.model<IAlumniFlag>("AlumniFlag", alumniFlagSchema);

