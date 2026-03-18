const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT Token
exports.authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            console.error('[authMiddleware] No token provided in Authorization header');
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please login.',
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[authMiddleware] Token verified for user:', decoded.userId);
        req.user = {
            studentId: decoded.studentId,
            role: decoded.role,
            userId: decoded.userId,
        };
        next();
    } catch (error) {
        console.error('[authMiddleware] Token verification failed:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            error: error.message,
        });
    }
};

// Role-based authorization middleware
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role(s): ${roles.join(', ')}`,
            });
        }
        next();
    };
};

// Validate Student ID format
exports.validateStudentId = (req, res, next) => {
    const studentId = req.body.studentId;

    if (!studentId) {
        return res.status(400).json({
            success: false,
            message: 'Student ID is required',
        });
    }

    const studentIdRegex = /^\d{8}$/;
    if (!studentIdRegex.test(studentId)) {
        return res.status(400).json({
            success: false,
            message: 'Student ID must be exactly 8 digits',
        });
    }

    next();
};
