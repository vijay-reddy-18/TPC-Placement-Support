const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, authorize } = require('../middleware/auth');

const featureController = require('../controllers/featureController');

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(authorize('admin'));

// User management routes
router.get('/users', userController.getAllUsers);
router.get('/users/role/:role', userController.getUsersByRole);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id/status', userController.updateUserStatus);
router.put('/users/:userId/reset-password', userController.adminResetPassword);

// Dashboard stats
router.get('/stats', userController.getDashboardStats);

// Create accounts
router.post('/create-tpc', userController.createTpcUser);
router.post('/create-student', userController.createStudentUser);

// Feature Toggles (Settings)
router.get('/features', featureController.getFeatures);
router.post('/features', featureController.createFeature);
router.put('/features/:id/toggle', featureController.toggleFeature);
router.delete('/features/:id', featureController.deleteFeature);

module.exports = router;



