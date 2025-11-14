import mongoose from "mongoose";
import dotenv from "dotenv";
import Mentorship from "../models/Mentorship";
import User from "../models/User";

dotenv.config();

const createTestMentorship = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      console.error("❌ MONGODB_URI environment variable is not set");
      process.exit(1);
    }

    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    // Find any two users to create a mentorship between them
    const users = await User.find().limit(2);

    if (users.length < 2) {
      console.log("❌ Need at least 2 users to create a mentorship");
      console.log("Please create some users first");
      process.exit(1);
    }

    const mentor = users[0];
    const mentee = users[1];

    console.log(
      `👨‍🏫 Mentor: ${mentor.firstName} ${mentor.lastName} (${mentor._id})`
    );
    console.log(
      `👨‍🎓 Mentee: ${mentee.firstName} ${mentee.lastName} (${mentee._id})`
    );

    // Check if mentorship already exists
    const existingMentorship = await Mentorship.findOne({
      mentorId: mentor._id,
      menteeId: mentee._id,
    });

    if (existingMentorship) {
      console.log("✅ Test mentorship already exists:", existingMentorship._id);
      console.log("Status:", existingMentorship.status);
    } else {
      // Create a new mentorship
      const mentorship = new Mentorship({
        mentorId: mentor._id,
        menteeId: mentee._id,
        status: "pending",
        domain: "Technology",
        description: "Test mentorship for debugging",
        goals: ["Learn React", "Improve coding skills"],
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        duration: 4,
        notes: "This is a test mentorship",
      });

      await mentorship.save();
      console.log("✅ Created test mentorship:", mentorship._id);
    }

    // List all mentorships
    const allMentorships = await Mentorship.find();

    console.log(`\n📊 Total mentorships in database: ${allMentorships.length}`);
    allMentorships.forEach((m, index) => {
      console.log(`${index + 1}. ${m.mentorId} -> ${m.menteeId} (${m.status})`);
    });
  } catch (error) {
    console.error("❌ Error creating test mentorship:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

createTestMentorship();
