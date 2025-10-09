#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 AlumniAccel - Quick Setup Script");
console.log("=====================================\n");

// Check if we're in the right directory
if (!fs.existsSync("package.json")) {
  console.error("❌ Error: Please run this script from the api directory");
  process.exit(1);
}

// Check if .env file exists
if (!fs.existsSync(".env")) {
  console.log("⚠️  Warning: .env file not found");
  console.log("Please create a .env file with the following variables:");
  console.log(`
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/alumni-accel
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=30d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
  `);
  console.log("Press Enter to continue after creating .env file...");
  process.stdin.read();
}

console.log("📦 Installing dependencies...");
try {
  execSync("npm install", { stdio: "inherit" });
  console.log("✅ Dependencies installed successfully\n");
} catch (error) {
  console.error("❌ Failed to install dependencies:", error.message);
  process.exit(1);
}

console.log("🗄️  Seeding database with comprehensive sample data...");
console.log("This will create:");
console.log("  - 1 College (Tech University)");
console.log("  - 40 Alumni Users");
console.log("  - 4 Admin/Staff Users");
console.log("  - 25 Events, 15 Job Posts, 20 News Articles");
console.log("  - 30 Gallery Items, 12 Communities");
console.log("  - 20 Mentorship Programs, 50 Donations");
console.log("  - 100 Connections, 200 Messages, 8 Campaigns\n");

try {
  execSync("npm run seed:comprehensive", { stdio: "inherit" });
  console.log("\n✅ Database seeded successfully!\n");
} catch (error) {
  console.error("❌ Failed to seed database:", error.message);
  console.log("Make sure MongoDB is running and accessible");
  process.exit(1);
}

console.log("🎉 Setup Complete!");
console.log("==================\n");
console.log("🔑 Login Credentials:");
console.log("College Admin: admin@techuniversity.edu / TechAdmin@123");
console.log("Sample Alumni: alumni1@techuniversity.edu / TechAlumni@1234");
console.log("Staff Users: staff1@techuniversity.edu / TechStaff@1234\n");
console.log("🚀 Start the application:");
console.log("Backend: npm run dev");
console.log("Frontend: cd ../client && npm run dev\n");
console.log("📖 For detailed setup instructions, see SETUP.md");
