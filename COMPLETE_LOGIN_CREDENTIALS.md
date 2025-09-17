# 🎓 **Complete Login Credentials - 3 Colleges Multi-Tenant System**

**System:** AlumniAccel Platform  
**Colleges:** 3 (Tech University, Business School, Medical Institute)  
**Total Users:** 22 (1 Super Admin + 21 College Users)  
**Last Updated:** January 2024

---

## 🌍 **System Overview**

### **Multi-College Architecture:**

```
Super Admin (Global)
├── Tech University (7 users)
├── Business School (7 users)
└── Medical Institute (7 users)
```

### **User Distribution:**

- **Super Admin:** 1 (Global access)
- **College Admins:** 3 (One per college)
- **HODs:** 6 (2 per college)
- **Staff:** 6 (2 per college)
- **Alumni:** 6 (2 per college)

---

## 🔧 **SUPER ADMIN (Global Access)**

### **Complete System Control**

```
Email: superadmin@alumniaccel.com
Password: SuperAdmin@123
Role: super_admin
Access: ALL colleges, ALL users, system management
```

**What Super Admin Can Do:**

- ✅ View all 3 colleges and their data
- ✅ Manage all 22 users across all colleges
- ✅ Create new colleges and assign college admins
- ✅ Monitor system-wide activity and analytics
- ✅ Access global reports and system settings
- ✅ Impersonate any user for troubleshooting

---

## 🏫 **TECH UNIVERSITY**

### **College Admin**

```
Email: admin@techuniversity.edu
Password: TechAdmin@123
Role: college_admin
Access: Tech University only
```

### **HODs (Heads of Department)**

```
CS HOD:
Email: cs-hod@techuniversity.edu
Password: CSHOD@1234
Role: hod
Department: Computer Science

Engineering HOD:
Email: eng-hod@techuniversity.edu
Password: EngHOD@1234
Role: hod
Department: Engineering
```

### **Staff Members**

```
Staff 1 (Administration):
Email: staff1@techuniversity.edu
Password: TechStaff@1234
Role: staff
Department: Administration

Staff 2 (Student Affairs):
Email: staff2@techuniversity.edu
Password: TechStaff@1234
Role: staff
Department: Student Affairs
```

### **Alumni**

```
Alumni 1 (Google Engineer):
Email: alumni1@techuniversity.edu
Password: TechAlumni@1234
Role: alumni
Company: Google
Position: Senior Software Engineer

Alumni 2 (Microsoft PM):
Email: alumni2@techuniversity.edu
Password: TechAlumni@1234
Role: alumni
Company: Microsoft
Position: Product Manager
```

---

## 🏢 **BUSINESS SCHOOL**

### **College Admin**

```
Email: admin@businessschool.edu
Password: BusinessAdmin@123
Role: college_admin
Access: Business School only
```

### **HODs (Heads of Department)**

```
MBA HOD:
Email: mba-hod@businessschool.edu
Password: MBAHOD@1234
Role: hod
Department: MBA

Finance HOD:
Email: finance-hod@businessschool.edu
Password: FinanceHOD@1234
Role: hod
Department: Finance
```

### **Staff Members**

```
Staff 1 (Career Services):
Email: staff1@businessschool.edu
Password: BusinessStaff@1234
Role: staff
Department: Career Services

Staff 2 (Administration):
Email: staff2@businessschool.edu
Password: BusinessStaff@1234
Role: staff
Department: Administration
```

### **Alumni**

```
Alumni 1 (Goldman Sachs Banker):
Email: alumni1@businessschool.edu
Password: BusinessAlumni@1234
Role: alumni
Company: Goldman Sachs
Position: Investment Banker

Alumni 2 (Coca-Cola Marketing):
Email: alumni2@businessschool.edu
Password: BusinessAlumni@1234
Role: alumni
Company: Coca-Cola
Position: Marketing Director
```

---

## 🏥 **MEDICAL INSTITUTE**

### **College Admin**

```
Email: admin@medicalinstitute.edu
Password: MedicalAdmin@123
Role: college_admin
Access: Medical Institute only
```

### **HODs (Heads of Department)**

```
Medicine HOD:
Email: medicine-hod@medicalinstitute.edu
Password: MedicineHOD@1234
Role: hod
Department: Medicine

Nursing HOD:
Email: nursing-hod@medicalinstitute.edu
Password: NursingHOD@1234
Role: hod
Department: Nursing
```

