import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import AlumniProfile from "@/models/AlumniProfile";
import Event from "@/models/Event";
import JobPost from "@/models/JobPost";
import { UserRole, UserStatus, EventType, JobPostStatus } from "@/types";
import { logger } from "@/utils/logger";

// Load environment variables
dotenv.config();

// Sample users data
const sampleUsers = [
  {
    email: "admin@alumniaccel.com",
    password: "Admin@123",
    firstName: "System",
    lastName: "Administrator",
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0100",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "System administrator for AlumniAccel platform",
    location: "San Francisco, CA",
    linkedinProfile: "https://linkedin.com/in/admin-alumniaccel",
    githubProfile: "https://github.com/admin-alumniaccel",
    website: "https://alumniaccel.com",
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "coordinator@alumniaccel.com",
    password: "Coord@123",
    firstName: "Sarah",
    lastName: "Johnson",
    role: UserRole.COORDINATOR,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0101",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Alumni relations coordinator with 5+ years of experience",
    location: "New York, NY",
    linkedinProfile: "https://linkedin.com/in/sarah-johnson",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "alumni1@alumniaccel.com",
    password: "Alumni@123",
    firstName: "Michael",
    lastName: "Chen",
    role: UserRole.ALUMNI,
    status: UserStatus.VERIFIED,
    phone: "+1-555-0102",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Software engineer at Google with expertise in AI/ML",
    location: "Mountain View, CA",
    linkedinProfile: "https://linkedin.com/in/michael-chen",
    githubProfile: "https://github.com/michaelchen",
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "alumni2@alumniaccel.com",
    password: "Alumni@123",
    firstName: "Emily",
    lastName: "Rodriguez",
    role: UserRole.ALUMNI,
    status: UserStatus.VERIFIED,
    phone: "+1-555-0103",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Product manager at Microsoft, passionate about edtech",
    location: "Seattle, WA",
    linkedinProfile: "https://linkedin.com/in/emily-rodriguez",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: false,
      newsletterSubscription: true,
    },
  },
  {
    email: "student1@alumniaccel.com",
    password: "Student@123",
    firstName: "David",
    lastName: "Kim",
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0104",
    isEmailVerified: true,
    isPhoneVerified: false,
    bio: "Computer Science student, graduating in 2024",
    location: "Boston, MA",
    githubProfile: "https://github.com/davidkim",
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
  {
    email: "student2@alumniaccel.com",
    password: "Student@123",
    firstName: "Lisa",
    lastName: "Wang",
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0105",
    isEmailVerified: true,
    isPhoneVerified: false,
    bio: "Business Administration student, interested in entrepreneurship",
    location: "Chicago, IL",
    linkedinProfile: "https://linkedin.com/in/lisa-wang",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: false,
    },
  },
  {
    email: "batchrep@alumniaccel.com",
    password: "Batch@123",
    firstName: "Alex",
    lastName: "Thompson",
    role: UserRole.BATCH_REP,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0106",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "Batch representative for Class of 2020, organizing reunions",
    location: "Austin, TX",
    linkedinProfile: "https://linkedin.com/in/alex-thompson",
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  },
];

// Sample alumni profiles data
const sampleAlumniProfiles = [
  {
    userId: "", // Will be set after user creation
    batchYear: 2018,
    graduationYear: 2020,
    department: "Computer Science",
    specialization: "Artificial Intelligence",
    rollNumber: "CS18B001",
    studentId: "STU2020001",
    currentCompany: "Google",
    currentPosition: "Senior Software Engineer",
    currentLocation: "Mountain View, CA",
    experience: 3,
    salary: 150000,
    currency: "USD",
    skills: [
      "Python",
      "TensorFlow",
      "Machine Learning",
      "Deep Learning",
      "Google Cloud",
    ],
    achievements: [
      "Google Scholar Award 2020",
      "Best Thesis Award",
      "Hackathon Winner 2019",
    ],
    certifications: [
      {
        name: "Google Cloud Professional Data Engineer",
        issuer: "Google",
        date: new Date("2022-06-15"),
        credentialId: "GCP-DE-2022-001",
      },
    ],
    education: [
      {
        degree: "Master of Science in Computer Science",
        institution: "Stanford University",
        year: 2020,
        gpa: 3.9,
      },
    ],
    careerTimeline: [
      {
        company: "Google",
        position: "Software Engineer",
        startDate: new Date("2020-08-01"),
        isCurrent: true,
        description: "Working on AI/ML infrastructure projects",
      },
    ],
    isHiring: true,
    availableForMentorship: true,
    mentorshipDomains: ["AI/ML", "Software Engineering", "Career Development"],
    availableSlots: [
      {
        day: "saturday",
        timeSlots: ["10:00", "14:00", "16:00"],
      },
    ],
    testimonials: [
      {
        content: "Great platform for connecting with fellow alumni!",
        author: "Michael Chen",
        date: new Date("2023-12-01"),
      },
    ],
    photos: [],
  },
  {
    userId: "", // Will be set after user creation
    batchYear: 2017,
    graduationYear: 2019,
    department: "Business Administration",
    specialization: "Marketing",
    rollNumber: "BA17B002",
    studentId: "STU2019002",
    currentCompany: "Microsoft",
    currentPosition: "Senior Product Manager",
    currentLocation: "Seattle, WA",
    experience: 4,
    salary: 140000,
    currency: "USD",
    skills: [
      "Product Management",
      "Marketing Strategy",
      "Data Analysis",
      "User Research",
      "Agile",
    ],
    achievements: [
      "Microsoft MVP Award 2022",
      "Product Launch Success 2021",
      "Customer Satisfaction Award",
    ],
    certifications: [
      {
        name: "Certified Scrum Product Owner",
        issuer: "Scrum Alliance",
        date: new Date("2021-03-20"),
        credentialId: "CSPO-2021-001",
      },
    ],
    education: [
      {
        degree: "Master of Business Administration",
        institution: "Harvard Business School",
        year: 2019,
        gpa: 3.8,
      },
    ],
    careerTimeline: [
      {
        company: "Microsoft",
        position: "Product Manager",
        startDate: new Date("2019-07-01"),
        isCurrent: true,
        description: "Leading product development for Microsoft Teams",
      },
    ],
    isHiring: false,
    availableForMentorship: true,
    mentorshipDomains: ["Product Management", "Marketing", "Career Transition"],
    availableSlots: [
      {
        day: "sunday",
        timeSlots: ["11:00", "15:00"],
      },
    ],
    testimonials: [
      {
        content: "Excellent networking opportunities and mentorship programs.",
        author: "Emily Rodriguez",
        date: new Date("2023-11-15"),
      },
    ],
    photos: [],
  },
];

