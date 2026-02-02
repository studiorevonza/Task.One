require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const timeRoutes = require('./routes/time');
const categoryRoutes = require('./routes/categories');
const tagRoutes = require('./routes/tags');
const notificationRoutes = require('./routes/notifications');

const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

const app = express();
const http = require('http');
const { Server } = require('socket.io');
const { setDbConnected } = require('./utils/dbHelper');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Neural Socket Connection
io.on('connection', (socket) => {
  console.log('📡 Neural Link Established:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Neural Link Severed:', socket.id);
  });
});

// Global io object for routes
app.set('io', io);

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

// Root endpoint to provide API information
app.get('/', (req, res) => {
  res.json({
    name: 'Task.One API',
    version: process.env.npm_package_version || '1.0.0',
    description: 'Neural Task Management API',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      projects: '/api/projects',
      tasks: '/api/tasks'
    },
    timestamp: new Date().toISOString()
  });
});

// Initialize database connection
const connectDB = require('./config/db');

// Connect to MongoDB with error handling - DON'T let it crash the app
let dbConnected = false;
connectDB()
  .then(() => {
    dbConnected = true;
    setDbConnected(true); // Set connection status
    console.log('✅ Database: Connected');
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    console.warn('⚠️ Running in development with limited functionality');
    // Don't exit the process - app continues with in-memory storage
    dbConnected = false;
    setDbConnected(false); // Set connection status
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Neural Engine Synchronized on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
  if (dbConnected) {
    console.log('✅ Database: Connected');
  } else {
    console.log('⚠️ Database: Not connected (using in-memory storage)');
  }
});

module.exports = app;