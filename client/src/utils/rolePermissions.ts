// Frontend role permissions utility
export enum UserRole {
  SUPER_ADMIN = "super_admin",
  COLLEGE_ADMIN = "college_admin",
  HOD = "hod",
  STAFF = "staff",
  ALUMNI = "alumni",
}

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
  role: string,
  permission: keyof RolePermissions
): boolean => {
  const userRole = role as UserRole;
  if (!Object.values(UserRole).includes(userRole)) {
    return false;
  }
  return ROLE_PERMISSIONS[userRole][permission];
};

// Helper function to check if user can perform an action on a resource
export const canPerformAction = (
  userRole: string,
  action: string,
  resourceOwnerRole?: string,
  resourceOwnerId?: string,
  currentUserId?: string
): boolean => {
  const role = userRole as UserRole;
  if (!Object.values(UserRole).includes(role)) {
    return false;
  }

  const permissions = ROLE_PERMISSIONS[role];

  // Check if user has the basic permission
  const permissionKey = `can${
    action.charAt(0).toUpperCase() + action.slice(1)
  }` as keyof RolePermissions;
  if (permissionKey in permissions && !permissions[permissionKey]) {
    return false;
  }

  // Check hierarchy for "All" permissions
  if (action.includes("All") && resourceOwnerRole) {
    const userLevel = ROLE_HIERARCHY[role];
    const ownerLevel = ROLE_HIERARCHY[resourceOwnerRole as UserRole] || 0;
    return userLevel > ownerLevel;
  }

  // Check if user owns the resource
  if (resourceOwnerId && currentUserId) {
    return resourceOwnerId === currentUserId;
  }

  return true;
};

// Helper function to get all permissions for a role
export const getRolePermissions = (role: string): RolePermissions | null => {
  const userRole = role as UserRole;
  if (!Object.values(UserRole).includes(userRole)) {
    return null;
  }
  return ROLE_PERMISSIONS[userRole];
};

// Helper function to check if user can access admin features
export const canAccessAdmin = (role: string): boolean => {
  return [
    UserRole.SUPER_ADMIN,
    UserRole.COLLEGE_ADMIN,
    UserRole.HOD,
    UserRole.STAFF,
  ].includes(role as UserRole);
};

// Helper function to check if user can manage other users
export const canManageUsers = (role: string): boolean => {
  return [UserRole.SUPER_ADMIN, UserRole.COLLEGE_ADMIN, UserRole.HOD].includes(
    role as UserRole
  );
};

// Helper function to check if user can manage content
export const canManageContent = (role: string): boolean => {
  return [
    UserRole.SUPER_ADMIN,
    UserRole.COLLEGE_ADMIN,
    UserRole.HOD,
    UserRole.STAFF,
  ].includes(role as UserRole);
};

// Helper function to get role display name
export const getRoleDisplayName = (role: string): string => {
  const roleNames = {
    [UserRole.SUPER_ADMIN]: "Super Admin",
    [UserRole.COLLEGE_ADMIN]: "College Admin",
    [UserRole.HOD]: "Head of Department",
    [UserRole.STAFF]: "Staff",
    [UserRole.ALUMNI]: "Alumni",
  };

  return roleNames[role as UserRole] || role;
};

// Helper function to get role color for UI
export const getRoleColor = (role: string): string => {
  const roleColors = {
    [UserRole.SUPER_ADMIN]: "bg-red-100 text-red-800",
    [UserRole.COLLEGE_ADMIN]: "bg-purple-100 text-purple-800",
    [UserRole.HOD]: "bg-blue-100 text-blue-800",
    [UserRole.STAFF]: "bg-green-100 text-green-800",
    [UserRole.ALUMNI]: "bg-gray-100 text-gray-800",
  };

  return roleColors[role as UserRole] || "bg-gray-100 text-gray-800";
};
