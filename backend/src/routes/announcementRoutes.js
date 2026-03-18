const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Public routes - Anyone can view announcements
router.get('/', authMiddleware, announcementController.getAnnouncements);
router.get('/:id', authMiddleware, announcementController.getAnnouncement);

// TPC/Admin routes - Create, update, delete announcements
router.post('/', authMiddleware, authorize('tpc', 'admin'), announcementController.createAnnouncement);
router.put('/:id', authMiddleware, authorize('tpc', 'admin'), announcementController.updateAnnouncement);
router.delete('/:id', authMiddleware, authorize('tpc', 'admin'), announcementController.deleteAnnouncement);

module.exports = router;