// Sample events data
const sampleEvents = [
  {
    title: "Annual Alumni Reunion 2024",
    description:
      "Join us for our biggest alumni gathering of the year! Network with fellow graduates, share experiences, and celebrate our community.",
    type: EventType.REUNION,
    startDate: new Date("2024-06-15T18:00:00Z"),
    endDate: new Date("2024-06-15T22:00:00Z"),
    location: "Grand Hyatt Hotel, San Francisco",
    isOnline: false,
    maxAttendees: 200,
    currentAttendees: 0,
    organizer: "", // Will be set after user creation
    tags: ["networking", "reunion", "celebration"],
    price: 50,
    speakers: [
      {
        name: "Dr. Sarah Johnson",
        title: "Alumni Relations Director",
        company: "AlumniAccel University",
        bio: "Leading alumni engagement initiatives for over 10 years",
      },
    ],
    agenda: [
      {
        time: "18:00",
        title: "Welcome & Registration",
        description: "Check-in and networking",
      },
      {
        time: "19:00",
        title: "Keynote Speech",
        description: "Future of Alumni Networks",
      },
      {
        time: "20:00",
        title: "Networking & Dinner",
        description: "Open networking session",
      },
    ],
    attendees: [],
    photos: [],
    status: "upcoming",
  },
  {
    title: "Tech Career Workshop",
    description:
      "Learn from industry experts about breaking into tech, interview preparation, and career advancement strategies.",
    type: EventType.WORKSHOP,
    startDate: new Date("2024-05-20T14:00:00Z"),
    endDate: new Date("2024-05-20T17:00:00Z"),
    location: "Virtual Event",
    isOnline: true,
    onlineUrl: "https://meet.google.com/tech-workshop-2024",
    maxAttendees: 100,
    currentAttendees: 0,
    organizer: "", // Will be set after user creation
    tags: ["career", "tech", "workshop", "interview"],
    price: 0,
    speakers: [
      {
        name: "Michael Chen",
        title: "Senior Software Engineer",
        company: "Google",
        bio: "AI/ML expert with 3+ years at Google",
      },
    ],
    agenda: [
      {
        time: "14:00",
        title: "Introduction to Tech Careers",
        description: "Overview of different tech roles and paths",
      },
      {
        time: "15:00",
        title: "Interview Preparation",
        description: "Technical and behavioral interview tips",
      },
      {
        time: "16:00",
        title: "Q&A Session",
        description: "Open discussion and networking",
      },
    ],
    attendees: [],
    photos: [],
    status: "upcoming",
  },
];

