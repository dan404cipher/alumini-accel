import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User";
import AlumniProfile from "../models/AlumniProfile";
import Event from "../models/Event";
import JobPost from "../models/JobPost";
import Tenant from "../models/Tenant";
import News from "../models/News";
import Gallery from "../models/Gallery";
import Community from "../models/Community";
import CommunityPost from "../models/CommunityPost";
import Mentorship from "../models/Mentorship";
import Donation from "../models/Donation";
import Connection from "../models/Connection";
import Message from "../models/Message";
import Campaign from "../models/Campaign";
import { UserRole, UserStatus, EventType, JobPostStatus } from "../types";
import { logger } from "../utils/logger";
import connectDB from "../config/database";

// Load environment variables
dotenv.config();

// Sample data arrays
const firstNames = [
  "James",
  "Mary",
  "John",
  "Patricia",
  "Robert",
  "Jennifer",
  "Michael",
  "Linda",
  "William",
  "Elizabeth",
  "David",
  "Barbara",
  "Richard",
  "Susan",
  "Joseph",
  "Jessica",
  "Thomas",
  "Sarah",
  "Christopher",
  "Karen",
  "Charles",
  "Nancy",
  "Daniel",
  "Lisa",
  "Matthew",
  "Betty",
  "Anthony",
  "Helen",
  "Mark",
  "Sandra",
  "Donald",
  "Donna",
  "Steven",
  "Carol",
  "Paul",
  "Ruth",
  "Andrew",
  "Sharon",
  "Joshua",
  "Michelle",
  "Kenneth",
  "Laura",
  "Kevin",
  "Sarah",
  "Brian",
  "Kimberly",
  "George",
  "Deborah",
];

const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
];

const companies = [
  "Google",
  "Microsoft",
  "Apple",
  "Amazon",
  "Meta",
  "Tesla",
  "Netflix",
  "Spotify",
  "Uber",
  "Airbnb",
  "Stripe",
  "Shopify",
  "Salesforce",
  "Adobe",
  "Oracle",
  "IBM",
  "Intel",
  "NVIDIA",
  "AMD",
  "Cisco",
  "VMware",
  "Atlassian",
  "Slack",
  "Zoom",
  "Palantir",
  "Snowflake",
  "Databricks",
  "MongoDB",
  "Redis",
  "Elastic",
  "GitHub",
  "GitLab",
];

const positions = [
  "Software Engineer",
  "Senior Software Engineer",
  "Lead Engineer",
  "Principal Engineer",
  "Product Manager",
  "Senior Product Manager",
  "Product Director",
  "VP of Product",
  "Data Scientist",
  "Senior Data Scientist",
  "ML Engineer",
  "AI Research Scientist",
  "DevOps Engineer",
  "Site Reliability Engineer",
  "Cloud Architect",
  "Security Engineer",
  "UX Designer",
  "Senior UX Designer",
  "Design Director",
  "Creative Director",
  "Marketing Manager",
  "Marketing Director",
  "Brand Manager",
  "Growth Manager",
  "Sales Manager",
  "Account Executive",
  "Business Development",
  "Partnership Manager",
  "Finance Manager",
  "Financial Analyst",
  "Investment Banker",
  "Portfolio Manager",
  "Operations Manager",
  "Program Manager",
  "Project Manager",
  "Scrum Master",
];

const departments = [
  "Computer Science",
  "Engineering",
  "Business Administration",
  "Marketing",
  "Finance",
  "Data Science",
  "Design",
  "Product Management",
  "Operations",
  "Human Resources",
  "Sales",
  "Customer Success",
  "Research & Development",
];

const locations = [
  "San Francisco, CA",
  "New York, NY",
  "Seattle, WA",
  "Austin, TX",
  "Boston, MA",
  "Los Angeles, CA",
  "Chicago, IL",
  "Denver, CO",
  "Portland, OR",
  "Miami, FL",
  "Atlanta, GA",
  "Dallas, TX",
  "Phoenix, AZ",
  "Philadelphia, PA",
  "Detroit, MI",
  "Minneapolis, MN",
  "Salt Lake City, UT",
  "Nashville, TN",
  "Orlando, FL",
  "Las Vegas, NV",
];

