import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import connectDB from "../config/database";

const debugPassword = async () => {
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

    console.log("🔍 Debugging password...");
    console.log("📧 Email:", superAdmin.email);
    console.log("🔐 Stored password hash:", superAdmin.password);

    // Test different passwords
    const passwords = [
      "SuperAdmin123!",
      "superadmin123!",
      "SuperAdmin123",
      "superadmin123",
      "SuperAdmin123! ",
      " SuperAdmin123!",
    ];

    for (const password of passwords) {
      const directComparison = await bcrypt.compare(
        password,
        superAdmin.password
      );
      console.log(`🔑 "${password}" -> ${directComparison}`);
    }

    // Test the method
    const methodResult = await superAdmin.comparePassword("SuperAdmin123!");
    console.log(`🔑 Method result: ${methodResult}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
  }
};

debugPassword();
