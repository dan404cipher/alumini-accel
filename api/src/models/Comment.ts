import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
  content: string;
  tenantId: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId; // For nested comments/replies
  isEdited: boolean;
  editedAt?: Date;
  likes: number;
  status: "active" | "hidden" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      index: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "hidden", "deleted"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
commentSchema.index({ postId: 1, status: 1, createdAt: 1 });
commentSchema.index({ authorId: 1, status: 1 });
commentSchema.index({ parentId: 1, status: 1 });
commentSchema.index({ tenantId: 1, status: 1 });

// Methods
commentSchema.methods.incrementLikes = async function () {
  this.likes += 1;
  await this.save();
};

commentSchema.methods.decrementLikes = async function () {
  this.likes = Math.max(0, this.likes - 1);
  await this.save();
};

commentSchema.methods.edit = async function (newContent: string) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  await this.save();
};

commentSchema.methods.hide = async function () {
  this.status = "hidden";
  await this.save();
};

commentSchema.methods.delete = async function () {
  this.status = "deleted";
  await this.save();
};

// Pre-save middleware
commentSchema.pre("save", function (next) {
  // Update parent post comment count
  if (this.isNew && this.status === "active") {
    mongoose
      .model("Post")
      .findByIdAndUpdate(this.postId, { $inc: { "engagement.comments": 1 } })
      .exec();
  }
  next();
});

// Post-delete middleware
commentSchema.post("findOneAndDelete", function (doc) {
  // Decrement parent post comment count
  mongoose
    .model("Post")
    .findByIdAndUpdate(doc.postId, { $inc: { "engagement.comments": -1 } })
    .exec();
});

export default mongoose.model<IComment>("Comment", commentSchema);
