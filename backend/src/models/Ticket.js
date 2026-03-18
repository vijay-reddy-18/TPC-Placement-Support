const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required'],
    },
    category: {
      type: String,
      enum: ['placement', 'internship', 'document', 'company-eligibility', 'internship-confirmation', 'offer-letter', 'document-verification', 'interview-schedule', 'placement-process', 'other'],
      required: [true, 'Category is required'],
    },
    priority: {
      type: String,
      enum: ['low', 'med', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
    },
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      ref: 'User',
    },
    tpcResponse: {
      type: String,
      default: null,
    },
    instructions: {
      type: String,
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    reopenedAt: {
      type: Date,
      default: null,
    },
    isEscalated: {
      type: Boolean,
      default: false,
    },
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    escalationReason: {
      type: String,
      default: null,
    },
    responseTime: {
      type: Number, // in minutes
      default: null,
    },
    slaStatus: {
      type: String,
      enum: ['on-track', 'at-risk', 'breached'],
      default: 'on-track',
    },
    activityLog: [{
      action: String,
      performedBy: mongoose.Schema.Types.ObjectId,
      timestamp: { type: Date, default: Date.now },
      details: String,
    }],
    responses: [{
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      senderRole: { type: String, enum: ['student', 'tpc', 'admin'] },
      senderName: String,
      message: String,
      timestamp: { type: Date, default: Date.now },
    }],
    internalNotes: [{
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      authorName: String,
      note: String,
      timestamp: { type: Date, default: Date.now },
    }],
    department: {
      type: String,
      enum: ['cse', 'ece', 'mech', 'civil', 'eee', 'it', 'other'],
      default: null,
    },
  },
  { timestamps: true }
);

// Index for faster queries
ticketSchema.index({ studentId: 1, status: 1 });
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ isEscalated: 1 });
ticketSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);
