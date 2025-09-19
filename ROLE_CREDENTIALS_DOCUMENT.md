# 🎯 AlumniAccel - Complete Role Credentials & Permissions Guide

**Document Version:** 1.0  
**Last Updated:** December 2024  
**System:** Alumni Management Platform

---

## 📋 Table of Contents

1. [Role Hierarchy Overview](#role-hierarchy-overview)
2. [Detailed Role Permissions](#detailed-role-permissions)
3. [UI Access Matrix](#ui-access-matrix)
4. [Technical Implementation](#technical-implementation)
5. [Permission Categories](#permission-categories)
6. [Role Comparison Chart](#role-comparison-chart)

---

## 🏗️ Role Hierarchy Overview

The AlumniAccel system implements a 5-level role hierarchy where higher numbers indicate greater authority:

| Level | Role Code       | Display Name       | Authority Scope                           |
| ----- | --------------- | ------------------ | ----------------------------------------- |
| **5** | `super_admin`   | Super Admin        | Full System Access - Multiple Colleges    |
| **4** | `college_admin` | College Admin      | College-Level Management - Single College |
| **3** | `hod`           | Head of Department | Department-Level Management               |
| **2** | `staff`         | Staff              | Basic Admin Features                      |
| **1** | `alumni`        | Alumni             | Standard User Features                    |

---

## 🔐 Detailed Role Permissions

### 1. SUPER ADMIN (`super_admin`) - Level 5

**🎯 Scope:** Complete system control across multiple colleges

#### ✅ Full Permissions

- **User Management:** Create, Edit, Delete, View All Users
- **College Management:** Manage All Colleges, View All Colleges
- **Content Management:** Create, Edit All, Delete, Pin, Feature Posts
- **Events Management:** Create, Edit All, Delete Events
- **Job Management:** Create, Edit All, Delete Jobs
- **Analytics & Reports:** View Analytics, Export Data
- **System Administration:** Manage System, View Logs

#### 🔑 Key Capabilities

- Multi-tenant college management
- Complete user lifecycle control
- System-wide content moderation
- Full analytics and reporting access
- System configuration and maintenance

---

### 2. COLLEGE ADMIN (`college_admin`) - Level 4

**🎯 Scope:** Single college management within the system

#### ✅ Permissions Granted

- **User Management:** Create Users, Edit Users, View All Users
- **Content Management:** Create, Edit All, Delete, Pin, Feature Posts
- **Events Management:** Create, Edit All, Delete Events
- **Job Management:** Create, Edit All, Delete Jobs
- **Analytics & Reports:** View Analytics, Export Data

#### ❌ Restrictions

- **User Management:** Cannot Delete Users
- **College Management:** Cannot Manage Other Colleges
- **System Administration:** No System Management or Log Access

#### 🔑 Key Capabilities

- College-level user management
- Complete content moderation for their college
- Full event and job management
- College-specific analytics and reporting

---

### 3. HOD (Head of Department) (`hod`) - Level 3

**🎯 Scope:** Department-level operations within their college

#### ✅ Permissions Granted

- **User Management:** Create Users, Edit Users
- **Content Management:** Create Posts (Own Only)
- **Events Management:** Create Events (Own Only)
- **Job Management:** Create Jobs (Own Only)
- **Analytics & Reports:** View Analytics (Limited)

#### ❌ Restrictions

- **User Management:** Cannot Delete Users, Cannot View All Users
- **Content Management:** Cannot Edit All Posts, Cannot Pin/Feature Posts
- **Events Management:** Cannot Edit All Events, Cannot Delete Events
- **Job Management:** Cannot Edit All Jobs, Cannot Delete Jobs
- **Analytics & Reports:** Cannot Export Data
- **System Administration:** No Access

#### 🔑 Key Capabilities

- Department user creation and editing
- Own content/events/jobs management
- Limited analytics access
- Department-level oversight

---

### 4. STAFF (`staff`) - Level 2

**🎯 Scope:** Basic administrative functions within their college

#### ✅ Permissions Granted

- **Content Management:** Create Posts (Own Only)
- **Events Management:** Create Events (Own Only)
- **Job Management:** Create Jobs (Own Only)

#### ❌ Restrictions

- **User Management:** No User Management Access
- **Content Management:** Cannot Edit All Posts, Cannot Pin/Feature Posts
- **Events Management:** Cannot Edit All Events, Cannot Delete Events
- **Job Management:** Cannot Edit All Jobs, Cannot Delete Jobs
- **Analytics & Reports:** No Access
- **System Administration:** No Access

#### 🔑 Key Capabilities

- Create own content, events, and jobs
- Basic content creation
- Limited administrative functions

---

### 5. ALUMNI (`alumni`) - Level 1

**🎯 Scope:** Standard community participation

#### ✅ Permissions Granted

- **Content Management:** Create Posts (Own Only)

#### ❌ Restrictions

- **User Management:** No Access
- **College Management:** No Access
- **Content Management:** Cannot Edit All Posts, Cannot Pin/Feature Posts
- **Events Management:** No Access
- **Job Management:** No Access
- **Analytics & Reports:** No Access
- **System Administration:** No Access

#### 🔑 Key Capabilities

- Community post creation
- Basic profile management
- Alumni network participation

---

## 🎨 UI Access Matrix

| Feature                  | Super Admin | College Admin | HOD | Staff | Alumni |
| ------------------------ | ----------- | ------------- | --- | ----- | ------ |
| **Admin Dashboard**      | ✅          | ✅            | ✅  | ✅    | ❌     |
| **User Management**      | ✅          | ✅            | ✅  | ❌    | ❌     |
| **Content Management**   | ✅          | ✅            | ❌  | ❌    | ❌     |
| **Pin Posts**            | ✅          | ✅            | ❌  | ❌    | ❌     |
| **Feature Posts**        | ✅          | ✅            | ❌  | ❌    | ❌     |
| **Create Events**        | ✅          | ✅            | ✅  | ✅    | ❌     |
| **Create Jobs**          | ✅          | ✅            | ✅  | ✅    | ❌     |
| **Analytics Dashboard**  | ✅          | ✅            | ✅  | ❌    | ❌     |
| **Export Data**          | ✅          | ✅            | ❌  | ❌    | ❌     |
| **System Logs**          | ✅          | ❌            | ❌  | ❌    | ❌     |
| **Multi-College Access** | ✅          | ❌            | ❌  | ❌    | ❌     |

---

## 🔧 Technical Implementation

### Role Enumeration

```typescript
enum UserRole {
  SUPER_ADMIN = "super_admin",
  COLLEGE_ADMIN = "college_admin",
  HOD = "hod",
  STAFF = "staff",
  ALUMNI = "alumni",
}
```

### Permission Interface

```typescript
interface RolePermissions {
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
```

### Permission Checking Functions

```typescript
// Check specific permission
hasPermission(userRole, "canCreatePosts");

// Check action with hierarchy
canPerformAction(
  userRole,
  "editPosts",
  resourceOwnerRole,
  resourceOwnerId,
  currentUserId
);

// Check admin access
canAccessAdmin(userRole);

// Check user management
canManageUsers(userRole);

// Check content management
canManageContent(userRole);
```

---

## 📊 Permission Categories

### 1. User Management

- **Create Users:** Add new users to the system
- **Edit Users:** Modify existing user information
- **Delete Users:** Remove users from the system
- **View All Users:** Access complete user directory

### 2. College Management

- **Manage Colleges:** Create, edit, delete college entities
- **View All Colleges:** Access multi-college directory

### 3. Events Management

- **Create Events:** Schedule new events
- **Edit All Events:** Modify any event in the system
- **Delete Events:** Remove events from the system

### 4. Job Management

- **Create Jobs:** Post new job opportunities
- **Edit All Jobs:** Modify any job posting
- **Delete Jobs:** Remove job postings

### 5. Analytics & Reports

- **View Analytics:** Access system statistics and reports
- **Export Data:** Download data in various formats

### 6. System Administration

- **Manage System:** Configure system settings
- **View Logs:** Access system logs and audit trails

---

## 📈 Role Comparison Chart

| Permission            | Super Admin | College Admin | HOD | Staff | Alumni |
| --------------------- | ----------- | ------------- | --- | ----- | ------ |
| **Create Users**      | ✅          | ✅            | ✅  | ❌    | ❌     |
| **Edit Users**        | ✅          | ✅            | ✅  | ❌    | ❌     |
| **Delete Users**      | ✅          | ❌            | ❌  | ❌    | ❌     |
| **View All Users**    | ✅          | ✅            | ❌  | ❌    | ❌     |
| **Manage Colleges**   | ✅          | ❌            | ❌  | ❌    | ❌     |
| **View All Colleges** | ✅          | ❌            | ❌  | ❌    | ❌     |
| **Create Posts**      | ✅          | ✅            | ✅  | ✅    | ✅     |
| **Edit All Posts**    | ✅          | ✅            | ❌  | ❌    | ❌     |
| **Delete Posts**      | ✅          | ✅            | ❌  | ❌    | ❌     |
| **Pin Posts**         | ✅          | ✅            | ❌  | ❌    | ❌     |
| **Feature Posts**     | ✅          | ✅            | ❌  | ❌    | ❌     |
| **Create Events**     | ✅          | ✅            | ✅  | ✅    | ❌     |
| **Edit All Events**   | ✅          | ✅            | ❌  | ❌    | ❌     |
| **Delete Events**     | ✅          | ✅            | ❌  | ❌    | ❌     |
| **Create Jobs**       | ✅          | ✅            | ✅  | ✅    | ❌     |
| **Edit All Jobs**     | ✅          | ✅            | ❌  | ❌    | ❌     |
| **Delete Jobs**       | ✅          | ✅            | ❌  | ❌    | ❌     |
| **View Analytics**    | ✅          | ✅            | ✅  | ❌    | ❌     |
| **Export Data**       | ✅          | ✅            | ❌  | ❌    | ❌     |
| **Manage System**     | ✅          | ❌            | ❌  | ❌    | ❌     |
| **View Logs**         | ✅          | ❌            | ❌  | ❌    | ❌     |

---

## 🚀 Implementation Notes

### Security Considerations

- All permissions are enforced at both frontend and backend levels
- Role hierarchy prevents lower-level users from accessing higher-level functions
- Resource ownership is checked for "own only" permissions
- JWT tokens include role information for authorization

### Best Practices

- Always check permissions before displaying UI elements
- Implement proper error handling for unauthorized access attempts
- Regular audit of role assignments and permissions
- Clear documentation of role responsibilities

### Future Enhancements

- Custom role creation for specific organizational needs
- Time-based permission grants
- Department-specific permission overrides
- Advanced audit logging for permission changes

---

**Document End**

_This document provides a comprehensive overview of the AlumniAccel role-based access control system. For technical implementation details, refer to the source code in the `/api/src/config/rolePermissions.ts` and `/client/src/utils/rolePermissions.ts` files._
