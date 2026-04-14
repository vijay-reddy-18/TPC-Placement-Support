const Ticket = require('../models/Ticket');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const sendEmail = require('../utils/emailService');
const { ticketCreatedTemplate, ticketSolvedTemplate } = require('../utils/emailTemplates');

// Helper function to log activity
const logActivity = async (ticketId, action, performedBy, newValue, oldValue, description) => {
    try {
        await ActivityLog.create({
            ticketId,
            action,
            performedBy,
            newValue,
            oldValue,
            description,
        });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

// Create Ticket (Student)
exports.createTicket = async (req, res) => {
    try {
        const { title, description, category, priority, department } = req.body;
        const studentId = req.user.studentId;

        // Validate required fields
        if (!title || !description || !category) {
            return res.status(400).json({
                success: false,
                message: 'Title, description, and category are required',
            });
        }


        // Find active TPC staff
        const activeTPCs = await User.find({ role: 'tpc', isActive: true });
        let assignedTo = null;
        let assignmentNote = '';
        if (activeTPCs.length > 0) {
            // Simple round-robin: assign to TPC with least open/in-progress tickets
            let minTickets = Infinity;
            for (const tpc of activeTPCs) {
                const count = await Ticket.countDocuments({ assignedTo: tpc._id, status: { $in: ['open', 'in-progress'] } });
                if (count < minTickets) {
                    minTickets = count;
                    assignedTo = tpc._id;
                }
            }
            assignmentNote = 'Assigned to active TPC staff.';
        } else {
            assignmentNote = 'No active TPC staff. Ticket is queued.';
        }

        // Create new ticket with assignment
        const newTicket = await Ticket.create({
            title,
            description,
            category,
            priority: priority || 'medium',
            department: department || null,
            studentId,
            status: 'open',
            assignedTo: assignedTo || null,
        });

        // Log assignment activity
        await logActivity(newTicket._id, 'ticket-created', req.user._id, assignedTo, null, assignmentNote);

        // Send email notification if enabled
        try {
            const user = await User.findOne({ studentId });
            if (user && user.emailNotifications) {
                const html = ticketCreatedTemplate(user.name, newTicket.title, newTicket._id);
                await sendEmail(
                    user.email || user.studentEmail,
                    'Ticket Created - Placement Department',
                    html
                );
                console.log(`[TICKET CREATED EMAIL] Sent to ${user.email}, Ticket: ${newTicket._id}`);
            }
        } catch (emailError) {
            console.error('[TICKET EMAIL ERROR]', emailError.message);
            // Don't fail the ticket creation if email fails
        }

        return res.status(201).json({
            success: true,
            message: 'Ticket created successfully',
            ticket: newTicket,
        });
    } catch (error) {
        console.error('Ticket creation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create ticket',
            error: error.message,
        });
    }
};

// Get All Tickets (Admin/TPC - all tickets, Student - own tickets)
exports.getAllTickets = async (req, res) => {
    try {
        const { status, priority, category, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        let filter = {};

        // If student, show only their tickets
        if (req.user.role === 'student') {
            filter.studentId = req.user.studentId;
        }
        // If TPC, show tickets assigned to them or unassigned (queue)
        if (req.user.role === 'tpc') {
            filter.$or = [
                { assignedTo: req.user.userId },
                { assignedTo: null }
            ];
        }

        // Apply additional filters
        if (status && status !== 'null' && status !== 'undefined') filter.status = status;
        if (priority && priority !== 'null' && priority !== 'undefined') filter.priority = priority;
        if (category && category !== 'null' && category !== 'undefined') filter.category = category;

        // Perform text search if specified
        const { search } = req.query;
        if (search && search.trim() !== '') {
            const searchLogic = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { category: { $regex: search, $options: 'i' } }
                ]
            };
            if (filter.$or) {
                // If there's an existing $or (like from TPC assignment), wrap in $and
                filter.$and = [ { $or: filter.$or }, searchLogic ];
                delete filter.$or;
            } else {
                Object.assign(filter, searchLogic);
            }
        }

        const tickets = await Ticket.find(filter)
            .populate('assignedTo', 'name role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Ticket.countDocuments(filter);

        return res.status(200).json({
            success: true,
            message: 'Tickets retrieved successfully',
            tickets,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Fetch tickets error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch tickets',
            error: error.message,
        });
    }
};

// Get Single Ticket
exports.getTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await Ticket.findById(id)
            .populate('assignedTo', 'name role email studentId');

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        // studentId is a plain string field, not a populated reference
        const ticketStudentId = ticket.studentId;

        // Check authorization: student can only view own tickets
        if (req.user.role === 'student' && ticketStudentId !== req.user.studentId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this ticket',
            });
        }

        // For TPC: fetch student info, all previous tickets, resolver, and resolution details
        let studentInfo = null;
        let previousTickets = [];
        let resolverInfo = null;
        let resolution = ticket.tpcResponse || null;
        if (req.user.role === 'tpc' || req.user.role === 'admin') {
            // Student info
            studentInfo = await User.findOne({ studentId: ticketStudentId }, '-password');
            // Previous tickets (excluding current)
            previousTickets = await Ticket.find({ studentId: ticketStudentId, _id: { $ne: ticket._id } })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('assignedTo', 'name role');
            // Resolver info (always fetch if assigned)
            if (ticket.assignedTo) {
                resolverInfo = await User.findById(ticket.assignedTo, 'name email studentId');
            }
        }

        return res.status(200).json({
            success: true,
            ticket,
            studentInfo,
            previousTickets,
            resolverInfo,
            resolution,
        });
    } catch (error) {
        console.error('Fetch ticket error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch ticket',
            error: error.message,
        });
    }
};

