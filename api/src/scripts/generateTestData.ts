import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import AlumniProfile from "@/models/AlumniProfile";
import { UserRole, UserStatus } from "@/types";
import { logger } from "@/utils/logger";

// Load environment variables
dotenv.config();

// Sample data arrays for generating random data
const firstNames = [
  "Alex",
  "Jordan",
  "Taylor",
  "Morgan",
  "Casey",
  "Riley",
  "Avery",
  "Quinn",
  "Blake",
  "Cameron",
  "Drew",
  "Emery",
  "Finley",
  "Hayden",
  "Jamie",
  "Kendall",
  "Logan",
  "Parker",
  "Reese",
  "Sage",
  "Skyler",
  "Tatum",
  "River",
  "Phoenix",
  "Sage",
  "Rowan",
  "Indigo",
  "Cedar",
  "Aspen",
  "Willow",
  "Juniper",
  "Sage",
  "River",
  "Ocean",
  "Forest",
  "Meadow",
  "Brook",
  "Dawn",
  "Sunny",
  "Sky",
  "Star",
  "Moon",
  "Rain",
  "Storm",
  "Thunder",
  "Lightning",
  "Fire",
  "Ice",
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
  "Green",
  "Adams",
  "Nelson",
  "Baker",
  "Hall",
  "Rivera",
  "Campbell",
];

const universities = [
  "Stanford University",
  "Harvard University",
  "MIT",
  "University of California, Berkeley",
  "Carnegie Mellon University",
  "University of Chicago",
  "Yale University",
  "Princeton University",
  "Columbia University",
  "University of Pennsylvania",
  "Cornell University",
  "Dartmouth College",
  "Brown University",
  "Duke University",
  "Northwestern University",
  "Johns Hopkins University",
  "Vanderbilt University",
  "Rice University",
  "Washington University in St. Louis",
  "Emory University",
  "Georgetown University",
  "University of Notre Dame",
  "University of Virginia",
  "Wake Forest University",
  "Tufts University",
  "University of North Carolina at Chapel Hill",
  "Boston College",
  "New York University",
  "University of Southern California",
  "University of California, Los Angeles",
  "University of Michigan",
  "University of Texas at Austin",
  "Georgia Institute of Technology",
  "University of Illinois at Urbana-Champaign",
];

const departments = [
  "Computer Science",
  "Business Administration",
  "Engineering",
  "Medicine",
  "Law",
  "Psychology",
  "Economics",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Political Science",
  "International Relations",
  "Journalism",
  "Communications",
  "Art",
  "Music",
  "Theater",
  "Film",
  "Architecture",
  "Urban Planning",
  "Education",
  "Social Work",
  "Public Health",
  "Environmental Science",
  "Data Science",
  "Cybersecurity",
  "Artificial Intelligence",
  "Biotechnology",
  "Renewable Energy",
  "Sustainability",
];

const companies = [
  "Google",
  "Microsoft",
  "Apple",
  "Amazon",
  "Meta",
  "Tesla",
  "Netflix",
  "Uber",
  "Airbnb",
  "Spotify",
  "Twitter",
  "LinkedIn",
  "Salesforce",
  "Adobe",
  "Oracle",
  "IBM",
  "Intel",
  "NVIDIA",
  "AMD",
  "Qualcomm",
  "Cisco",
  "VMware",
  "ServiceNow",
  "Workday",
  "Snowflake",
  "Palantir",
  "Stripe",
  "Square",
  "PayPal",
  "Visa",
  "Mastercard",
  "JPMorgan Chase",
  "Goldman Sachs",
  "Morgan Stanley",
  "BlackRock",
  "McKinsey & Company",
  "Bain & Company",
  "Boston Consulting Group",
  "Deloitte",
  "PwC",
  "Ernst & Young",
  "KPMG",
  "Accenture",
  "IBM Consulting",
  "Capgemini",
];

const positions = [
  "Software Engineer",
  "Product Manager",
  "Data Scientist",
  "UX Designer",
  "DevOps Engineer",
  "Full Stack Developer",
  "Machine Learning Engineer",
  "Cybersecurity Analyst",
  "Cloud Architect",
  "Technical Lead",
  "Engineering Manager",
  "Product Owner",
  "Scrum Master",
  "Business Analyst",
  "Marketing Manager",
  "Sales Director",
  "Operations Manager",
  "Financial Analyst",
  "Investment Banker",
  "Management Consultant",
  "Strategy Consultant",
  "Research Scientist",
  "Research Engineer",
  "Principal Engineer",
  "Staff Engineer",
  "Senior Engineer",
  "Lead Engineer",
  "Architect",
  "Technical Director",
  "VP of Engineering",
  "CTO",
  "CEO",
  "Founder",
];

