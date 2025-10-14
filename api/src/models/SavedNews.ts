import mongoose, { Schema, Document } from "mongoose";

export interface ISavedNews extends Document {
  _id: string;
  userId: string;
  newsId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const savedNewsSchema = new Schema<ISavedNews>(
  {
    userId: {
      type: mongoose.Types.ObjectId as any,
      ref: "User",
      required: true,
    },
    newsId: {
      type: mongoose.Types.ObjectId as any,
      ref: "News",
      required: true,
    },
    tenantId: {
      type: mongoose.Types.ObjectId as any,
      ref: "Tenant",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to prevent duplicate saves
savedNewsSchema.index({ userId: 1, newsId: 1 }, { unique: true });

// Index for better query performance
savedNewsSchema.index({ userId: 1, tenantId: 1 });
savedNewsSchema.index({ newsId: 1 });

export default mongoose.model<ISavedNews>("SavedNews", savedNewsSchema);