// Update Ticket (TPC/Admin)
exports.updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, tpcResponse, deadline, priority } = req.body;
        console.log(`[DEBUG] updateTicket hit for ID: ${id}`);
        console.log(`[DEBUG] Body:`, req.body);
        console.log(`[DEBUG] User:`, req.user);

        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        // Store old values for logging
        const oldStatus = ticket.status;
        const oldPriority = ticket.priority;

        // Get sender info for response thread
        const senderUser = await User.findById(req.user.userId);
        const senderName = senderUser ? senderUser.name : 'TPC Staff';

        // If a response is provided, push to responses array AND set tpcResponse for backward compat
        if (tpcResponse) {
            ticket.tpcResponse = tpcResponse;
            ticket.responses.push({
                sender: req.user.userId,
                senderRole: req.user.role,
                senderName: senderName,
                message: tpcResponse,
                timestamp: new Date(),
            });
            // Log response activity
            await logActivity(ticket._id, 'response-added', req.user.userId, tpcResponse, null, `Response sent by ${senderName}`);
        }

        // Update allowed fields
        if (status) ticket.status = status;
        if (deadline) ticket.deadline = new Date(deadline);
        if (priority) ticket.priority = priority;

        // Mark as resolved if status is resolved
        if (status === 'resolved') {
            ticket.resolvedAt = new Date();
        }

        await ticket.save();

        // Log status change activity
        if (status && status !== oldStatus) {
            await logActivity(ticket._id, 'status-changed', req.user.userId, status, oldStatus, `Status changed from ${oldStatus} to ${status} by ${senderName}`);
        }

        // Log priority change
        if (priority && priority !== oldPriority) {
            await logActivity(ticket._id, 'ticket-updated', req.user.userId, priority, oldPriority, `Priority changed from ${oldPriority} to ${priority}`);
        }

        // Send email notification if ticket is resolved and email notifications are enabled
        if (status === 'resolved' && oldStatus !== 'resolved') {
            try {
                const user = await User.findOne({ studentId: ticket.studentId });
                if (user && user.emailNotifications) {
                    const html = ticketSolvedTemplate(user.name, ticket.title, ticket._id);
                    await sendEmail(
                        user.email || user.studentEmail,
                        'Ticket Resolved - Placement Department',
                        html
                    );
                    console.log(`[TICKET RESOLVED EMAIL] Sent to ${user.email}, Ticket: ${ticket._id}`);
                }
            } catch (emailError) {
                console.error('[TICKET RESOLUTION EMAIL ERROR]', emailError.message);
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Ticket updated successfully',
            ticket,
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            console.error('Ticket update validation error:', messages);
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: messages
            });
        }
        console.error('Update ticket error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update ticket',
            error: error.message,
        });
    }
};

// Close Ticket (Student)
exports.closeTicket = async (req, res) => {
    try {
        const { id } = req.params;

        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        // Check if student owns the ticket
        if (ticket.studentId !== req.user.studentId) {
            return res.status(403).json({
                success: false,
                message: 'You cannot close this ticket',
            });
        }

        ticket.status = 'closed';
        await ticket.save();

        return res.status(200).json({
            success: true,
            message: 'Ticket closed successfully',
            ticket,
        });
    } catch (error) {
        console.error('Close ticket error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to close ticket',
            error: error.message,
        });
    }
};

