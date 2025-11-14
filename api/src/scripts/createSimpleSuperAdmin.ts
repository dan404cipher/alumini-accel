import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import connectDB from "../config/database";

const createSimpleSuperAdmin = async () => {
  try {
    await connectDB();
    console.log("✅ Connected to database");

    // Delete existing super admin
    await User.deleteOne({ email: "admin@test.com" });

    // Create with a simple password
    const simplePassword = "admin123";
    const hashedPassword = await bcrypt.hash(simplePassword, 12);

    console.log("🔑 Original password:", simplePassword);
    console.log("🔐 Hashed password:", hashedPassword);

    const superAdmin = new User({
      firstName: "Test",
      lastName: "Admin",
      email: "admin@test.com",
      password: hashedPassword,
      role: "super_admin",
      status: "active",
      isEmailVerified: true,
      phone: "+1234567890",
      dateOfBirth: new Date("1990-01-01"),
      graduationYear: 2010,
      department: "Computer Science",
      college: "Test University",
      currentCompany: "Alumni Portal",
      currentPosition: "Super Administrator",
      location: "Global",
      bio: "Test Super Administrator",
      skills: ["Administration"],
      interests: ["Technology"],
      socialLinks: {
        linkedin: "https://linkedin.com/in/testadmin",
        twitter: "https://twitter.com/testadmin",
        github: "https://github.com/testadmin",
      },
      lastLoginAt: new Date(),
      emailVerificationToken: "",
      passwordResetToken: "",
      passwordResetExpires: undefined,
      emailVerificationExpires: undefined,
    });

    await superAdmin.save();

    // Test the password immediately
    const testResult = await bcrypt.compare(simplePassword, hashedPassword);
    console.log("🔑 Direct test result:", testResult);

    const methodResult = await superAdmin.comparePassword(simplePassword);
    console.log("🔑 Method test result:", methodResult);

    console.log("🎉 Simple Super Admin created!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 EMAIL:    admin@test.com");
    console.log("🔑 PASSWORD: admin123");
    console.log("👤 ROLE:     super_admin");
    console.log("✅ STATUS:   active");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
  }
};

createSimpleSuperAdmin();