// Sample job posts data
const sampleJobPosts = [
  {
    postedBy: "", // Will be set after user creation
    company: "Google",
    position: "Software Engineer - AI/ML",
    location: "Mountain View, CA",
    type: "full-time",
    remote: false,
    salary: {
      min: 120000,
      max: 180000,
      currency: "USD",
    },
    description:
      "Join our AI/ML team to build cutting-edge machine learning solutions that impact millions of users worldwide.",
    requirements: [
      "Bachelor's degree in Computer Science or related field",
      "3+ years of experience in software development",
      "Strong knowledge of Python, TensorFlow, and ML algorithms",
      "Experience with distributed systems and cloud platforms",
    ],
    benefits: [
      "Competitive salary and equity",
      "Comprehensive health benefits",
      "Flexible work arrangements",
      "Professional development opportunities",
    ],
    status: JobPostStatus.ACTIVE,
    applications: [],
    tags: ["AI/ML", "Python", "Machine Learning", "Google Cloud"],
    deadline: new Date("2024-07-31"),
  },
  {
    postedBy: "", // Will be set after user creation
    company: "Microsoft",
    position: "Product Manager - Teams",
    location: "Seattle, WA",
    type: "full-time",
    remote: true,
    salary: {
      min: 110000,
      max: 160000,
      currency: "USD",
    },
    description:
      "Lead product development for Microsoft Teams, focusing on user experience and feature innovation.",
    requirements: [
      "MBA or equivalent experience in product management",
      "5+ years of product management experience",
      "Strong analytical and communication skills",
      "Experience with SaaS products and collaboration tools",
    ],
    benefits: [
      "Competitive compensation package",
      "Health and wellness benefits",
      "Remote work options",
      "Career growth opportunities",
    ],
    status: JobPostStatus.ACTIVE,
    applications: [],
    tags: ["Product Management", "SaaS", "Collaboration", "Microsoft Teams"],
    deadline: new Date("2024-08-15"),
  },
];

// Connect to database
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/alumni_accel";
    await mongoose.connect(mongoURI);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

// Clear existing data
const clearData = async () => {
  try {
    await User.deleteMany({});
    await AlumniProfile.deleteMany({});
    await Event.deleteMany({});
    await JobPost.deleteMany({});
    logger.info("Existing data cleared successfully");
  } catch (error) {
    logger.error("Error clearing data:", error);
  }
};

// Seed users
const seedUsers = async () => {
  try {
    const createdUsers = [];

    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      logger.info(`Created user: ${user.email}`);
    }

    logger.info(`Created ${createdUsers.length} users successfully`);
    return createdUsers;
  } catch (error) {
    logger.error("Error seeding users:", error);
    throw error;
  }
};

// Seed alumni profiles
const seedAlumniProfiles = async (users: any[]) => {
  try {
    const alumniUsers = users.filter((user) => user.role === UserRole.ALUMNI);
    const createdProfiles = [];

    for (
      let i = 0;
      i < alumniUsers.length && i < sampleAlumniProfiles.length;
      i++
    ) {
      const profileData = { ...sampleAlumniProfiles[i] };
      profileData.userId = alumniUsers[i]._id;

      const profile = new AlumniProfile(profileData);
      await profile.save();
      createdProfiles.push(profile);
      logger.info(`Created alumni profile for: ${alumniUsers[i].email}`);
    }

    logger.info(
      `Created ${createdProfiles.length} alumni profiles successfully`
    );
    return createdProfiles;
  } catch (error) {
    logger.error("Error seeding alumni profiles:", error);
    throw error;
  }
};

// Seed events
const seedEvents = async (users: any[]) => {
  try {
    const coordinatorUser = users.find(
      (user) => user.role === UserRole.COORDINATOR
    );
    const createdEvents = [];

    for (const eventData of sampleEvents) {
      const event = new Event({
        ...eventData,
        organizer: coordinatorUser?._id || users[0]._id,
      });
      await event.save();
      createdEvents.push(event);
      logger.info(`Created event: ${event.title}`);
    }

    logger.info(`Created ${createdEvents.length} events successfully`);
    return createdEvents;
  } catch (error) {
    logger.error("Error seeding events:", error);
    throw error;
  }
};

// Seed job posts
const seedJobPosts = async (users: any[]) => {
  try {
    const alumniUsers = users.filter((user) => user.role === UserRole.ALUMNI);
    const createdJobPosts = [];

    for (let i = 0; i < alumniUsers.length && i < sampleJobPosts.length; i++) {
      const jobData = { ...sampleJobPosts[i] };
      jobData.postedBy = alumniUsers[i]._id;

      const jobPost = new JobPost(jobData);
      await jobPost.save();
      createdJobPosts.push(jobPost);
      logger.info(
        `Created job post: ${jobPost.position} at ${jobPost.company}`
      );
    }

    logger.info(`Created ${createdJobPosts.length} job posts successfully`);
    return createdJobPosts;
  } catch (error) {
    logger.error("Error seeding job posts:", error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    await connectDB();

    logger.info("Starting database seeding...");

    // Clear existing data
    await clearData();

    // Seed users
    const users = await seedUsers();

    // Seed alumni profiles
    await seedAlumniProfiles(users);

    // Seed events
    await seedEvents(users);

    // Seed job posts
    await seedJobPosts(users);

    logger.info("Database seeding completed successfully! 🎉");
    logger.info("Sample data created:");
    logger.info(`- ${users.length} users`);
    logger.info(
      `- ${users.filter((u) => u.role === UserRole.ALUMNI).length} alumni profiles`
    );
    logger.info(`- ${sampleEvents.length} events`);
    logger.info(`- ${sampleJobPosts.length} job posts`);

    // Display login credentials
    logger.info("\n📋 Sample Login Credentials:");
    logger.info("Super Admin: admin@alumniaccel.com / Admin@123");
    logger.info("Coordinator: coordinator@alumniaccel.com / Coord@123");
    logger.info("Alumni: alumni1@alumniaccel.com / Alumni@123");
    logger.info("Student: student1@alumniaccel.com / Student@123");

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
