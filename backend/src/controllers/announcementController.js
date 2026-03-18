const Announcement = require('../models/Announcement');
const User = require('../models/User');

// Create Announcement (TPC/Admin only)
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, description, category, content, targetAudience, targetBatch, targetBranch, expiryDate, priority } = req.body;

        if (!title || !description || !category || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title, description, category, and content are required',
            });
        }

        const announcement = await Announcement.create({
            title,
            description,
            category,
            content,
            targetAudience,
            targetBatch,
            targetBranch,
            expiryDate,
            priority,
            createdBy: req.user.userId,
        });

        return res.status(201).json({
            success: true,
            message: 'Announcement created successfully',
            announcement,
        });
    } catch (error) {
        console.error('Create announcement error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create announcement',
            error: error.message,
        });
    }
};

// Get All Announcements (Students - active ones, TPC/Admin - all)
exports.getAnnouncements = async (req, res) => {
    try {
        const { category, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        let filter = {};

        // Students only see active announcements
        if (req.user.role === 'student') {
            filter.isActive = true;
            filter.$or = [
                { expiryDate: { $gte: new Date() } },
                { expiryDate: null }
            ];
        }

        if (category) {
            filter.category = category;
        }

        const announcements = await Announcement.find(filter)
            .populate('createdBy', 'name role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Announcement.countDocuments(filter);

        return res.status(200).json({
            success: true,
            announcements,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get announcements error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch announcements',
            error: error.message,
        });
    }
};

// Get Single Announcement
exports.getAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await Announcement.findByIdAndUpdate(
            id,
            { $inc: { views: 1 } },
            { new: true }
        ).populate('createdBy', 'name role');

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found',
            });
        }

        return res.status(200).json({
            success: true,
            announcement,
        });
    } catch (error) {
        console.error('Get announcement error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch announcement',
            error: error.message,
        });
    }
};

// Update Announcement (TPC/Admin only)
exports.updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, content, targetAudience, targetBatch, targetBranch, expiryDate, priority, isActive } = req.body;

        const announcement = await Announcement.findById(id);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found',
            });
        }

        // Check authorization
        if (announcement.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to update this announcement',
            });
        }

        if (title) announcement.title = title;
        if (description) announcement.description = description;
        if (category) announcement.category = category;
        if (content) announcement.content = content;
        if (targetAudience) announcement.targetAudience = targetAudience;
        if (targetBatch) announcement.targetBatch = targetBatch;
        if (targetBranch) announcement.targetBranch = targetBranch;
        if (expiryDate) announcement.expiryDate = expiryDate;
        if (priority) announcement.priority = priority;
        if (typeof isActive === 'boolean') announcement.isActive = isActive;

        await announcement.save();

        return res.status(200).json({
            success: true,
            message: 'Announcement updated successfully',
            announcement,
        });
    } catch (error) {
        console.error('Update announcement error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update announcement',
            error: error.message,
        });
    }
};

// Delete Announcement (TPC/Admin only)
exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await Announcement.findById(id);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found',
            });
        }

        // Check authorization
        if (announcement.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to delete this announcement',
            });
        }

        await Announcement.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Announcement deleted successfully',
        });
    } catch (error) {
        console.error('Delete announcement error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete announcement',
            error: error.message,
        });
    }
};
