const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const featureController = require('../controllers/featureController');
const { authMiddleware } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.get('/features', authMiddleware, featureController.getFeatures);

module.exports = router;



