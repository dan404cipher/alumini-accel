const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/alumni-accel",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Import models
const User = require("./dist/models/User").default;
const Connection = require("./dist/models/Connection").default;
const Message = require("./dist/models/Message").default;

async function testConnectedUsers() {
  try {
    console.log("🔍 Testing connected users functionality...\n");

    // Get all users
    const users = await User.find({}).limit(5);
    console.log(`📊 Found ${users.length} users in database`);

    if (users.length === 0) {
      console.log("❌ No users found in database");
      return;
    }

    // Get all connections
    const connections = await Connection.find({ status: "ACCEPTED" });
    console.log(`🔗 Found ${connections.length} accepted connections`);

    if (connections.length === 0) {
      console.log("❌ No accepted connections found");
      return;
    }

    // Test the getConnectedUsers method for the first user
    const testUserId = users[0]._id.toString();
    console.log(
      `\n🧪 Testing getConnectedUsers for user: ${users[0].firstName} ${users[0].lastName} (${testUserId})`
    );

    const connectedUsers = await Message.getConnectedUsers(testUserId);
    console.log(`\n✅ Found ${connectedUsers.length} connected users:`);

    connectedUsers.forEach((user, index) => {
      console.log(
        `  ${index + 1}. ${user.user.firstName} ${user.user.lastName}`
      );
      console.log(
        `     - Last message: ${user.lastMessage ? user.lastMessage.content : "None"}`
      );
      console.log(`     - Unread count: ${user.unreadCount}`);
      console.log("");
    });

    // Test API endpoint
    console.log("🌐 Testing API endpoint...");
    const response = await fetch(
      "http://localhost:3000/api/v1/messages/conversations",
      {
        headers: {
          Authorization: "Bearer test-token",
        },
      }
    );

    console.log(`API Response Status: ${response.status}`);
    const data = await response.text();
    console.log(`API Response: ${data}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Wait for server to start
setTimeout(() => {
  testConnectedUsers();
}, 3000);
