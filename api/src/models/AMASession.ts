import mongoose, { Document, Schema } from "mongoose";

export interface IAMASession extends Document {
  title: string;
  description: string;
  host: {
    id: mongoose.Types.ObjectId;
    name: string;
    profileImage?: string;
    role: string;
    company?: string;
    department?: string;
    graduationYear?: number;
  };
  scheduledDate: Date;
  duration: number; // in minutes
  maxParticipants: number;
  currentParticipants: number;
  status: "upcoming" | "live" | "completed";
  category: string;
  tags: string[];
  questions: number;
  tenantId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AMASessionSchema = new Schema<IAMASession>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    host: {
      id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      profileImage: {
        type: String,
      },
      role: {
        type: String,
        required: true,
      },
      company: {
        type: String,
      },
      department: {
        type: String,
      },
      graduationYear: {
        type: Number,
      },
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 15,
      max: 180, // Maximum 3 hours
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 5,
      max: 100,
    },
    currentParticipants: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["upcoming", "live", "completed"],
      default: "upcoming",
    },
    category: {
      type: String,
      required: true,
      enum: [
        "career",
        "technology",
        "entrepreneurship",
        "events",
        "academic",
        "networking",
        "general",
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    questions: {
      type: Number,
      default: 0,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
AMASessionSchema.index({ tenantId: 1, status: 1, scheduledDate: 1 });
AMASessionSchema.index({ tenantId: 1, category: 1 });
AMASessionSchema.index({ tenantId: 1, "host.id": 1 });
AMASessionSchema.index({ scheduledDate: 1 });

// Pre-save middleware to update host info
AMASessionSchema.pre("save", async function (next) {
  if (this.isModified("host.id")) {
    try {
      const User = mongoose.model("User");
      const user = await User.findById(this.host.id).select(
        "firstName lastName profileImage role company department graduationYear"
      );

      if (user) {
        this.host.name = `${user.firstName} ${user.lastName}`;
        this.host.profileImage = user.profileImage;
        this.host.role = user.role;
        this.host.company = user.company;
        this.host.department = user.department;
        this.host.graduationYear = user.graduationYear;
      }
    } catch (error) {
      console.error("Error updating host info:", error);
    }
  }
  next();
});

// Method to check if session is live
AMASessionSchema.methods.isLive = function () {
  const now = new Date();
  const startTime = this.scheduledDate;
  const endTime = new Date(startTime.getTime() + this.duration * 60000);

  return now >= startTime && now <= endTime;
};

// Method to check if session is upcoming
AMASessionSchema.methods.isUpcoming = function () {
  return this.scheduledDate > new Date();
};

// Method to check if session is completed
AMASessionSchema.methods.isCompleted = function () {
  const endTime = new Date(
    this.scheduledDate.getTime() + this.duration * 60000
  );
  return endTime < new Date();
};

export default mongoose.model<IAMASession>("AMASession", AMASessionSchema);
