import mongoose from "mongoose";
import Campaign from "../models/Campaign";
import Donation from "../models/Donation";
import User from "../models/User";
import Tenant from "../models/Tenant";
import { logger } from "../utils/logger";
import connectDB from "../config/database";

const generateMockCampaigns = async () => {
  try {
    logger.info("🚀 Starting campaign test data generation...");

    // Get tenant and users
    const tenant = await Tenant.findOne({});
    if (!tenant) {
      logger.error("No tenant found. Please run generateTestData first.");
      process.exit(1);
    }

    const users = await User.find({ tenantId: tenant._id });
    if (users.length === 0) {
      logger.error("No users found. Please run generateTestData first.");
      process.exit(1);
    }

    const collegeAdmin = users.find((u) => u.role === ("COLLEGE_ADMIN" as any));
    const alumni = users.find((u) => u.role === ("ALUMNI" as any));

    if (!collegeAdmin || !alumni) {
      logger.error(
        "Required users not found. Please run generateTestData first."
      );
      process.exit(1);
    }

    // Clear existing campaigns and donations
    await Campaign.deleteMany({ tenantId: tenant._id });
    await Donation.deleteMany({ tenantId: tenant._id });
    logger.info("Existing campaign data cleared");

    // Create sample campaigns
    const campaigns = [
      {
        title: "Scholarship Fund for Underprivileged Students",
        description:
          "Help us provide financial assistance to deserving students who cannot afford higher education. Your contribution will directly impact a student's future and help them achieve their academic dreams.",
        tenantId: tenant._id,
        createdBy: collegeAdmin._id,
        category: "scholarship",
        targetAmount: 500000,
        currentAmount: 125000,
        currency: "INR",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        status: "active",
        images: ["/uploads/campaigns/scholarship-fund.jpg"],
        isPublic: true,
        allowAnonymous: true,
        featured: true,
        tags: ["education", "scholarship", "students"],
        location: "Alma Mater University",
        contactInfo: {
          email: "scholarships@alma-mater.edu",
          phone: "+91-9876543210",
          person: "Dr. Sarah Johnson",
        },
        statistics: {
          totalDonations: 125000,
          totalDonors: 45,
          averageDonation: 2777,
        },
      },
      {
        title: "New Computer Lab Infrastructure",
        description:
          "We need to upgrade our computer lab with modern equipment to provide students with the latest technology for their studies. This includes new computers, software licenses, and networking equipment.",
        tenantId: tenant._id,
        createdBy: collegeAdmin._id,
        category: "infrastructure",
        targetAmount: 750000,
        currentAmount: 300000,
        currency: "INR",
        startDate: new Date("2024-02-01"),
        endDate: new Date("2024-11-30"),
        status: "active",
        images: ["/uploads/campaigns/computer-lab.jpg"],
        isPublic: true,
        allowAnonymous: true,
        featured: false,
        tags: ["technology", "infrastructure", "computers"],
        location: "Computer Science Department",
        contactInfo: {
          email: "cs@alma-mater.edu",
          phone: "+91-9876543211",
          person: "Prof. Michael Chen",
        },
        statistics: {
          totalDonations: 300000,
          totalDonors: 28,
          averageDonation: 10714,
        },
      },
      {
        title: "Research Equipment for Biotechnology Lab",
        description:
          "Support cutting-edge research in biotechnology by helping us acquire advanced laboratory equipment. This will enable our researchers to make breakthrough discoveries in medicine and agriculture.",
        tenantId: tenant._id,
        createdBy: collegeAdmin._id,
        category: "research",
        targetAmount: 1000000,
        currentAmount: 450000,
        currency: "INR",
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-10-31"),
        status: "active",
        images: ["/uploads/campaigns/biotech-lab.jpg"],
        isPublic: true,
        allowAnonymous: true,
        featured: true,
        tags: ["research", "biotechnology", "science"],
        location: "Biotechnology Department",
        contactInfo: {
          email: "biotech@alma-mater.edu",
          phone: "+91-9876543212",
          person: "Dr. Emily Rodriguez",
        },
        statistics: {
          totalDonations: 450000,
          totalDonors: 32,
          averageDonation: 14062,
        },
      },
      {
        title: "Annual Alumni Meet 2024",
        description:
          "Join us for the biggest alumni reunion of the year! Help us organize this memorable event that brings together alumni from different batches to reconnect and celebrate our shared memories.",
        tenantId: tenant._id,
        createdBy: alumni._id,
        category: "event",
        targetAmount: 200000,
        currentAmount: 85000,
        currency: "INR",
        startDate: new Date("2024-04-01"),
        endDate: new Date("2024-08-31"),
        status: "active",
        images: ["/uploads/campaigns/alumni-meet.jpg"],
        isPublic: true,
        allowAnonymous: false,
        featured: false,
        tags: ["alumni", "reunion", "networking"],
        location: "University Campus",
        contactInfo: {
          email: "alumni@alma-mater.edu",
          phone: "+91-9876543213",
          person: "John Smith",
        },
        statistics: {
          totalDonations: 85000,
          totalDonors: 67,
          averageDonation: 1268,
        },
      },
      {
        title: "Emergency Relief Fund",
        description:
          "Help students and families affected by natural disasters. This fund provides immediate financial assistance for food, shelter, and medical expenses during times of crisis.",
        tenantId: tenant._id,
        createdBy: collegeAdmin._id,
        category: "emergency",
        targetAmount: 300000,
        currentAmount: 180000,
        currency: "INR",
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-12-15"),
        status: "active",
        images: ["/uploads/campaigns/emergency-fund.jpg"],
        isPublic: true,
        allowAnonymous: true,
        featured: true,
        tags: ["emergency", "relief", "disaster"],
        location: "University Campus",
        contactInfo: {
          email: "emergency@alma-mater.edu",
          phone: "+91-9876543214",
          person: "Emergency Response Team",
        },
        statistics: {
          totalDonations: 180000,
          totalDonors: 89,
          averageDonation: 2022,
        },
      },
    ];

    // Create campaigns
    const createdCampaigns = [];
    for (const campaignData of campaigns) {
      const campaign = new Campaign(campaignData);
      await campaign.save();
      createdCampaigns.push(campaign);
      logger.info(`✅ Created campaign: ${campaign.title}`);
    }

    // Create sample donations
    const donationAmounts = [500, 1000, 2500, 5000, 10000, 25000];
    const paymentMethods = [
      "UPI",
      "Credit Card",
      "Bank Transfer",
      "Net Banking",
    ];

    for (let i = 0; i < 50; i++) {
      const campaign =
        createdCampaigns[Math.floor(Math.random() * createdCampaigns.length)];
      const donor = users[Math.floor(Math.random() * users.length)];
      const amount =
        donationAmounts[Math.floor(Math.random() * donationAmounts.length)];

      const donation = new Donation({
        donor: donor._id,
        tenantId: tenant._id,
        campaignId: campaign._id,
        amount: amount,
        currency: "INR",
        paymentMethod:
          paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        paymentStatus: "completed",
        donationType: "one-time",
        anonymous: Math.random() > 0.7,
        receiptSent: true,
        transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
        paymentGateway: "Razorpay",
      });

      await donation.save();
    }

    logger.info("🎉 Campaign test data generated successfully!");
    logger.info(`📊 Summary:`);
    logger.info(`   - ${createdCampaigns.length} Campaigns created ✅`);
    logger.info(`   - 50 Sample donations created 💰`);
    logger.info(`   - All campaigns are active and accepting donations 🚀`);
  } catch (error) {
    logger.error("Error generating campaign test data:", error);
    throw error;
  }
};

// Run the script
const main = async () => {
  await connectDB();
  await generateMockCampaigns();
  logger.info("Campaign test data generation completed successfully!");
  process.exit(0);
};

main().catch((error) => {
  logger.error("Campaign test data generation failed:", error);
  process.exit(1);
});