const universities = [
  "Stanford University",
  "MIT",
  "Harvard University",
  "UC Berkeley",
  "Carnegie Mellon",
  "University of Washington",
  "Georgia Tech",
  "University of Illinois",
  "Cornell University",
  "Princeton University",
  "Yale University",
  "Columbia University",
  "University of Michigan",
  "University of Texas",
  "University of California",
  "Northwestern University",
  "Duke University",
];

const eventTitles = [
  "Annual Alumni Reunion",
  "Tech Innovation Summit",
  "Career Development Workshop",
  "Networking Mixer",
  "Industry Insights Panel",
  "Startup Pitch Competition",
  "Leadership Conference",
  "Women in Tech Event",
  "Diversity & Inclusion Forum",
  "Mentorship Program Launch",
  "Graduate School Fair",
  "Job Interview Prep Session",
  "Financial Planning Workshop",
  "Health & Wellness Seminar",
  "Cultural Celebration",
  "Sports Tournament",
  "Art Exhibition",
  "Music Concert",
  "Book Club Meeting",
  "Volunteer Service Day",
  "Environmental Awareness Event",
  "Mental Health Workshop",
  "Entrepreneurship Bootcamp",
  "Digital Marketing Masterclass",
  "Data Science Meetup",
];

const newsTitles = [
  "Alumni Spotlight: Success Stories from Our Graduates",
  "University Announces New Research Initiative",
  "Annual Fundraising Campaign Reaches Record High",
  "New Scholarship Program Launched for Underprivileged Students",
  "Alumni Network Expands to 15 New Cities Worldwide",
  "University Partners with Leading Tech Companies",
  "Student Achievements: Awards and Recognition",
  "Faculty Research Breakthrough in AI Technology",
  "Alumni Mentorship Program Celebrates 5th Anniversary",
  "University Campus Renovation Project Completed",
  "New Online Learning Platform Launched",
  "Alumni Entrepreneurs Raise $50M in Funding",
  "University Ranks #1 in Student Satisfaction Survey",
  "International Exchange Program Expands",
  "Alumni Giving Back: Community Service Initiatives",
];

const communityNames = [
  "Tech Entrepreneurs",
  "Women in Business",
  "Data Science Professionals",
  "Healthcare Alumni",
  "Finance & Investment",
  "Creative Arts Community",
  "Environmental Advocates",
  "Sports & Fitness",
  "Book Lovers Club",
  "Travel Enthusiasts",
  "Food & Wine Society",
  "Photography Group",
  "Music & Arts",
  "Volunteer Network",
  "Startup Founders",
  "Remote Workers",
  "Parents Network",
  "LGBTQ+ Alliance",
  "International Students",
  "Graduate Students",
  "Career Changers",
  "Freelancers",
  "Consultants",
];

const mentorshipTopics = [
  "Career Development",
  "Technical Skills",
  "Leadership",
  "Entrepreneurship",
  "Work-Life Balance",
  "Industry Insights",
  "Networking",
  "Interview Preparation",
  "Resume Building",
  "Salary Negotiation",
  "Public Speaking",
  "Project Management",
  "Team Management",
  "Strategic Planning",
  "Innovation",
  "Digital Transformation",
  "Marketing Strategy",
  "Financial Planning",
  "Personal Branding",
  "Time Management",
];

const unsplashPhotoIds = [
  "1507003211169-0a1dd7228f2d", // University campus
  "1523050854058-8df90110c9f1", // Graduation ceremony
  "1562774053-701939374585", // Students studying
  "1571019613454-1cb2f99b2d8b", // Library
  "1581833979350-635d6b9e4b3b", // Classroom
  "1593642532402-b92d5a4b2a6b", // Technology lab
  "1600880292204-757f2464bd35", // Group discussion
  "1600880292204-757f2464bd35", // Professional meeting
  "1600880292204-757f2464bd35", // Networking event
  "1600880292204-757f2464bd35", // Conference hall
];

// Generate random data functions
const getRandomItem = (array: any[]) =>
  array[Math.floor(Math.random() * array.length)];
