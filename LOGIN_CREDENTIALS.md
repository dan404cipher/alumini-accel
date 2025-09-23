# 🔐 AlumniAccel - Complete Login Credentials Guide

**Document Version:** 1.0  
**Last Updated:** December 2024  
**System:** Alumni Management Platform

---

## 📋 Table of Contents

1. [Quick Access Credentials](#quick-access-credentials)
2. [Detailed User Accounts](#detailed-user-accounts)
3. [Role-Specific Access](#role-specific-access)
4. [Testing Scenarios](#testing-scenarios)
5. [API Endpoints](#api-endpoints)

---

## 🚀 Quick Access Credentials

### **Super Admin** (Level 5 - Full System Access)

```
Email: superadmin@alumniaccel.com
Password: SuperAdmin@123
Role: super_admin
```

### **College Admin** (Level 4 - College Management)

```
Email: collegeadmin@alumniaccel.com
Password: CollegeAdmin@123
Role: college_admin
```

### **HOD** (Level 3 - Department Management)

```
Email: hod@alumniaccel.com
Password: HOD@1234
Role: hod
```

### **Staff** (Level 2 - Basic Admin)

```
Email: staff@alumniaccel.com
Password: Staff@1234
Role: staff
```

### **Alumni** (Level 1 - Standard User)

```
Email: alumni@alumniaccel.com
Password: Alumni@1234
Role: alumni
```

---

## 👥 Detailed User Accounts

### 1. **SUPER ADMIN** - System Administrator

```
📧 Email: superadmin@alumniaccel.com
🔑 Password: SuperAdmin@123
👤 Name: John Smith
📱 Phone: +1-555-0001
🏢 Role: super_admin
✅ Status: Active
📧 Email Verified: Yes
📱 Phone Verified: Yes
🌍 Location: San Francisco, CA
🔗 LinkedIn: https://linkedin.com/in/john-smith-superadmin
```

**Capabilities:**

- Manage multiple colleges
- Full user lifecycle management
- System-wide content moderation
- Complete analytics access
- System configuration

---

### 2. **COLLEGE ADMIN** - College Administrator

```
📧 Email: collegeadmin@alumniaccel.com
🔑 Password: CollegeAdmin@123
👤 Name: Sarah Johnson
📱 Phone: +1-555-0002
🏢 Role: college_admin
✅ Status: Active
📧 Email Verified: Yes
📱 Phone Verified: Yes
🌍 Location: New York, NY
🔗 LinkedIn: https://linkedin.com/in/sarah-johnson-collegeadmin
```

**Capabilities:**

- College-level user management
- Content moderation for their college
- Event and job management
- College analytics access
- Cannot delete users or access system logs

---

### 3. **HOD** - Head of Department

```
📧 Email: hod@alumniaccel.com
🔑 Password: HOD@1234
👤 Name: Dr. Michael Chen
📱 Phone: +1-555-0003
🏢 Role: hod
✅ Status: Active
📧 Email Verified: Yes
📱 Phone Verified: Yes
🌍 Location: Boston, MA
🔗 LinkedIn: https://linkedin.com/in/michael-chen-hod
```

**Capabilities:**

- Department user creation and editing
- Manage own content/events/jobs
- Limited analytics access
- Cannot pin/feature posts
- Cannot export data

---

### 4. **STAFF** - College Staff

```
📧 Email: staff@alumniaccel.com
🔑 Password: Staff@1234
👤 Name: Emily Rodriguez
📱 Phone: +1-555-0004
🏢 Role: staff
✅ Status: Active
📧 Email Verified: Yes
📱 Phone Verified: Yes
🌍 Location: Chicago, IL
🔗 LinkedIn: https://linkedin.com/in/emily-rodriguez-staff
```

**Capabilities:**

- Create own content, events, and jobs
- Basic content creation
- No user management access
- No analytics access
- Limited administrative functions

---

### 5. **ALUMNI** - Alumni Member

```
📧 Email: alumni@alumniaccel.com
🔑 Password: Alumni@1234
👤 Name: David Kim
📱 Phone: +1-555-0005
🏢 Role: alumni
✅ Status: Active
📧 Email Verified: Yes
📱 Phone Verified: Yes
🌍 Location: Seattle, WA
🔗 LinkedIn: https://linkedin.com/in/david-kim-alumni
```

**Capabilities:**

- Create posts only
- Community participation
- Profile management
- Cannot create events or jobs
- No administrative functions

---

## 🎯 Additional Test Accounts

### **Multiple Alumni Accounts**

```
📧 Email: alumni1@alumniaccel.com
🔑 Password: Alumni@1234
👤 Name: Lisa Wang
🏢 Role: alumni

📧 Email: alumni2@alumniaccel.com
🔑 Password: Alumni@1234
👤 Name: Alex Thompson
🏢 Role: alumni

📧 Email: alumni3@alumniaccel.com
🔑 Password: Alumni@1234
👤 Name: Maria Garcia
🏢 Role: alumni
```

### **Multiple Staff Accounts**

```
📧 Email: staff1@alumniaccel.com
🔑 Password: Staff@1234
👤 Name: Robert Wilson
🏢 Role: staff

📧 Email: staff2@alumniaccel.com
🔑 Password: Staff@1234
👤 Name: Jennifer Brown
🏢 Role: staff
```

### **Multiple HOD Accounts**

```
📧 Email: hod1@alumniaccel.com
🔑 Password: HOD@1234
👤 Name: Dr. James Taylor
🏢 Role: hod

📧 Email: hod2@alumniaccel.com
🔑 Password: HOD@1234
👤 Name: Dr. Susan Davis
🏢 Role: hod
```

---

## 🔧 Role-Specific Access Testing

### **Super Admin Testing**

1. **Login:** `superadmin@alumniaccel.com` / `SuperAdmin@123`
2. **Expected Access:**
   - Admin Dashboard ✅
   - User Management ✅
   - Content Management ✅
   - Pin/Feature Posts ✅
   - Analytics Dashboard ✅
   - Export Data ✅
   - System Logs ✅
   - Multi-College Access ✅

### **College Admin Testing**

1. **Login:** `collegeadmin@alumniaccel.com` / `CollegeAdmin@123`
2. **Expected Access:**
   - Admin Dashboard ✅
   - User Management ✅
   - Content Management ✅
   - Pin/Feature Posts ✅
   - Analytics Dashboard ✅
   - Export Data ✅
   - System Logs ❌
   - Multi-College Access ❌

### **HOD Testing**

1. **Login:** `hod@alumniaccel.com` / `HOD@1234`
2. **Expected Access:**
   - Admin Dashboard ✅
   - User Management ✅
   - Content Management ❌
   - Pin/Feature Posts ❌
   - Analytics Dashboard ✅
   - Export Data ❌
   - System Logs ❌
   - Multi-College Access ❌

### **Staff Testing**

1. **Login:** `staff@alumniaccel.com` / `Staff@1234`
2. **Expected Access:**
   - Admin Dashboard ✅
   - User Management ❌
   - Content Management ❌
   - Pin/Feature Posts ❌
   - Analytics Dashboard ❌
   - Export Data ❌
   - System Logs ❌
   - Multi-College Access ❌

### **Alumni Testing**

1. **Login:** `alumni@alumniaccel.com` / `Alumni@1234`
2. **Expected Access:**
   - Admin Dashboard ❌
   - User Management ❌
   - Content Management ❌
   - Pin/Feature Posts ❌
   - Analytics Dashboard ❌
   - Export Data ❌
   - System Logs ❌
   - Multi-College Access ❌

---

## 🧪 Testing Scenarios

### **Scenario 1: Post Creation & Management**

1. **Login as Alumni:** `alumni@alumniaccel.com`
2. **Action:** Create a post
3. **Expected:** ✅ Success - Can create posts
4. **Login as Staff:** `staff@alumniaccel.com`
5. **Action:** Try to pin the alumni's post
6. **Expected:** ❌ No pin button visible

### **Scenario 2: User Management**

1. **Login as HOD:** `hod@alumniaccel.com`
2. **Action:** Access User Management
3. **Expected:** ✅ Can view and edit users
4. **Login as Staff:** `staff@alumniaccel.com`
5. **Action:** Try to access User Management
6. **Expected:** ❌ User Management not visible in navigation

### **Scenario 3: Content Moderation**

1. **Login as College Admin:** `collegeadmin@alumniaccel.com`
2. **Action:** Pin and feature posts
3. **Expected:** ✅ Can pin and feature any post
4. **Login as HOD:** `hod@alumniaccel.com`
5. **Action:** Try to pin posts
6. **Expected:** ❌ No pin/feature buttons visible

### **Scenario 4: Analytics Access**

1. **Login as Super Admin:** `superadmin@alumniaccel.com`
2. **Action:** Access Analytics Dashboard
3. **Expected:** ✅ Full analytics access
4. **Login as Staff:** `staff@alumniaccel.com`
5. **Action:** Try to access Analytics
6. **Expected:** ❌ Analytics not visible in navigation

---

## 🌐 API Endpoints

### **Authentication Endpoints**

```
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
```

### **Login Request Format**

```json
{
  "email": "superadmin@alumniaccel.com",
  "password": "SuperAdmin@123"
}
```

### **Login Response Format**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "superadmin@alumniaccel.com",
      "firstName": "John",
      "lastName": "Smith",
      "role": "super_admin",
      "status": "active"
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

---

## 🚀 Quick Setup Instructions

### **1. Run Database Seeding**

```bash
cd alumini-accel/api
npm run seed
```

### **2. Start the Application**

```bash
# Backend
cd alumini-accel/api
npm start

# Frontend
cd alumini-accel/client
npm start
```

### **3. Access the Application**

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Documentation:** http://localhost:5000/api-docs

### **4. Test Login**

1. Go to http://localhost:3000/login
2. Use any of the credentials above
3. Verify role-based access in the UI

---

## 🔒 Security Notes

- **All passwords** meet the minimum 8-character requirement
- **Passwords include** uppercase, lowercase, numbers, and special characters
- **All accounts** are pre-verified and active
- **JWT tokens** are generated for each login
- **Role-based access** is enforced at both frontend and backend

---

## 📞 Support

If you encounter any issues with login credentials:

1. **Check Database:** Ensure the seed script ran successfully
2. **Verify Environment:** Check that MongoDB is running
3. **Check Logs:** Review application logs for errors
4. **Reset Data:** Run `npm run seed` to recreate test data

---

**Document End**

_This document provides comprehensive login credentials for testing all role-based features in the AlumniAccel system. All accounts are pre-configured and ready for immediate use._
