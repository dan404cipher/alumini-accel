# AlumniAccel Quick Start Guide

## 🚀 Prerequisites

Before running the application, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)
- **Redis** (local or Redis Cloud)

## 📦 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd alumini-accel
```

### 2. Install Backend Dependencies
```bash
cd api
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../client
npm install
```

## ⚙️ Configuration

### 1. Backend Environment Setup
```bash
cd api
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/alumni_accel

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFPIRES_IN=30d

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Email Configuration (Optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=AlumniAccel <noreply@alumniaccel.com>
```

### 2. Frontend Environment Setup
```bash
cd client
```

Create a `.env` file:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

## 🗄️ Database Setup

### Option 1: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Create database: `alumni_accel`

### Option 2: MongoDB Atlas
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in your `.env` file

## 🔄 Redis Setup

### Option 1: Local Redis
1. Install Redis locally
2. Start Redis service

### Option 2: Redis Cloud
1. Create a Redis Cloud account
2. Create a new database
3. Get your connection string
4. Update `REDIS_URL` in your `.env` file

## 🚀 Running the Application

### 1. Start the Backend
```bash
cd api
npm run dev
```

The backend will start on `http://localhost:3000`

### 2. Start the Frontend
```bash
cd client
npm run dev
```

The frontend will start on `http://localhost:5173`

## 📱 Accessing the Application

1. **Frontend**: Open `http://localhost:5173` in your browser
2. **Backend API**: Access `http://localhost:3000/api/v1`
3. **Health Check**: `http://localhost:3000/api/v1/health`

## 👤 Creating Your First User

### Option 1: Using the API
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@alumniaccel.com",
    "password": "password123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'
```

### Option 2: Using the Frontend
1. Navigate to `http://localhost:5173`
2. Click "Sign up" or go to `/register`
3. Fill in your details and create an account

## 🔧 Development Commands

### Backend Commands
```bash
cd api

# Development
npm run dev

# Build
npm run build

# Production
npm start

# Testing
npm test

# Linting
npm run lint
```

### Frontend Commands
```bash
cd client

# Development
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Linting
npm run lint
```

## 📊 Available Features

### ✅ Implemented
- **Authentication**: Login, register, password reset
- **User Management**: Profile management, role-based access
- **Alumni Directory**: Search, filter, and view alumni profiles
- **Job Board**: Post jobs, apply, search and filter
- **Events**: Create events, register, manage attendees
- **Dashboard**: Statistics and overview
- **Recognition**: Badges and achievements system

### 🔄 In Progress
- **Mentorship**: Request and manage mentorship sessions
- **Donations**: Track and manage donations
- **Newsletters**: Create and send newsletters
- **Discussions**: Forum and discussion boards
- **Notifications**: Real-time notifications

## 🧪 Testing

### Backend Testing
```bash
cd api
npm test
```

### Frontend Testing
```bash
cd client
npm test
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check your connection string in `.env`
   - Verify network connectivity

2. **Redis Connection Error**
   - Ensure Redis is running
   - Check your Redis URL in `.env`
   - Verify Redis credentials

3. **Frontend API Errors**
   - Check if backend is running on port 3000
   - Verify `VITE_API_URL` in frontend `.env`
   - Check CORS configuration

4. **Authentication Issues**
   - Clear browser localStorage
   - Check JWT configuration
   - Verify token expiration settings

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

## 📚 API Documentation

The API endpoints are available at:
- **Base URL**: `http://localhost:3000/api/v1`
- **Health Check**: `GET /health`
- **Authentication**: `POST /auth/login`, `POST /auth/register`
- **Users**: `GET /users`, `PUT /users/profile`
- **Alumni**: `GET /alumni`, `POST /alumni/profile`
- **Jobs**: `GET /jobs`, `POST /jobs`
- **Events**: `GET /events`, `POST /events`

## 🔒 Security Notes

For development, the application uses default security settings. For production:

1. Change all default secrets in `.env`
2. Enable HTTPS
3. Configure proper CORS origins
4. Set up rate limiting
5. Enable security headers

## 📞 Support

If you encounter issues:

1. Check the console logs for errors
2. Verify all environment variables are set
3. Ensure all services (MongoDB, Redis) are running
4. Check the network connectivity

## 🚀 Next Steps

After getting the application running:

1. **Explore the Features**: Try creating users, posting jobs, creating events
2. **Customize**: Modify the UI components and styling
3. **Extend**: Add new features and endpoints
4. **Deploy**: Set up production deployment

## 📈 Production Deployment

For production deployment, see the `PRODUCTION_CHECKLIST.md` file for detailed instructions on:

- Docker configuration
- Environment setup
- Security hardening
- Performance optimization
- Monitoring and logging 