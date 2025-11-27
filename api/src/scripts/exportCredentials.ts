import mongoose from "mongoose";
import XLSX from "xlsx";
import User from "../models/User";
import AlumniProfile from "../models/AlumniProfile";
import Tenant from "../models/Tenant";
import { logger } from "../utils/logger";
import connectDB from "../config/database";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

const exportCredentialsToExcel = async () => {
  try {
    await connectDB();
    logger.info("Connecting to database for credentials export...");

    // Get all users
    const users = await User.find({}).populate("tenantId");
    logger.info(`Found ${users.length} users`);

    // Get all tenants
    const tenants = await Tenant.find({});
    logger.info(`Found ${tenants.length} tenants`);

    // Prepare data for Excel
    const credentialsData = [];
    const tenantData = [];
    const alumniData = [];

    // Process tenants
    for (const tenant of tenants) {
      tenantData.push({
        "Tenant ID": (tenant._id as mongoose.Types.ObjectId).toString(),
        "Tenant Name": tenant.name,
        Domain: tenant.domain,
        "Contact Email": tenant.contactInfo?.email || "N/A",
        "Contact Phone": tenant.contactInfo?.phone || "N/A",
        Website: tenant.contactInfo?.website || "N/A",
        "Subscription Plan": tenant.subscription?.plan || "N/A",
        "Subscription Status": tenant.subscription?.status || "N/A",
        "Max Users": tenant.subscription?.maxUsers || "N/A",
        "Is Active": tenant.isActive ? "Yes" : "No",
        "Created At": tenant.createdAt.toISOString().split("T")[0],
      });
    }

    // Process users
    for (const user of users) {
      const tenantName = user.tenantId ? (user.tenantId as any).name : "N/A";

      // Get alumni profile for additional fields
      let alumniProfile = null;
      if (user.role === "alumni") {
        alumniProfile = await AlumniProfile.findOne({ userId: user._id });
      }

      credentialsData.push({
        "User ID": user._id.toString(),
        Email: user.email,
        Password: getUserPassword(user.role),
        "First Name": user.firstName,
        "Last Name": user.lastName,
        "Full Name": `${user.firstName} ${user.lastName}`,
        Role: user.role,
        Status: user.status,
        Phone: user.phone || "N/A",
        Location: user.location || "N/A",
        "Graduation Year": alumniProfile?.graduationYear || "N/A",
        Department: user.department || alumniProfile?.department || "N/A",
        "Current Company": alumniProfile?.currentCompany || "N/A",
        "Current Position": alumniProfile?.currentPosition || "N/A",
        "Email Verified": user.isEmailVerified ? "Yes" : "No",
        "Phone Verified": user.isPhoneVerified ? "Yes" : "No",
        Tenant: tenantName,
        "Last Login": user.lastLoginAt
          ? user.lastLoginAt.toISOString().split("T")[0]
          : "Never",
        "Created At": user.createdAt.toISOString().split("T")[0],
      });

      // Get alumni profile if exists
      if (user.role === "alumni" && alumniProfile) {
        alumniData.push({
          "User ID": user._id.toString(),
          Email: user.email,
          "Full Name": `${user.firstName} ${user.lastName}`,
          University: (alumniProfile as any).university || "N/A",
          Program: alumniProfile.program || "N/A",
          Department: alumniProfile.department || "N/A",
          "Batch Year": alumniProfile.batchYear || "N/A",
          "Graduation Year": alumniProfile.graduationYear || "N/A",
          Specialization: alumniProfile.specialization || "N/A",
          "Roll Number": alumniProfile.rollNumber || "N/A",
          "Current Company": alumniProfile.currentCompany || "N/A",
          "Current Position": alumniProfile.currentPosition || "N/A",
          "Current Location": alumniProfile.currentLocation || "N/A",
          "Experience (Years)": alumniProfile.experience || "N/A",
          Skills: alumniProfile.skills
            ? alumniProfile.skills.join(", ")
            : "N/A",
          Achievements: alumniProfile.achievements
            ? alumniProfile.achievements.join(", ")
            : "N/A",
          "Available for Mentorship": alumniProfile.availableForMentorship
            ? "Yes"
            : "No",
          "Mentorship Domains": alumniProfile.mentorshipDomains
            ? alumniProfile.mentorshipDomains.join(", ")
            : "N/A",
          "Career Interests": alumniProfile.careerInterests
            ? alumniProfile.careerInterests.join(", ")
            : "N/A",
          "Is Hiring": alumniProfile.isHiring ? "Yes" : "No",
          "Created At": alumniProfile.createdAt.toISOString().split("T")[0],
        });
      }
    }

    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();

    // Add credentials sheet
    const credentialsSheet = XLSX.utils.json_to_sheet(credentialsData);
    XLSX.utils.book_append_sheet(
      workbook,
      credentialsSheet,
      "User Credentials"
    );

    // Add tenants sheet
    const tenantsSheet = XLSX.utils.json_to_sheet(tenantData);
    XLSX.utils.book_append_sheet(workbook, tenantsSheet, "Tenants");

    // Add alumni profiles sheet
    if (alumniData.length > 0) {
      const alumniSheet = XLSX.utils.json_to_sheet(alumniData);
      XLSX.utils.book_append_sheet(workbook, alumniSheet, "Alumni Profiles");
    }

    // Add summary sheet
    const summaryData = [
      { Category: "Total Tenants", Count: tenants.length },
      { Category: "Total Users", Count: users.length },
      {
        Category: "Admin Users",
        Count: users.filter((u) => u.role === "college_admin").length,
      },
      {
        Category: "Staff Users",
        Count: users.filter((u) => u.role === "staff").length,
      },
      {
        Category: "Alumni Users",
        Count: users.filter((u) => u.role === "alumni").length,
      },
      { Category: "Alumni Profiles", Count: alumniData.length },
      {
        Category: "Verified Users",
        Count: users.filter((u) => u.isEmailVerified).length,
      },
      {
        Category: "Active Users",
        Count: users.filter(
          (u) => u.status === "active" || u.status === "verified"
        ).length,
      },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Generate filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const filename = `alumni-credentials-${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(workbook, filename);

    logger.info(`✅ Credentials exported successfully to ${filename}`);
    logger.info(`📊 Export Summary:`);
    logger.info(`- ${tenants.length} Tenants`);
    logger.info(`- ${users.length} Users`);
    logger.info(`- ${alumniData.length} Alumni Profiles`);
    logger.info(`- File saved as: ${filename}`);

    // Print login credentials to console
    logger.info(`\n🔑 LOGIN CREDENTIALS:`);
    logger.info(`College Admin: admin@techuniversity.edu / TechAdmin@123`);
    logger.info(`Sample Alumni: alumni1@techuniversity.edu / TechAlumni@1234`);
    logger.info(`Sample Alumni: alumni2@techuniversity.edu / TechAlumni@1234`);
    logger.info(
      `... (${users.filter((u) => u.role === "alumni").length} alumni users created)`
    );

    process.exit(0);
  } catch (error) {
    logger.error("Export failed:", error);
    process.exit(1);
  }
};

// Helper function to get password based on user role
const getUserPassword = (role: string): string => {
  switch (role) {
    case "college_admin":
      return "TechAdmin@123";
    case "staff":
      return "TechStaff@1234";
    case "alumni":
      return "TechAlumni@1234";
    default:
      return "DefaultPassword@123";
  }
};

// Run export if this file is executed directly
if (require.main === module) {
  exportCredentialsToExcel();
}

export default exportCredentialsToExcel;
