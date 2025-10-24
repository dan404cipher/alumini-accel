import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import connectDB from "../config/database";

const debugMethod = async () => {
  try {
    await connectDB();
    console.log("✅ Connected to database");

    const user = await User.findOne({
      email: "admin@test.com",
    }).select("+password");

    if (!user) {
      console.log("❌ User not found!");
      return;
    }

    console.log("🔍 Debugging comparePassword method...");
    console.log("📧 Email:", user.email);
    console.log("🔐 Password field exists:", !!user.password);
    console.log("🔐 Password field type:", typeof user.password);
    console.log("🔐 Password field length:", user.password?.length);

    // Test the method step by step
    const candidatePassword = "admin123";
    console.log("🔑 Candidate password:", candidatePassword);
    console.log("🔐 Stored password:", user.password);

    // Direct comparison
    const directResult = await bcrypt.compare(candidatePassword, user.password);
    console.log("🔑 Direct bcrypt result:", directResult);

    // Method comparison
    try {
      const methodResult = await user.comparePassword(candidatePassword);
      console.log("🔑 Method result:", methodResult);
    } catch (error) {
      console.log("❌ Method error:", error);
    }

    // Check if password field is accessible in method context
    console.log("🔍 Testing method context...");
    const testMethod = function (this: any) {
      console.log("🔐 this.password in method:", this.password);
      console.log("🔐 this.password type:", typeof this.password);
      return bcrypt.compare(candidatePassword, this.password);
    };

    const contextResult = await testMethod.call(user);
    console.log("🔑 Context test result:", contextResult);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
  }
};

debugMethod();
