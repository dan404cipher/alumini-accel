# AlumniAccel - Developer Setup Guide

## 🚀 Quick Start

This guide will help you set up the AlumniAccel application with sample data on your local machine.

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

## 🛠️ Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd alumini-accel
```

### 2. Install Dependencies

**Backend (API):**

```bash
cd api
npm install
```

**Frontend (Client):**

```bash
cd ../client
npm install
```

### 3. Environment Setup

**Backend Environment (.env file in `/api` directory):**

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/alumni-accel
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=30d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**Frontend Environment (.env file in `/client` directory):**

```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=AlumniAccel
```

### 4. Database Setup

**Option A: Local MongoDB**

1. Install MongoDB locally
2. Start MongoDB service
3. Create database: `alumni-accel`

**Option B: MongoDB Atlas (Cloud)**

1. Create free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in your `.env` file

### 5. Seed the Database

Run the comprehensive seed script to populate your database with sample data:

```bash
cd api
npm run seed:comprehensive
```

This will create:

- ✅ 1 College (Tech University)
- ✅ 40 Alumni Users
- ✅ 4 Admin/Staff Users
- ✅ 25 Events
- ✅ 15 Job Posts
- ✅ 20 News Articles
- ✅ 30 Gallery Items
- ✅ 12 Communities
- ✅ 20 Mentorship Programs
- ✅ 50 Donations
- ✅ 100 Connections
- ✅ 200 Messages
- ✅ 8 Campaigns

### 6. Start the Application

**Terminal 1 - Backend:**

```bash
cd api
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd client
npm run dev
```

### 7. Access the Application

- **Frontend**: http://localhost:5173 (or port shown in terminal)
- **Backend API**: http://localhost:5000

## 🔑 Default Login Credentials

After seeding, you can login with:

**College Admin:**

- Email: `admin@techuniversity.edu`
- Password: `TechAdmin@123`

**Sample Alumni:**

- Email: `alumni1@techuniversity.edu` to `alumni40@techuniversity.edu`
- Password: `TechAlumni@1234`

**Staff Users:**

- Email: `staff1@techuniversity.edu`, `staff2@techuniversity.edu`, `staff3@techuniversity.edu`
- Password: `TechStaff@1234`

## 🗄️ Database Management

### Reset Database

To clear all data and reseed:

```bash
cd api
npm run seed:comprehensive
```

### Backup Database

```bash
mongodump --db alumni-accel --out ./backup
```

### Restore Database

```bash
mongorestore --db alumni-accel ./backup/alumni-accel
```

## 🐛 Troubleshooting

### Common Issues

**1. MongoDB Connection Error**

- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env` file
- Verify database name is correct

**2. Images Not Loading**

- Images use external services (Robohash, DiceBear)
- Check internet connection
- Images should load automatically

**3. Login Issues**

- Ensure you've run the seed script
- Use exact credentials from the guide
- Check browser console for errors

**4. Port Already in Use**

- Change `PORT` in backend `.env`
- Update `VITE_API_URL` in frontend `.env`
- Restart both servers

## 📁 Project Structure

```
alumini-accel/
├── api/                 # Backend (Node.js + Express)
│   ├── src/
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   ├── scripts/     # Database scripts
│   │   └── ...
│   └── package.json
├── client/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   └── ...
│   └── package.json
└── README.md
```

## 🔧 Available Scripts

**Backend (`/api`):**

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run seed:comprehensive` - Seed database with sample data
- `npm run seed` - Run basic seed script

**Frontend (`/client`):**

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 📞 Support

If you encounter any issues:

1. Check this guide first
2. Check the console for error messages
3. Ensure all prerequisites are installed
4. Verify environment variables are set correctly

## 🎉 You're All Set!

Once you've completed these steps, you should have a fully functional AlumniAccel application with sample data running locally!
