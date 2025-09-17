import { UserRole } from "@/types";

// Define permissions for each role
export interface RolePermissions {
  // User Management
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canViewAllUsers: boolean;

  // College Management
  canManageColleges: boolean;
  canViewAllColleges: boolean;

  // Content Management
  canCreatePosts: boolean;
  canEditAllPosts: boolean;
  canDeletePosts: boolean;
  canPinPosts: boolean;
  canFeaturePosts: boolean;

  // Events Management
  canCreateEvents: boolean;
  canEditAllEvents: boolean;
  canDeleteEvents: boolean;

  // Job Management
  canCreateJobs: boolean;
  canEditAllJobs: boolean;
  canDeleteJobs: boolean;

  // Analytics & Reports
  canViewAnalytics: boolean;
  canExportData: boolean;

  // System Administration
  canManageSystem: boolean;
  canViewLogs: boolean;
}

// Role hierarchy levels (higher number = more permissions)
export const ROLE_HIERARCHY = {
  [UserRole.SUPER_ADMIN]: 5,
  [UserRole.COLLEGE_ADMIN]: 4,
  [UserRole.HOD]: 3,
  [UserRole.STAFF]: 2,
  [UserRole.ALUMNI]: 1,
};

// Permission definitions for each role
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  [UserRole.SUPER_ADMIN]: {
    // User Management
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewAllUsers: true,

    // College Management
    canManageColleges: true,
    canViewAllColleges: true,

    // Content Management
    canCreatePosts: true,
    canEditAllPosts: true,
    canDeletePosts: true,
    canPinPosts: true,
    canFeaturePosts: true,

    // Events Management
    canCreateEvents: true,
    canEditAllEvents: true,
    canDeleteEvents: true,

    // Job Management
    canCreateJobs: true,
    canEditAllJobs: true,
    canDeleteJobs: true,

    // Analytics & Reports
    canViewAnalytics: true,
    canExportData: true,

    // System Administration
    canManageSystem: true,
    canViewLogs: true,
  },

  [UserRole.COLLEGE_ADMIN]: {
    // User Management
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: false, // Cannot delete users
    canViewAllUsers: true,

    // College Management
    canManageColleges: false, // Can only manage their own college
    canViewAllColleges: false,

    // Content Management
    canCreatePosts: true,
    canEditAllPosts: true,
    canDeletePosts: true,
    canPinPosts: true,
    canFeaturePosts: true,

    // Events Management
    canCreateEvents: true,
    canEditAllEvents: true,
    canDeleteEvents: true,

    // Job Management
    canCreateJobs: true,
    canEditAllJobs: true,
    canDeleteJobs: true,

    // Analytics & Reports
    canViewAnalytics: true,
    canExportData: true,

    // System Administration
    canManageSystem: false,
    canViewLogs: false,
  },

  [UserRole.HOD]: {
    // User Management
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: false,
    canViewAllUsers: false, // Can only view department users

    // College Management
    canManageColleges: false,
    canViewAllColleges: false,

    // Content Management
    canCreatePosts: true,
    canEditAllPosts: false, // Can only edit their own posts
    canDeletePosts: false, // Can only delete their own posts
    canPinPosts: false,
    canFeaturePosts: false,

    // Events Management
    canCreateEvents: true,
    canEditAllEvents: false, // Can only edit their own events
    canDeleteEvents: false, // Can only delete their own events

    // Job Management
    canCreateJobs: true,
    canEditAllJobs: false, // Can only edit their own jobs
    canDeleteJobs: false, // Can only delete their own jobs

    // Analytics & Reports
    canViewAnalytics: true,
    canExportData: false,

    // System Administration
    canManageSystem: false,
    canViewLogs: false,
  },

  [UserRole.STAFF]: {
    // User Management
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewAllUsers: false,

    // College Management
    canManageColleges: false,
    canViewAllColleges: false,

    // Content Management
    canCreatePosts: true,
    canEditAllPosts: false, // Can only edit their own posts
    canDeletePosts: false, // Can only delete their own posts
    canPinPosts: false,
    canFeaturePosts: false,

    // Events Management
    canCreateEvents: true,
    canEditAllEvents: false, // Can only edit their own events
    canDeleteEvents: false, // Can only delete their own events

    // Job Management
    canCreateJobs: true,
    canEditAllJobs: false, // Can only edit their own jobs
    canDeleteJobs: false, // Can only delete their own jobs

    // Analytics & Reports
    canViewAnalytics: false,
    canExportData: false,

    // System Administration
    canManageSystem: false,
    canViewLogs: false,
  },

  [UserRole.ALUMNI]: {
    // User Management
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewAllUsers: false,

    // College Management
    canManageColleges: false,
    canViewAllColleges: false,

    // Content Management
    canCreatePosts: true,
    canEditAllPosts: false, // Can only edit their own posts
    canDeletePosts: false, // Can only delete their own posts
    canPinPosts: false,
    canFeaturePosts: false,

    // Events Management
    canCreateEvents: false,
    canEditAllEvents: false,
    canDeleteEvents: false,

    // Job Management
    canCreateJobs: false,
    canEditAllJobs: false,
    canDeleteJobs: false,

    // Analytics & Reports
    canViewAnalytics: false,
    canExportData: false,

    // System Administration
    canManageSystem: false,
    canViewLogs: false,
  },
};

// Helper function to check if a role has a specific permission
export const hasPermission = (
  role: UserRole,
  permission: keyof RolePermissions
): boolean => {
  return ROLE_PERMISSIONS[role][permission];
};

// Helper function to check if a role can perform an action on a resource
export const canPerformAction = (
  userRole: UserRole,
  action: string,
  resourceOwnerRole?: UserRole,
  resourceOwnerId?: string,
  currentUserId?: string
): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole];

  // Check if user has the basic permission
  const permissionKey =
    `can${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof RolePermissions;
  if (permissionKey in permissions && !permissions[permissionKey]) {
    return false;
  }

  // Check hierarchy for "All" permissions
  if (action.includes("All") && resourceOwnerRole) {
    const userLevel = ROLE_HIERARCHY[userRole];
    const ownerLevel = ROLE_HIERARCHY[resourceOwnerRole];
    return userLevel > ownerLevel;
  }

  // Check if user owns the resource
  if (resourceOwnerId && currentUserId) {
    return resourceOwnerId === currentUserId;
  }

  return true;
};

// Helper function to get all permissions for a role
export const getRolePermissions = (role: UserRole): RolePermissions => {
  return ROLE_PERMISSIONS[role];
};

// Helper function to check if user can access admin features
export const canAccessAdmin = (role: UserRole): boolean => {
  return [
    UserRole.SUPER_ADMIN,
    UserRole.COLLEGE_ADMIN,
    UserRole.HOD,
    UserRole.STAFF,
  ].includes(role);
};

// Helper function to check if user can manage other users
export const canManageUsers = (role: UserRole): boolean => {
  return [UserRole.SUPER_ADMIN, UserRole.COLLEGE_ADMIN, UserRole.HOD].includes(
    role
  );
};

// Helper function to check if user can manage content
export const canManageContent = (role: UserRole): boolean => {
  return [
    UserRole.SUPER_ADMIN,
    UserRole.COLLEGE_ADMIN,
    UserRole.HOD,
    UserRole.STAFF,
  ].includes(role);
};
