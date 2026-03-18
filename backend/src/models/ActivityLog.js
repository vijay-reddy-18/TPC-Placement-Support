const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
    {
        ticketId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ticket',
            required: true,
        },
        action: {
            type: String,
            enum: ['ticket-created', 'ticket-updated', 'status-changed', 'assigned', 'escalated', 'response-added', 'deadline-set', 'ticket-reopened', 'ticket-closed'],
            required: [true, 'Action is required'],
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        oldValue: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        newValue: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        description: {
            type: String,
            default: null,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: false }
);

// Index for faster queries
activityLogSchema.index({ ticketId: 1, timestamp: -1 });
activityLogSchema.index({ performedBy: 1 });
activityLogSchema.index({ action: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
