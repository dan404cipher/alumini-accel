import mongoose from "mongoose";
import User from "@/models/User";
import AlumniProfile from "@/models/AlumniProfile";
import { UserRole } from "@/types";
import { logger } from "@/utils/logger";
import connectDB from "@/config/database";

const createMissingAlumniProfiles = async () => {
  try {
    await connectDB();
    logger.info("🚀 Starting to create missing alumni profiles...");

    // Find all users with alumni role who don't have alumni profiles
    const alumniUsers = await User.find({ role: UserRole.ALUMNI });
    logger.info(`Found ${alumniUsers.length} alumni users`);

    const createdProfiles = [];

    for (const user of alumniUsers) {
      // Check if alumni profile already exists
      const existingProfile = await AlumniProfile.findOne({ userId: user._id });

      if (existingProfile) {
        logger.info(
          `Profile already exists for ${user.firstName} ${user.lastName}`
        );
        continue;
      }

      // Create alumni profile with sample data
      const currentYear = new Date().getFullYear();
      const graduationYear = currentYear - Math.floor(Math.random() * 5) - 1; // Random year between 1-5 years ago
      const batchYear = graduationYear - 4; // Assuming 4-year program
      const experience = Math.max(1, currentYear - graduationYear);

      const alumniProfile = new AlumniProfile({
        userId: user._id,
        batchYear,
        graduationYear,
        university: "Alma Mater University",
        program: "Computer Science",
        department: "Computer Science",
        specialization: "Software Engineering",
        rollNumber: `CS${graduationYear}${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
        studentId: `STU${graduationYear}${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
        currentCompany: "Independent Developer", // Default as mentioned in the issue
        currentPosition: "DATA Engineer", // Default as mentioned in the issue
        currentLocation: user.location || "Chennai",
        experience,
        salary: 80000 + experience * 10000, // Estimated salary based on experience
        currency: "INR",
        skills: [
          "JavaScript",
          "Python",
          "Data Analysis",
          "Machine Learning",
          "SQL",
        ],
        achievements: [
          "Data Science Certification",
          "Project Excellence Award",
        ],
        certifications: [
          {
            name: "Data Science Professional",
            issuer: "Coursera",
            date: new Date("2023-01-15"),
            credentialId: `DS-${Math.floor(Math.random() * 100000)}`,
          },
        ],
        education: [
          {
            degree: "Bachelor's in Computer Science",
            institution: "Alma Mater University",
            year: graduationYear,
            gpa: 3.5 + Math.random() * 0.5, // Random GPA between 3.5-4.0
          },
        ],
        careerTimeline: [
          {
            company: "Independent Developer",
            position: "DATA Engineer",
            startDate: new Date(`${graduationYear}-06-01`),
            isCurrent: true,
            description:
              "Working as an independent data engineer specializing in data analysis and machine learning",
          },
        ],
        isHiring: false,
        availableForMentorship: false,
        mentorshipDomains: ["Data Science", "Career Development"],
      });

      await alumniProfile.save();
      createdProfiles.push(alumniProfile);

      logger.info(
        `✅ Created alumni profile for ${user.firstName} ${user.lastName} (${user.email})`
      );
    }

    logger.info(
      `🎉 Successfully created ${createdProfiles.length} alumni profiles`
    );

    // Log summary
    const totalAlumni = await User.countDocuments({ role: UserRole.ALUMNI });
    const totalProfiles = await AlumniProfile.countDocuments();

    logger.info(`📊 Summary:`);
    logger.info(`   - Total alumni users: ${totalAlumni}`);
    logger.info(`   - Total alumni profiles: ${totalProfiles}`);
    logger.info(`   - Profiles created: ${createdProfiles.length}`);
  } catch (error) {
    logger.error("Error creating alumni profiles:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info("Database connection closed");
  }
};

// Run the script
if (require.main === module) {
  createMissingAlumniProfiles()
    .then(() => {
      logger.info("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("❌ Script failed:", error);
      process.exit(1);
    });
}

export default createMissingAlumniProfiles;
