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
  category?: string | mongoose.Types.ObjectId;
  customCategory?: mongoose.Types.ObjectId;
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
    images: [
      {
        type: String,
        required: true,
      },
    ],
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
      type: Schema.Types.Mixed, // Can be String (enum) or ObjectId (custom)
      required: false,
      validate: {
        validator: function (value: any) {
          if (!value) return true; // Optional field
          
          // Check if it's a valid ObjectId (as string or ObjectId)
          if (mongoose.Types.ObjectId.isValid(value)) {
            return true;
          }
          
          // If not ObjectId, check if it's a valid enum value
          if (typeof value === "string") {
            const validEnums = [
              "Events",
              "Campus",
              "Sports",
              "Academic",
              "Cultural",
              "Other",
            ];
            return validEnums.includes(value);
          }
          
          return false;
        },
        message: "Category must be a valid enum value or ObjectId",
      },
      default: "Other",
    },
    customCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: undefined,
      required: false,
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
