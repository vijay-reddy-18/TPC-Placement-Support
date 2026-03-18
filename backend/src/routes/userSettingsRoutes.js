const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
        }
    }
});

// Protected routes - User settings
router.get('/profile', authMiddleware, userController.getUserProfile);
router.put('/profile', authMiddleware, userController.updateUserProfile);
router.put('/settings', authMiddleware, userController.updateUserSettings);
router.post('/change-password', authMiddleware, userController.changePassword);
router.post('/upload-photo', authMiddleware, upload.single('profilePhoto'), userController.uploadProfilePhoto);
router.get('/download-data', authMiddleware, userController.downloadUserData);
router.delete('/delete-account', authMiddleware, userController.deleteAccount);

// Get student profile by studentId (authenticated)
router.get('/student/:studentId', authMiddleware, userController.getStudentProfile);

module.exports = router;

