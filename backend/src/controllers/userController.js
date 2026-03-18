const User = require('../models/User');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '+plainPassword -password').sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message,
        });
    }
};

// Get user by ID (Admin/Self)
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id, '-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: error.message,
        });
    }
};

// Update user status (Admin only)
exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isActive must be a boolean',
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { isActive },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'User status updated',
            user,
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message,
        });
    }
};

// Get users by role (Admin only)
exports.getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;

        const validRoles = ['student', 'tpc', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
            });
        }

        const users = await User.find({ role }, '-password').sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            role,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error('Error fetching users by role:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message,
        });
    }
};

// Get dashboard stats (Admin/TPC)
exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const studentCount = await User.countDocuments({ role: 'student' });
        const tpcCount = await User.countDocuments({ role: 'tpc' });
        const adminCount = await User.countDocuments({ role: 'admin' });
        const activeUsers = await User.countDocuments({ isActive: true });

        return res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                studentCount,
                tpcCount,
                adminCount,
                activeUsers,
            },
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch stats',
            error: error.message,
        });
    }
};

// Update user profile (name, email, mobile, studentEmail)
exports.updateUserProfile = async (req, res) => {
    try {
        console.log('[updateUserProfile] Request received');
        console.log('[updateUserProfile] User ID:', req.user?.userId);
        console.log('[updateUserProfile] Body:', req.body);

        const userId = req.user.userId;
        const { name, email, mobileNumber, studentEmail } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (mobileNumber !== undefined) user.mobileNumber = mobileNumber;
        if (studentEmail) user.studentEmail = studentEmail;

        await user.save();

        console.log(`[UPDATE PROFILE] User ${userId} profile updated`);

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                name: user.name,
                email: user.email,
                mobileNumber: user.mobileNumber,
                studentEmail: user.studentEmail,
            },
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message,
        });
    }
};

// Update user settings (notifications, privacy, 2FA)
exports.updateUserSettings = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { emailNotifications, smsNotifications, pushNotifications, twoFactorAuth, privateProfile } = req.body;

        const settings = {};
        if (emailNotifications !== undefined) settings.emailNotifications = emailNotifications;
        if (smsNotifications !== undefined) settings.smsNotifications = smsNotifications;
        if (pushNotifications !== undefined) settings.pushNotifications = pushNotifications;
        if (twoFactorAuth !== undefined) settings.twoFactorAuth = twoFactorAuth;
        if (privateProfile !== undefined) settings.privateProfile = privateProfile;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: settings },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            user,
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: error.message,
        });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        console.log('[changePassword] Request received');
        console.log('[changePassword] User ID:', req.user?.userId);

        const userId = req.user.userId;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New passwords do not match',
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters',
            });
        }

        const user = await User.findById(userId).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message,
        });
    }
};

// Download user data
exports.downloadUserData = async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log(`[DOWNLOAD DATA] Received request for userId: ${userId}`);

        const user = await User.findById(userId);

        if (!user) {
            console.log(`[DOWNLOAD DATA] User not found with id: ${userId}`);
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const userData = {
            personalInfo: {
                name: user.name,
                email: user.email,
                studentId: user.studentId,
                role: user.role,
                createdAt: user.createdAt,
            },
            settings: {
                emailNotifications: user.emailNotifications,
                smsNotifications: user.smsNotifications,
                pushNotifications: user.pushNotifications,
                twoFactorAuth: user.twoFactorAuth,
                privateProfile: user.privateProfile,
            },
        };

        console.log(`[DOWNLOAD DATA] Sending data for user: ${user.name}`);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}.json"`);
        res.send(JSON.stringify(userData, null, 2));
    } catch (error) {
        console.error('[DOWNLOAD DATA] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to download data',
            error: error.message,
        });
    }
};

// Delete account
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required to delete account',
            });
        }

        const user = await User.findById(userId).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Password is incorrect',
            });
        }

        // Delete user
        await User.findByIdAndDelete(userId);

        return res.status(200).json({
            success: true,
            message: 'Account deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting account:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete account',
            error: error.message,
        });
    }
};

