const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  message:    { type: String, required: true },
  type:       { type: String, enum: ['info', 'success', 'warning', 'alert', 'announcement'], default: 'info' },
  targetRole: { type: String, enum: ['all', 'student', 'tpc', 'admin'], default: 'all' },
  targetId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = broadcast
  isRead:     { type: Boolean, default: false },
  readBy:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  link:       { type: String, default: '' },
  icon:       { type: String, default: '🔔' },
  sentBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
