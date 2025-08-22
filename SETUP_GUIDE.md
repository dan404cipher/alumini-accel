# 🚀 AlumniAccel Setup Guide

## 📋 Prerequisites

Before setting up AlumniAccel, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **MongoDB** (local or MongoDB Atlas)
- **Redis** (local or Redis Cloud)

## 🛠️ Quick Setup

### 1. Install Dependencies

```bash
# Install all dependencies (root, API, and client)
npm run install:all

# Or install manually:
npm install
cd api && npm install
cd ../client && npm install
```

### 2. Environment Configuration

The environment files have been automatically created. You need to configure them:

#### API Environment (`api/.env`)

**Required Configuration:**
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/alumni_accel

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Email (Optional but recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Client Environment (`client/.env`)

**Required Configuration:**
```bash
# API URL
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### 3. Database Setup

#### Local MongoDB
```bash
# Start MongoDB (if not running)
brew services start mongodb-community

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### MongoDB Atlas (Recommended for Production)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `api/.env`

### 4. Redis Setup

#### Local Redis
```bash
# Start Redis (if not running)
brew services start redis

# Or using Docker
docker run -d -p 6379:6379 --name redis redis:latest
```

#### Redis Cloud (Recommended for Production)
1. Create a Redis Cloud account
2. Create a new database
3. Get your connection string
4. Update `REDIS_URL` in `api/.env`

## 🚀 Running the Application

### Development Mode (Both API and Client)

```bash
# Run both API and client simultaneously
npm run dev

# Or run separately:
npm run dev:api    # API only (port 3000)
npm run dev:client # Client only (port 5173)
```

### Production Build

```bash
# Build both API and client
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
alumni-accel/
├── api/                    # Backend API
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/    # API controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── .env               # API environment variables
│   └── package.json
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utility libraries
│   │   ├── pages/          # Page components
│   │   └── services/       # API services
│   ├── .env               # Client environment variables
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

## 🔧 Available Scripts

### Root Level
```bash
npm run dev              # Run both API and client
npm run build            # Build both API and client
npm run test             # Run tests for both
npm run lint             # Lint both API and client
npm run setup            # Complete setup (install + env)
npm run clean            # Clean all node_modules
```

### API Only
```bash
cd api
npm run dev              # Development server
npm run build            # Build TypeScript
npm run test             # Run tests
npm run lint             # Lint code
```

### Client Only
```bash
cd client
npm run dev              # Development server
npm run build            # Build for production
npm run test             # Run tests
npm run lint             # Lint code
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/v1/docs (when implemented)

## 🔐 Default Credentials

For development, you can create a test user through the registration endpoint:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@alumniaccel.com",
    "password": "password123",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill processes on ports
   lsof -ti:3000 | xargs kill -9
   lsof -ti:5173 | xargs kill -9
   ```

2. **MongoDB Connection Issues**
   ```bash
   # Check if MongoDB is running
   brew services list | grep mongodb
   
   # Start MongoDB
   brew services start mongodb-community
   ```

3. **Redis Connection Issues**
   ```bash
   # Check if Redis is running
   brew services list | grep redis
   
   # Start Redis
   brew services start redis
   ```

4. **TypeScript Compilation Errors**
   ```bash
   # Clean and reinstall
   npm run clean
   npm run install:all
   ```

### Environment Variables

Make sure all required environment variables are set:

**API Required:**
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

**Client Required:**
- `VITE_API_BASE_URL`

## 📊 Development Status

- ✅ **Backend Infrastructure**: Complete
- ✅ **Database Models**: 5/12 complete
- ✅ **API Controllers**: 6/11 complete
- ✅ **API Routes**: 7/13 complete
- ✅ **Frontend Infrastructure**: Complete
- ✅ **Frontend Components**: 8/15 complete
- 🔄 **TypeScript Compilation**: 97 errors remaining (down from 144)
- 🔄 **Integration**: In progress

## 🚀 Next Steps

1. **Fix remaining TypeScript errors** (97 errors)
2. **Complete missing controllers and routes**
3. **Integrate frontend with backend APIs**
4. **Add comprehensive testing**
5. **Deploy to production**

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the error logs
3. Check the current status files in the root directory

---

**Happy Coding! 🎉** 