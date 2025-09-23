import mongoose from "mongoose";
import User from "../models/User";
import Tenant from "../models/Tenant";
import connectDB from "../config/database";

const fixCollegeAdminTenantId = async () => {
  try {
    await connectDB();

    console.log("🔧 Fixing College Admin tenantId issues...");

    // Find all college admins without tenantId
    const collegeAdminsWithoutTenant = await User.find({
      role: "college_admin",
      tenantId: { $exists: false },
    });

    console.log(
      `Found ${collegeAdminsWithoutTenant.length} college admins without tenantId`
    );

    for (const admin of collegeAdminsWithoutTenant) {
      console.log(
        `\n👤 Processing: ${admin.email} (${admin.firstName} ${admin.lastName})`
      );

      // Try to find tenant by domain from email
      const emailDomain = admin.email.split("@")[1];
      console.log(`🔍 Looking for tenant with domain: ${emailDomain}`);

      // Find tenant by domain or by superAdminId
      let tenant = await Tenant.findOne({ domain: emailDomain });

      if (!tenant) {
        // Try to find tenant where this user is the superAdmin
        tenant = await Tenant.findOne({ superAdminId: admin._id });
      }

      if (!tenant) {
        // Create a new tenant for this college admin
        console.log(`📝 Creating new tenant for ${emailDomain}`);

        tenant = new Tenant({
          name: `${emailDomain.split(".")[0].charAt(0).toUpperCase() + emailDomain.split(".")[0].slice(1)} College`,
          domain: emailDomain,
          about: `College managed by ${admin.firstName} ${admin.lastName}`,
          superAdminId: admin._id as any,
          contactInfo: {
            email: admin.email,
          },
          settings: {
            allowAlumniRegistration: true,
            requireApproval: true,
            allowJobPosting: true,
            allowFundraising: true,
            allowMentorship: true,
            allowEvents: true,
            emailNotifications: true,
            whatsappNotifications: false,
            customBranding: false,
          },
        });

        await tenant.save();
        console.log(`✅ Created tenant: ${tenant.name} (${tenant._id})`);
      } else {
        console.log(`✅ Found existing tenant: ${tenant.name} (${tenant._id})`);
      }

      // Update the college admin with the correct tenantId
      admin.tenantId = tenant._id as any;
      await admin.save();

      console.log(`✅ Updated ${admin.email} with tenantId: ${tenant._id}`);
    }

    // Also fix any users that have tenantId but it doesn't exist in Tenant collection
    const usersWithInvalidTenantId = await User.find({
      tenantId: { $exists: true, $ne: null },
      role: { $ne: "super_admin" },
    });

    console.log(
      `\n🔍 Checking ${usersWithInvalidTenantId.length} users with tenantId...`
    );

    for (const user of usersWithInvalidTenantId) {
      const tenant = await Tenant.findById(user.tenantId);
      if (!tenant) {
        console.log(
          `❌ User ${user.email} has invalid tenantId: ${user.tenantId}`
        );

        // Try to find or create tenant
        const emailDomain = user.email.split("@")[1];
        let validTenant = await Tenant.findOne({ domain: emailDomain });

        if (!validTenant) {
          validTenant = new Tenant({
            name: `${emailDomain.split(".")[0].charAt(0).toUpperCase() + emailDomain.split(".")[0].slice(1)} College`,
            domain: emailDomain,
            about: `College for ${user.email}`,
            superAdminId:
              user.role === "college_admin" ? (user._id as any) : null,
            contactInfo: {
              email: user.email,
            },
            settings: {
              allowAlumniRegistration: true,
              requireApproval: true,
              allowJobPosting: true,
              allowFundraising: true,
              allowMentorship: true,
              allowEvents: true,
              emailNotifications: true,
              whatsappNotifications: false,
              customBranding: false,
            },
          });

          await validTenant.save();
          console.log(
            `✅ Created tenant for ${user.email}: ${validTenant.name}`
          );
        }

        user.tenantId = validTenant._id as any;
        await user.save();
        console.log(`✅ Fixed ${user.email} tenantId: ${validTenant._id}`);
      }
    }

    console.log("\n🎉 College Admin tenantId fix completed!");

    // Display summary
    const allCollegeAdmins = await User.find({
      role: "college_admin",
    }).populate("tenantId", "name domain");
    console.log("\n📊 COLLEGE ADMINS SUMMARY:");
    console.log("=".repeat(50));

    for (const admin of allCollegeAdmins) {
      const tenant = admin.tenantId as any;
      console.log(`👤 ${admin.firstName} ${admin.lastName} (${admin.email})`);
      console.log(
        `   🏫 College: ${tenant?.name || "No College"} (${tenant?.domain || "No Domain"})`
      );
      console.log(`   🆔 TenantId: ${admin.tenantId || "MISSING"}`);
      console.log("");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing college admin tenantId:", error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  fixCollegeAdminTenantId();
}

export default fixCollegeAdminTenantId;
