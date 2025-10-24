import mongoose from "mongoose";
import User from "../models/User";
import connectDB from "../config/database";

const showCredentials = async () => {
  try {
    await connectDB();
    console.log("✅ Connected to database");

    const users = await User.find({}, "firstName lastName email role").sort({
      role: 1,
    });

    console.log("🎉 ALUMNI PORTAL - LOGIN CREDENTIALS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    users.forEach((user) => {
      console.log(`👤 ${user.role.toUpperCase()}:`);
      console.log(`   📧 Email:    ${user.email}`);
      console.log(`   🔑 Password: ${getPasswordForRole(user.role)}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
  }
};

const getPasswordForRole = (role: string) => {
  const passwords: { [key: string]: string } = {
    super_admin: "SuperAdmin123!",
    college_admin: "CollegeAdmin123!",
    hod: "HOD123!",
    staff: "Staff123!",
    alumni: "Alumni123!",
  };
  return passwords[role] || "Password123!";
};

showCredentials();
