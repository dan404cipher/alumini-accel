import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Tenant from "../models/Tenant";
import connectDB from "../config/database";

const createAdminUsers = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log("✅ Connected to database");

    // Get or create default tenant
    let defaultTenant = await Tenant.findOne({ name: "Default University" });
    if (!defaultTenant) {
      // Get the super admin user to use as superAdminId
      const superAdmin = await User.findOne({ role: "super_admin" });
      if (!superAdmin) {
        throw new Error(
          "Super admin user not found. Please run createSuperAdmin.ts first."
        );
      }

      defaultTenant = new Tenant({
        name: "Default University",
        domain: "default.edu",
        superAdminId: superAdmin._id,
        isActive: true,
        settings: {
          allowAlumniRegistration: true,
          requireApproval: false,
          allowJobPosting: true,
          allowFundraising: true,
          allowMentorship: true,
          allowEvents: true,
          emailNotifications: true,
          whatsappNotifications: false,
          customBranding: false,
        },
        contactInfo: {
          email: "admin@default.edu",
          phone: "+1234567890",
          address: "123 University St, Test City",
          website: "https://default.edu",
        },
        subscription: {
          plan: "premium",
          status: "active",
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          maxUsers: 1000,
          features: ["unlimited_users", "custom_branding", "analytics"],
        },
      });
      await defaultTenant.save();
      console.log("✅ Created default tenant");
    }

    const adminUsers = [
      {
        firstName: "College",
        lastName: "Admin",
        email: "collegeadmin@alumni.com",
        password: "CollegeAdmin123!",
        role: "college_admin",
        college: "Test University",
        department: "Administration",
      },
      {
        firstName: "HOD",
        lastName: "User",
        email: "hod@alumni.com",
        password: "HOD123!",
        role: "hod",
        college: "Test University",
        department: "Computer Science",
      },
      {
        firstName: "Staff",
        lastName: "Member",
        email: "staff@alumni.com",
        password: "Staff123!",
        role: "staff",
        college: "Test University",
        department: "Student Affairs",
      },
      {
        firstName: "Regular",
        lastName: "Alumni",
        email: "alumni@alumni.com",
        password: "Alumni123!",
        role: "alumni",
        college: "Test University",
        department: "Computer Science",
        graduationYear: 2020,
      },
    ];

    console.log("🔧 Creating admin users...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    for (const userData of adminUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`⚠️  User already exists: ${userData.email}`);
        continue;
      }

      // Create user
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const user = new User({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        tenantId: defaultTenant._id, // Add tenantId for non-super-admin users
        isEmailVerified: true,
        profileImage: "",
        phoneNumber: "+1234567890",
        dateOfBirth: new Date("1990-01-01"),
        graduationYear: userData.graduationYear || 2015,
        department: userData.department,
        college: userData.college,
        currentCompany: "Test Company",
        currentPosition: `${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}`,
        location: "Test City",
        bio: `${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)} user for testing`,
        skills: ["Testing", "Administration"],
        interests: ["Technology", "Education"],
        socialLinks: {
          linkedin: `https://linkedin.com/in/${userData.role}`,
          twitter: `https://twitter.com/${userData.role}`,
          github: `https://github.com/${userData.role}`,
        },
        isActive: true,
        lastLoginAt: new Date(),
        emailVerificationToken: "",
        passwordResetToken: "",
        passwordResetExpires: undefined,
        emailVerificationExpires: undefined,
      });

      await user.save();
      console.log(`✅ Created: ${userData.email} (${userData.role})`);
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 All admin users created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 LOGIN CREDENTIALS:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    adminUsers.forEach((user) => {
      console.log(`👤 ${user.role.toUpperCase()}:`);
      console.log(`   📧 Email:    ${user.email}`);
      console.log(`   🔑 Password: ${user.password}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error creating admin users:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

// Run the script
createAdminUsers();
