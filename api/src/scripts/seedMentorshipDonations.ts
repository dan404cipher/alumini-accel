import mongoose from "mongoose";
import dotenv from "dotenv";
import Mentorship from "../models/Mentorship";
import Donation from "../models/Donation";
import Campaign from "../models/Campaign";
import User from "../models/User";
import Tenant from "../models/Tenant";
import AlumniProfile from "../models/AlumniProfile";
import { MentorshipStatus } from "../types";
import { logger } from "../utils/logger";
import connectDB from "../config/database";

// Load environment variables
dotenv.config();

// Seed Mentorship and Donations for Crescent Valley College
const seedMentorshipDonations = async () => {
  try {
    await connectDB();
    logger.info("Starting Mentorship and Donations seeding for Crescent Valley College...");

    // Find tenant by admin email
    const adminUser = await User.findOne({ email: "admin@crescentvalley.edu" });
    if (!adminUser) {
      logger.error("Admin user with email admin@crescentvalley.edu not found!");
      logger.info("Please ensure the tenant and admin user exist before running this script.");
      process.exit(1);
    }

    const tenant = await Tenant.findById(adminUser.tenantId);
    if (!tenant) {
      logger.error("Tenant not found for admin user!");
      process.exit(1);
    }

    logger.info(`Found tenant: ${tenant.name} (${tenant.domain})`);

    // Find alumni users from this tenant (excluding admin)
    const alumniUsers = await User.find({
      tenantId: tenant._id,
      role: { $in: ["ALUMNI", "alumni"] },
      status: { $in: ["ACTIVE", "VERIFIED", "active", "verified"] },
    }).limit(20);

    if (alumniUsers.length < 4) {
      logger.error("Not enough alumni users found. Need at least 4 alumni users.");
      logger.info(`Found ${alumniUsers.length} alumni users. Please create more alumni users first.`);
      process.exit(1);
    }

    logger.info(`Found ${alumniUsers.length} alumni users`);

    // Clear existing mentorship and donations for this tenant
    await Mentorship.deleteMany({
      mentorId: { $in: alumniUsers.map((u) => u._id) },
    });
    await Donation.deleteMany({ tenantId: tenant._id });

    // Create campaigns first
    const campaigns = await createCampaigns(tenant, adminUser, alumniUsers);
    logger.info(`Created ${campaigns.length} campaigns`);

    // Create mentor profiles (AlumniProfile with availableForMentorship: true)
    const mentorProfiles = await createMentorProfiles(tenant, alumniUsers);
    logger.info(`Created ${mentorProfiles.length} mentor profiles`);

    // Create mentorship data
    const mentorships = await createMentorships(alumniUsers);
    logger.info(`Created ${mentorships.length} mentorship records`);

    // Create donations data
    const donations = await createDonations(tenant, alumniUsers, campaigns);
    logger.info(`Created ${donations.length} donation records`);

    logger.info("\n✅ Mentorship and Donations seeding completed successfully! 🎉");
    logger.info("\n📊 SUMMARY:");
    logger.info(`- ${campaigns.length} campaigns created`);
    logger.info(`- ${mentorProfiles.length} mentor profiles created`);
    logger.info(`- ${mentorships.length} mentorship records created`);
    logger.info(`- ${donations.length} donation records created`);

    // Display mentorship breakdown
    const statusBreakdown = {
      pending: mentorships.filter((m) => m.status === MentorshipStatus.PENDING).length,
      accepted: mentorships.filter((m) => m.status === MentorshipStatus.ACCEPTED).length,
      active: mentorships.filter((m) => m.status === MentorshipStatus.ACTIVE).length,
      completed: mentorships.filter((m) => m.status === MentorshipStatus.COMPLETED).length,
      rejected: mentorships.filter((m) => m.status === MentorshipStatus.REJECTED).length,
    };
    logger.info("\n📈 MENTORSHIP STATUS BREAKDOWN:");
    logger.info(`- Pending: ${statusBreakdown.pending}`);
    logger.info(`- Accepted: ${statusBreakdown.accepted}`);
    logger.info(`- Active: ${statusBreakdown.active}`);
    logger.info(`- Completed: ${statusBreakdown.completed}`);
    logger.info(`- Rejected: ${statusBreakdown.rejected}`);

    // Display donation breakdown
    const donationBreakdown = {
      completed: donations.filter((d) => d.paymentStatus === "completed" || d.paymentStatus === "successful").length,
      pending: donations.filter((d) => d.paymentStatus === "pending").length,
      failed: donations.filter((d) => d.paymentStatus === "failed").length,
    };
    logger.info("\n💰 DONATION STATUS BREAKDOWN:");
    logger.info(`- Completed/Successful: ${donationBreakdown.completed}`);
    logger.info(`- Pending: ${donationBreakdown.pending}`);
    logger.info(`- Failed: ${donationBreakdown.failed}`);

    const totalDonations = donations
      .filter((d) => d.paymentStatus === "completed" || d.paymentStatus === "successful")
      .reduce((sum, d) => sum + d.amount, 0);
    logger.info(`- Total Amount: USD ${totalDonations.toLocaleString()}`);

    process.exit(0);
  } catch (error) {
    logger.error("Mentorship and Donations seeding failed:", error);
    process.exit(1);
  }
};