const getRandomItems = (array: any[], count: number) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
const getRandomDate = (start: Date, end: Date) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const getRandomNumber = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Create comprehensive seed data
const createComprehensiveSeedData = async () => {
  try {
    await connectDB();
    logger.info("Starting comprehensive database seeding...");

    // Clear existing data
    await clearAllData();

    // Create one college (tenant)
    const college = await createCollege();
    logger.info(`Created college: ${college.name}`);

    // Create 40 alumni users with full profiles
    const alumniUsers = await createAlumniUsers(
      college._id as mongoose.Types.ObjectId,
      40
    );
    logger.info(`Created ${alumniUsers.length} alumni users`);

    // Create admin and staff users
    const adminUsers = await createAdminUsers(
      college._id as mongoose.Types.ObjectId
    );
    logger.info(`Created ${adminUsers.length} admin/staff users`);

    // Create alumni profiles
    await createAlumniProfiles(alumniUsers);
    logger.info("Created alumni profiles");

    // Create events
    await createEvents(college._id as mongoose.Types.ObjectId, alumniUsers, 25);
    logger.info("Created 25 events");

    // Create job posts
    await createJobPosts(
      college._id as mongoose.Types.ObjectId,
      alumniUsers,
      15
    );
    logger.info("Created 15 job posts");

    // Create news articles
    await createNews(college._id as mongoose.Types.ObjectId, adminUsers, 20);
    logger.info("Created 20 news articles");

    // Create gallery items
    await createGalleryItems(
      college._id as mongoose.Types.ObjectId,
      alumniUsers,
      30
    );
    logger.info("Created 30 gallery items");

    // Create communities
    await createCommunities(
      college._id as mongoose.Types.ObjectId,
      alumniUsers,
      12
    );
    logger.info("Created 12 communities");

    // Create mentorship programs
    await createMentorshipPrograms(
      college._id as mongoose.Types.ObjectId,
      alumniUsers,
      20
    );
    logger.info("Created 20 mentorship programs");

    // Create donations
    await createDonations(
      college._id as mongoose.Types.ObjectId,
      alumniUsers,
      50
    );
    logger.info("Created 50 donations");

    // Create connections
    await createConnections(alumniUsers, 100);
    logger.info("Created 100 connections");

    // Create messages
    await createMessages(alumniUsers, 200);
    logger.info("Created 200 messages");

    // Create campaigns
    await createCampaigns(
      college._id as mongoose.Types.ObjectId,
      adminUsers,
      8
    );
    logger.info("Created 8 campaigns");

    logger.info("🎉 Comprehensive database seeding completed successfully!");
    logger.info("\n📊 SUMMARY:");
    logger.info(`- 1 College: ${college.name}`);
    logger.info(`- ${alumniUsers.length} Alumni Users`);
    logger.info(`- ${adminUsers.length} Admin/Staff Users`);
    logger.info("- 25 Events");
    logger.info("- 15 Job Posts");
    logger.info("- 20 News Articles");
    logger.info("- 30 Gallery Items");
    logger.info("- 12 Communities");
    logger.info("- 20 Mentorship Programs");
    logger.info("- 50 Donations");
    logger.info("- 100 Connections");
    logger.info("- 200 Messages");
    logger.info("- 8 Campaigns");

    logger.info("\n🔑 LOGIN CREDENTIALS:");
    logger.info("College Admin: admin@techuniversity.edu / TechAdmin@123");
    logger.info("Sample Alumni: alumni1@techuniversity.edu / TechAlumni@1234");
    logger.info("Sample Alumni: alumni2@techuniversity.edu / TechAlumni@1234");
    logger.info("... (40 alumni users created)");

    process.exit(0);
  } catch (error) {
    logger.error("Comprehensive seeding failed:", error);
    process.exit(1);
  }
};

// Clear all data
const clearAllData = async () => {
  try {
    await User.deleteMany({});
    await AlumniProfile.deleteMany({});
    await Event.deleteMany({});
    await JobPost.deleteMany({});
    await Tenant.deleteMany({});
    await News.deleteMany({});
    await Gallery.deleteMany({});
    await Community.deleteMany({});
    await CommunityPost.deleteMany({});
    await Mentorship.deleteMany({});
    await Donation.deleteMany({});
    await Connection.deleteMany({});
    await Message.deleteMany({});
    await Campaign.deleteMany({});
    logger.info("Existing data cleared successfully");
  } catch (error) {
    logger.error("Error clearing data:", error);
  }
};

