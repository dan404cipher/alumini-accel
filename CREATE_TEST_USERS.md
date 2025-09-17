# 🚀 Create Test Users - Quick Setup Guide

## 📋 **Complete Login Credentials for All Roles**

### **🔑 Primary Test Accounts**

| Role | Email | Password | Name | Level |
|------|-------|----------|------|-------|
| **Super Admin** | `superadmin@alumniaccel.com` | `SuperAdmin@123` | John Smith | 5 |
| **College Admin** | `collegeadmin@alumniaccel.com` | `CollegeAdmin@123` | Sarah Johnson | 4 |
| **HOD** | `hod@alumniaccel.com` | `HOD@123` | Dr. Michael Chen | 3 |
| **Staff** | `staff@alumniaccel.com` | `Staff@123` | Emily Rodriguez | 2 |
| **Alumni** | `alumni@alumniaccel.com` | `Alumni@123` | David Kim | 1 |

### **🔑 Additional Test Accounts**

| Role | Email | Password | Name |
|------|-------|----------|------|
| **HOD** | `hod1@alumniaccel.com` | `HOD@123` | Dr. James Taylor |
| **Staff** | `staff1@alumniaccel.com` | `Staff@123` | Robert Wilson |
| **Alumni** | `alumni1@alumniaccel.com` | `Alumni@123` | Lisa Wang |
| **Alumni** | `alumni2@alumniaccel.com` | `Alumni@123` | Alex Thompson |

---

## 🛠️ **Setup Instructions**

### **Step 1: Run Database Seeding**
```bash
cd alumini-accel/api
npm run seed
```

### **Step 2: Start the Application**
```bash
# Terminal 1 - Backend
cd alumini-accel/api
npm start

# Terminal 2 - Frontend  
cd alumini-accel/client
npm start
```

### **Step 3: Access the Application**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Login Page:** http://localhost:3000/login

---

## 🧪 **Quick Testing Guide**

### **Test Super Admin Access**
1. Login: `superadmin@alumniaccel.com` / `SuperAdmin@123`
2. ✅ Should see: Admin Dashboard, User Management, Content Management, Analytics
3. ✅ Should be able to: Pin posts, Feature posts, Export data, View system logs

### **Test College Admin Access**
1. Login: `collegeadmin@alumniaccel.com` / `CollegeAdmin@123`
2. ✅ Should see: Admin Dashboard, User Management, Content Management, Analytics
3. ❌ Should NOT see: System logs, Multi-college access

### **Test HOD Access**
1. Login: `hod@alumniaccel.com` / `HOD@123`
2. ✅ Should see: Admin Dashboard, User Management, Analytics
3. ❌ Should NOT see: Content Management, Pin/Feature buttons, Export data

### **Test Staff Access**
1. Login: `staff@alumniaccel.com` / `Staff@123`
2. ✅ Should see: Admin Dashboard
3. ❌ Should NOT see: User Management, Content Management, Analytics

### **Test Alumni Access**
1. Login: `alumni@alumniaccel.com` / `Alumni@123`
2. ✅ Should see: Standard user interface
3. ❌ Should NOT see: Admin Dashboard, User Management, Content Management

---

## 🔍 **Role-Based Feature Testing**

### **Post Creation & Management**
- **Alumni:** Can create posts ✅
- **Staff:** Can create posts ✅
- **HOD:** Can create posts ✅
- **College Admin:** Can create, edit, pin, feature posts ✅
- **Super Admin:** Can create, edit, pin, feature posts ✅

### **User Management**
- **Alumni:** No access ❌
- **Staff:** No access ❌
- **HOD:** Can create/edit users ✅
- **College Admin:** Can create/edit users ✅
- **Super Admin:** Can create/edit/delete users ✅

### **Content Moderation**
- **Alumni:** No moderation ❌
- **Staff:** No moderation ❌
- **HOD:** No moderation ❌
- **College Admin:** Can pin/feature posts ✅
- **Super Admin:** Can pin/feature posts ✅

### **Analytics Access**
- **Alumni:** No access ❌
- **Staff:** No access ❌
- **HOD:** Limited analytics ✅
- **College Admin:** Full analytics ✅
- **Super Admin:** Full analytics ✅

---

## 🚨 **Troubleshooting**

### **If Login Fails:**
1. Check if MongoDB is running
2. Verify the seed script completed successfully
3. Check browser console for errors
4. Try running `npm run seed` again

### **If Role Features Don't Work:**
1. Clear browser cache and cookies
2. Logout and login again
3. Check the role in the user dropdown
4. Verify the role permissions are correctly set

### **If Database Issues:**
1. Stop the application
2. Run `npm run seed` to recreate test data
3. Restart the application
4. Try logging in again

---

## 📞 **Support**

If you encounter any issues:
1. Check the console logs for errors
2. Verify all environment variables are set
3. Ensure MongoDB is running and accessible
4. Run the seed script to recreate test data

---

**Ready to test! All accounts are pre-configured and ready for immediate use.** 🎉
