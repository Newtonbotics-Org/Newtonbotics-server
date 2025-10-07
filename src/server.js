const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const xss = require('xss-clean');
const hpp = require('hpp');
require('dotenv').config();

const { connectDB, getConnectionStatus } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { setupSocketIO } = require('./config/socket');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const workshopRoutes = require('./routes/workshops');
const eventRoutes = require('./routes/events');
const inventoryRoutes = require('./routes/inventory');
const projectRequestRoutes = require('./routes/projectRequests');
const newsRoutes = require('./routes/news');
const newsletterRoutes = require('./routes/newsletter');
const mediaRoutes = require('./routes/media');
const contactRoutes = require('./routes/contact');
const messageRoutes = require('./routes/messages');
const publicRoutes = require('./routes/public');
const roleApprovalRoutes = require('./routes/roleApprovals');
const researchAreaRoutes = require('./routes/researchAreas');

const app = express();
const PORT = process.env.PORT || 3000;
// Bind to all interfaces by default for PaaS platforms (Render, Railway, etc.)
const HOST = process.env.HOST || '0.0.0.0';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // For development, allow any localhost origin
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      console.log('CORS check - Development mode, allowing localhost:', origin);
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3003',
      'http://localhost:3005',
      process.env.CORS_ORIGIN
    ].filter(Boolean); // Remove any undefined values
    
    console.log('CORS check - Origin:', origin);
    console.log('CORS check - Allowed origins:', allowedOrigins);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('CORS check - Allowed');
      callback(null, true);
    } else {
      console.log('CORS check - Blocked');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Request context & simple console logging
app.use(require('./middleware/requestContext'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 / 60),
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Allow critical auth route to bypass global limiter
  skip: (req) => req.path === '/auth/change-password',
});

// Speed limiting
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: () => 500, // fixed delay per request above the threshold
});

app.use('/api/', limiter);
app.use('/api/', speedLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(xss());
app.use(hpp());

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Root endpoint - serve the public HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  const db = getConnectionStatus();
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: require('../package.json').version,
    message: 'NewtonBotics Backend API is running',
    database: db.hasMongoURI ? (db.isConnected ? 'Connected' : 'Not connected') : 'Not configured',
    databaseDetails: db,
    redis: (process.env.REDIS_HOST && process.env.REDIS_PORT) ? 'Configured' : 'Not configured'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/workshops', workshopRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/project-requests', projectRequestRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/role-approvals', roleApprovalRoutes);
app.use('/api/research-areas', researchAreaRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to MongoDB only if MONGODB_URI is available
    if (process.env.MONGODB_URI) {
      await connectDB();
      logger.info('✅ Connected to MongoDB');
    } else {
      logger.warn('⚠️ MONGODB_URI not found, skipping database connection');
    }

    // Connect to Redis (optional in dev)
    if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
      try {
        await connectRedis();
        logger.info('✅ Connected to Redis');
      } catch (redisError) {
        logger.warn(`⚠️ Redis not available: ${redisError.message}. Continuing without Redis.`);
      }
    } else {
      logger.warn('⚠️ Redis configuration not found, skipping Redis connection');
    }

    // Start HTTP server
    const server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 NewtonBotics Backend Server running on http://${HOST}:${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Health Check: http://${HOST}:${PORT}/health`);
    });

    // Setup Socket.IO only if we have a server
    if (server) {
      setupSocketIO(server);
      logger.info('✅ Socket.IO initialized');
    }

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      if (server) {
        server.close(() => {
          logger.info('Process terminated');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      if (server) {
        server.close(() => {
          logger.info('Process terminated');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    // Don't exit on Vercel, just log the error
    if (process.env.NODE_ENV === 'production') {
      logger.error('Running in production mode, continuing without database connection');
    } else {
      process.exit(1);
    }
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
