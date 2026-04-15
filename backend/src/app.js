const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userSettingsRoutes = require('./routes/userSettingsRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (Object.keys(req.body).length > 0) {
    console.log('  Body:', req.body);
  }
  next();
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  exposedHeaders: ['Content-Disposition']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT',
      message: 'Too many requests from this IP, please try again later.'
    }
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
console.log('[APP] Registering routes...');
app.use('/api/auth', authRoutes);
console.log('[APP] ✓ Auth routes registered');
app.use('/api/tickets', ticketRoutes);
console.log('[APP] ✓ Ticket routes registered');
app.use('/api/admin', adminRoutes);
console.log('[APP] ✓ Admin routes registered');
app.use('/api/user', userSettingsRoutes);
console.log('[APP] ✓ User settings routes registered');

// 404 handler - must be after all routes
app.use('*', (req, res) => {
  console.error(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `${req.method} ${req.originalUrl} - Route not found`
    }
  });
});

// Error handling middleware - must be the last middleware
app.use((err, req, res, next) => {
  console.error('[ERROR HANDLER]', {
    code: err.code,
    message: err.message,
    stack: err.stack
  });
  errorHandler(err, req, res, next);
});

module.exports = app;



