# AlumniAccel 🎓

**The Ultimate Alumni Engagement & Empowerment SaaS Platform**

A comprehensive platform for universities and colleges to manage their alumni networks, facilitate networking, mentorship, events, and fundraising.

## 🌟 Features

- **👥 Alumni Management**: Complete alumni directory with profiles and search
- **📅 Event Management**: Create and manage alumni events, workshops, and reunions
- **💼 Job Board**: Alumni can post and find job opportunities
- **🎓 Mentorship Programs**: Connect mentors with mentees
- **💰 Fundraising**: Donation campaigns and fundraising management
- **📰 News & Updates**: University news and alumni success stories
- **🖼️ Gallery**: Photo galleries for events and campus life
- **👥 Communities**: Interest-based alumni communities
- **💬 Messaging**: Direct messaging between alumni
- **📊 Analytics**: Comprehensive analytics and reporting

## 🚀 Quick Start

### For New Developers

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd alumini-accel
   ```

2. **Run the setup script**

   ```bash
   cd api
   node setup.js
   ```

3. **Start the application**

   ```bash
   # Terminal 1 - Backend
   npm run dev

   # Terminal 2 - Frontend
   cd ../client
   npm run dev
   ```

4. **Login with sample data**
   - Admin: `admin@techuniversity.edu` / `TechAdmin@123`
   - Alumni: `alumni1@techuniversity.edu` / `TechAlumni@1234`

### Manual Setup

For detailed setup instructions, see [SETUP.md](./SETUP.md)

## 🏗️ Architecture

### Backend (API)

- **Framework**: Node.js + Express + TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based authentication
- **File Upload**: Multer for image/file handling
- **Email**: Nodemailer for email notifications

### Frontend (Client)

- **Framework**: React + TypeScript + Vite
- **UI Library**: Shadcn/ui + Tailwind CSS
- **State Management**: React Query + Context API
- **Routing**: React Router
- **Icons**: Lucide React

## 📁 Project Structure

```
alumini-accel/
├── api/                    # Backend API
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── scripts/         # Database scripts
│   │   └── utils/           # Utility functions
│   └── package.json
├── client/                  # Frontend React app
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utility functions
│   └── package.json
├── SETUP.md                 # Detailed setup guide
└── README.md               # This file
```

## 🗄️ Database Schema

### Core Models

- **User**: Alumni, staff, and admin users
- **AlumniProfile**: Extended alumni information
- **Tenant**: Multi-tenant college/university data
- **Event**: Events and workshops
- **JobPost**: Job opportunities
- **News**: News articles and updates
- **Gallery**: Photo galleries
- **Community**: Alumni communities
- **Mentorship**: Mentorship programs
- **Donation**: Donation records
- **Campaign**: Fundraising campaigns
- **Connection**: Alumni connections
- **Message**: Direct messages

## 🔧 Available Scripts

### Backend (`/api`)

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run seed:comprehensive` - Seed database with sample data
- `npm run seed` - Run basic seed script
- `npm run test` - Run tests

### Frontend (`/client`)

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🌐 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Users & Alumni

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `GET /api/alumni` - Get alumni directory

### Events

- `GET /api/events` - Get all events
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event

### Jobs

- `GET /api/jobs` - Get job posts
- `POST /api/jobs` - Create job post
- `PUT /api/jobs/:id` - Update job post

## 🔐 Authentication & Authorization

### User Roles

- **Super Admin**: System-wide access
- **College Admin**: College-specific management
- **Staff**: Limited administrative access
- **Alumni**: Standard user access

### Permissions

- Role-based access control
- Resource-level permissions
- Multi-tenant data isolation

## 🎨 UI Components

Built with Shadcn/ui components:

- **Forms**: Input, Select, Textarea, Checkbox
- **Navigation**: Navigation Menu, Breadcrumb
- **Data Display**: Table, Card, Badge, Avatar
- **Feedback**: Alert, Toast, Dialog
- **Layout**: Container, Grid, Flex

## 📱 Responsive Design

- **Mobile-first** approach
- **Tablet-optimized** navigation
- **Desktop** full-featured experience
- **Cross-browser** compatibility

## 🧪 Testing

- **Backend**: Jest + Supertest
- **Frontend**: React Testing Library
- **E2E**: Playwright (planned)

## 🚀 Deployment

### Backend

- **Production**: Node.js on VPS/Cloud
- **Database**: MongoDB Atlas
- **Environment**: Docker (optional)

### Frontend

- **Static Hosting**: Vercel, Netlify
- **CDN**: CloudFlare
- **Build**: Vite production build

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Check the [SETUP.md](./SETUP.md) for troubleshooting
- Review the API documentation

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Email marketing integration
- [ ] Social media integration
- [ ] Video conferencing integration
- [ ] Multi-language support

---

**Built with ❤️ for Alumni Networks Worldwide**
