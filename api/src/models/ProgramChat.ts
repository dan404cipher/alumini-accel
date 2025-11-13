import mongoose, { Schema, Model, Document } from "mongoose";

export interface IProgramChat extends Document {
  _id: string;
  programId: string; // Reference to MentoringProgram
  sender: string; // User ID who sent the message
  content: string; // Message content
  messageType: string;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const programChatSchema = new Schema<IProgramChat>(
  {
    programId: {
      type: mongoose.Types.ObjectId as any,
      ref: "MentoringProgram",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Types.ObjectId as any,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, "Message content cannot exceed 1000 characters"],
    },
    messageType: {
      type: String,
      enum: ["text", "TEXT"],
      default: "text",
      required: true,
    },
    tenantId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
programChatSchema.index({ programId: 1, createdAt: -1 });
programChatSchema.index({ sender: 1 });

// Static method to get messages for a program
programChatSchema.statics.getProgramMessages = function (
  programId: string,
  limit: number = 50,
  page: number = 1
) {
  return this.find({ programId })
    .populate("sender", "firstName lastName email profilePicture")
    .populate("programId", "name")
    .sort({ createdAt: 1 }) // Oldest first for chat display
    .limit(limit)
    .skip((page - 1) * limit);
};

// Interface for ProgramChat model
export interface IProgramChatModel extends Model<IProgramChat> {
  getProgramMessages(
    programId: string,
    limit?: number,
    page?: number
  ): Promise<IProgramChat[]>;
}

export default mongoose.model<IProgramChat, IProgramChatModel>(
  "ProgramChat",
  programChatSchema
);

