import mongoose from "mongoose";
import dotenv from "dotenv";
import Community from "../models/Community";
import User from "../models/User";
import CommunityMembership from "../models/CommunityMembership";
import Tenant from "../models/Tenant";

// Load environment variables
dotenv.config();

const createTestCommunities = async () => {
  try {
    // Connect to MongoDB using environment variable
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      console.error("❌ MONGODB_URI environment variable is not set");
      console.log("Please set MONGODB_URI in your .env file");
      process.exit(1);
    }

    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);

    // Check if communities already exist
    const existingCommunities = await Community.countDocuments();
    console.log(`📊 Communities count: ${existingCommunities}`);

    if (existingCommunities > 0) {
      console.log(
        `✅ Found ${existingCommunities} existing communities in database`
      );

      // Get a few communities to see their structure
      const sampleCommunities = await Community.find()
        .limit(3)
        .select("name type memberCount category");
      console.log("📋 Sample communities:", sampleCommunities);

      console.log("Top communities should now be visible in the UI!");
      return;
    }

    // Also check if there are any documents in the communities collection
    const allCollections = await mongoose.connection.db
      ?.listCollections()
      .toArray();
    console.log(
      "📁 Available collections:",
      allCollections?.map((c) => c.name) || []
    );

    // Check if there's a different collection name
    const communitiesCollection =
      mongoose.connection.db?.collection("communities");
    const communitiesCount = communitiesCollection
      ? await communitiesCollection.countDocuments()
      : 0;
    console.log(`📊 Raw communities collection count: ${communitiesCount}`);

    // If raw collection has data but model doesn't, there might be a schema issue
    if (communitiesCount > 0 && existingCommunities === 0) {
      console.log("⚠️ Raw collection has data but Mongoose model returns 0");
      console.log("This might be a schema mismatch issue");

      // Try to get raw documents
      const rawDocs = await communitiesCollection?.find().limit(3).toArray();
      console.log("📋 Raw documents:", rawDocs);
    }

    // Check all possible collection names
    const possibleNames = [
      "communities",
      "community",
      "Community",
      "Communities",
    ];
    for (const name of possibleNames) {
      const collection = mongoose.connection.db?.collection(name);
      if (collection) {
        const count = await collection.countDocuments();
        if (count > 0) {
          console.log(`✅ Found ${count} documents in collection: ${name}`);
        }
      }
    }

    console.log("❌ No communities found in database.");
    console.log("To see top communities, you need to:");
    console.log("1. Create some communities through the UI");
    console.log("2. Or run the database seeding scripts");
    console.log("3. Or manually add communities to the database");
  } catch (error) {
    console.error("Error checking communities:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the script
createTestCommunities();
