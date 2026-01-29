const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const timeRoutes = require('./routes/time');
const categoryRoutes = require('./routes/categories');
const tagRoutes = require('./routes/tags');

const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Graceful database connection handling
let dbConnected = false;
global.db = null; // Make database available globally

// Try to initialize database connection
const initDbConnection = async () => {
  try {
    const dbModule = require('./config/db');
    await dbModule.pool.getConnection();
    console.log('✅ Database connected successfully');
    global.db = dbModule; // Make db available globally
    dbConnected = true;
  } catch (error) {
    console.error('⚠️ Database connection pending:', error.message);
    // Don't exit on Render - allow server to start anyway
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ Database connection failed - exiting');
      process.exit(1);
    } else {
      console.warn('⚠️ Database connection failed in production - server will start without database');
    }
  }
};

// Initialize database connection
initDbConnection();

// Add temporary in-memory storage for user profiles
const userProfiles = new Map();
const userSecurity = new Map();

// Mock user profile endpoints (temporary until database is ready)
app.get('/api/users/:userId/profile', (req, res) => {
  try {
    const { userId } = req.params;
    const profile = userProfiles.get(userId) || {
      name: req.user?.name || 'User',
      role: 'User',
      location: 'San Francisco, CA',
      bio: 'Product Designer passionate about creating exceptional digital experiences',
      website: `tasq.one/u/${userId}`,
      avatar: ''
    };
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

app.put('/api/users/:userId/profile', (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;
    
    // Store in memory
    userProfiles.set(userId, {
      ...profileData,
      updatedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profileData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

app.get('/api/users/:userId/security', (req, res) => {
  try {
    const { userId } = req.params;
    const security = userSecurity.get(userId) || {
      twoFactorEnabled: true,
      biometricEnabled: true,
      notificationsEnabled: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    };
    
    res.json({
      success: true,
      data: security
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security settings'
    });
  }
});

app.put('/api/users/:userId/security', (req, res) => {
  try {
    const { userId } = req.params;
    const securityData = req.body;
    
    // Store in memory
    userSecurity.set(userId, {
      ...securityData,
      updatedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Security settings updated successfully',
      data: securityData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update security settings'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
  if (dbConnected) {
    console.log('✅ Database: Connected');
  } else {
    console.log('⚠️ Database: Not connected (using in-memory storage)');
  }
});

module.exports = app;