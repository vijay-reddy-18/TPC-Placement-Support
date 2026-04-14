const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // General Settings
  appName: { type: String, default: 'TPC Support System' },
  appLogo: { type: String, default: '' }, // base64 or URL
  theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  language: { type: String, default: 'en' },
  maintenanceMode: { type: Boolean, default: false },

  // SLA Rules (per priority)
  slaRules: {
    type: [{
      priority: { type: String, enum: ['urgent', 'high', 'medium', 'low'] },
      resolutionHours: { type: Number, default: 24 },
      escalateAfterHours: { type: Number, default: 4 },
      color: { type: String, default: '#94a3b8' },
    }],
    default: [
      { priority: 'urgent', resolutionHours: 4,  escalateAfterHours: 1,  color: '#ef4444' },
      { priority: 'high',   resolutionHours: 24, escalateAfterHours: 4,  color: '#f97316' },
      { priority: 'medium', resolutionHours: 48, escalateAfterHours: 12, color: '#f59e0b' },
      { priority: 'low',    resolutionHours: 72, escalateAfterHours: 24, color: '#10b981' },
    ]
  },

  // Automation Rules
  automationRules: {
    type: [{
      id: String,
      name: String,
      trigger: String,
      action: String,
      isActive: { type: Boolean, default: true },
    }],
    default: [
      { id: 'ar1', name: 'Auto-assign on create',   trigger: 'ticket_created',   action: 'assign_round_robin', isActive: true },
      { id: 'ar2', name: 'SLA breach alert',         trigger: 'sla_at_risk',      action: 'notify_tpc_head',    isActive: true },
      { id: 'ar3', name: 'Auto-escalate on breach',  trigger: 'sla_breached',     action: 'escalate_to_admin',  isActive: true },
      { id: 'ar4', name: 'Feedback on resolve',      trigger: 'ticket_resolved',  action: 'request_feedback',   isActive: true },
      { id: 'ar5', name: 'Reassign on reopen',       trigger: 'ticket_reopened',  action: 'reassign_original',  isActive: false },
    ]
  },

  // Notification Settings
  notifications: {
    emailOnCreate:    { type: Boolean, default: true },
    emailOnResolve:   { type: Boolean, default: true },
    emailOnEscalate:  { type: Boolean, default: true },
    emailOnComment:   { type: Boolean, default: true },
    smsOnUrgent:      { type: Boolean, default: false },
    inAppAll:         { type: Boolean, default: true },
  },

  // Ticket Custom Categories
  ticketCategories: {
    type: [{
      id: String,
      name: String,
      icon: String,
      color: String,
      isActive: { type: Boolean, default: true },
    }],
    default: [
      { id: 'cat1', name: 'Placement',          icon: '🏢', color: '#3b82f6', isActive: true },
      { id: 'cat2', name: 'Internship',          icon: '💼', color: '#10b981', isActive: true },
      { id: 'cat3', name: 'Document',            icon: '📄', color: '#f59e0b', isActive: true },
      { id: 'cat4', name: 'Company Eligibility', icon: '✅', color: '#8b5cf6', isActive: true },
      { id: 'cat5', name: 'Offer Letter',        icon: '📝', color: '#ef4444', isActive: true },
      { id: 'cat6', name: 'Interview Schedule',  icon: '📅', color: '#06b6d4', isActive: true },
      { id: 'cat7', name: 'Other',               icon: '📌', color: '#64748b', isActive: true },
    ]
  },

  // Ticket Status Flow
  ticketStatuses: {
    type: [{ id: String, label: String, color: String, order: Number }],
    default: [
      { id: 'open',        label: 'Open',        color: '#3b82f6', order: 1 },
      { id: 'in-progress', label: 'In Progress',  color: '#f59e0b', order: 2 },
      { id: 'waiting',     label: 'Waiting',      color: '#8b5cf6', order: 3 },
      { id: 'resolved',    label: 'Resolved',     color: '#10b981', order: 4 },
      { id: 'closed',      label: 'Closed',       color: '#64748b', order: 5 },
    ]
  },

  // Role Permissions Matrix
  permissions: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      student: {
        tickets:    { view: true,  create: true,  edit: false, delete: false },
        profile:    { view: true,  create: false, edit: true,  delete: false },
        knowledge:  { view: true,  create: false, edit: false, delete: false },
        feedback:   { view: true,  create: true,  edit: false, delete: false },
      },
      tpc: {
        tickets:    { view: true,  create: true,  edit: true,  delete: false },
        users:      { view: true,  create: false, edit: false, delete: false },
        knowledge:  { view: true,  create: true,  edit: true,  delete: false },
        analytics:  { view: true,  create: false, edit: false, delete: false },
        announcements: { view: true, create: true, edit: true, delete: false },
      },
      admin: {
        tickets:    { view: true, create: true, edit: true, delete: true },
        users:      { view: true, create: true, edit: true, delete: true },
        knowledge:  { view: true, create: true, edit: true, delete: true },
        analytics:  { view: true, create: true, edit: true, delete: true },
        settings:   { view: true, create: true, edit: true, delete: true },
      }
    }
  },

  // Security Settings
  security: {
    jwtExpiryDays:        { type: Number, default: 7 },
    minPasswordLength:    { type: Number, default: 6 },
    require2FA:           { type: Boolean, default: false },
    sessionTimeoutMins:   { type: Number, default: 30 },
    ipRestriction:        { type: Boolean, default: false },
    allowedIPs:           { type: [String], default: [] },
  },

  // SMTP / Integration Settings
  integrations: {
    smtpHost:     { type: String, default: '' },
    smtpPort:     { type: Number, default: 587 },
    smtpUser:     { type: String, default: '' },
    smtpPass:     { type: String, default: '' },
    webhookUrl:   { type: String, default: '' },
    aiEnabled:    { type: Boolean, default: false },
  },

}, { timestamps: true });

// Singleton pattern — only one settings document
systemSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
