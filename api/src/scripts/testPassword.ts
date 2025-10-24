import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import connectDB from "../config/database";

const testPassword = async () => {
  try {
    await connectDB();
    console.log("✅ Connected to database");

    const superAdmin = await User.findOne({
      email: "superadmin@alumni.com",
    }).select("+password");

    if (!superAdmin) {
      console.log("❌ Super Admin not found!");
      return;
    }

    console.log("🔍 Testing password comparison...");
    console.log("📧 Email:", superAdmin.email);
    console.log("👤 Role:", superAdmin.role);
    console.log("✅ Status:", superAdmin.status);

    // Test password comparison
    const testPassword = "SuperAdmin123!";
    const isPasswordValid = await superAdmin.comparePassword(testPassword);

    console.log("🔑 Password test result:", isPasswordValid);

    // Also test with bcrypt directly
    const directComparison = await bcrypt.compare(
      testPassword,
      superAdmin.password
    );
    console.log("🔑 Direct bcrypt comparison:", directComparison);

    // Show password hash (first 20 chars)
    console.log(
      "🔐 Password hash (first 20 chars):",
      superAdmin.password.substring(0, 20) + "..."
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
  }
};

testPassword();