// Create college
const createCollege = async (): Promise<any> => {
  const collegeData = {
    name: "Tech University",
    domain: "tech-university",
    logo: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&h=200&fit=crop&crop=center",
    banner:
      "https://images.unsplash.com/photo-1562774053-701939374585?w=1200&h=400&fit=crop&crop=center",
    about:
      "A leading technology university fostering innovation in computer science, engineering, and emerging technologies. We prepare students for careers in the digital age and maintain strong connections with our alumni network worldwide.",
    superAdminId: new mongoose.Types.ObjectId(),
    settings: {
      allowAlumniRegistration: true,
      requireApproval: false,
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
      maxUsers: 10000,
      features: ["advanced_analytics", "custom_branding", "priority_support"],
    },
    isActive: true,
  };

  const college = new Tenant(collegeData);
  await college.save();
  return college;
};

// Create alumni users
const createAlumniUsers = async (
  tenantId: mongoose.Types.ObjectId,
  count: number
): Promise<any[]> => {
  const users: any[] = [];
  const password = "TechAlumni@1234";

  for (let i = 0; i < count; i++) {
    const firstName = getRandomItem(firstNames);
    const lastName = getRandomItem(lastNames);
    const email = `alumni${i + 1}@techuniversity.edu`;
    const graduationYear = getRandomNumber(2015, 2023);
    const company = getRandomItem(companies);
    const position = getRandomItem(positions);
    const location = getRandomItem(locations);
    const department = getRandomItem(departments);

    const userData = {
      email,
      password: password,
      firstName,
      lastName,
      role: UserRole.ALUMNI,
      status: UserStatus.VERIFIED,
      phone: `+1-555-${String(i + 1).padStart(4, "0")}`,
      isEmailVerified: true,
      isPhoneVerified: true,
      bio: `${position} at ${company}. Passionate about technology and innovation.`,
      location,
      graduationYear,
      department,
      currentCompany: company,
      currentPosition: position,
      tenantId,
      preferences: {
        emailNotifications: true,
        smsNotifications: Math.random() > 0.5,
        pushNotifications: true,
        newsletterSubscription: true,
      },
    };

    const user = new User(userData);
    await user.save();
    users.push(user);
  }

  return users;
};

// Create admin users
const createAdminUsers = async (
  tenantId: mongoose.Types.ObjectId
): Promise<any[]> => {
  const users: any[] = [];
  const adminPassword = "TechAdmin@123";
  const staffPassword = "TechStaff@1234";

  // College Admin
  const adminData = {
    email: "admin@techuniversity.edu",
    password: adminPassword,
    firstName: "Dr. Sarah",
    lastName: "Johnson",
    role: UserRole.COLLEGE_ADMIN,
    status: UserStatus.ACTIVE,
    phone: "+1-555-0001",
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: "College Administrator for Tech University.",
    location: "Tech City, TC",
    tenantId,
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      newsletterSubscription: true,
    },
  };

  const admin = new User(adminData);
  await admin.save();
  users.push(admin);

  // Staff members
  for (let i = 0; i < 3; i++) {
    const staffData = {
      email: `staff${i + 1}@techuniversity.edu`,
      password: staffPassword,
      firstName: getRandomItem(firstNames),
      lastName: getRandomItem(lastNames),
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
      phone: `+1-555-${String(i + 2).padStart(4, "0")}`,
      isEmailVerified: true,
      isPhoneVerified: true,
      bio: "Administrative staff member.",
      location: "Tech City, TC",
      department: getRandomItem([
        "Administration",
        "Student Affairs",
        "Career Services",
      ]),
      tenantId,
      preferences: {
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        newsletterSubscription: true,
      },
    };

    const staff = new User(staffData);
    await staff.save();
    users.push(staff);
  }

  return users;
};