// Assign Ticket (TPC/Admin)
exports.assignTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { assignedTo } = req.body;

        if (!assignedTo) {
            return res.status(400).json({
                success: false,
                message: 'Assigned to user ID is required',
            });
        }

        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        // Verify the assigned user exists and is TPC or Admin
        const assignedUser = await User.findById(assignedTo);
        if (!assignedUser || !['tpc', 'admin'].includes(assignedUser.role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user assignment',
            });
        }

        ticket.assignedTo = assignedTo;
        await ticket.save();

        return res.status(200).json({
            success: true,
            message: 'Ticket assigned successfully',
            ticket,
        });
    } catch (error) {
        console.error('Assign ticket error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to assign ticket',
            error: error.message,
        });
    }
};

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        let filter = {};

        // If student, show stats for their tickets
        if (req.user.role === 'student') {
            filter.studentId = req.user.studentId;
        }

        const totalTickets = await Ticket.countDocuments(filter);
        const openTickets = await Ticket.countDocuments({ ...filter, status: 'open' });
        const inProgressTickets = await Ticket.countDocuments({
            ...filter,
            status: 'in-progress',
        });
        const resolvedTickets = await Ticket.countDocuments({
            ...filter,
            status: 'resolved',
        });

        return res.status(200).json({
            success: true,
            stats: {
                totalTickets,
                openTickets,
                inProgressTickets,
                resolvedTickets,
            },
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard stats',
            error: error.message,
        });
    }
};
// Add Internal Note (TPC/Admin)
exports.addInternalNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;

        if (!note || !note.trim()) {
            return res.status(400).json({ success: false, message: 'Note text is required' });
        }

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        const author = await User.findById(req.user.userId);
        const authorName = author ? author.name : 'TPC Staff';

        ticket.internalNotes.push({
            author: req.user.userId,
            authorName,
            note: note.trim(),
            timestamp: new Date(),
        });

        await ticket.save();

        return res.status(200).json({
            success: true,
            message: 'Internal note added',
            ticket,
        });
    } catch (error) {
        console.error('Add internal note error:', error);
        return res.status(500).json({ success: false, message: 'Failed to add note', error: error.message });
    }
};

// Escalate Ticket (TPC/Admin)
exports.escalateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { escalationReason } = req.body;

        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        const oldEscalationStatus = ticket.isEscalated;
        ticket.isEscalated = true;
        ticket.escalatedTo = req.user.userId;
        ticket.escalationReason = escalationReason || 'Requires admin review';

        await ticket.save();

        // Log activity
        await logActivity(ticket._id, 'escalated', req.user.userId, true, oldEscalationStatus, escalationReason);

        return res.status(200).json({
            success: true,
            message: 'Ticket escalated successfully',
            ticket,
        });
    } catch (error) {
        console.error('Escalate ticket error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to escalate ticket',
            error: error.message,
        });
    }
};

// Reopen Ticket (TPC/Admin/Student)
exports.reopenTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        // Check authorization
        if (req.user.role === 'student' && ticket.studentId !== req.user.studentId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to reopen this ticket',
            });
        }

        const oldStatus = ticket.status;
        ticket.status = 'open';
        ticket.reopenedAt = new Date();
        
        // Add reason as a response so it shows in the chat
        let finalReason = reason || 'User reopened ticket';
        const user = await User.findById(req.user.userId);
        const userName = user ? user.name : (req.user.role === 'student' ? 'Student' : 'Staff');
        
        ticket.responses.push({
            sender: req.user.userId,
            senderRole: req.user.role,
            senderName: userName,
            message: `Ticket Reopened: ${finalReason}`,
            timestamp: new Date()
        });

        await ticket.save();

        // Log activity
        await logActivity(ticket._id, 'ticket-reopened', req.user.userId, 'open', oldStatus, finalReason);

        return res.status(200).json({
            success: true,
            message: 'Ticket reopened successfully',
            ticket,
        });
    } catch (error) {
        console.error('Reopen ticket error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reopen ticket',
            error: error.message,
        });
    }
};

