import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import connectDB from "../config/database";

const updateAdminPasswords = async () => {
  try {
    await connectDB();
    console.log("✅ Connected to database");

    const adminUsers = [
      {
        email: "collegeadmin@alumni.com",
        password: "CollegeAdmin123!",
        role: "college_admin",
      },
      {
        email: "hod@alumni.com",
        password: "HOD123!",
        role: "hod",
      },
      {
        email: "staff@alumni.com",
        password: "Staff123!",
        role: "staff",
      },
      {
        email: "alumni@alumni.com",
        password: "Alumni123!",
        role: "alumni",
      },
    ];

    console.log("🔧 Updating admin user passwords...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    for (const userData of adminUsers) {
      const user = await User.findOne({ email: userData.email });

      if (user) {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        // Update the user's password
        await User.findByIdAndUpdate(user._id, {
          password: hashedPassword,
          status: "active", // Also ensure they're active
        });

        console.log(`✅ Updated ${userData.email} (${userData.role}) password`);
      } else {
        console.log(`❌ User not found: ${userData.email}`);
      }
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 All admin user passwords updated!");
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
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
  }
};

updateAdminPasswords();