// Create alumni profiles
const createAlumniProfiles = async (alumniUsers: any[]) => {
  for (const user of alumniUsers) {
    const graduationYear = getRandomNumber(2015, 2023);
    const profileData = {
      userId: user._id,
      tenantId: user.tenantId,
      university: "Tech University",
      program: `${user.department} Program`,
      department: user.department,
      batchYear: graduationYear,
      graduationYear: graduationYear,
      specialization: getRandomItem([
        "Software Engineering",
        "Data Science",
        "Machine Learning",
        "Cybersecurity",
        "Cloud Computing",
        "Mobile Development",
        "Web Development",
        "DevOps",
        "Product Management",
        "UX/UI Design",
      ]),
      rollNumber: `TU${user.graduationYear}${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
      currentCompany: user.currentCompany,
      currentPosition: user.currentPosition,
      currentLocation: user.location,
      experience: getRandomNumber(1, 15),
      skills: getRandomItems(
        [
          "JavaScript",
          "Python",
          "React",
          "Node.js",
          "AWS",
          "Docker",
          "Kubernetes",
          "Machine Learning",
          "Data Analysis",
          "Project Management",
          "Leadership",
          "Communication",
          "Problem Solving",
          "Team Management",
          "Strategic Planning",
        ],
        getRandomNumber(3, 8)
      ),
      achievements: getRandomItems(
        [
          "Employee of the Year",
          "Innovation Award",
          "Leadership Excellence",
          "Project Success",
          "Team Collaboration",
          "Customer Satisfaction",
          "Process Improvement",
          "Cost Reduction",
          "Revenue Growth",
        ],
        getRandomNumber(1, 4)
      ),
      education: [
        {
          degree: "Bachelor's Degree",
          institution: "Tech University",
          year: graduationYear,
          gpa: getRandomNumber(3.0, 4.0),
        },
      ],
      careerTimeline: [
        {
          company: user.currentCompany || getRandomItem(companies),
          position: user.currentPosition || getRandomItem(positions),
          startDate: getRandomDate(new Date(2020, 0, 1), new Date()),
          endDate: null,
          isCurrent: true,
          description: `Working as ${user.currentPosition || getRandomItem(positions)} at ${user.currentCompany || getRandomItem(companies)}.`,
          location: user.location || getRandomItem(locations),
        },
      ],
      isHiring: Math.random() > 0.7,
      availableForMentorship: Math.random() > 0.3,
      mentorshipDomains: getRandomItems(
        [
          "Career Development",
          "Technical Skills",
          "Leadership",
          "Entrepreneurship",
          "Industry Insights",
          "Networking",
        ],
        getRandomNumber(1, 3)
      ),
      careerInterests: getRandomItems(
        [
          "Technology",
          "Innovation",
          "Leadership",
          "Mentoring",
          "Networking",
          "Continuous Learning",
          "Open Source",
          "Startups",
          "AI/ML",
          "Cloud Computing",
        ],
        getRandomNumber(3, 6)
      ),
    };

    const profile = new AlumniProfile(profileData);
    await profile.save();
  }
};

// Create events
const createEvents = async (
  tenantId: mongoose.Types.ObjectId,
  alumniUsers: any[],
  count: number
) => {
  for (let i = 0; i < count; i++) {
    const eventData = {
      title: getRandomItem(eventTitles),
      description: `Join us for an exciting ${getRandomItem(eventTitles).toLowerCase()}. This event will feature industry experts, networking opportunities, and valuable insights for your career development.`,
      type: getRandomItem([
        EventType.WORKSHOP,
        EventType.CONFERENCE,
        EventType.MEETUP,
        EventType.WEBINAR,
      ]),
      startDate: getRandomDate(
        new Date(),
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      ),
      endDate: getRandomDate(
        new Date(),
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      ),
      location: getRandomItem(locations),
      isOnline: Math.random() > 0.3,
      maxAttendees: getRandomNumber(20, 200),
      organizer: getRandomItem(alumniUsers)._id,
      tenantId,
      image: `https://images.unsplash.com/photo-${getRandomItem(unsplashPhotoIds)}?w=800&h=400&fit=crop&crop=center`,
      tags: getRandomItems(
        [
          "Networking",
          "Career Development",
          "Technology",
          "Innovation",
          "Leadership",
          "Entrepreneurship",
          "Professional Growth",
          "Industry Insights",
          "Skills Development",
        ],
        getRandomNumber(2, 5)
      ),
      status: "upcoming",
    };

    const event = new Event(eventData);
    await event.save();
  }
};

