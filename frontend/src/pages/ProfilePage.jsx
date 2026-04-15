import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { FaCamera, FaEdit, FaLock, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import '../styles/Dashboard.css';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [profilePhoto, setProfilePhoto] = useState('');
    const [photoPreview, setPhotoPreview] = useState('');

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        mobileNumber: '',
        studentEmail: '',
        studentId: '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getProfile();
            if (response.data.success) {
                const user = response.data.user;
                setProfileData({
                    name: user.name || '',
                    email: user.email || '',
                    mobileNumber: user.mobileNumber || '',
                    studentEmail: user.studentEmail || '',
                    studentId: user.studentId || '',
                });
                if (user.profilePhoto) {
                    setPhotoPreview(user.profilePhoto);
                }
            }
        } catch (error) {
            setMessage({
                type: 'danger',
                text: error.response?.data?.message || 'Failed to load profile',
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
            setProfilePhoto(file);
        }
    };

    const handleUploadPhoto = async () => {
        if (!profilePhoto) {
            setMessage({ type: 'warning', text: 'Please select a photo first' });
            return;
        }

        try {
            setLoading(true);
            const response = await userAPI.uploadProfilePhoto(profilePhoto);
            if (response.data.success) {
                setMessage({
                    type: 'success',
                    text: 'Profile photo uploaded successfully',
                });
                setProfilePhoto('');
                // Reload profile to get updated photo
                setTimeout(() => loadProfile(), 1000);
            }
        } catch (error) {
            setMessage({
                type: 'danger',
                text: error.response?.data?.message || 'Failed to upload photo',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!profileData.name.trim()) {
            setMessage({ type: 'warning', text: 'Full Name is required' });
            return;
        }

        if (profileData.email && !profileData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setMessage({ type: 'warning', text: 'Please enter a valid email' });
            return;
        }

        try {
            setLoading(true);
            const response = await userAPI.updateProfile(profileData);
            if (response.data.success) {
                setMessage({
                    type: 'success',
                    text: 'Profile updated successfully',
                });
                setIsEditingProfile(false);
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }
        } catch (error) {
            setMessage({
                type: 'danger',
                text: error.response?.data?.message || 'Failed to update profile',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setMessage({ type: 'warning', text: 'All password fields are required' });
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'warning', text: 'New passwords do not match' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'warning', text: 'Password must be at least 6 characters' });
            return;
        }

        try {
            setLoading(true);
            const response = await userAPI.changePassword(
                passwordData.currentPassword,
                passwordData.newPassword,
                passwordData.confirmPassword
            );
            if (response.data.success) {
                setMessage({
                    type: 'success',
                    text: 'Password changed successfully',
                });
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }
        } catch (error) {
            setMessage({
                type: 'danger',
                text: error.response?.data?.message || 'Failed to change password',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: '#f5f7fa', minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
            <Container>
                <div className="mb-4 d-flex align-items-center">
                    <Button
                        variant="outline-primary"
                        onClick={() => navigate('/dashboard')}
                        className="me-3"
                        size="sm"
                    >
                        <FaArrowLeft className="me-2" />
                        Back
                    </Button>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1a1a1a' }}>
                        My Profile
                    </h1>
                </div>

                {message.text && (
                    <Alert
                        variant={message.type}
                        dismissible
                        onClose={() => setMessage({ type: '', text: '' })}
                        className="mb-4"
                    >
                        {message.text}
                    </Alert>
                )}

                <Row>
                    {/* Profile Photo Section */}
                    <Col lg={4} className="mb-4">
                        <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                            <Card.Body className="text-center p-4">
                                <div
                                    style={{
                                        width: '150px',
                                        height: '150px',
                                        margin: '0 auto 1.5rem',
                                        background: '#e3f2fd',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        border: '3px solid #0066cc',
                                    }}
                                >
                                    {photoPreview ? (
                                        <img
                                            src={photoPreview}
                                            alt="Profile"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : (
                                        <FaCamera style={{ fontSize: '48px', color: '#0066cc' }} />
                                    )}
                                </div>

                                <h5 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                    {profileData.name}
                                </h5>
                                <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                    Student ID: {profileData.studentId}
                                </p>

                                <Form.Group className="mb-3">
                                    <Form.Control
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoSelect}
                                        disabled={loading}
                                        style={{ display: 'none' }}
                                        id="photoInput"
                                    />
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => document.getElementById('photoInput').click()}
                                        className="w-100 mb-2"
                                        disabled={loading}
                                    >
                                        <FaCamera className="me-2" />
                                        Choose Photo
                                    </Button>
                                    {profilePhoto && (
                                        <Button
                                            variant="success"
                                            size="sm"
                                            onClick={handleUploadPhoto}
                                            className="w-100"
                                            disabled={loading}
                                        >
                                            {loading ? 'Uploading...' : 'Upload Photo'}
                                        </Button>
                                    )}
                                </Form.Group>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Profile Information Section */}
                    <Col lg={8} className="mb-4">
                        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                            <Card.Header
                                style={{
                                    background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
                                    color: 'white',
                                    borderRadius: '12px 12px 0 0',
                                    padding: '1.5rem',
                                }}
                            >
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 fw-bold">
                                        <FaEdit className="me-2" />
                                        Personal Information
                                    </h5>
                                    <Button
                                        variant="light"
                                        size="sm"
                                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                                    >
                                        {isEditingProfile ? 'Cancel' : 'Edit'}
                                    </Button>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-4">
                                <Form>
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold">Full Name *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Enter your full name"
                                            value={profileData.name}
                                            onChange={(e) =>
                                                setProfileData({ ...profileData, name: e.target.value })
                                            }
                                            disabled={!isEditingProfile || loading}
                                            style={{ borderRadius: '8px' }}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold">Student ID</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={profileData.studentId}
                                            disabled
                                            style={{ borderRadius: '8px', background: '#f5f5f5' }}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold">Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            placeholder="Enter your email"
                                            value={profileData.email}
                                            onChange={(e) =>
                                                setProfileData({ ...profileData, email: e.target.value })
                                            }
                                            disabled={!isEditingProfile || loading}
                                            style={{ borderRadius: '8px' }}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold">Student Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            placeholder="Enter your student email"
                                            value={profileData.studentEmail}
                                            onChange={(e) =>
                                                setProfileData({ ...profileData, studentEmail: e.target.value })
                                            }
                                            disabled={!isEditingProfile || loading}
                                            style={{ borderRadius: '8px' }}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold">Mobile Number</Form.Label>
                                        <Form.Control
                                            type="tel"
                                            placeholder="Enter your mobile number"
                                            value={profileData.mobileNumber}
                                            onChange={(e) =>
                                                setProfileData({ ...profileData, mobileNumber: e.target.value })
                                            }
                                            disabled={!isEditingProfile || loading}
                                            style={{ borderRadius: '8px' }}
                                        />
                                    </Form.Group>

                                    {isEditingProfile && (
                                        <div className="d-flex gap-3">
                                            <Button
                                                variant="outline-secondary"
                                                onClick={() => setIsEditingProfile(false)}
                                                disabled={loading}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="primary"
                                                onClick={handleSaveProfile}
                                                disabled={loading}
                                            >
                                                {loading ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </div>
                                    )}
                                </Form>
                            </Card.Body>
                        </Card>

                        {/* Change Password Section */}
                        <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                            <Card.Header
                                style={{
                                    background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                                    color: 'white',
                                    borderRadius: '12px 12px 0 0',
                                    padding: '1.5rem',
                                }}
                            >
                                <h5 className="mb-0 fw-bold">
                                    <FaLock className="me-2" />
                                    Change Password
                                </h5>
                            </Card.Header>
                            <Card.Body className="p-4">
                                <Form>
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold">Current Password *</Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="Enter your current password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) =>
                                                setPasswordData({
                                                    ...passwordData,
                                                    currentPassword: e.target.value,
                                                })
                                            }
                                            disabled={loading}
                                            style={{ borderRadius: '8px' }}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold">New Password *</Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="Enter new password"
                                            value={passwordData.newPassword}
                                            onChange={(e) =>
                                                setPasswordData({
                                                    ...passwordData,
                                                    newPassword: e.target.value,
                                                })
                                            }
                                            disabled={loading}
                                            style={{ borderRadius: '8px' }}
                                        />
                                        <Form.Text className="text-muted">
                                            Password must be at least 6 characters long.
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold">Confirm New Password *</Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="Confirm new password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) =>
                                                setPasswordData({
                                                    ...passwordData,
                                                    confirmPassword: e.target.value,
                                                })
                                            }
                                            disabled={loading}
                                            style={{ borderRadius: '8px' }}
                                        />
                                    </Form.Group>

                                    <Button
                                        variant="danger"
                                        onClick={handleChangePassword}
                                        disabled={loading}
                                        className="w-100 fw-bold"
                                    >
                                        {loading ? 'Updating...' : 'Update Password'}
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default ProfilePage;