// Create mentor profiles (AlumniProfile with availableForMentorship: true)
const createMentorProfiles = async (tenant: any, alumniUsers: any[]) => {
  const mentorProfiles = [];
  const currentYear = new Date().getFullYear();
  
  // Select about 60% of alumni users to be mentors
  const mentorsToCreate = Math.min(Math.ceil(alumniUsers.length * 0.6), 12);
  
  const mentorshipDomains = [
    ["Software Engineering", "Full Stack Development"],
    ["Data Science", "Machine Learning"],
    ["Product Management", "Product Strategy"],
    ["Business Development", "Entrepreneurship"],
    ["Marketing", "Digital Marketing"],
    ["Finance", "Investment Banking"],
    ["Career Development", "Leadership"],
    ["Cloud Computing", "DevOps"],
  ];

  const testimonials = [
    {
      content: "Excellent mentor! Very helpful and supportive throughout my career transition.",
      author: "John Doe",
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      content: "Great guidance and mentorship. Highly recommend!",
      author: "Jane Smith",
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
    {
      content: "Helped me land my dream job. Amazing mentor!",
      author: "Alex Johnson",
      date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    },
  ];

  for (let i = 0; i < mentorsToCreate; i++) {
    const user = alumniUsers[i];
    
    // Check if AlumniProfile already exists
    let alumniProfile = await AlumniProfile.findOne({ userId: user._id });
    
    if (!alumniProfile) {
      // Create new AlumniProfile
      const graduationYear = user.graduationYear || currentYear - 5 - i;
      const batchYear = graduationYear - 4;
      
      alumniProfile = new AlumniProfile({
        userId: user._id,
        university: tenant.name || "Crescent Valley Institute of Technology",
        program: user.department || "Bachelor's Degree",
        batchYear: batchYear,
        graduationYear: graduationYear,
        department: user.department || "Computer Science",
        specialization: "",
        currentCompany: user.currentCompany || "Tech Company",
        currentPosition: user.currentPosition || "Senior Engineer",
        currentLocation: user.location || "San Francisco, CA",
        experience: Math.floor(Math.random() * 15) + 3, // 3-18 years
        skills: ["JavaScript", "React", "Node.js", "TypeScript", "Python"],
        availableForMentorship: true,
        mentorshipDomains: mentorshipDomains[i % mentorshipDomains.length],
        availableSlots: [
          {
            day: "monday",
            timeSlots: ["18:00", "19:00"],
          },
          {
            day: "wednesday",
            timeSlots: ["18:00"],
          },
          {
            day: "friday",
            timeSlots: ["17:00"],
          },
        ],
        testimonials: testimonials.slice(0, Math.floor(Math.random() * 3) + 1),
      });
    } else {
      // Update existing profile to be a mentor
      alumniProfile.availableForMentorship = true;
      alumniProfile.mentorshipDomains = mentorshipDomains[i % mentorshipDomains.length];
      if (!alumniProfile.availableSlots || alumniProfile.availableSlots.length === 0) {
        alumniProfile.availableSlots = [
          {
            day: "monday",
            timeSlots: ["18:00", "19:00"],
          },
          {
            day: "wednesday",
            timeSlots: ["18:00"],
          },
        ];
      }
      if (!alumniProfile.testimonials || alumniProfile.testimonials.length === 0) {
        alumniProfile.testimonials = testimonials.slice(0, 2);
      }
    }
    
    await alumniProfile.save();
    mentorProfiles.push(alumniProfile);
  }

  return mentorProfiles;
};

// Create campaigns
const createCampaigns = async (tenant: any, adminUser: any, alumniUsers: any[]) => {
  const campaignsData = [
    {
      title: "Scholarship Fund for Underprivileged Students",
      description:
        "Help us provide scholarships to deserving students who cannot afford college tuition. Your donation will directly impact a student's future and help them achieve their academic dreams.",
      tenantId: tenant._id,
      createdBy: adminUser._id,
      category: "Education",
      targetAmount: 50000,
      currentAmount: 32500,
      currency: "USD",
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
      images: [],
      documents: [],
      isPublic: true,
      allowAnonymous: true,
      featured: true,
      tags: ["education", "scholarship", "students"],
      location: "Crescent Valley Campus",
      contactInfo: {
        email: "admin@crescentvalley.edu",
        phone: "+1-555-0100",
        person: "Financial Aid Office",
      },
      updates: [],
      statistics: {
        totalDonations: 32500,
        totalDonors: 15,
        averageDonation: 2166.67,
      },
    },
    {
      title: "Library Modernization Project",
      description:
        "Support our effort to modernize the college library with digital resources, updated technology, and comfortable study spaces. This will benefit all students and faculty members.",
      tenantId: tenant._id,
      createdBy: adminUser._id,
      category: "Infrastructure",
      targetAmount: 75000,
      currentAmount: 48200,
      currency: "USD",
      startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800",
      images: [],
      documents: [],
      isPublic: true,
      allowAnonymous: true,
      featured: true,
      tags: ["infrastructure", "library", "technology"],
      location: "Crescent Valley Campus",
      contactInfo: {
        email: "admin@crescentvalley.edu",
        phone: "+1-555-0100",
        person: "Library Department",
      },
      updates: [],
      statistics: {
        totalDonations: 48200,
        totalDonors: 22,
        averageDonation: 2190.91,
      },
    },
    {
      title: "Alumni Networking Event Fund",
      description:
        "Help organize the annual alumni networking event where current students can connect with successful alumni. This event is crucial for career guidance and job opportunities.",
      tenantId: tenant._id,
      createdBy: adminUser._id,
      category: "Events",
      targetAmount: 15000,
      currentAmount: 12750,
      currency: "USD",
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800",
      images: [],
      documents: [],
      isPublic: true,
      allowAnonymous: false,
      featured: false,
      tags: ["events", "networking", "alumni"],
      location: "Crescent Valley Campus",
      contactInfo: {
        email: "admin@crescentvalley.edu",
        phone: "+1-555-0100",
        person: "Alumni Relations Office",
      },
      updates: [],
      statistics: {
        totalDonations: 12750,
        totalDonors: 8,
        averageDonation: 1593.75,
      },
    },
    {
      title: "Research Lab Equipment Fund",
      description:
        "Support cutting-edge research by helping us purchase state-of-the-art laboratory equipment for our science and engineering departments.",
      tenantId: tenant._id,
      createdBy: alumniUsers[0]._id,
      category: "Research",
      targetAmount: 100000,
      currentAmount: 0,
      currency: "USD",
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days from now
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800",
      images: [],
      documents: [],
      isPublic: true,
      allowAnonymous: true,
      featured: false,
      tags: ["research", "equipment", "science"],
      location: "Crescent Valley Campus",
      contactInfo: {
        email: alumniUsers[0].email,
        phone: alumniUsers[0].phone || "+1-555-0100",
        person: alumniUsers[0].firstName + " " + alumniUsers[0].lastName,
      },
      updates: [],
      statistics: {
        totalDonations: 0,
        totalDonors: 0,
        averageDonation: 0,
      },
    },
  ];

  const createdCampaigns = [];
  for (const campaignData of campaignsData) {
    const campaign = new Campaign(campaignData);
    await campaign.save();
    createdCampaigns.push(campaign);
  }

  return createdCampaigns;
};

// Create mentorship data
const createMentorships = async (alumniUsers: any[]) => {
  const mentorshipsData = [];

  // Ensure we have enough users
  if (alumniUsers.length < 4) {
    throw new Error("Need at least 4 alumni users to create mentorships");
  }

  const domains = [
    "Software Engineering",
    "Data Science",
    "Business Development",
    "Product Management",
    "Marketing",
    "Finance",
    "Entrepreneurship",
    "Career Development",
  ];

  const descriptions = [
    "Looking for guidance on transitioning into tech industry and building a strong portfolio.",
    "Seeking mentorship to develop leadership skills and advance in my current role.",
    "Need help with interview preparation and career planning.",
    "Want to learn about entrepreneurship and starting my own business.",
    "Looking for career advice in the finance sector.",
    "Seeking guidance on product management and product strategy.",
    "Need mentorship in data science and machine learning to advance my career.",
    "Looking for guidance on cloud architecture and DevOps practices.",
    "Seeking help with startup funding and investor relations.",
    "Want to improve my technical skills and get industry certifications.",
    "Need career advice for transitioning from developer to tech lead.",
    "Looking for mentorship in digital marketing and brand building.",
    "Seeking guidance on building scalable tech products.",
    "Want to learn about venture capital and startup ecosystem.",
    "Need help with negotiating job offers and salary discussions.",
  ];

  const backgrounds = [
    "Recent graduate with a degree in Computer Science. Currently working as a junior developer.",
    "Mid-level professional with 3 years of experience in marketing. Looking to transition to product management.",
    "Recent MBA graduate seeking guidance on career advancement.",
    "Experienced professional looking to pivot to a new industry.",
    "Entrepreneur with a startup idea seeking mentorship.",
    "Software engineer with 5 years of experience looking to move into tech leadership.",
    "Data analyst wanting to transition into data science and machine learning.",
    "Product manager seeking guidance on scaling products and team management.",
    "Finance professional looking to transition into fintech startup.",
    "Recent graduate in business administration seeking entrepreneurship mentorship.",
    "Experienced developer wanting to learn cloud architecture and system design.",
    "Marketing professional looking to transition into digital marketing leadership.",
    "Tech professional seeking guidance on startup ecosystem and fundraising.",
    "Mid-career professional wanting to pivot into product management.",
    "Recent graduate seeking career guidance and job search strategies.",
  ];

  const expectations = [
    "Monthly 1-hour sessions via video call. Focus on career guidance and skill development.",
    "Bi-weekly sessions to discuss career growth and industry insights.",
    "Regular check-ins and guidance on job search strategies.",
    "Mentorship on business strategy and entrepreneurship.",
    "Weekly sessions to review technical projects and code reviews.",
    "Monthly strategy sessions on startup growth and fundraising.",
    "Bi-weekly mentorship on leadership and team management.",
    "Regular guidance on technical certifications and skill building.",
    "Monthly sessions on product strategy and roadmap planning.",
    "Ongoing support for career transitions and industry networking.",
  ];

  const goals = [
    ["Land a job in tech", "Build a strong portfolio", "Improve technical skills"],
    ["Advance to senior role", "Develop leadership skills", "Network in industry"],
    ["Start own business", "Validate business idea", "Create business plan"],
    ["Transition to new role", "Learn new skills", "Build industry connections"],
    ["Master data science tools", "Build ML projects", "Get industry certifications"],
    ["Improve communication skills", "Build presentation skills", "Network effectively"],
    ["Learn cloud computing", "Get AWS certification", "Build scalable applications"],
    ["Career switch guidance", "Resume optimization", "Interview preparation"],
    ["Startup mentorship", "Business model validation", "Fundraising strategies"],
    ["Technical leadership", "Team management", "Architecture design"],
  ];

  // Create mentorships with different statuses
  let mentorshipCount = 0;
  const usedPairs = new Set<string>(); // Track used mentor-mentee pairs
  const targetMentorships = 35; // Increase to 35 mentorships for better test data

  // Helper function to get a unique mentor-mentee pair
  const getUniquePair = (): { mentor: any; mentee: any } | null => {
    for (let attempt = 0; attempt < 200; attempt++) {
      const mentorIndex = Math.floor(Math.random() * alumniUsers.length);
      const menteeIndex = Math.floor(Math.random() * alumniUsers.length);
      const mentor = alumniUsers[mentorIndex];
      const mentee = alumniUsers[menteeIndex];

      if (mentor._id.toString() === mentee._id.toString()) continue;

      const pairKey = `${mentor._id.toString()}_${mentee._id.toString()}`;
      if (!usedPairs.has(pairKey)) {
        usedPairs.add(pairKey);
        return { mentor, mentee };
      }
    }
    return null; // Couldn't find a unique pair
  };

  // PENDING mentorships (12)
  for (let i = 0; i < 12 && mentorshipCount < targetMentorships; i++) {
    const pair = getUniquePair();
    if (!pair) break;

    const mentorship = new Mentorship({
      mentorId: pair.mentor._id,
      menteeId: pair.mentee._id,
      status: MentorshipStatus.PENDING,
      domain: domains[i % domains.length],
      description: descriptions[i % descriptions.length],
      goals: goals[i % goals.length],
      background: backgrounds[i % backgrounds.length],
      expectations: expectations[i % expectations.length],
      timeCommitment: "1 hour per month",
      communicationMethod: "Video call",
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      duration: 12, // 12 weeks
    });
    await mentorship.save();
    mentorshipsData.push(mentorship);
    mentorshipCount++;
  }

  // ACCEPTED mentorships (8)
  for (let i = 0; i < 8 && mentorshipCount < targetMentorships; i++) {
    const pair = getUniquePair();
    if (!pair) break;

    const mentorship = new Mentorship({
      mentorId: pair.mentor._id,
      menteeId: pair.mentee._id,
      status: MentorshipStatus.ACCEPTED,
      domain: domains[(i + 2) % domains.length],
      description: descriptions[(i + 1) % descriptions.length],
      goals: goals[(i + 1) % goals.length],
      background: backgrounds[(i + 1) % backgrounds.length],
      expectations: expectations[(i + 1) % expectations.length],
      timeCommitment: "1 hour per month",
      communicationMethod: "Video call",
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      duration: 12,
    });
    await mentorship.save();
    mentorshipsData.push(mentorship);
    mentorshipCount++;
  }

  // ACTIVE mentorships (10)
  for (let i = 0; i < 10 && mentorshipCount < targetMentorships; i++) {
    const pair = getUniquePair();
    if (!pair) break;

    const mentorship = new Mentorship({
      mentorId: pair.mentor._id,
      menteeId: pair.mentee._id,
      status: MentorshipStatus.ACTIVE,
      domain: domains[(i + 3) % domains.length],
      description: descriptions[(i + 2) % descriptions.length],
      goals: goals[(i + 2) % goals.length],
      background: backgrounds[(i + 2) % backgrounds.length],
      expectations: expectations[(i + 2) % expectations.length],
      timeCommitment: "1 hour per month",
      communicationMethod: "Video call",
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      duration: 12,
      sessions: [
        {
          date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          duration: 60,
          notes: "Initial session - discussed goals and expectations",
          meetingLink: "https://meet.google.com/abc-defg-hij",
          status: "completed",
        },
        {
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          duration: 60,
          notes: "Second session - reviewed progress and provided feedback",
          meetingLink: "https://meet.google.com/abc-defg-hij",
          status: "completed",
        },
        {
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          duration: 60,
          notes: "Upcoming session",
          meetingLink: "https://meet.google.com/abc-defg-hij",
          status: "scheduled",
        },
      ],
      feedback: [
        {
          from: "mentee",
          rating: 5,
          comment: "Excellent mentor! Very helpful and supportive.",
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
      ],
    });
    await mentorship.save();
    mentorshipsData.push(mentorship);
    mentorshipCount++;
  }

  // COMPLETED mentorships (4)
  for (let i = 0; i < 4 && mentorshipCount < targetMentorships; i++) {
    const pair = getUniquePair();
    if (!pair) break;

    const mentorship = new Mentorship({
      mentorId: pair.mentor._id,
      menteeId: pair.mentee._id,
      status: MentorshipStatus.COMPLETED,
      domain: domains[(i + 4) % domains.length],
      description: descriptions[(i + 3) % descriptions.length],
      goals: goals[(i + 3) % goals.length],
      background: backgrounds[(i + 3) % backgrounds.length],
      expectations: expectations[(i + 3) % expectations.length],
      timeCommitment: "1 hour per month",
      communicationMethod: "Video call",
      startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
      endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      duration: 12,
      sessions: [
        {
          date: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000),
          duration: 60,
          notes: "Session 1",
          meetingLink: "https://meet.google.com/abc-defg-hij",
          status: "completed",
        },
        {
          date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          duration: 60,
          notes: "Session 2",
          meetingLink: "https://meet.google.com/abc-defg-hij",
          status: "completed",
        },
        {
          date: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
          duration: 60,
          notes: "Session 3",
          meetingLink: "https://meet.google.com/abc-defg-hij",
          status: "completed",
        },
      ],
      feedback: [
        {
          from: "mentor",
          rating: 4,
          comment: "Mentee was dedicated and showed great progress.",
          date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        },
        {
          from: "mentee",
          rating: 5,
          comment: "Amazing mentorship experience! Learned a lot.",
          date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        },
      ],
    });
    await mentorship.save();
    mentorshipsData.push(mentorship);
    mentorshipCount++;
  }

  // REJECTED mentorships (1)
  if (mentorshipCount < targetMentorships) {
    const pair = getUniquePair();
    if (pair) {
      const mentorship = new Mentorship({
        mentorId: pair.mentor._id,
        menteeId: pair.mentee._id,
        status: MentorshipStatus.REJECTED,
        domain: domains[0],
        description: descriptions[0],
        goals: goals[0],
        background: backgrounds[0],
        expectations: expectations[0],
        timeCommitment: "1 hour per month",
        communicationMethod: "Video call",
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        duration: 12,
      });
      await mentorship.save();
      mentorshipsData.push(mentorship);
      mentorshipCount++;
    }
  }

  return mentorshipsData;
};

// Create donations data
const createDonations = async (tenant: any, alumniUsers: any[], campaigns: any[]) => {
  const donationsData = [];
  const paymentMethods = ["Credit Card", "Bank Transfer", "UPI", "Razorpay"];
  const paymentStatuses = ["completed", "successful", "pending", "failed"];
  const causes = [
    "Education Support",
    "Infrastructure Development",
    "Student Welfare",
    "Research Funding",
    "Scholarship Program",
  ];

  // Donations linked to campaigns (20 donations)
  for (let i = 0; i < 20; i++) {
    const campaign = campaigns[i % campaigns.length];
    const donor = alumniUsers[i % alumniUsers.length];
    const amount = Math.floor(Math.random() * 5000) + 100; // $100 to $5000
    const status = paymentStatuses[Math.floor(Math.random() * 3)]; // completed, successful, or pending

    const donation = new Donation({
      donor: donor._id,
      tenantId: tenant._id,
      campaignId: campaign._id,
      amount: amount,
      currency: campaign.currency || "USD",
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      paymentStatus: status,
      donationType: Math.random() > 0.9 ? "recurring" : "one-time",
      campaign: campaign.title,
      cause: campaign.category,
      message: `Supporting ${campaign.title}. Keep up the great work!`,
      anonymous: Math.random() > 0.8,
      receiptSent: status === "completed" || status === "successful",
      receiptEmail: donor.email,
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentGateway: status === "completed" || status === "successful" ? "Razorpay" : undefined,
      paidAt: status === "completed" || status === "successful" ? new Date(Date.now() - i * 24 * 60 * 60 * 1000) : undefined,
    });

    await donation.save();
    donationsData.push(donation);
  }

  // Standalone donations (15 donations)
  for (let i = 0; i < 15; i++) {
    const donor = alumniUsers[i % alumniUsers.length];
    const amount = Math.floor(Math.random() * 3000) + 50; // $50 to $3000
    const status = paymentStatuses[Math.floor(Math.random() * 4)];

    const donation = new Donation({
      donor: donor._id,
      tenantId: tenant._id,
      amount: amount,
      currency: "USD",
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      paymentStatus: status,
      donationType: "one-time",
      cause: causes[i % causes.length],
      message: `General donation to support ${tenant.name}`,
      anonymous: Math.random() > 0.85,
      receiptSent: status === "completed" || status === "successful",
      receiptEmail: donor.email,
      transactionId: status === "completed" || status === "successful" ? `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : undefined,
      paymentGateway: status === "completed" || status === "successful" ? "Razorpay" : undefined,
      paidAt: status === "completed" || status === "successful" ? new Date(Date.now() - (i + 20) * 24 * 60 * 60 * 1000) : undefined,
    });

    await donation.save();
    donationsData.push(donation);
  }

  // External donations (anonymous, no donor user) (5 donations)
  for (let i = 0; i < 5; i++) {
    const amount = Math.floor(Math.random() * 2000) + 100; // $100 to $2000
    const status = paymentStatuses[Math.floor(Math.random() * 2)]; // completed or successful

    const donation = new Donation({
      tenantId: tenant._id,
      amount: amount,
      currency: "USD",
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      paymentStatus: status,
      donationType: "one-time",
      cause: causes[i % causes.length],
      message: "Supporting the college's mission",
      anonymous: true,
      receiptSent: false,
      receiptEmail: `donor${i}@example.com`,
      donorName: `Anonymous Donor ${i + 1}`,
      donorEmail: `donor${i}@example.com`,
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentGateway: "Razorpay",
      paidAt: new Date(Date.now() - (i + 35) * 24 * 60 * 60 * 1000),
    });

    await donation.save();
    donationsData.push(donation);
  }

  return donationsData;
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedMentorshipDonations();
}

export default seedMentorshipDonations;