// Upload profile photo
exports.uploadProfilePhoto = async (req, res) => {
    try {
        console.log('[uploadProfilePhoto] Request received');
        console.log('[uploadProfilePhoto] User ID:', req.user?.userId);
        console.log('[uploadProfilePhoto] File:', req.file ? { name: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype } : 'No file');

        const userId = req.user.userId;

        if (!req.file) {
            console.error('[uploadProfilePhoto] No file provided');
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
            });
        }

        // Convert file to base64 string for storage
        const fileBuffer = req.file.buffer;
        const base64String = fileBuffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64String}`;

        const user = await User.findByIdAndUpdate(
            userId,
            { profilePhoto: dataUrl },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile photo uploaded successfully',
            profilePhoto: user.profilePhoto,
        });
    } catch (error) {
        console.error('Error uploading profile photo:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to upload profile photo',
            error: error.message,
        });
    }
};

// Get user profile with photo
exports.getUserProfile = async (req, res) => {
    try {
        console.log('[getUserProfile] Request received');
        console.log('[getUserProfile] User ID:', req.user?.userId);

        const userId = req.user.userId;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobileNumber: user.mobileNumber,
                studentEmail: user.studentEmail,
                studentId: user.studentId,
                profilePhoto: user.profilePhoto,
                role: user.role,
                createdAt: user.createdAt,
                emailNotifications: user.emailNotifications,
                smsNotifications: user.smsNotifications,
                pushNotifications: user.pushNotifications,
                twoFactorAuth: user.twoFactorAuth,
                privateProfile: user.privateProfile,
            },
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile',
            error: error.message,
        });
    }
};

exports.getStudentProfile = async (req, res) => {
    try {
        const { studentId } = req.params;

        const user = await User.findOne({ studentId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Student not found',
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobileNumber: user.mobileNumber,
                studentEmail: user.studentEmail,
                studentId: user.studentId,
                profilePhoto: user.profilePhoto,
                role: user.role,
                department: user.department,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('Error fetching student profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch student profile',
            error: error.message,
        });
    }
};

// Create TPC User (Admin only)
exports.createTpcUser = async (req, res) => {
    try {
        const { studentId, password, name, email, department } = req.body;

        if (!studentId || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'TPC ID, password, and name are required',
            });
        }

        const existingUser = await User.findOne({ studentId });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this ID already exists',
            });
        }

        const newUser = await User.create({
            studentId,
            password,
            plainPassword: password,
            name,
            email: email || '',
            department: department || 'other',
            role: 'tpc',
            isActive: true,
        });

        return res.status(201).json({
            success: true,
            message: 'TPC user created successfully',
            user: {
                _id: newUser._id,
                studentId: newUser.studentId,
                name: newUser.name,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error('Error creating TPC user:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create TPC user',
            error: error.message,
        });
    }
};

// Create Student User (Admin only)
exports.createStudentUser = async (req, res) => {
    try {
        const { studentId, password, name, email, department, dateOfBirth } = req.body;

        if (!studentId || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Student ID, password, and name are required',
            });
        }

        const existingUser = await User.findOne({ studentId });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this ID already exists',
            });
        }

        const newUser = await User.create({
            studentId,
            password,
            plainPassword: password,
            name,
            email: email || '',
            studentEmail: email || '',
            department: department || 'cse',
            dateOfBirth: dateOfBirth || null,
            role: 'student',
            isActive: true,
        });

        return res.status(201).json({
            success: true,
            message: 'Student account created successfully',
            user: { _id: newUser._id, studentId: newUser.studentId, name: newUser.name, role: newUser.role },
        });
    } catch (error) {
        console.error('Error creating student:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create student account',
            error: error.message,
        });
    }
};

// Admin reset user password
exports.adminResetPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters',
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.password = newPassword;
        user.plainPassword = newPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password has been successfully overridden',
        });
    } catch (error) {
        console.error('Error overriding password:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to override password',
            error: error.message,
        });
    }
};
