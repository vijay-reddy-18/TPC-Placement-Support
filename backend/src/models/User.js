const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    match: [/^\d{8}$/, 'Student ID must be exactly 8 digits'],
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  mobileNumber: {
    type: String,
    trim: true,
    default: '',
  },
  studentEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  plainPassword: {
    type: String,
    select: false,
  },
  role: {
    type: String,
    enum: ['student', 'tpc', 'admin'],
    default: 'student',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  emailNotifications: {
    type: Boolean,
    default: true,
  },
  smsNotifications: {
    type: Boolean,
    default: false,
  },
  pushNotifications: {
    type: Boolean,
    default: true,
  },
  twoFactorAuth: {
    type: Boolean,
    default: false,
  },
  privateProfile: {
    type: Boolean,
    default: false,
  },
  profilePhoto: {
    type: String,
    default: '',
  },
  dateOfBirth: {
    type: Date,
    default: null,
  },
  department: {
    type: String,
    enum: ['cse', 'ece', 'mech', 'civil', 'eee', 'it', 'other'],
    default: null,
  },
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get user without sensitive data
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);