// Get Escalated Tickets (Admin/TPC)
exports.getEscalatedTickets = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const tickets = await Ticket.find({ isEscalated: true })
            .populate('assignedTo', 'name role')
            .populate('escalatedTo', 'name role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Ticket.countDocuments({ isEscalated: true });

        return res.status(200).json({
            success: true,
            tickets,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get escalated tickets error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch escalated tickets',
            error: error.message,
        });
    }
};

// Get Ticket History with Activity Log
exports.getTicketHistory = async (req, res) => {
    try {
        const { id } = req.params;

        const ticket = await Ticket.findById(id)
            .populate('assignedTo', 'name role')
            .populate('escalatedTo', 'name role');

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        // Check authorization
        if (req.user.role === 'student' && ticket.studentId !== req.user.studentId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this ticket history',
            });
        }

        const activityLog = await ActivityLog.find({ ticketId: id })
            .populate('performedBy', 'name role studentId')
            .sort({ timestamp: -1 });

        return res.status(200).json({
            success: true,
            ticket,
            activityLog,
        });
    } catch (error) {
        console.error('Get ticket history error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch ticket history',
            error: error.message,
        });
    }
};

// Get Category Analytics (TPC/Admin)
exports.getCategoryAnalytics = async (req, res) => {
    try {
        const analytics = await Ticket.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    resolved: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0],
                        },
                    },
                    pending: {
                        $sum: {
                            $cond: [{ $in: ['$status', ['open', 'in-progress']] }, 1, 0],
                        },
                    },
                },
            },
            {
                $sort: { count: -1 },
            },
        ]);

        const categoryNames = {
            'placement': 'Placement',
            'internship': 'Internship',
            'document': 'Document',
            'company-eligibility': 'Company Eligibility',
            'internship-confirmation': 'Internship Confirmation',
            'offer-letter': 'Offer Letter',
            'document-verification': 'Document Verification',
            'interview-schedule': 'Interview Schedule',
            'placement-process': 'Placement Process',
            'other': 'Other',
        };

        const formattedAnalytics = analytics.map(item => ({
            category: categoryNames[item._id] || item._id,
            categoryKey: item._id,
            total: item.count,
            resolved: item.resolved,
            pending: item.pending,
        }));

        return res.status(200).json({
            success: true,
            analytics: formattedAnalytics,
        });
    } catch (error) {
        console.error('Get category analytics error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch category analytics',
            error: error.message,
        });
    }
};

// Get Weekly Trends (TPC/Admin)
exports.getWeeklyTrends = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const trends = await Ticket.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);

        return res.status(200).json({
            success: true,
            trends,
        });
    } catch (error) {
        console.error('Get weekly trends error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch weekly trends',
            error: error.message,
        });
    }
};

// Calculate SLA and Update Ticket SLA Status
exports.updateSLAStatus = async (req, res) => {
    try {
        const SLA_RESPONSE_TIME_HOURS = 24; // 24 hours response time
        const SLA_RESOLUTION_TIME_DAYS = 5; // 5 days resolution time

        const tickets = await Ticket.find({ status: { $in: ['open', 'in-progress'] } });

        for (let ticket of tickets) {
            const hoursElapsed = (new Date() - ticket.createdAt) / (1000 * 60 * 60);

            if (hoursElapsed > SLA_RESPONSE_TIME_HOURS * SLA_RESOLUTION_TIME_DAYS) {
                ticket.slaStatus = 'breached';
            } else if (hoursElapsed > SLA_RESPONSE_TIME_HOURS * SLA_RESOLUTION_TIME_DAYS * 0.8) {
                ticket.slaStatus = 'at-risk';
            } else {
                ticket.slaStatus = 'on-track';
            }

            await ticket.save();
        }

        return res.status(200).json({
            success: true,
            message: 'SLA status updated',
        });
    } catch (error) {
        console.error('Update SLA status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update SLA status',
            error: error.message,
        });
    }
};

// Get SLA Dashboard
exports.getSLADashboard = async (req, res) => {
    try {
        const totalTickets = await Ticket.countDocuments({});
        const breachedSLA = await Ticket.countDocuments({ slaStatus: 'breached' });
        const atRiskSLA = await Ticket.countDocuments({ slaStatus: 'at-risk' });
        const onTrackSLA = await Ticket.countDocuments({ slaStatus: 'on-track' });

        const slaCompliance = ((onTrackSLA + atRiskSLA) / totalTickets * 100).toFixed(2);

        return res.status(200).json({
            success: true,
            slaMetrics: {
                totalTickets,
                breached: breachedSLA,
                atRisk: atRiskSLA,
                onTrack: onTrackSLA,
                compliancePercentage: slaCompliance,
            },
        });
    } catch (error) {
        console.error('Get SLA dashboard error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch SLA dashboard',
            error: error.message,
        });
    }
};