const locations = [
  "San Francisco, CA",
  "New York, NY",
  "Seattle, WA",
  "Los Angeles, CA",
  "Boston, MA",
  "Chicago, IL",
  "Austin, TX",
  "Denver, CO",
  "Portland, OR",
  "Miami, FL",
  "Atlanta, GA",
  "Dallas, TX",
  "Phoenix, AZ",
  "Las Vegas, NV",
  "San Diego, CA",
  "San Jose, CA",
  "Washington, DC",
  "Philadelphia, PA",
  "Detroit, MI",
  "Minneapolis, MN",
  "Nashville, TN",
  "Orlando, FL",
  "Tampa, FL",
  "Charlotte, NC",
  "Raleigh, NC",
  "Salt Lake City, UT",
  "Kansas City, MO",
  "Columbus, OH",
  "Indianapolis, IN",
  "Milwaukee, WI",
  "Cleveland, OH",
];

const skills = [
  "JavaScript",
  "Python",
  "Java",
  "C++",
  "C#",
  "Go",
  "Rust",
  "Swift",
  "Kotlin",
  "React",
  "Angular",
  "Vue.js",
  "Node.js",
  "Express.js",
  "Django",
  "Flask",
  "Spring Boot",
  "Laravel",
  "Ruby on Rails",
  "ASP.NET",
  "TensorFlow",
  "PyTorch",
  "Scikit-learn",
  "Pandas",
  "NumPy",
  "Matplotlib",
  "Seaborn",
  "D3.js",
  "Chart.js",
  "AWS",
  "Azure",
  "Google Cloud",
  "Docker",
  "Kubernetes",
  "Jenkins",
  "GitLab CI",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "Redis",
  "Elasticsearch",
  "Apache Kafka",
  "Machine Learning",
  "Deep Learning",
  "Computer Vision",
  "NLP",
  "Data Analysis",
  "Statistics",
  "SQL",
  "NoSQL",
  "GraphQL",
  "REST API",
  "Microservices",
  "Agile",
  "Scrum",
  "DevOps",
  "CI/CD",
  "TDD",
  "BDD",
  "Code Review",
  "System Design",
];

const careerInterests = [
  "Software Engineering",
  "Data Science",
  "Product Management",
  "UX/UI Design",
  "Cybersecurity",
  "Cloud Computing",
  "Machine Learning",
  "Artificial Intelligence",
  "Blockchain",
  "Fintech",
  "Edtech",
  "Healthtech",
  "E-commerce",
  "SaaS",
  "Mobile Development",
  "Web Development",
  "DevOps",
  "System Administration",
  "Database Administration",
  "Network Engineering",
  "Quality Assurance",
  "Testing",
  "Project Management",
  "Business Analysis",
  "Consulting",
  "Investment Banking",
  "Private Equity",
  "Venture Capital",
  "Marketing",
  "Sales",
  "Operations",
  "Human Resources",
  "Finance",
  "Accounting",
  "Law",
  "Medicine",
  "Research",
];

// Generate random data functions
const getRandomItem = (array: string[]) =>
  array[Math.floor(Math.random() * array.length)];
const getRandomItems = (array: string[], count: number) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
const getRandomNumber = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min: number, max: number, decimals: number = 2) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

