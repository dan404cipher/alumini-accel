import mongoose, { Schema, Document } from "mongoose";

export interface INews extends Document {
  _id: string;
  title: string;
  summary: string;
  image?: string;
  isShared: boolean;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

const newsSchema = new Schema<INews>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: [5000, "Summary cannot exceed 5000 characters"],
    },
    image: {
      type: String,
      trim: true,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    author: {
      type: mongoose.Types.ObjectId as any,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
newsSchema.index({ createdAt: -1 });
newsSchema.index({ isShared: 1 });
newsSchema.index({ author: 1 });

export default mongoose.model<INews>("News", newsSchema);