// Get Performance Stats for current TPC/Admin user
exports.getPerformanceStats = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Tickets assigned to this user
        const totalAssigned = await Ticket.countDocuments({ assignedTo: userId });
        const resolvedByMe = await Ticket.countDocuments({ assignedTo: userId, status: 'resolved' });
        const closedByMe = await Ticket.countDocuments({ assignedTo: userId, status: 'closed' });
        const openByMe = await Ticket.countDocuments({ assignedTo: userId, status: { $in: ['open', 'in-progress'] } });

        // Resolution rate
        const resolutionRate = totalAssigned > 0 ? Math.round(((resolvedByMe + closedByMe) / totalAssigned) * 100) : 0;

        // Avg response time: average time between createdAt and first response timestamp
        const ticketsWithResponses = await Ticket.find(
            { assignedTo: userId, 'responses.0': { $exists: true } },
            { createdAt: 1, 'responses.timestamp': 1 }
        );

        let avgResponseHours = 0;
        if (ticketsWithResponses.length > 0) {
            let totalMinutes = 0;
            for (const t of ticketsWithResponses) {
                const firstResponse = t.responses[0];
                if (firstResponse && firstResponse.timestamp) {
                    totalMinutes += (new Date(firstResponse.timestamp) - new Date(t.createdAt)) / (1000 * 60);
                }
            }
            avgResponseHours = parseFloat((totalMinutes / ticketsWithResponses.length / 60).toFixed(1));
        }

        // Monthly resolved (current month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const resolvedThisMonth = await Ticket.countDocuments({
            assignedTo: userId,
            status: 'resolved',
            resolvedAt: { $gte: startOfMonth },
        });

        return res.status(200).json({
            success: true,
            performance: {
                totalAssigned,
                resolvedByMe,
                closedByMe,
                openByMe,
                resolutionRate,
                avgResponseHours,
                resolvedThisMonth,
            },
        });
    } catch (error) {
        console.error('Performance stats error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch performance stats', error: error.message });
    }
};


// Submit Feedback (Student)
exports.submitFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Only the ticket owner can submit feedback
        if (ticket.studentId !== req.user.studentId) {
            return res.status(403).json({ success: false, message: 'You cannot rate this ticket' });
        }

        // Only resolved/closed tickets can be rated
        if (!['resolved', 'closed'].includes(ticket.status)) {
            return res.status(400).json({ success: false, message: 'Only resolved or closed tickets can be rated' });
        }

        ticket.feedback = {
            rating: parseInt(rating),
            comment: comment || '',
            submittedAt: new Date(),
        };

        await ticket.save();
        await logActivity(ticket._id, 'feedback-submitted', req.user._id, rating, null, `Student rated ticket ${rating}/5`);

        return res.status(200).json({ success: true, message: 'Feedback submitted successfully', ticket });
    } catch (error) {
        console.error('Submit feedback error:', error);
        return res.status(500).json({ success: false, message: 'Failed to submit feedback', error: error.message });
    }
};

// Add Student Response / Message (Student)
exports.addStudentResponse = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Only ticket owner can post
        if (ticket.studentId !== req.user.studentId) {
            return res.status(403).json({ success: false, message: 'You can only respond to your own tickets' });
        }

        if (ticket.status === 'closed') {
            return res.status(400).json({ success: false, message: 'Cannot reply to a closed ticket. Please reopen it first.' });
        }

        const senderUser = await User.findById(req.user.userId);
        const senderName = senderUser ? senderUser.name : 'Student';

        ticket.responses.push({
            sender: req.user.userId,
            senderRole: 'student',
            senderName,
            message: message.trim(),
            timestamp: new Date(),
        });

        await ticket.save();
        await logActivity(ticket._id, 'response-added', req.user.userId, message.trim(), null, `Student reply by ${senderName}`);

        return res.status(200).json({ success: true, message: 'Response added', ticket });
    } catch (error) {
        console.error('Student response error:', error);
        return res.status(500).json({ success: false, message: 'Failed to add response', error: error.message });
    }
};