// Create job posts
const createJobPosts = async (
  tenantId: mongoose.Types.ObjectId,
  alumniUsers: any[],
  count: number
) => {
  for (let i = 0; i < count; i++) {
    const company = getRandomItem(companies);
    const position = getRandomItem(positions);
    const location = getRandomItem(locations);

    const jobData = {
      company: company,
      position: position,
      location: location,
      type: getRandomItem(["full-time", "part-time", "contract", "internship"]),
      experience: getRandomItem(["entry", "mid", "senior", "lead"]),
      industry: getRandomItem([
        "technology",
        "finance",
        "healthcare",
        "education",
        "consulting",
        "marketing",
        "sales",
        "operations",
        "other",
      ]),
      remote: Math.random() > 0.3,
      description: `We are looking for a talented ${position} to join our team at ${company}. This is an excellent opportunity to work with cutting-edge technology and grow your career.`,
      requirements: [
        `Bachelor's degree in ${getRandomItem(departments)} or related field`,
        `${getRandomNumber(2, 8)} years of experience in relevant field`,
        "Strong problem-solving skills",
        "Excellent communication skills",
        "Ability to work in a team environment",
      ],
      salary: {
        min: getRandomNumber(60000, 120000),
        max: getRandomNumber(120000, 200000),
        currency: "USD",
      },
      status: JobPostStatus.ACTIVE,
      postedBy: getRandomItem(alumniUsers)._id,
      tenantId,
      deadline: getRandomDate(
        new Date(),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ),
      tags: getRandomItems(
        [
          "Software Development",
          "Technology",
          "Innovation",
          "Career Growth",
          "Remote Work",
          "Benefits",
          "Startup",
          "Enterprise",
        ],
        getRandomNumber(2, 4)
      ),
    };

    const job = new JobPost(jobData);
    await job.save();
  }
};

// Create news articles
const createNews = async (
  tenantId: mongoose.Types.ObjectId,
  adminUsers: any[],
  count: number
) => {
  for (let i = 0; i < count; i++) {
    const newsData = {
      title: getRandomItem(newsTitles),
      summary: `This is a comprehensive article about ${getRandomItem(newsTitles).toLowerCase()}. The article covers important developments, achievements, and insights relevant to our university community.`,
      content: `This is a comprehensive article about ${getRandomItem(newsTitles).toLowerCase()}. The article covers important developments, achievements, and insights relevant to our university community.`,
      author: getRandomItem(adminUsers)._id,
      tenantId,
      tags: getRandomItems(
        [
          "University News",
          "Alumni Success",
          "Research",
          "Innovation",
          "Community",
          "Achievements",
          "Partnerships",
          "Scholarships",
          "Events",
          "Technology",
        ],
        getRandomNumber(2, 4)
      ),
      isPublished: true,
      publishedAt: getRandomDate(
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        new Date()
      ),
      featuredImage: `https://images.unsplash.com/photo-${getRandomItem(unsplashPhotoIds)}?w=800&h=400&fit=crop&crop=center`,
    };

    const news = new News(newsData);
    await news.save();
  }
};

// Create gallery items
const createGalleryItems = async (
  tenantId: mongoose.Types.ObjectId,
  alumniUsers: any[],
  count: number
) => {
  for (let i = 0; i < count; i++) {
    const galleryData = {
      title: `Gallery Item ${i + 1}`,
      description: `A beautiful image from our university events and activities.`,
      images: [
        `https://images.unsplash.com/photo-${getRandomItem(unsplashPhotoIds)}?w=600&h=400&fit=crop&crop=center`,
      ],
      createdBy: getRandomItem(alumniUsers)._id,
      isActive: true,
      tags: getRandomItems(
        [
          "Events",
          "Campus",
          "Students",
          "Alumni",
          "Activities",
          "Celebrations",
          "Sports",
          "Academic",
          "Cultural",
          "Community",
        ],
        getRandomNumber(2, 4)
      ),
      category: getRandomItem([
        "Events",
        "Campus",
        "Sports",
        "Academic",
        "Cultural",
        "Other",
      ]),
    };

    const gallery = new Gallery(galleryData);
    await gallery.save();
  }
};

