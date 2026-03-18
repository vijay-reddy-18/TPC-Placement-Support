const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, studentId: user.studentId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Register Controller
exports.register = async (req, res) => {
  try {
    const { studentId, name, password, confirmPassword } = req.body;

    // Validate required fields
    if (!studentId || !name || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Validate Student ID format
    const studentIdRegex = /^\d{8}$/;
    if (!studentIdRegex.test(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Student ID must be exactly 8 digits',
      });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    // Check if student already exists
    const existingUser = await User.findOne({ studentId });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Student ID already registered',
      });
    }

    // Create new user
    const newUser = await User.create({
      studentId,
      name,
      password,
      plainPassword: password,
      role: 'student',
    });

    // Generate token
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        userId: newUser._id,
        studentId: newUser.studentId,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

// Login Controller
exports.login = async (req, res) => {
  try {
    const { studentId, password, role } = req.body;

    // Validate required fields
    if (!studentId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and password are required',
      });
    }

    // Validate Student ID format
    const studentIdRegex = /^\d{8}$/;
    if (!studentIdRegex.test(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Student ID must be exactly 8 digits',
      });
    }

    // Validate role is provided
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required',
      });
    }

    // Find user and check password
    const user = await User.findOne({ studentId }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Validate that user role matches requested role
    if (user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Invalid credentials for ${role} login. Please use the correct login portal.`,
      });
    }

    // Generate token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        userId: user._id,
        studentId: user.studentId,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        userId: user._id,
        studentId: user.studentId,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
    });
  }
};



