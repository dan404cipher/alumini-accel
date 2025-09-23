import mongoose, { Schema, Document } from "mongoose";

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: {
    // User Management
    canCreateUsers: boolean;
    canEditUsers: boolean;
    canDeleteUsers: boolean;
    canViewUsers: boolean;
    canApproveUsers: boolean;

    // Content Management
    canCreatePosts: boolean;
    canEditPosts: boolean;
    canDeletePosts: boolean;
    canViewPosts: boolean;
    canModeratePosts: boolean;

    // Job Management
    canCreateJobs: boolean;
    canEditJobs: boolean;
    canDeleteJobs: boolean;
    canViewJobs: boolean;
    canEditAllJobs: boolean;
    canDeleteAllJobs: boolean;

    // Event Management
    canCreateEvents: boolean;
    canEditEvents: boolean;
    canDeleteEvents: boolean;
    canViewEvents: boolean;

    // Fundraising Management
    canCreateFundraisers: boolean;
    canEditFundraisers: boolean;
    canDeleteFundraisers: boolean;
    canViewFundraisers: boolean;

    // Gallery Management
    canCreateGalleries: boolean;
    canEditGalleries: boolean;
    canDeleteGalleries: boolean;
    canViewGalleries: boolean;

    // News Management
    canCreateNews: boolean;
    canEditNews: boolean;
    canDeleteNews: boolean;
    canViewNews: boolean;

    // Analytics & Reports
    canViewAnalytics: boolean;
    canExportData: boolean;
    canViewReports: boolean;

    // System Administration
    canManageTenants: boolean;
    canManageRoles: boolean;
    canManageSettings: boolean;
    canViewSystemLogs: boolean;
  };
  isSystemRole: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: [50, "Role name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    permissions: {
      // User Management
      canCreateUsers: {
        type: Boolean,
        default: false,
      },
      canEditUsers: {
        type: Boolean,
        default: false,
      },
      canDeleteUsers: {
        type: Boolean,
        default: false,
      },
      canViewUsers: {
        type: Boolean,
        default: true,
      },
      canApproveUsers: {
        type: Boolean,
        default: false,
      },

      // Content Management
      canCreatePosts: {
        type: Boolean,
        default: true,
      },
      canEditPosts: {
        type: Boolean,
        default: false,
      },
      canDeletePosts: {
        type: Boolean,
        default: false,
      },
      canViewPosts: {
        type: Boolean,
        default: true,
      },
      canModeratePosts: {
        type: Boolean,
        default: false,
      },

      // Job Management
      canCreateJobs: {
        type: Boolean,
        default: false,
      },
      canEditJobs: {
        type: Boolean,
        default: false,
      },
      canDeleteJobs: {
        type: Boolean,
        default: false,
      },
      canViewJobs: {
        type: Boolean,
        default: true,
      },
      canEditAllJobs: {
        type: Boolean,
        default: false,
      },
      canDeleteAllJobs: {
        type: Boolean,
        default: false,
      },

      // Event Management
      canCreateEvents: {
        type: Boolean,
        default: false,
      },
      canEditEvents: {
        type: Boolean,
        default: false,
      },
      canDeleteEvents: {
        type: Boolean,
        default: false,
      },
      canViewEvents: {
        type: Boolean,
        default: true,
      },

      // Fundraising Management
      canCreateFundraisers: {
        type: Boolean,
        default: false,
      },
      canEditFundraisers: {
        type: Boolean,
        default: false,
      },
      canDeleteFundraisers: {
        type: Boolean,
        default: false,
      },
      canViewFundraisers: {
        type: Boolean,
        default: true,
      },

      // Gallery Management
      canCreateGalleries: {
        type: Boolean,
        default: false,
      },
      canEditGalleries: {
        type: Boolean,
        default: false,
      },
      canDeleteGalleries: {
        type: Boolean,
        default: false,
      },
      canViewGalleries: {
        type: Boolean,
        default: true,
      },

      // News Management
      canCreateNews: {
        type: Boolean,
        default: false,
      },
      canEditNews: {
        type: Boolean,
        default: false,
      },
      canDeleteNews: {
        type: Boolean,
        default: false,
      },
      canViewNews: {
        type: Boolean,
        default: true,
      },

      // Analytics & Reports
      canViewAnalytics: {
        type: Boolean,
        default: false,
      },
      canExportData: {
        type: Boolean,
        default: false,
      },
      canViewReports: {
        type: Boolean,
        default: false,
      },

      // System Administration
      canManageTenants: {
        type: Boolean,
        default: false,
      },
      canManageRoles: {
        type: Boolean,
        default: false,
      },
      canManageSettings: {
        type: Boolean,
        default: false,
      },
      canViewSystemLogs: {
        type: Boolean,
        default: false,
      },
    },
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
roleSchema.index({ name: 1 });
roleSchema.index({ isActive: 1 });
roleSchema.index({ isSystemRole: 1 });

// Static method to get role by name
roleSchema.statics.findByName = function (name: string) {
  return this.findOne({ name, isActive: true });
};

// Static method to get all active roles
roleSchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to get system roles
roleSchema.statics.findSystemRoles = function () {
  return this.find({ isSystemRole: true, isActive: true }).sort({ name: 1 });
};

// Instance method to check if role has permission
roleSchema.methods.hasPermission = function (permission: string): boolean {
  return this.permissions[permission as keyof typeof this.permissions] === true;
};

// Instance method to get all permissions
roleSchema.methods.getPermissions = function (): string[] {
  const permissions: string[] = [];
  for (const [key, value] of Object.entries(this.permissions)) {
    if (value === true) {
      permissions.push(key);
    }
  }
  return permissions;
};

export default mongoose.model<IRole>("Role", roleSchema);
