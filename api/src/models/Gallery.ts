import mongoose, { Document, Schema } from "mongoose";

export interface IGallery extends Document {
  title: string;
  description?: string;
  images: string[]; // Array of image URLs/paths
  createdBy: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId; // Add tenantId for multi-tenant support
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  tags?: string[];
  category?: string;
}

const GallerySchema = new Schema<IGallery>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    images: {
      type: [
        {
          type: String,
          required: true,
        },
      ],
      validate: [
        {
          validator: function (value: string[]) {
            return Array.isArray(value) && value.length > 0;
          },
          message: "At least one image is required",
        },
        {
          validator: function (value: string[]) {
            return Array.isArray(value) && value.length <= 50;
          },
          message: "You can upload a maximum of 50 images per gallery",
        },
      ],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: String,
      trim: true,
      default: "Other",
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
GallerySchema.index({ createdBy: 1, createdAt: -1 });
GallerySchema.index({ tenantId: 1, isActive: 1, createdAt: -1 });
GallerySchema.index({ isActive: 1, createdAt: -1 });
GallerySchema.index({ category: 1 });

export default mongoose.model<IGallery>("Gallery", GallerySchema);
