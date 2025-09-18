import mongoose from "mongoose";
import Role from "@/models/Role";
import connectDB from "@/config/database";

const defaultRoles = [
  {
    name: "super_admin",
    description: "Super Administrator with full system access",
    isSystemRole: true,
    permissions: {
      // User Management
      canCreateUsers: true,
      canEditUsers: true,
      canDeleteUsers: true,
      canViewUsers: true,
      canApproveUsers: true,

      // Content Management
      canCreatePosts: true,
      canEditPosts: true,
      canDeletePosts: true,
      canViewPosts: true,
      canModeratePosts: true,

      // Job Management
      canCreateJobs: true,
      canEditJobs: true,
      canDeleteJobs: true,
      canViewJobs: true,
      canEditAllJobs: true,
      canDeleteAllJobs: true,

      // Event Management
      canCreateEvents: true,
      canEditEvents: true,
      canDeleteEvents: true,
      canViewEvents: true,

      // Fundraising Management
      canCreateFundraisers: true,
      canEditFundraisers: true,
      canDeleteFundraisers: true,
      canViewFundraisers: true,

      // Gallery Management
      canCreateGalleries: true,
      canEditGalleries: true,
      canDeleteGalleries: true,
      canViewGalleries: true,

      // News Management
      canCreateNews: true,
      canEditNews: true,
      canDeleteNews: true,
      canViewNews: true,

      // Analytics & Reports
      canViewAnalytics: true,
      canExportData: true,
      canViewReports: true,

      // System Administration
      canManageTenants: true,
      canManageRoles: true,
      canManageSettings: true,
      canViewSystemLogs: true,
    },
  },
  {
    name: "college_admin",
    description: "College Administrator with full college access",
    isSystemRole: true,
    permissions: {
      // User Management
      canCreateUsers: true,
      canEditUsers: true,
      canDeleteUsers: false,
      canViewUsers: true,
      canApproveUsers: true,

      // Content Management
      canCreatePosts: true,
      canEditPosts: true,
      canDeletePosts: true,
      canViewPosts: true,
      canModeratePosts: true,

      // Job Management
      canCreateJobs: false,
      canEditJobs: true,
      canDeleteJobs: true,
      canViewJobs: true,
      canEditAllJobs: true,
      canDeleteAllJobs: true,

      // Event Management
      canCreateEvents: true,
      canEditEvents: true,
      canDeleteEvents: true,
      canViewEvents: true,

      // Fundraising Management
      canCreateFundraisers: true,
      canEditFundraisers: true,
      canDeleteFundraisers: true,
      canViewFundraisers: true,

      // Gallery Management
      canCreateGalleries: true,
      canEditGalleries: true,
      canDeleteGalleries: true,
      canViewGalleries: true,

      // News Management
      canCreateNews: true,
      canEditNews: true,
      canDeleteNews: true,
      canViewNews: true,

      // Analytics & Reports
      canViewAnalytics: true,
      canExportData: true,
      canViewReports: true,

      // System Administration
      canManageTenants: false,
      canManageRoles: false,
      canManageSettings: true,
      canViewSystemLogs: false,
    },
  },
  {
    name: "hod",
    description: "Head of Department with department management access",
    isSystemRole: true,
    permissions: {
      // User Management
      canCreateUsers: true,
      canEditUsers: false,
      canDeleteUsers: false,
      canViewUsers: true,
      canApproveUsers: true,

      // Content Management
      canCreatePosts: true,
      canEditPosts: true,
      canDeletePosts: false,
      canViewPosts: true,
      canModeratePosts: true,

      // Job Management
      canCreateJobs: false,
      canEditJobs: false,
      canDeleteJobs: false,
      canViewJobs: true,
      canEditAllJobs: false,
      canDeleteAllJobs: false,

      // Event Management
      canCreateEvents: true,
      canEditEvents: true,
      canDeleteEvents: false,
      canViewEvents: true,

      // Fundraising Management
      canCreateFundraisers: true,
      canEditFundraisers: true,
      canDeleteFundraisers: false,
      canViewFundraisers: true,

      // Gallery Management
      canCreateGalleries: true,
      canEditGalleries: true,
      canDeleteGalleries: false,
      canViewGalleries: true,

      // News Management
      canCreateNews: true,
      canEditNews: true,
      canDeleteNews: false,
      canViewNews: true,

      // Analytics & Reports
      canViewAnalytics: true,
      canExportData: false,
      canViewReports: true,

      // System Administration
      canManageTenants: false,
      canManageRoles: false,
      canManageSettings: false,
      canViewSystemLogs: false,
    },
  },
  {
    name: "staff",
    description: "Staff member with limited administrative access",
    isSystemRole: true,
    permissions: {
      // User Management
      canCreateUsers: false,
      canEditUsers: false,
      canDeleteUsers: false,
      canViewUsers: true,
      canApproveUsers: true,

      // Content Management
      canCreatePosts: true,
      canEditPosts: true,
      canDeletePosts: false,
      canViewPosts: true,
      canModeratePosts: true,

      // Job Management
      canCreateJobs: false,
      canEditJobs: false,
      canDeleteJobs: false,
      canViewJobs: true,
      canEditAllJobs: false,
      canDeleteAllJobs: false,

      // Event Management
      canCreateEvents: true,
      canEditEvents: true,
      canDeleteEvents: false,
      canViewEvents: true,

      // Fundraising Management
      canCreateFundraisers: true,
      canEditFundraisers: true,
      canDeleteFundraisers: false,
      canViewFundraisers: true,

      // Gallery Management
      canCreateGalleries: true,
      canEditGalleries: true,
      canDeleteGalleries: false,
      canViewGalleries: true,

      // News Management
      canCreateNews: true,
      canEditNews: true,
      canDeleteNews: false,
      canViewNews: true,

      // Analytics & Reports
      canViewAnalytics: true,
      canExportData: false,
      canViewReports: false,

      // System Administration
      canManageTenants: false,
      canManageRoles: false,
      canManageSettings: false,
      canViewSystemLogs: false,
    },
  },
  {
    name: "alumni",
    description: "Alumni with basic platform access",
    isSystemRole: true,
    permissions: {
      // User Management
      canCreateUsers: false,
      canEditUsers: false,
      canDeleteUsers: false,
      canViewUsers: true,
      canApproveUsers: false,

      // Content Management
      canCreatePosts: true,
      canEditPosts: false,
      canDeletePosts: false,
      canViewPosts: true,
      canModeratePosts: false,

      // Job Management
      canCreateJobs: true,
      canEditJobs: false,
      canDeleteJobs: false,
      canViewJobs: true,
      canEditAllJobs: false,
      canDeleteAllJobs: false,

      // Event Management
      canCreateEvents: false,
      canEditEvents: false,
      canDeleteEvents: false,
      canViewEvents: true,

      // Fundraising Management
      canCreateFundraisers: false,
      canEditFundraisers: false,
      canDeleteFundraisers: false,
      canViewFundraisers: true,

      // Gallery Management
      canCreateGalleries: false,
      canEditGalleries: false,
      canDeleteGalleries: false,
      canViewGalleries: true,

      // News Management
      canCreateNews: false,
      canEditNews: false,
      canDeleteNews: false,
      canViewNews: true,

      // Analytics & Reports
      canViewAnalytics: false,
      canExportData: false,
      canViewReports: false,

      // System Administration
      canManageTenants: false,
      canManageRoles: false,
      canManageSettings: false,
      canViewSystemLogs: false,
    },
  },
];

const seedRoles = async () => {
  try {
    await connectDB();

    console.log("🌱 Seeding roles...");

    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });

      if (!existingRole) {
        const role = new Role(roleData);
        await role.save();
        console.log(`✅ Created role: ${roleData.name}`);
      } else {
        console.log(`⏭️  Role already exists: ${roleData.name}`);
      }
    }

    console.log("🎉 Roles seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding roles:", error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedRoles();
}

export default seedRoles;