// Create communities
const createCommunities = async (
  tenantId: mongoose.Types.ObjectId,
  alumniUsers: any[],
  count: number
) => {
  const usedNames = new Set();
  for (let i = 0; i < count; i++) {
    let communityName;
    do {
      communityName = getRandomItem(communityNames);
    } while (usedNames.has(communityName));
    usedNames.add(communityName);

    const communityData = {
      name: communityName,
      description: `A vibrant community for ${communityName.toLowerCase()} to connect, share experiences, and grow together.`,
      category: getRandomItem([
        "department",
        "batch",
        "interest",
        "professional",
        "location",
        "academic_research",
        "professional_career",
        "entrepreneurship_startups",
        "social_hobby",
        "mentorship_guidance",
      ]),
      createdBy: getRandomItem(alumniUsers)._id,
      tenantId,
      isPublic: true,
      memberCount: getRandomNumber(5, 50),
      tags: getRandomItems(
        [
          "Networking",
          "Professional Development",
          "Community",
          "Support",
          "Learning",
          "Collaboration",
          "Innovation",
          "Growth",
        ],
        getRandomNumber(2, 4)
      ),
    };

    const community = new Community(communityData);
    await community.save();

    // Create some community posts
    for (let j = 0; j < getRandomNumber(3, 8); j++) {
      const postData = {
        title: `Post ${j + 1} in ${communityName}`,
        content: `This is an interesting post in the ${communityName} community. Share your thoughts and experiences!`,
        authorId: getRandomItem(alumniUsers)._id,
        communityId: community._id,
        likes: [],
        comments: [],
        isPinned: j === 0,
        createdAt: getRandomDate(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          new Date()
        ),
      };

      const post = new CommunityPost(postData);
      await post.save();
    }
  }
};

// Create mentorship programs
const createMentorshipPrograms = async (
  tenantId: mongoose.Types.ObjectId,
  alumniUsers: any[],
  count: number
) => {
  const usedPairs = new Set();
  let attempts = 0;
  const maxAttempts = count * 10; // Prevent infinite loop

  for (let i = 0; i < count && attempts < maxAttempts; i++) {
    const mentor = getRandomItem(alumniUsers);
    const mentee = getRandomItem(
      alumniUsers.filter((u) => u._id.toString() !== mentor._id.toString())
    );

    // Create unique pair key to prevent duplicates
    const pairKey = `${mentor._id}-${mentee._id}`;
    const reversePairKey = `${mentee._id}-${mentor._id}`;

    if (usedPairs.has(pairKey) || usedPairs.has(reversePairKey)) {
      attempts++;
      i--; // Retry this iteration
      continue;
    }

    usedPairs.add(pairKey);
    usedPairs.add(reversePairKey);

    const topic = getRandomItem(mentorshipTopics);

    const mentorshipData = {
      mentorId: mentor._id,
      menteeId: mentee._id,
      domain: topic,
      description: `Mentorship program focused on ${topic.toLowerCase()}. The mentor will provide guidance and support to help the mentee grow professionally.`,
      status: getRandomItem(["active", "completed", "pending"]),
      startDate: getRandomDate(
        new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        new Date()
      ),
      endDate: getRandomDate(
        new Date(),
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      ),
      goals: [
        "Professional development",
        "Skill enhancement",
        "Career guidance",
        "Network expansion",
      ],
    };

    const mentorship = new Mentorship(mentorshipData);
    await mentorship.save();
  }
};

// Create donations
const createDonations = async (
  tenantId: mongoose.Types.ObjectId,
  alumniUsers: any[],
  count: number
) => {
  for (let i = 0; i < count; i++) {
    const donor = getRandomItem(alumniUsers);
    const amount = getRandomNumber(50, 5000);

    const donationData = {
      donor: donor._id,
      amount: amount,
      currency: "USD",
      paymentMethod: getRandomItem([
        "credit_card",
        "debit_card",
        "bank_transfer",
        "paypal",
        "stripe",
      ]),
      paymentStatus: "completed",
      donationType: "one-time",
      cause: getRandomItem([
        "Scholarship Fund",
        "Research Initiative",
        "Campus Improvement",
        "Student Support",
        "Faculty Development",
        "Technology Upgrade",
        "Library Resources",
        "Sports Facilities",
        "Community Outreach",
      ]),
      message: `Donation of $${amount} to support ${getRandomItem([
        "scholarship programs",
        "research initiatives",
        "campus improvements",
        "student support services",
        "faculty development",
        "technology upgrades",
      ])}.`,
      anonymous: Math.random() > 0.7,
      receiptSent: true,
      screenshot: `https://images.unsplash.com/photo-${getRandomItem(unsplashPhotoIds)}?w=600&h=400&fit=crop&crop=center`,
      tenantId,
    };

    const donation = new Donation(donationData);
    await donation.save();
  }
};

