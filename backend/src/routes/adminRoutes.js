const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, authorize } = require('../middleware/auth');
const featureController = require('../controllers/featureController');
const adminSettingsController = require('../controllers/adminSettingsController');
const kbController = require('../controllers/kbController');

// ─── SHARED: any authenticated user ───
// These must be before the admin-only middleware
const sharedRouter = express.Router();
sharedRouter.use(authMiddleware);
sharedRouter.get('/notifications', kbController.getMyNotifications);
sharedRouter.put('/notifications/read-all', kbController.markAllRead);
sharedRouter.put('/notifications/:id/read', kbController.markRead);
sharedRouter.get('/kb', kbController.publicList);

// ─── ADMIN ONLY ───
router.use(authMiddleware);
router.use(authorize('admin'));

// User management
router.get('/users', userController.getAllUsers);
router.get('/users/role/:role', userController.getUsersByRole);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id/status', userController.updateUserStatus);
router.put('/users/:userId/reset-password', userController.adminResetPassword);

// Dashboard stats
router.get('/stats', userController.getDashboardStats);

// Real Analytics
router.get('/analytics', adminSettingsController.getAnalytics);

// Create accounts
router.post('/create-tpc', userController.createTpcUser);
router.post('/create-student', userController.createStudentUser);

// Feature Toggles
router.get('/features', featureController.getFeatures);
router.post('/features', featureController.createFeature);
router.put('/features/:id/toggle', featureController.toggleFeature);
router.delete('/features/:id', featureController.deleteFeature);

// System Settings
router.get('/settings', adminSettingsController.getSettings);
router.put('/settings', adminSettingsController.updateSettings);

// Knowledge Base (admin CRUD)
router.get('/kb', kbController.listArticles);
router.post('/kb', kbController.createArticle);
router.put('/kb/:id', kbController.updateArticle);
router.delete('/kb/:id', kbController.deleteArticle);
router.post('/kb/:id/publish', kbController.togglePublish);

// Broadcast Notification
router.post('/notify', kbController.broadcastNotification);

module.exports = { adminRouter: router, sharedRouter };
