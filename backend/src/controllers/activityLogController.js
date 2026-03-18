const ActivityLog = require('../models/ActivityLog');
const Ticket = require('../models/Ticket');

// Get Activity Log for a Ticket
exports.getActivityLog = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        // Check if ticket exists
        const ticket = await Ticket.findById(ticketId);
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
                message: 'Unauthorized to view this ticket activity',
            });
        }

        const activities = await ActivityLog.find({ ticketId })
            .populate('performedBy', 'name role studentId')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await ActivityLog.countDocuments({ ticketId });

        return res.status(200).json({
            success: true,
            activities,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get activity log error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch activity log',
            error: error.message,
        });
    }
};

// Get Activity Log for a User (TPC/Admin only)
exports.getUserActivityLog = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20, action } = req.query;
        const skip = (page - 1) * limit;

        let filter = { performedBy: userId };

        if (action) {
            filter.action = action;
        }

        const activities = await ActivityLog.find(filter)
            .populate('ticketId', 'title')
            .populate('performedBy', 'name role')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await ActivityLog.countDocuments(filter);

        return res.status(200).json({
            success: true,
            activities,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get user activity log error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user activity log',
            error: error.message,
        });
    }
};

// Get All Activity Logs (Admin only)
exports.getAllActivityLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, action, startDate, endDate } = req.query;
        const skip = (page - 1) * limit;

        let filter = {};

        if (action) {
            filter.action = action;
        }

        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) filter.timestamp.$lte = new Date(endDate);
        }

        const activities = await ActivityLog.find(filter)
            .populate('ticketId', 'title studentId')
            .populate('performedBy', 'name role')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await ActivityLog.countDocuments(filter);

        return res.status(200).json({
            success: true,
            activities,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get all activity logs error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch activity logs',
            error: error.message,
        });
    }
};

// Create Activity Log (Internal use)
exports.createActivityLog = async (ticketId, action, performedBy, newValue, oldValue, description) => {
    try {
        const activityLog = new ActivityLog({
            ticketId,
            action,
            performedBy,
            newValue,
            oldValue,
            description,
        });
        await activityLog.save();
        return activityLog;
    } catch (error) {
        console.error('Create activity log error:', error);
    }
};
