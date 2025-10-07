import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User";
import AlumniProfile from "../models/AlumniProfile";
import Event from "../models/Event";
import JobPost from "../models/JobPost";
import Tenant from "../models/Tenant";
import { UserRole, UserStatus, EventType, JobPostStatus } from "../types";
import { logger } from "../utils/logger";
import connectDB from "../config/database";

// Load environment variables
dotenv.config();

// Sample tenant data for 3 colleges
const sampleTenants = [
  {
    name: "Tech University",
    domain: "tech-university",
    logo: "https://example.com/tech-university-logo.png",
    banner: "https://example.com/tech-university-banner.jpg",
    about:
      "A leading technology university fostering innovation in computer science, engineering, and emerging technologies.",
    superAdminId: new mongoose.Types.ObjectId(),
    settings: {
      allowAlumniRegistration: true,
      requireApproval: true,
      allowJobPosting: true,
      allowFundraising: true,
      allowMentorship: true,
      allowEvents: true,
      emailNotifications: true,
      whatsappNotifications: false,
      customBranding: true,
    },
    contactInfo: {
      email: "contact@techuniversity.edu",
      phone: "+1-555-0123",
      address: "123 Innovation Drive, Tech City, TC 12345",
      website: "https://techuniversity.edu",
    },
    subscription: {
      plan: "premium",
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      maxUsers: 5000,
      features: ["advanced_analytics", "custom_branding", "priority_support"],
    },
    isActive: true,
  },
  {
    name: "Business School",
    domain: "business-school",
    logo: "https://example.com/business-school-logo.png",
    banner: "https://example.com/business-school-banner.jpg",
    about:
      "Premier business education institution specializing in MBA, finance, marketing, and entrepreneurship.",
    superAdminId: new mongoose.Types.ObjectId(),
    settings: {
      allowAlumniRegistration: true,
      requireApproval: true,
      allowJobPosting: true,
      allowFundraising: true,
      allowMentorship: true,
      allowEvents: true,
      emailNotifications: true,
      whatsappNotifications: false,
      customBranding: true,
    },
    contactInfo: {
      email: "contact@businessschool.edu",
      phone: "+1-555-0124",
      address: "456 Commerce Avenue, Business District, BD 67890",
      website: "https://businessschool.edu",
    },
    subscription: {
      plan: "premium",
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      maxUsers: 5000,
      features: ["advanced_analytics", "custom_branding", "priority_support"],
    },
    isActive: true,
  },
  {
    name: "Medical Institute",
    domain: "medical-institute",
    logo: "https://example.com/medical-institute-logo.png",
    banner: "https://example.com/medical-institute-banner.jpg",
    about:
      "Leading medical education institution offering programs in medicine, nursing, pharmacy, and healthcare management.",
    superAdminId: new mongoose.Types.ObjectId(),
    settings: {
      allowAlumniRegistration: true,
      requireApproval: true,
      allowJobPosting: true,
      allowFundraising: true,
      allowMentorship: true,
      allowEvents: true,
      emailNotifications: true,
      whatsappNotifications: false,
      customBranding: true,
    },
    contactInfo: {
      email: "contact@medicalinstitute.edu",
      phone: "+1-555-0125",
      address: "789 Health Boulevard, Medical Center, MC 11111",
      website: "https://medicalinstitute.edu",
    },
    subscription: {
      plan: "premium",
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      maxUsers: 5000,
      features: ["advanced_analytics", "custom_branding", "priority_support"],
    },
    isActive: true,
  },
];

