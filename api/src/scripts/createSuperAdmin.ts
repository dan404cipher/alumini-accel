import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import connectDB from "../config/database";

const createSuperAdmin = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log("✅ Connected to database");

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({
      role: "super_admin",
      email: "superadmin@alumni.com",
    });

    if (existingSuperAdmin) {
      console.log("❌ Super admin already exists!");
      console.log("📧 Email: superadmin@alumni.com");
      console.log("🔑 Password: SuperAdmin123!");
      return;
    }

    // Create super admin user
    const hashedPassword = await bcrypt.hash("SuperAdmin123!", 12);

    const superAdmin = new User({
      firstName: "Super",
      lastName: "Admin",
      email: "superadmin@alumni.com",
      password: hashedPassword,
      role: "super_admin",
      isEmailVerified: true,
      profileImage: "",
      phoneNumber: "+1234567890",
      dateOfBirth: new Date("1990-01-01"),
      graduationYear: 2010,
      department: "Computer Science",
      college: "Test University",
      currentCompany: "Alumni Portal",
      currentPosition: "Super Administrator",
      location: "Global",
      bio: "Super Administrator of the Alumni Portal System",
      skills: ["Administration", "System Management", "User Management"],
      interests: ["Technology", "Education", "Networking"],
      socialLinks: {
        linkedin: "https://linkedin.com/in/superadmin",
        twitter: "https://twitter.com/superadmin",
        github: "https://github.com/superadmin",
      },
      isActive: true,
      lastLoginAt: new Date(),
      emailVerificationToken: "",
      passwordResetToken: "",
      passwordResetExpires: undefined,
      emailVerificationExpires: undefined,
    });

    await superAdmin.save();

    console.log("🎉 Super Admin created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 EMAIL:    superadmin@alumni.com");
    console.log("🔑 PASSWORD: SuperAdmin123!");
    console.log("👤 ROLE:     super_admin");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ You can now login with these credentials!");
  } catch (error) {
    console.error("❌ Error creating super admin:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

// Run the script
createSuperAdmin();
