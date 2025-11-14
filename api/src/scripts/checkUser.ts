import mongoose from "mongoose";
import User from "../models/User";
import connectDB from "../config/database";

const checkUser = async () => {
  try {
    await connectDB();
    console.log("✅ Connected to database");

    const superAdmin = await User.findOne({
      email: "superadmin@alumni.com",
    }).select("email role firstName lastName status isEmailVerified");

    if (superAdmin) {
      console.log("✅ Super Admin found:");
      console.log("📧 Email:", superAdmin.email);
      console.log("👤 Role:", superAdmin.role);
      console.log("👤 Name:", superAdmin.firstName, superAdmin.lastName);
      console.log("✅ Status:", superAdmin.status);
      console.log("✅ Email Verified:", superAdmin.isEmailVerified);
    } else {
      console.log("❌ Super Admin not found!");
    }

    // Also check other admin users
    const adminUsers = await User.find({
      role: { $in: ["super_admin", "college_admin", "hod", "staff"] },
    }).select("email role firstName lastName status isEmailVerified");

    console.log("\n📋 All Admin Users:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    adminUsers.forEach((user) => {
      console.log(
        `👤 ${user.role.toUpperCase()}: ${user.email} (Status: ${user.status}, Verified: ${user.isEmailVerified})`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
  }
};

checkUser();