### **Staff Members**

```
Staff 1 (Clinical Services):
Email: staff1@medicalinstitute.edu
Password: MedicalStaff@1234
Role: staff
Department: Clinical Services

Staff 2 (Student Affairs):
Email: staff2@medicalinstitute.edu
Password: MedicalStaff@1234
Role: staff
Department: Student Affairs
```

### **Alumni**

```
Alumni 1 (Mayo Clinic Cardiologist):
Email: alumni1@medicalinstitute.edu
Password: MedicalAlumni@1234
Role: alumni
Company: Mayo Clinic
Position: Cardiologist

Alumni 2 (Johns Hopkins Nurse):
Email: alumni2@medicalinstitute.edu
Password: MedicalAlumni@1234
Role: alumni
Company: Johns Hopkins
Position: Nurse Practitioner
```

---

## 🎯 **Testing Scenarios**

### **1. Super Admin Testing**

```
Login: superadmin@alumniaccel.com / SuperAdmin@123
Test:
- View all 3 colleges in dashboard
- See all 22 users across colleges
- Create new college
- Monitor global analytics
```

### **2. College Admin Testing**

```
Login: admin@techuniversity.edu / TechAdmin@123
Test:
- See only Tech University data
- Create HODs and staff
- Approve alumni applications
- Manage college branding
```

### **3. HOD Testing**

```
Login: cs-hod@techuniversity.edu / CSHOD@1234
Test:
- Manage staff under Computer Science
- Approve alumni from CS department
- Create posts for department
- View department contributions
```

### **4. Staff Testing**

```
Login: staff1@techuniversity.edu / TechStaff@1234
Test:
- Verify alumni applications
- Create posts and events
- Moderate content
- View analytics
```

### **5. Alumni Testing**

```
Login: alumni1@techuniversity.edu / TechAlumni@1234
Test:
- View college feed
- Post achievements
- Share job opportunities
- Contribute to fundraising
```

---

## 🔐 **Permission Matrix Verification**

### **Cross-College Access Test:**

1. **Login as Tech University Admin**

   - ✅ Should see only Tech University users
   - ❌ Should NOT see Business School or Medical Institute users

2. **Login as Business School HOD**

   - ✅ Should see only Business School staff/alumni
   - ❌ Should NOT see other colleges' data

3. **Login as Super Admin**
   - ✅ Should see ALL users from ALL colleges
   - ✅ Should be able to manage any college

---

## 🚀 **Quick Start Guide**

### **Step 1: Start the System**

```bash
# Terminal 1 - Backend
cd /Users/apple/Desktop/Alumni/alumini-accel/api
npm run dev

# Terminal 2 - Frontend
cd /Users/apple/Desktop/Alumni/alumini-accel/client
npm run dev
```

### **Step 2: Access the Application**

- **Frontend:** http://localhost:8081
- **Backend API:** http://localhost:3000

### **Step 3: Login and Test**

1. Go to http://localhost:8081/login
2. Use any credentials from above
3. Navigate to `/dashboard` to see role-specific interface
4. Test different roles to verify permissions

---

## 📊 **Data Summary**

### **Created Data:**

- ✅ **3 Colleges (Tenants)** with complete settings
- ✅ **22 Users** across all roles and colleges
- ✅ **Multi-tenant isolation** (users can only see their college)
- ✅ **Role-based permissions** implemented
- ✅ **Realistic user profiles** with company information

### **College Details:**

- **Tech University:** Technology-focused, 7 users
- **Business School:** Business education, 7 users
- **Medical Institute:** Healthcare education, 7 users

### **User Profiles:**

- **Super Admin:** Global platform management
- **College Admins:** College-specific management
- **HODs:** Department-level management
- **Staff:** Operational tasks and content moderation
- **Alumni:** Community engagement and networking

---

## 🎉 **Ready for Testing!**

The multi-college system is now fully set up with:

- ✅ Complete role-based access control
- ✅ Multi-tenant data isolation
- ✅ Realistic user data and profiles
- ✅ All permission matrices implemented
- ✅ Ready for comprehensive testing

**Start testing different roles to see how the system handles multi-college management and user isolation!** 🚀
