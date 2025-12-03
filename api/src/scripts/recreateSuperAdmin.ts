import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import connectDB from "../config/database";
import { UserRole, UserStatus } from "../types";

const recreateSuperAdmin = async () => {
  try {
    await connectDB();
    console.log("✅ Connected to database");

    // Delete existing super admin
    await User.deleteOne({ email: "superadmin@alumni.com" });
    console.log("🗑️  Deleted existing super admin");

    // Create new super admin with correct password
    const hashedPassword = await bcrypt.hash("SuperAdmin123!", 12);

    const superAdmin = new User({
      firstName: "Super",
      lastName: "Admin",
      email: "superadmin@alumni.com",
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      phone: "+1234567890",
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
      lastLoginAt: new Date(),
      emailVerificationToken: "",
      passwordResetToken: "",
      passwordResetExpires: undefined,
      emailVerificationExpires: undefined,
    });

    await superAdmin.save();

    console.log("🎉 Super Admin recreated successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 EMAIL:    superadmin@alumni.com");
    console.log("🔑 PASSWORD: SuperAdmin123!");
    console.log("👤 ROLE:     super_admin");
    console.log("✅ STATUS:   active (ACTIVE)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Test the password
    const testPassword = "SuperAdmin123!";
    const isPasswordValid = await superAdmin.comparePassword(testPassword);
    console.log("🔑 Password test result:", isPasswordValid);
  } catch (error) {
    console.error("❌ Error creating super admin:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

recreateSuperAdmin();
