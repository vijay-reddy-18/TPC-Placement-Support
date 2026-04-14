require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const { adminRouter, sharedRouter } = require('./routes/adminRoutes');
const userSettingsRoutes = require('./routes/userSettingsRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');

const { authMiddleware, authorize } = require('./middleware/auth');
const userController = require('./controllers/userController');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Connect to MongoDB
connectDB();

// ================= API ROUTES =================

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRouter);
app.use('/api', sharedRouter);          // /api/notifications, /api/kb (shared)
app.use('/api/user', userSettingsRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/activity-logs', activityLogRoutes);

// Public endpoint for getting all users (Admin only)
app.get('/api/users', authMiddleware, authorize('admin'), userController.getAllUsers);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// ================= 404 HANDLER =================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ================= ERROR HANDLER =================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ================= START SERVER =================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📚 MongoDB connected and listening for requests...`);
});