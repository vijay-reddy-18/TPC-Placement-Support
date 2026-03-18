const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Feature name is required'],
    trim: true,
  },
  targetRole: {
    type: String,
    enum: ['student', 'tpc'],
    required: [true, 'Target role is required'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    default: '',
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feature', featureSchema);