// Sample users data for all colleges
const sampleUsers = [
  // Super Admin (Global)
  {
    email: "superadmin@alumniaccel.com",
    password: "SuperAdmin@123",
    firstName: "John",
    lastName: "Smith",
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0000",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Global platform administrator overseeing all colleges and operations.",
    location: "Global",
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },

  // Tech University Users
  {
    email: "admin@techuniversity.edu",
    password: "TechAdmin@123",
    firstName: "Dr. Sarah",
    lastName: "Johnson",
    role: UserRole.COLLEGE_ADMIN,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0001",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "College Administrator for Tech University.",
    location: "Tech City, TC",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "cs-hod@techuniversity.edu",
    password: "CSHOD@1234",
    firstName: "Dr. Michael",
    lastName: "Chen",
    role: UserRole.HOD,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0002",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Head of Computer Science Department.",
    location: "Tech City, TC",
    department: "Computer Science",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "eng-hod@techuniversity.edu",
    password: "EngHOD@1234",
    firstName: "Dr. Lisa",
    lastName: "Wang",
    role: UserRole.HOD,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0003",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Head of Engineering Department.",
    location: "Tech City, TC",
    department: "Engineering",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "staff1@techuniversity.edu",
    password: "TechStaff@1234",
    firstName: "Emily",
    lastName: "Rodriguez",
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0004",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Administrative staff member.",
    location: "Tech City, TC",
    department: "Administration",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "staff2@techuniversity.edu",
    password: "TechStaff@1234",
    firstName: "David",
    lastName: "Kim",
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0005",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Student affairs coordinator.",
    location: "Tech City, TC",
    department: "Student Affairs",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "alumni1@techuniversity.edu",
    password: "TechAlumni@1234",
    firstName: "Alex",
    lastName: "Thompson",
    role: UserRole.ALUMNI,
    status: UserStatus.VERIFIED,
    phone: "+1-555-0006",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Software engineer at Google.",
    location: "Mountain View, CA",
    graduationYear: 2020,
    department: "Computer Science",
    currentCompany: "Google",
    currentPosition: "Senior Software Engineer",
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "alumni2@techuniversity.edu",
    password: "TechAlumni@1234",
    firstName: "Maria",
    lastName: "Garcia",
    role: UserRole.ALUMNI,
    status: UserStatus.VERIFIED,
    phone: "+1-555-0007",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Product manager at Microsoft.",
    location: "Seattle, WA",
    graduationYear: 2019,
    department: "Engineering",
    currentCompany: "Microsoft",
    currentPosition: "Product Manager",
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },

  // Business School Users
  {
    email: "admin@businessschool.edu",
    password: "BusinessAdmin@123",
    firstName: "Prof. Michael",
    lastName: "Brown",
    role: UserRole.COLLEGE_ADMIN,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0008",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "College Administrator for Business School.",
    location: "Business District, BD",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "mba-hod@businessschool.edu",
    password: "MBAHOD@1234",
    firstName: "Dr. Jennifer",
    lastName: "Davis",
    role: UserRole.HOD,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0009",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Head of MBA Program.",
    location: "Business District, BD",
    department: "MBA",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "finance-hod@businessschool.edu",
    password: "FinanceHOD@1234",
    firstName: "Dr. Robert",
    lastName: "Wilson",
    role: UserRole.HOD,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0010",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Head of Finance Department.",
    location: "Business District, BD",
    department: "Finance",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "staff1@businessschool.edu",
    password: "BusinessStaff@1234",
    firstName: "Sarah",
    lastName: "Miller",
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0011",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Career services coordinator.",
    location: "Business District, BD",
    department: "Career Services",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "staff2@businessschool.edu",
    password: "BusinessStaff@1234",
    firstName: "James",
    lastName: "Taylor",
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0012",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Administrative assistant.",
    location: "Business District, BD",
    department: "Administration",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "alumni1@businessschool.edu",
    password: "BusinessAlumni@1234",
    firstName: "Jessica",
    lastName: "Lee",
    role: UserRole.ALUMNI,
    status: UserStatus.VERIFIED,
    phone: "+1-555-0013",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Investment banker at Goldman Sachs.",
    location: "New York, NY",
    graduationYear: 2018,
    department: "Finance",
    currentCompany: "Goldman Sachs",
    currentPosition: "Investment Banker",
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "alumni2@businessschool.edu",
    password: "BusinessAlumni@1234",
    firstName: "Kevin",
    lastName: "Anderson",
    role: UserRole.ALUMNI,
    status: UserStatus.VERIFIED,
    phone: "+1-555-0014",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Marketing director at Coca-Cola.",
    location: "Atlanta, GA",
    graduationYear: 2019,
    department: "Marketing",
    currentCompany: "Coca-Cola",
    currentPosition: "Marketing Director",
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },

  // Medical Institute Users
  {
    email: "admin@medicalinstitute.edu",
    password: "MedicalAdmin@123",
    firstName: "Dr. Elizabeth",
    lastName: "Martinez",
    role: UserRole.COLLEGE_ADMIN,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0015",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "College Administrator for Medical Institute.",
    location: "Medical Center, MC",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "medicine-hod@medicalinstitute.edu",
    password: "MedicineHOD@1234",
    firstName: "Dr. William",
    lastName: "Johnson",
    role: UserRole.HOD,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0016",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Head of Medicine Department.",
    location: "Medical Center, MC",
    department: "Medicine",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "nursing-hod@medicalinstitute.edu",
    password: "NursingHOD@1234",
    firstName: "Dr. Patricia",
    lastName: "Garcia",
    role: UserRole.HOD,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0017",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Head of Nursing Department.",
    location: "Medical Center, MC",
    department: "Nursing",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "staff1@medicalinstitute.edu",
    password: "MedicalStaff@1234",
    firstName: "Rachel",
    lastName: "White",
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0018",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Clinical coordinator.",
    location: "Medical Center, MC",
    department: "Clinical Services",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "staff2@medicalinstitute.edu",
    password: "MedicalStaff@1234",
    firstName: "Mark",
    lastName: "Thompson",
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0019",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Student affairs coordinator.",
    location: "Medical Center, MC",
    department: "Student Affairs",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "alumni1@medicalinstitute.edu",
    password: "MedicalAlumni@1234",
    firstName: "Dr. Amanda",
    lastName: "Clark",
    role: UserRole.ALUMNI,
    status: UserStatus.VERIFIED,
    phone: "+1-555-0020",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Cardiologist at Mayo Clinic.",
    location: "Rochester, MN",
    graduationYear: 2017,
    department: "Medicine",
    currentCompany: "Mayo Clinic",
    currentPosition: "Cardiologist",
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "alumni2@medicalinstitute.edu",
    password: "MedicalAlumni@1234",
    firstName: "Dr. Christopher",
    lastName: "Rodriguez",
    role: UserRole.ALUMNI,
    status: UserStatus.VERIFIED,
    phone: "+1-555-0021",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Nurse practitioner at Johns Hopkins.",
    location: "Baltimore, MD",
    graduationYear: 2018,
    department: "Nursing",
    currentCompany: "Johns Hopkins",
    currentPosition: "Nurse Practitioner",
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
];

// Clear existing data
const clearData = async () => {
  try {
    await User.deleteMany({});
    await AlumniProfile.deleteMany({});
    await Event.deleteMany({});
    await JobPost.deleteMany({});
    await Tenant.deleteMany({});
    logger.info("Existing data cleared successfully");
  } catch (error) {
    logger.error("Error clearing data:", error);
  }
};

// Seed tenants (colleges)
const seedTenants = async () => {
  try {
    const createdTenants = [];
    for (const tenantData of sampleTenants) {
      const tenant = new Tenant(tenantData);
      await tenant.save();
      createdTenants.push(tenant);
      logger.info(`Created tenant: ${tenant.name}`);
    }
    logger.info(`Created ${createdTenants.length} tenants successfully`);
    return createdTenants;
  } catch (error) {
    logger.error("Error seeding tenants:", error);
    throw error;
  }
};

// Seed users
const seedUsers = async (tenants: any[]) => {
  try {
    const createdUsers = [];

    // Create Super Admin first (no tenant)
    const superAdminData = sampleUsers[0];
    const superAdmin = new User(superAdminData);
    await superAdmin.save();
    createdUsers.push(superAdmin);
    logger.info(`Created Super Admin: ${superAdmin.email}`);

    // Create users for each college
    for (let i = 0; i < tenants.length; i++) {
      const tenant = tenants[i];
      const startIndex = 1 + i * 7; // Each college has 7 users
      const endIndex = startIndex + 7;

      for (let j = startIndex; j < endIndex; j++) {
        if (j < sampleUsers.length) {
          const userData = {
            ...sampleUsers[j],
            tenantId: tenant._id,
          };
          const user = new User(userData);
          await user.save();
          createdUsers.push(user);
          logger.info(`Created user: ${user.email} for ${tenant.name}`);
        }
      }
    }

    logger.info(`Created ${createdUsers.length} users successfully`);
    return createdUsers;
  } catch (error) {
    logger.error("Error seeding users:", error);
    throw error;
  }
};

// Update tenant superAdminId
const updateTenantSuperAdmin = async (tenants: any[], superAdmin: any) => {
  try {
    for (const tenant of tenants) {
      tenant.superAdminId = superAdmin._id;
      await tenant.save();
      logger.info(
        `Updated tenant ${tenant.name} with super admin: ${superAdmin.email}`
      );
    }
  } catch (error) {
    logger.error("Error updating tenant super admin:", error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    await connectDB();
    logger.info("Starting database seeding...");

    await clearData();

    const tenants = await seedTenants();
    const users = await seedUsers(tenants);

    const superAdmin = users.find((user) => user.role === UserRole.SUPER_ADMIN);
    if (superAdmin) {
      await updateTenantSuperAdmin(tenants, superAdmin);
    }

    logger.info("Database seeding completed successfully! 🎉");
    logger.info("Sample data created:");
    logger.info(`- ${tenants.length} colleges (tenants)`);
    logger.info(`- ${users.length} users`);

    // Display login credentials
    logger.info("\n📋 LOGIN CREDENTIALS FOR ALL ROLES:");
    logger.info("=".repeat(50));

    logger.info("\n🔧 SUPER ADMIN (Global Access):");
    logger.info("Email: superadmin@alumniaccel.com");
    logger.info("Password: SuperAdmin@123");
    logger.info("Access: All colleges, all users, system management");

    logger.info("\n🏫 TECH UNIVERSITY:");
    logger.info("College Admin: admin@techuniversity.edu / TechAdmin@123");
    logger.info("CS HOD: cs-hod@techuniversity.edu / CSHOD@1234");
    logger.info("Engineering HOD: eng-hod@techuniversity.edu / EngHOD@1234");
    logger.info("Staff 1: staff1@techuniversity.edu / TechStaff@1234");
    logger.info("Staff 2: staff2@techuniversity.edu / TechStaff@1234");
    logger.info("Alumni 1: alumni1@techuniversity.edu / TechAlumni@1234");
    logger.info("Alumni 2: alumni2@techuniversity.edu / TechAlumni@1234");

    logger.info("\n🏢 BUSINESS SCHOOL:");
    logger.info("College Admin: admin@businessschool.edu / BusinessAdmin@123");
    logger.info("MBA HOD: mba-hod@businessschool.edu / MBAHOD@1234");
    logger.info(
      "Finance HOD: finance-hod@businessschool.edu / FinanceHOD@1234"
    );
    logger.info("Staff 1: staff1@businessschool.edu / BusinessStaff@1234");
    logger.info("Staff 2: staff2@businessschool.edu / BusinessStaff@1234");
    logger.info("Alumni 1: alumni1@businessschool.edu / BusinessAlumni@1234");
    logger.info("Alumni 2: alumni2@businessschool.edu / BusinessAlumni@1234");

    logger.info("\n🏥 MEDICAL INSTITUTE:");
    logger.info("College Admin: admin@medicalinstitute.edu / MedicalAdmin@123");
    logger.info(
      "Medicine HOD: medicine-hod@medicalinstitute.edu / MedicineHOD@1234"
    );
    logger.info(
      "Nursing HOD: nursing-hod@medicalinstitute.edu / NursingHOD@1234"
    );
    logger.info("Staff 1: staff1@medicalinstitute.edu / MedicalStaff@1234");
    logger.info("Staff 2: staff2@medicalinstitute.edu / MedicalStaff@1234");
    logger.info("Alumni 1: alumni1@medicalinstitute.edu / MedicalAlumni@1234");
    logger.info("Alumni 2: alumni2@medicalinstitute.edu / MedicalAlumni@1234");

    logger.info("\n🎯 TESTING INSTRUCTIONS:");
    logger.info("1. Start backend: npm run dev (in api folder)");
    logger.info("2. Start frontend: npm run dev (in client folder)");
    logger.info("3. Go to http://localhost:8081/login");
    logger.info("4. Login with any credentials above");
    logger.info("5. Navigate to /dashboard to see role-specific interface");
    logger.info("6. Test different roles to see different permissions");

    process.exit(0);
  } catch (error) {
    logger.error("Database seeding failed:", error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;
