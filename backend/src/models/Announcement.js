const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Announcement title is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Announcement description is required'],
        },
        category: {
            type: String,
            enum: ['company-eligibility', 'interview-schedule', 'document-requirement', 'offer-update', 'general'],
            required: [true, 'Category is required'],
        },
        content: {
            type: String,
            required: [true, 'Content is required'],
        },
        targetAudience: {
            type: String,
            enum: ['all-students', 'specific-batch', 'specific-branch'],
            default: 'all-students',
        },
        targetBatch: {
            type: String,
            default: null,
        },
        targetBranch: {
            type: String,
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        expiryDate: {
            type: Date,
            default: null,
        },
        views: {
            type: Number,
            default: 0,
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },
    },
    { timestamps: true }
);

// Index for faster queries
announcementSchema.index({ isActive: 1, createdAt: -1 });
announcementSchema.index({ targetBatch: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