// Create connections
const createConnections = async (alumniUsers: any[], count: number) => {
  const usedPairs = new Set();
  let attempts = 0;
  const maxAttempts = count * 10; // Prevent infinite loop

  for (let i = 0; i < count && attempts < maxAttempts; i++) {
    const requester = getRandomItem(alumniUsers);
    const recipient = getRandomItem(
      alumniUsers.filter((u) => u._id.toString() !== requester._id.toString())
    );

    const pairKey = `${requester._id}-${recipient._id}`;
    const reversePairKey = `${recipient._id}-${requester._id}`;

    if (usedPairs.has(pairKey) || usedPairs.has(reversePairKey)) {
      attempts++;
      i--; // Retry this iteration
      continue;
    }

    usedPairs.add(pairKey);
    usedPairs.add(reversePairKey);

    const connectionData = {
      requester: requester._id,
      recipient: recipient._id,
      status: getRandomItem(["accepted", "pending", "rejected"]),
      type: getRandomItem(["connection", "mentorship", "collaboration"]),
      message: `Hi! I'd like to connect with you.`,
      createdAt: getRandomDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date()
      ),
    };

    const connection = new Connection(connectionData);
    await connection.save();
  }
};

// Create messages
const createMessages = async (alumniUsers: any[], count: number) => {
  for (let i = 0; i < count; i++) {
    const sender = getRandomItem(alumniUsers);
    const recipient = getRandomItem(
      alumniUsers.filter((u) => u._id.toString() !== sender._id.toString())
    );

    const messageData = {
      sender: sender._id,
      recipient: recipient._id,
      content: `Hello! This is a sample message between alumni members.`,
      messageType: "text",
      isRead: Math.random() > 0.3,
      createdAt: getRandomDate(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        new Date()
      ),
    };

    const message = new Message(messageData);
    await message.save();
  }
};

// Create campaigns
const createCampaigns = async (
  tenantId: mongoose.Types.ObjectId,
  adminUsers: any[],
  count: number
) => {
  for (let i = 0; i < count; i++) {
    const campaignData = {
      title: getRandomItem([
        "Annual Fundraising Campaign",
        "Scholarship Fund Drive",
        "Research Initiative",
        "Campus Renovation Project",
        "Student Support Program",
        "Technology Upgrade",
        "Faculty Development Fund",
        "Community Outreach Program",
      ]),
      description: `Join us in supporting this important initiative for our university community.`,
      targetAmount: getRandomNumber(10000, 100000),
      currentAmount: getRandomNumber(1000, 50000),
      currency: "USD",
      category: getRandomItem([
        "Infrastructure",
        "Scholarships & Student Support",
        "Research & Academics",
        "Sports, Arts & Culture",
        "Community & Social Impact",
        "Emergency",
        "Other",
      ]),
      startDate: getRandomDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date()
      ),
      endDate: getRandomDate(
        new Date(),
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      ),
      createdBy: getRandomItem(adminUsers)._id,
      tenantId,
      status: getRandomItem(["active", "completed", "paused"]),
      contactInfo: {
        email: "campaigns@techuniversity.edu",
        phone: "+1-555-0123",
        person: "Campaign Manager",
      },
      tags: getRandomItems(
        [
          "Fundraising",
          "Scholarship",
          "Research",
          "Campus",
          "Student Support",
          "Community",
          "Development",
          "Innovation",
        ],
        getRandomNumber(2, 4)
      ),
      isPublic: true,
      allowAnonymous: true,
      featured: Math.random() > 0.7,
    };

    const campaign = new Campaign(campaignData);
    await campaign.save();
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  createComprehensiveSeedData();
}

export default createComprehensiveSeedData;
