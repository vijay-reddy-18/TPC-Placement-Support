const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Get activity log for a specific ticket (All users can view for their own tickets)
router.get('/ticket/:ticketId', authMiddleware, activityLogController.getActivityLog);

// Get activity log for a specific user (TPC/Admin only)
router.get('/user/:userId', authMiddleware, authorize('tpc', 'admin'), activityLogController.getUserActivityLog);

// Get all activity logs (Admin only)
router.get('/all/logs', authMiddleware, authorize('admin'), activityLogController.getAllActivityLogs);

module.exports = router;
