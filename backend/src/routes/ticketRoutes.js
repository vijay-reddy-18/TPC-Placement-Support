const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authMiddleware, authorize } = require('../middleware/auth');

// All ticket routes require authentication
router.use(authMiddleware);

// Dashboard and Analytics routes (must be before :id routes)
router.get('/stats/dashboard', ticketController.getDashboardStats);
router.get('/stats/sla', authorize('tpc', 'admin'), ticketController.getSLADashboard);
router.get('/stats/categories', authorize('tpc', 'admin'), ticketController.getCategoryAnalytics);
router.get('/stats/weekly-trends', authorize('tpc', 'admin'), ticketController.getWeeklyTrends);
router.get('/escalated/list', authorize('tpc', 'admin'), ticketController.getEscalatedTickets);
router.get('/stats/performance', authorize('tpc', 'admin'), ticketController.getPerformanceStats);

// Student routes
router.post('/', ticketController.createTicket);
router.get('/', ticketController.getAllTickets);

// TPC/Admin action routes (must be before :id routes)
router.put('/escalate/:id', authorize('tpc', 'admin'), ticketController.escalateTicket);
router.put('/reopen/:id', ticketController.reopenTicket); // Students and TPC/Admin can reopen
router.get('/history/:id', ticketController.getTicketHistory); // Get ticket history with activity log
router.put('/update-sla', authorize('admin'), ticketController.updateSLAStatus); // Admin only

// Single ticket routes
router.get('/:id', ticketController.getTicket);
router.put('/:id', authorize('tpc', 'admin'), ticketController.updateTicket);
router.put('/:id/assign', authorize('tpc', 'admin'), ticketController.assignTicket);
router.put('/:id/close', ticketController.closeTicket);
router.post('/:id/note', authorize('tpc', 'admin'), ticketController.addInternalNote);
router.post('/:id/student-response', ticketController.addStudentResponse); // Student can add message
router.put('/:id/feedback', ticketController.submitFeedback); // Student feedback on resolved tickets

module.exports = router;