// Generate random alumni data
const generateAlumniData = (index: number) => {
  const firstName = getRandomItem(firstNames);
  const lastName = getRandomItem(lastNames);
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@alumni.edu`;

  const currentYear = new Date().getFullYear();
  const graduationYear = getRandomNumber(2020, currentYear - 1); // Ensure graduation is in the past
  const batchYear = graduationYear - getRandomNumber(3, 5); // Batch year is before graduation
  const experience = Math.max(0, currentYear - graduationYear);

  return {
    user: {
      email,
      password: "Alumni@123",
      firstName,
      lastName,
      role: UserRole.ALUMNI,
      status: UserStatus.VERIFIED,
      phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      isEmailVerified: true,
      isPhoneVerified: true,
      bio: `Experienced ${getRandomItem(positions).toLowerCase()} at ${getRandomItem(companies)} with ${experience} years of experience in ${getRandomItems(skills, 2).join(" and ")}.`,
      location: getRandomItem(locations),
      linkedinProfile: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${index}`,
      githubProfile: `https://github.com/${firstName.toLowerCase()}${lastName.toLowerCase()}${index}`,
      preferences: {
        emailNotifications: true,
        smsNotifications: Math.random() > 0.3,
        pushNotifications: true,
        newsletterSubscription: Math.random() > 0.2,
      },
    },
    profile: {
      batchYear,
      graduationYear,
      department: getRandomItem(departments),
      specialization: getRandomItem([
        "Artificial Intelligence",
        "Machine Learning",
        "Data Science",
        "Software Engineering",
        "Product Management",
        "Marketing",
        "Finance",
        "Consulting",
      ]),
      rollNumber: `${getRandomItem(departments).substring(0, 2).toUpperCase()}${batchYear}${String(index).padStart(3, "0")}`,
      studentId: `STU${batchYear}${String(index).padStart(4, "0")}`,
      currentCompany: getRandomItem(companies),
      currentPosition: getRandomItem(positions),
      currentLocation: getRandomItem(locations),
      experience: Math.max(0, experience),
      salary: getRandomNumber(80000, 200000),
      currency: "USD",
      skills: getRandomItems(skills, getRandomNumber(5, 12)),
      achievements: [
        `${getRandomItem(companies)} Excellence Award ${getRandomNumber(2020, 2024)}`,
        `Best ${getRandomItem(positions)} Award`,
        `Industry Recognition ${getRandomNumber(2020, 2024)}`,
      ],
      certifications: [
        {
          name: `${getRandomItem(companies)} Professional Certification`,
          issuer: getRandomItem(companies),
          date: new Date(
            getRandomNumber(2020, 2024),
            getRandomNumber(0, 11),
            getRandomNumber(1, 28)
          ),
          credentialId: `CERT-${getRandomNumber(1000, 9999)}`,
        },
      ],
      education: [
        {
          degree: `${getRandomItem(["Bachelor's", "Master's", "PhD"])} in ${getRandomItem(departments)}`,
          institution: getRandomItem(universities),
          year: graduationYear,
          gpa: getRandomFloat(3.0, 4.0),
        },
      ],
      careerTimeline: [
        {
          company: getRandomItem(companies),
          position: getRandomItem(positions),
          startDate: new Date(
            graduationYear,
            getRandomNumber(0, 11),
            getRandomNumber(1, 28)
          ),
          isCurrent: true,
          description: `Leading ${getRandomItems(skills, 2).join(" and ")} initiatives at ${getRandomItem(companies)}`,
        },
      ],
      isHiring: Math.random() > 0.7,
      availableForMentorship: Math.random() > 0.3,
      mentorshipDomains: getRandomItems(careerInterests, getRandomNumber(2, 4)),
      availableSlots: [
        {
          day: getRandomItem([
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ]),
          timeSlots: getRandomItems(
            ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"],
            getRandomNumber(1, 3)
          ),
        },
      ],
      testimonials: [
        {
          content: `Great experience working with ${firstName}! Highly recommend for ${getRandomItems(careerInterests, 1)[0]} mentorship.`,
          author: `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`,
          date: new Date(
            getRandomNumber(2023, 2024),
            getRandomNumber(0, 11),
            getRandomNumber(1, 28)
          ),
        },
      ],
      photos: [],
    },
  };
};

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

// Clear existing test data
const clearTestData = async () => {
  try {
    // Only clear test data (emails ending with @student.edu or @alumni.edu)
    await User.deleteMany({
      email: { $regex: /@(student|alumni)\.edu$/ },
    });
    await AlumniProfile.deleteMany({});
    logger.info("Test data cleared successfully");
  } catch (error) {
    logger.error("Error clearing test data:", error);
  }
};

// Create alumni
const createAlumni = async () => {
  try {
    const alumni = [];

    for (let i = 1; i <= 10; i++) {
      const alumniData = generateAlumniData(i);

      // Create user
      const user = new User(alumniData.user);
      await user.save();

      // Create alumni profile
      const profile = new AlumniProfile({
        ...alumniData.profile,
        userId: user._id,
      });
      await profile.save();

      alumni.push({ user, profile });
      logger.info(`Created alumni ${i}/10: ${user.email}`);
    }

    logger.info(`✅ Created ${alumni.length} alumni successfully`);
    return alumni;
  } catch (error) {
    logger.error("Error creating alumni:", error);
    throw error;
  }
};

// Main function
const generateTestData = async () => {
  try {
    await connectDB();

    logger.info("🚀 Starting test data generation...");

    // Clear existing test data
    await clearTestData();

    // Create alumni
    logger.info("🎓 Creating 10 random alumni...");
    const alumni = await createAlumni();

    logger.info("🎉 Test data generation completed successfully!");
    logger.info(`📊 Summary:`);
    logger.info(`   - ${alumni.length} alumni created`);

    // Display sample credentials
    logger.info("\n🔑 Sample Login Credentials:");
    if (alumni.length > 0) {
      logger.info(`Alumni: ${alumni[0].user.email} / Alumni@123`);
    }

    process.exit(0);
  } catch (error) {
    logger.error("❌ Test data generation failed:", error);
    process.exit(1);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  generateTestData();
}

export default generateTestData;
