# 🤖 NewtonBotics Backend

Robotics Club Management System Backend API

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Run in development
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📋 Prerequisites

- Node.js >= 18.0.0
- MongoDB database
- Redis (optional, disabled by default)

## 🔧 Environment Variables

Create a `.env` file based on `env.example`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Redis Configuration (optional)
REDIS_ENABLED=false
REDIS_URL=redis://localhost:6379
```

## 🏗️ Project Structure

```
src/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── models/          # Mongoose models
├── routes/          # API route handlers
├── services/        # Business logic services
├── utils/           # Utility functions
└── server.js        # Main server file
```

## 📚 API Endpoints

### Public APIs
- `GET /api/public/metrics` - Homepage metrics
- `GET /api/public/people` - List all people
- `GET /api/public/leadership-team` - Leadership team members
- `GET /api/public/team-directory` - Basic team members
- `GET /api/public/mentors` - All mentors
- `GET /api/public/researchers` - All researchers
- `GET /api/public/news` - Published news
- `GET /api/public/events` - Upcoming events
- `GET /api/public/projects` - Research projects
- `GET /api/public/research-areas` - Research areas

### Authentication Required
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - User profile

### Admin Only
- `POST /api/news` - Create news
- `PUT /api/news/:id` - Update news
- `DELETE /api/news/:id` - Delete news
- `POST /api/attendance` - Mark attendance for team members (admin only)
- `GET /api/attendance` - List attendance with filters (admin only)
- `GET /api/attendance/mine` - Authenticated user attendance history

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## 🗄️ Database

### Seeding Data
```bash
# Seed the database with sample data
npm run db:seed

# Reset database
npm run db:reset
```

### Models
- **User** - Team members, mentors, researchers
- **Attendance** - Daily attendance records for team members
- **News** - News articles with application forms
- **Event** - Workshops, seminars, competitions
- **Project** - Research projects
- **ResearchArea** - Research focus areas
- **NewsApplication** - Applications for news items

## 🚀 Deployment

### Vercel
This project is configured for Vercel deployment with:
- `vercel.json` - Deployment configuration
- `public/` directory - Static files
- Build process optimized for Vercel

### Manual Deployment
```bash
npm run build
# Deploy dist/ folder to your server
```

## 🔒 Security Features

- JWT authentication
- Role-based access control
- Input validation with express-validator
- XSS protection
- CORS configuration
- Rate limiting
- Helmet security headers

## 📊 Monitoring

- Winston logging
- Request/response logging
- Error tracking
- Health check endpoint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/` (when deployed)

---

**Built with ❤️ by the NewtonBotics Team**
