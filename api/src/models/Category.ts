import mongoose, { Document, Schema } from "mongoose";

export type EntityType =
  | "community" // For communities
  | "community_post_category" // For community post categories
  | "department" // For departments within a college
  | "program" // For academic programs (B.Tech, MBA, B.Sc, etc.)
  | "event_type" // For event types
  | "event_location" // For event locations
  | "event_price_range" // For event price ranges
  | "mentorship_category" // For mentorship topics/categories
  | "donation_category" // For donation/campaign categories
  | "gallery_category" // For gallery/media categories
  | "job_type" // For job types (full-time, part-time, etc.)
  | "job_experience" // For job experience levels
  | "job_industry"; // For job industries

export interface ICategory extends Document {
  name: string;
  slug: string; // URL-friendly version of name
  description?: string;
  entityType: EntityType; // Which entity this category belongs to
  tenantId: mongoose.Types.ObjectId; // College-specific
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  order: number; // For sorting/display order
  programs?: mongoose.Types.ObjectId[]; // For department categories: linked program category IDs
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    entityType: {
      type: String,
      enum: [
        "community",
        "community_post_category",
        "department",
        "program",
        "event_type",
        "event_location",
        "event_price_range",
        "mentorship_category",
        "donation_category",
        "gallery_category",
        "job_type",
        "job_experience",
        "job_industry",
      ],
      required: [true, "Entity type is required"],
      index: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    programs: {
      type: [Schema.Types.ObjectId],
      ref: "Category",
      default: [],
      // Only applicable for department entityType
      validate: {
        validator: function (this: ICategory, value: mongoose.Types.ObjectId[]) {
          // Only allow programs field for department entityType
          if (this.entityType !== "department") {
            return !value || value.length === 0;
          }
          return true;
        },
        message: "Programs field is only applicable for department categories",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to ensure unique slug per tenant and entity type
CategorySchema.index({ tenantId: 1, entityType: 1, slug: 1 }, { unique: true });
CategorySchema.index({ tenantId: 1, entityType: 1, isActive: 1 });
CategorySchema.index({ entityType: 1, order: 1 });
CategorySchema.index({ tenantId: 1, isActive: 1 });
CategorySchema.index({ order: 1 });

// Pre-save middleware to generate slug from name
CategorySchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

export default mongoose.model<ICategory>("Category", CategorySchema);
