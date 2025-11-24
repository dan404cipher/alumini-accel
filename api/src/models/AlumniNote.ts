import mongoose, { Schema, Document } from "mongoose";

export interface IAlumniNote extends Document {
  _id: string;
  alumniId: mongoose.Types.ObjectId;
  staffId: mongoose.Types.ObjectId;
  content: string;
  category?: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const alumniNoteSchema = new Schema<IAlumniNote>(
  {
    alumniId: {
      type: mongoose.Types.ObjectId as any,
      ref: "AlumniProfile",
      required: [true, "Alumni ID is required"],
      index: true,
    },
    staffId: {
      type: mongoose.Types.ObjectId as any,
      ref: "User",
      required: [true, "Staff ID is required"],
      index: true,
    },
    content: {
      type: String,
      required: [true, "Note content is required"],
      trim: true,
      maxlength: [5000, "Note content cannot exceed 5000 characters"],
    },
    category: {
      type: String,
      trim: true,
      enum: [
        "general",
        "meeting",
        "call",
        "email",
        "event",
        "donation",
        "issue",
        "other",
      ],
      default: "general",
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
alumniNoteSchema.index({ alumniId: 1, createdAt: -1 });
alumniNoteSchema.index({ staffId: 1 });
alumniNoteSchema.index({ category: 1 });

export default mongoose.model<IAlumniNote>("AlumniNote", alumniNoteSchema);

