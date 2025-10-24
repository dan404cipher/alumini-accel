import mongoose from "mongoose";
import User from "../models/User";
import connectDB from "../config/database";

const fixUserStatuses = async () => {
  try {
    await connectDB();
    console.log("✅ Connected to database");

    // Update super admin status to active
    const superAdmin = await User.findOneAndUpdate(
      { email: "superadmin@alumni.com" },
      { status: "active" },
      { new: true }
    );

    if (superAdmin) {
      console.log("✅ Updated Super Admin status to active");
    } else {
      console.log("❌ Super Admin not found!");
    }

    // Update other admin users to active
    const adminUsers = await User.find({
      role: { $in: ["college_admin", "hod", "staff"] },
      status: "pending",
    });

    console.log(
      `🔧 Found ${adminUsers.length} admin users with pending status`
    );

    for (const user of adminUsers) {
      await User.findByIdAndUpdate(user._id, { status: "active" });
      console.log(`✅ Updated ${user.email} (${user.role}) status to active`);
    }

    // Verify the changes
    console.log("\n📋 Updated Admin Users:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const updatedAdmins = await User.find({
      role: { $in: ["super_admin", "college_admin", "hod", "staff"] },
    }).select("email role status");

    updatedAdmins.forEach((user) => {
      console.log(
        `👤 ${user.role.toUpperCase()}: ${user.email} (Status: ${user.status})`
      );
    });

    console.log("\n🎉 All admin users are now active and can login!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
  }
};

fixUserStatuses();
