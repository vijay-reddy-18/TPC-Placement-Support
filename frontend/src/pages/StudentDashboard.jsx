import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Alert, ToggleButton, ToggleButtonGroup, Modal } from 'react-bootstrap';
import { FaHome, FaThList, FaEdit, FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { ticketAPI, userAPI } from '../services/api';
import '../styles/Dashboard.css';

const StudentDashboard = () => {
    const { user, logout, features } = useAuth();
    
    // Check if an admin feature toggle is active for students
    const isFeatureActive = (featureName, defaultState = true) => {
        if (!features) return defaultState;
        const feature = features.find(f => f.name.toLowerCase() === featureName.toLowerCase() && f.targetRole === 'student');
        return feature ? feature.isActive : defaultState;
    };

    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('dashboard');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'placement',
        priority: 'medium',
        department: 'cse',
    });
    const [settings, setSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        twoFactorAuth: false,
        privateProfile: false,
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        mobileNumber: '',
        studentEmail: '',
    });
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState('');
    const [photoPreview, setPhotoPreview] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showTicketModal, setShowTicketModal] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    // Populate profile data from user
    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                email: user.email || '',
                mobileNumber: user.mobileNumber || '',
                studentEmail: user.studentEmail || '',
            });
            if (user.profilePhoto) {
                setPhotoPreview(user.profilePhoto);
            }
        }
    }, [user]);

    // Fetch fresh profile data from API on component mount
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const response = await userAPI.getProfile();
                const userData = response.data.user;
                setProfileData({
                    name: userData.name || '',
                    email: userData.email || '',
                    mobileNumber: userData.mobileNumber || '',
                    studentEmail: userData.studentEmail || '',
                });
                if (userData.profilePhoto) {
                    setPhotoPreview(userData.profilePhoto);
                }
            } catch (error) {
                console.error('Failed to fetch profile data:', error);
            }
        };

        if (user) {
            fetchProfileData();
        }
    }, [user]);

    // Fetch user settings on component mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await userAPI.getProfile();
                const userData = response.data.user;
                setSettings({
                    emailNotifications: userData.emailNotifications !== false,
                    smsNotifications: userData.smsNotifications || false,
                    pushNotifications: userData.pushNotifications !== false,
                    twoFactorAuth: userData.twoFactorAuth || false,
                    privateProfile: userData.privateProfile || false,
                });
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            }
        };

        if (user) {
            fetchSettings();
        }
    }, [user]);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const [ticketsRes, statsRes] = await Promise.all([
                ticketAPI.getAllTickets(null, null, null, 1, 10),
                ticketAPI.getDashboardStats(),
            ]);
            setTickets(ticketsRes.data.tickets);
            setStats(statsRes.data.stats);
        } catch (error) {
            alert('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async () => {
        if (!formData.title || !formData.description) {
            alert('Please fill all required fields');
            return;
        }

        try {
            setLoading(true);
            await ticketAPI.createTicket(
                formData.title,
                formData.description,
                formData.category,
                formData.priority,
                formData.department
            );
            alert('Ticket created successfully');
            setShowCreateForm(false);
            setFormData({ title: '', description: '', category: 'placement', priority: 'medium', department: 'cse' });
            loadDashboard();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = async (key, value) => {
        try {
            const newSettings = { ...settings, [key]: value };
            setSettings(newSettings);

            await userAPI.updateSettings({
                [key]: value
            });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update setting');
            setSettings(settings); // Revert on error
        }
    };

    const handleUploadPhoto = async () => {
        if (!profilePhoto) {
            alert('Please select a photo first');
            return;
        }

        try {
            setLoading(true);
            await userAPI.uploadProfilePhoto(profilePhoto);
            alert('Profile photo uploaded successfully');
            setProfilePhoto('');
            // Reload profile to get updated photo
            loadDashboard();
        } catch (error) {
            console.error('Photo upload error:', error);
            alert(error.response?.data?.message || 'Failed to upload photo');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (currentPassword, newPassword, confirmPassword) => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('All password fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            await userAPI.changePassword(currentPassword, newPassword, confirmPassword);
            alert('Password changed successfully');
            // Clear password fields
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error) {
            console.error('Password change error:', error);
            alert(error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!profileData.name.trim()) {
            alert('Full Name is required');
            return;
        }

        if (profileData.email && !profileData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            alert('Please enter a valid email');
            return;
        }

        try {
            setLoading(true);
            await userAPI.updateProfile({
                name: profileData.name,
                email: profileData.email,
                mobileNumber: profileData.mobileNumber,
                studentEmail: profileData.studentEmail,
            });
            alert('Profile updated successfully');
            setIsEditingProfile(false);
        } catch (error) {
            console.error('Profile update error:', error);
            alert(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadData = async () => {
        try {
            setLoading(true);
            const response = await userAPI.downloadData();
            // response.data is already a Blob when responseType is 'blob'
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `user-data-${new Date().getTime()}.json`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            alert('Data downloaded successfully');
        } catch (error) {
            console.error('Download error:', error);
            // Try to parse error message from response
            let errorMessage = 'Failed to download data';
            if (error.response) {
                if (error.response.data instanceof Blob) {
                    // If error is also a blob, try to read it
                    const text = await error.response.data.text();
                    try {
                        const json = JSON.parse(text);
                        errorMessage = json.message || errorMessage;
                    } catch (e) {
                        errorMessage = text || errorMessage;
                    }
                } else {
                    errorMessage = error.response.data?.message || error.message || errorMessage;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        const password = window.prompt('Enter your password to confirm account deletion:');
        if (!password) {
            return;
        }

        if (window.confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) {
            try {
                setLoading(true);
                await userAPI.deleteAccount(password);
                alert('Account deleted successfully');
                logout(); // Log out after deletion
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete account');
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="d-flex align-items-center justify-content-center min-vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Sidebar - Dark Theme matching Admin/TPC mockups */}
            <div style={{ width: '260px', background: '#1e293b', padding: '1.5rem 0', boxShadow: '4px 0 10px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', left: 0, top: 0, overflowY: 'auto', color: '#fff', zIndex: 1000 }}>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div className="px-4 mb-4 text-center">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <div style={{ width: '40px', height: '40px', background: '#3b82f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 'bold' }}>🎓</div>
                            <h4 style={{ color: 'white', margin: 0, fontWeight: '700', fontSize: '1.2rem' }}>Portal</h4>
                        </div>
                    </div>

                    <div className="sidebar-menu" style={{ padding: '0 1rem' }}>
                        {[
                            { id: 'dashboard', icon: <FaHome />, label: 'Dashboard' },
                            { id: 'queries', icon: <FaThList />, label: 'My Tickets' },
                            { id: 'newTicket', icon: <FaEdit />, label: 'Create Ticket' },
                            { id: 'profile', icon: <FaUser />, label: 'Profile' },
                        ].map(item => (
                            <a key={item.id} href="#" onClick={(e) => { e.preventDefault(); if(item.id === 'newTicket') { setShowCreateForm(true); setActiveSection('dashboard'); } else { setActiveSection(item.id); setShowCreateForm(false); } }}
                                className="sidebar-item"
                                style={{
                                    color: activeSection === item.id && !showCreateForm && item.id !== 'newTicket' ? '#fff' : '#94a3b8',
                                    background: activeSection === item.id && !showCreateForm && item.id !== 'newTicket' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                    borderLeft: activeSection === item.id && !showCreateForm && item.id !== 'newTicket' ? '4px solid #3b82f6' : '4px solid transparent',
                                    fontWeight: activeSection === item.id && !showCreateForm && item.id !== 'newTicket' ? '600' : '500',
                                    display: 'flex', alignItems: 'center', gap: '12px', padding: '0.85rem 1rem', marginBottom: '0.25rem', borderRadius: '0 8px 8px 0', textDecoration: 'none', transition: 'all 0.2s'
                                }}>
                                {item.icon} {item.label}
                            </a>
                        ))}
                    </div>
                </div>

                <div style={{ borderTop: '1px solid #334155', padding: '1.25rem' }}>
                    <a href="#" className="d-flex align-items-center gap-2" onClick={(e) => { e.preventDefault(); logout(); }} style={{ padding: '0.75rem', textDecoration: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: '600', borderRadius: '8px', transition: 'background 0.2s' }}>
                        <FaSignOutAlt /> Logout
                    </a>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content" style={{ padding: '0', background: '#f8fafc', marginLeft: '260px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
<div style={{ padding: '2.5rem' }}>
                {/* Global Topbar with Notifications and Profile */}
                <div style={{ height: '70px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', width: '100%', position: 'sticky', top: 0, zIndex: 999 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ cursor: 'pointer', position: 'relative' }} onClick={() => { alert("Notifications icon clicked!"); }}>
                            <span style={{ fontSize: '20px', color: '#64748b' }}>🔔</span>
                            <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', width: '8px', height: '8px', borderRadius: '50%' }}></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderLeft: '1px solid #e2e8f0', paddingLeft: '20px' }} onClick={() => { setActiveSection('profile'); setShowCreateForm(false); }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', lineHeight: '1.2' }}>{user?.name || 'Student Name'}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Student</div>
                            </div>
                            <div style={{ width: '36px', height: '36px', background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                                {user?.name?.charAt(0) || 'S'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Section */}
                {activeSection === 'dashboard' && (
                    <>
                        <div className="mb-4">
                            <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.5rem' }}>Student Dashboard</h1>
                            <p style={{ fontSize: '1rem', color: '#666', marginBottom: 0, fontWeight: '400' }}>Manage your educational queries efficiently</p>
                        </div>

                        {/* Stats Cards */}
                        {!showCreateForm && (
                            <Row className="mb-4 g-3">
                                <Col lg={3} md={6}>
                                    <Card className="border-0 shadow-sm stat-card" style={{
                                        background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
                                        borderRadius: '16px',
                                        padding: '1.5rem',
                                        color: 'white'
                                    }}>
                                        <div className="d-flex align-items-center">
                                            <div style={{ fontSize: '3rem', marginRight: '1rem', opacity: 0.9 }}>📋</div>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', opacity: 0.9, fontWeight: '500' }}>Total Queries</div>
                                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: '1' }}>{stats?.totalTickets || 0}</div>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                                <Col lg={3} md={6}>
                                    <Card className="border-0 shadow-sm stat-card" style={{
                                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
                                        borderRadius: '16px',
                                        padding: '1.5rem',
                                        color: 'white'
                                    }}>
                                        <div className="d-flex align-items-center">
                                            <div style={{ fontSize: '3rem', marginRight: '1rem', opacity: 0.9 }}>⚠️</div>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', opacity: 0.9, fontWeight: '500' }}>Open</div>
                                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: '1' }}>{stats?.openTickets || 0}</div>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                                <Col lg={3} md={6}>
                                    <Card className="border-0 shadow-sm stat-card" style={{
                                        background: 'linear-gradient(135deg, #ffc107 0%, #f39c12 100%)',
                                        borderRadius: '16px',
                                        padding: '1.5rem',
                                        color: 'white'
                                    }}>
                                        <div className="d-flex align-items-center">
                                            <div style={{ fontSize: '3rem', marginRight: '1rem', opacity: 0.9 }}>⏱️</div>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', opacity: 0.9, fontWeight: '500' }}>In Progress</div>
                                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: '1' }}>{stats?.inProgressTickets || 0}</div>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                                <Col lg={3} md={6}>
                                    <Card className="border-0 shadow-sm stat-card" style={{
                                        background: 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)',
                                        borderRadius: '16px',
                                        padding: '1.5rem',
                                        color: 'white'
                                    }}>
                                        <div className="d-flex align-items-center">
                                            <div style={{ fontSize: '3rem', marginRight: '1rem', opacity: 0.9 }}>✓</div>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', opacity: 0.9, fontWeight: '500' }}>Resolved</div>
                                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: '1' }}>{stats?.resolvedTickets || 0}</div>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            </Row>
                        )}

                        {/* Create Ticket Section */}
                        {showCreateForm && (
                            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                                <Card.Header style={{ background: '#ffffff', borderBottom: '1px solid #e0e0e0', borderRadius: '16px 16px 0 0', padding: '1.5rem' }}>
                                    <h5 className="mb-0 fw-bold" style={{ fontSize: '1.25rem', color: '#1a1a1a' }}>Create New Ticket</h5>
                                </Card.Header>
                                <Card.Body className="pt-4" style={{ background: '#ffffff' }}>
                                    <Form>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-bold" style={{ color: '#333', marginBottom: '0.5rem' }}>Subject</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Subject"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                style={{
                                                    borderRadius: '10px',
                                                    borderColor: '#ddd',
                                                    padding: '0.75rem 1rem',
                                                    fontSize: '0.95rem'
                                                }}
                                            />
                                        </Form.Group>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-4">
                                                    <Form.Label className="fw-bold" style={{ color: '#333', marginBottom: '0.5rem' }}>Category</Form.Label>
                                                    <Form.Select
                                                        value={formData.category}
                                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                        style={{
                                                            borderRadius: '10px',
                                                            borderColor: '#ddd',
                                                            padding: '0.75rem 1rem',
                                                            fontSize: '0.95rem'
                                                        }}
                                                    >
                                                        <option value="placement">Placement</option>
                                                        <option value="internship">Internship</option>
                                                        <option value="general">General</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-4">
                                                    <Form.Label className="fw-bold" style={{ color: '#333', marginBottom: '0.5rem' }}>Department</Form.Label>
                                                    <Form.Select
                                                        value={formData.department}
                                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                        style={{
                                                            borderRadius: '10px',
                                                            borderColor: '#ddd',
                                                            padding: '0.75rem 1rem',
                                                            fontSize: '0.95rem'
                                                        }}
                                                    >
                                                        <option value="cse">Computer Science (CSE)</option>
                                                        <option value="ece">Electronics & Communication (ECE)</option>
                                                        <option value="mech">Mechanical (MECH)</option>
                                                        <option value="civil">Civil</option>
                                                        <option value="eee">Electrical (EEE)</option>
                                                        <option value="it">Information Technology (IT)</option>
                                                        <option value="other">Other</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-bold" style={{ color: '#333', marginBottom: '0.5rem' }}>Description</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={5}
                                                placeholder="Description"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                style={{
                                                    borderRadius: '10px',
                                                    borderColor: '#ddd',
                                                    padding: '0.75rem 1rem',
                                                    fontSize: '0.95rem',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </Form.Group>

                                        <div className="text-end">
                                            <Button
                                                variant="secondary"
                                                onClick={() => setShowCreateForm(false)}
                                                style={{
                                                    borderRadius: '10px',
                                                    fontWeight: '600',
                                                    padding: '0.75rem 2rem',
                                                    fontSize: '0.95rem',
                                                    marginRight: '0.5rem'
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                style={{
                                                    background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
                                                    border: 'none',
                                                    borderRadius: '10px',
                                                    fontWeight: '600',
                                                    padding: '0.75rem 2rem',
                                                    fontSize: '0.95rem'
                                                }}
                                                onClick={handleCreateTicket}
                                                disabled={loading}
                                            >
                                                {loading ? 'Submitting...' : 'Submit Ticket'}
                                            </Button>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Recent Queries */}
                        {!showCreateForm && (
                            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                                <Card.Header style={{ background: '#ffffff', borderBottom: '1px solid #e0e0e0', borderRadius: '16px 16px 0 0', padding: '1.5rem' }}>
                                    <h5 className="mb-0 fw-bold" style={{ fontSize: '1.25rem', color: '#1a1a1a' }}>Recent Queries</h5>
                                </Card.Header>
                                <Card.Body style={{ padding: '0', background: '#ffffff' }}>
                                    {tickets.length === 0 ? (
                                        <Alert variant="info" className="mb-0" style={{ borderRadius: '0', marginTop: 0 }}>
                                            No queries yet. Create your first ticket to get started.
                                        </Alert>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead style={{ background: '#f8f9fa', fontWeight: '600', borderBottom: '2px solid #e0e0e0' }}>
                                                    <tr>
                                                        <th style={{ color: '#666', padding: '1.25rem', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
                                                        <th style={{ color: '#666', padding: '1.25rem', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Query Details</th>
                                                        <th style={{ color: '#666', padding: '1.25rem', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Ticket ID</th>
                                                        <th style={{ color: '#666', padding: '1.25rem', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tickets.map((ticket) => (
                                                        <tr key={ticket._id} style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'} onClick={() => { setSelectedTicket(ticket); setShowTicketModal(true); }}>
                                                            <td style={{ padding: '1.25rem' }}>
                                                                <Badge
                                                                    pill
                                                                    style={{
                                                                        background: ticket.status === 'open' ? '#4a90e2' :
                                                                            ticket.status === 'in-progress' ? '#ffc107' :
                                                                                '#27ae60',
                                                                        color: ticket.status === 'in-progress' ? '#333' : 'white',
                                                                        fontSize: '0.7rem',
                                                                        padding: '0.4rem 0.8rem',
                                                                        fontWeight: '600'
                                                                    }}
                                                                >
                                                                    {ticket.status === 'open' ? '🔵 Blue' :
                                                                        ticket.status === 'in-progress' ? '🟡 Yellow' :
                                                                            '🟢 Green'}
                                                                </Badge>
                                                            </td>
                                                            <td style={{ padding: '1.25rem' }}>
                                                                <div className="fw-bold" style={{ color: '#333', marginBottom: '0.25rem' }}>{ticket.title}</div>
                                                                <div className="text-muted" style={{ fontSize: '0.85rem' }}>{ticket.description.substring(0, 50)}...</div>
                                                            </td>
                                                            <td style={{ padding: '1.25rem', fontWeight: '600', color: '#333' }}>#{ticket._id.slice(-6)}</td>
                                                            <td style={{ padding: '1.25rem', color: '#999', fontSize: '0.9rem' }}>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        )}
                    </>
                )}

                {/* My Queries Section */}
                {activeSection === 'queries' && (
                    <>
                        <div className="mb-4">
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '0.5rem' }}>My Queries</h1>
                            <p style={{ fontSize: '1rem', color: '#666', marginBottom: '1rem' }}>View all your submitted queries and tickets</p>
                        </div>

                        <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                            <Card.Header style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0', borderRadius: '12px 12px 0 0' }}>
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 fw-bold">All Queries ({tickets.length})</h5>
                                    <Button
                                        style={{
                                            background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 'bold'
                                        }}
                                        onClick={() => {
                                            setShowCreateForm(true);
                                            setActiveSection('dashboard');
                                        }}
                                    >
                                        + New Query
                                    </Button>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {tickets.length === 0 ? (
                                    <Alert variant="info" className="mb-0">
                                        No queries yet. Create your first ticket to get started.
                                    </Alert>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead style={{ background: '#f8f9fa', fontWeight: 'bold' }}>
                                                <tr>
                                                    <th>Ticket ID</th>
                                                    <th>Subject</th>
                                                    <th>Category</th>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tickets.map((ticket) => (
                                                    <tr key={ticket._id} style={{ borderBottom: '1px solid #eee' }}>
                                                        <td className="fw-bold">#{ticket._id.slice(-6)}</td>
                                                        <td>
                                                            <div className="fw-bold">{ticket.title}</div>
                                                            <div className="text-muted small">{ticket.description.substring(0, 40)}...</div>
                                                        </td>
                                                        <td><Badge bg="light" text="dark">{ticket.category}</Badge></td>
                                                        <td>
                                                            <Badge
                                                                pill
                                                                style={{
                                                                    background:
                                                                        ticket.status === 'open' ? '#4a90e2' :
                                                                            ticket.status === 'in-progress' ? '#f39c12' :
                                                                                '#27ae60',
                                                                    fontSize: '0.75rem'
                                                                }}
                                                            >
                                                                {ticket.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-muted">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                                        <td>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => { setSelectedTicket(ticket); setShowTicketModal(true); }}
                                                                style={{
                                                                    background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
                                                                    border: 'none',
                                                                    borderRadius: '8px',
                                                                    fontSize: '0.78rem',
                                                                    fontWeight: '600',
                                                                    padding: '0.35rem 0.85rem',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                            >
                                                                👁 View Details
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </>
                )}

                {/* Profile Section */}
                {activeSection === 'profile' && (
                    <>
                        <div className="mb-4">
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '0.5rem' }}>My Profile</h1>
                            <p style={{ fontSize: '1rem', color: '#666', marginBottom: '1rem' }}>Manage your account information</p>
                        </div>

                        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)', color: 'white' }}>
                            <Card.Body className="text-center pt-5 pb-5">
                                <div className="mb-3" style={{
                                    width: '100px',
                                    height: '100px',
                                    margin: '0 auto 1.5rem',
                                    background: '#fff',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden'
                                }}>
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ fontSize: '3rem' }}>👤</div>
                                    )}
                                </div>
                                <h3 className="fw-bold mb-2" style={{ color: 'white' }}>{user?.name || 'Student'}</h3>
                                <p className="mb-3" style={{ opacity: 0.9, fontSize: '1.1rem', color: 'white' }}>{user?.studentId || 'Student ID'}</p>
                                <Badge bg="light" text="dark" className="mb-3" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>{user?.role || 'Student'}</Badge>
                            </Card.Body>
                        </Card>

                        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                            <Card.Header style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0', borderRadius: '12px 12px 0 0' }}>
                                <h5 className="mb-0 fw-bold">📷 Profile Photo</h5>
                            </Card.Header>
                            <Card.Body className="text-center pt-4 pb-4">
                                <Form.Group className="mb-3">
                                    <Form.Control
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files[0]) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setPhotoPreview(reader.result);
                                                };
                                                reader.readAsDataURL(e.target.files[0]);
                                                setProfilePhoto(e.target.files[0]);
                                            }
                                        }}
                                        disabled={loading}
                                        style={{ display: 'none' }}
                                        id="photoInput"
                                    />
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => document.getElementById('photoInput').click()}
                                        className="me-2"
                                        disabled={loading}
                                    >
                                        Choose Photo
                                    </Button>
                                    {profilePhoto && (
                                        <Button
                                            variant="success"
                                            size="sm"
                                            onClick={() => handleUploadPhoto()}
                                            disabled={loading}
                                        >
                                            {loading ? 'Uploading...' : 'Upload Photo'}
                                        </Button>
                                    )}
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                            <Card.Header style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h5 className="mb-0 fw-bold">Personal Information</h5>
                                <Button
                                    variant="link"
                                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                                    style={{ textDecoration: 'none', fontSize: '0.9rem', color: '#4a90e2' }}
                                    className="fw-bold"
                                >
                                    {isEditingProfile ? '✕ Cancel' : '✏️ Edit'}
                                </Button>
                            </Card.Header>
                            <Card.Body className="pt-4">
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Student ID</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={user?.studentId || 'N/A'}
                                        disabled
                                        style={{ borderRadius: '8px', background: '#f8f9fa' }}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Full Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={profileData.name}
                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                        disabled={!isEditingProfile}
                                        style={{
                                            borderRadius: '8px',
                                            background: isEditingProfile ? '#fff' : '#f8f9fa',
                                            borderColor: isEditingProfile ? '#ddd' : '#e0e0e0'
                                        }}
                                        placeholder="Enter your full name"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Personal Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        disabled={!isEditingProfile}
                                        style={{
                                            borderRadius: '8px',
                                            background: isEditingProfile ? '#fff' : '#f8f9fa',
                                            borderColor: isEditingProfile ? '#ddd' : '#e0e0e0'
                                        }}
                                        placeholder="Enter your personal email"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Student Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={profileData.studentEmail}
                                        onChange={(e) => setProfileData({ ...profileData, studentEmail: e.target.value })}
                                        disabled={!isEditingProfile}
                                        style={{
                                            borderRadius: '8px',
                                            background: isEditingProfile ? '#fff' : '#f8f9fa',
                                            borderColor: isEditingProfile ? '#ddd' : '#e0e0e0'
                                        }}
                                        placeholder="Enter your student email"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Mobile Number</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        value={profileData.mobileNumber}
                                        onChange={(e) => setProfileData({ ...profileData, mobileNumber: e.target.value })}
                                        disabled={!isEditingProfile}
                                        style={{
                                            borderRadius: '8px',
                                            background: isEditingProfile ? '#fff' : '#f8f9fa',
                                            borderColor: isEditingProfile ? '#ddd' : '#e0e0e0'
                                        }}
                                        placeholder="Enter your mobile number"
                                    />
                                </Form.Group>

                                {isEditingProfile && (
                                    <Button
                                        disabled={loading}
                                        onClick={handleSaveProfile}
                                        style={{
                                            background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontWeight: '600',
                                            padding: '0.6rem 1.5rem',
                                            fontSize: '0.9rem',
                                            marginTop: '1.5rem'
                                        }}
                                        className="w-100"
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                )}
                            </Card.Body>
                        </Card>
                    </>
                )}

                {/* Settings Section */}
                {activeSection === 'settings' && (
                    <>
                        <div className="mb-4">
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '0.5rem' }}>Settings</h1>
                            <p style={{ fontSize: '1rem', color: '#666', marginBottom: '1rem' }}>Manage your preferences and account security</p>
                        </div>

                        {/* Notification Settings */}
                        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                            <Card.Header style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0', borderRadius: '12px 12px 0 0' }}>
                                <h5 className="mb-0 fw-bold">🔔 Notification Preferences</h5>
                            </Card.Header>
                            <Card.Body className="pt-4">
                                <Form.Group className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <Form.Label className="fw-bold mb-1">Email Notifications</Form.Label>
                                            <p style={{ color: '#666', marginBottom: 0, fontSize: '0.9rem' }}>Receive updates via email</p>
                                        </div>
                                        <Form.Check
                                            type="switch"
                                            checked={settings.emailNotifications}
                                            onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                                            style={{ zIndex: 1 }}
                                        />
                                    </div>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <Form.Label className="fw-bold mb-1">SMS Notifications</Form.Label>
                                            <p style={{ color: '#666', marginBottom: 0, fontSize: '0.9rem' }}>Receive urgent updates via SMS</p>
                                        </div>
                                        <Form.Check
                                            type="switch"
                                            checked={settings.smsNotifications}
                                            onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                                            style={{ zIndex: 1 }}
                                        />
                                    </div>
                                </Form.Group>

                                <Form.Group className="mb-0">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <Form.Label className="fw-bold mb-1">Push Notifications</Form.Label>
                                            <p style={{ color: '#666', marginBottom: 0, fontSize: '0.9rem' }}>Receive browser notifications</p>
                                        </div>
                                        <Form.Check
                                            type="switch"
                                            checked={settings.pushNotifications}
                                            onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                                            style={{ zIndex: 1 }}
                                        />
                                    </div>
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        {/* Security Settings */}
                        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                            <Card.Header style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0', borderRadius: '12px 12px 0 0' }}>
                                <h5 className="mb-0 fw-bold">🔒 Security Settings</h5>
                            </Card.Header>
                            <Card.Body className="pt-4">
                                <Form.Group className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <Form.Label className="fw-bold mb-1">Two-Factor Authentication</Form.Label>
                                            <p style={{ color: '#666', marginBottom: 0, fontSize: '0.9rem' }}>Add an extra layer of security</p>
                                        </div>
                                        <Form.Check
                                            type="switch"
                                            checked={settings.twoFactorAuth}
                                            onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                                            style={{ zIndex: 1 }}
                                        />
                                    </div>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">Change Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Current Password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        style={{
                                            borderRadius: '10px',
                                            borderColor: '#ddd',
                                            padding: '0.75rem 1rem',
                                            fontSize: '0.95rem',
                                            marginBottom: '0.5rem'
                                        }}
                                    />
                                    <Form.Control
                                        type="password"
                                        placeholder="New Password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        style={{
                                            borderRadius: '10px',
                                            borderColor: '#ddd',
                                            padding: '0.75rem 1rem',
                                            fontSize: '0.95rem',
                                            marginBottom: '0.5rem'
                                        }}
                                    />
                                    <Form.Control
                                        type="password"
                                        placeholder="Confirm Password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        style={{
                                            borderRadius: '10px',
                                            borderColor: '#ddd',
                                            padding: '0.75rem 1rem',
                                            fontSize: '0.95rem',
                                            marginBottom: '0.5rem'
                                        }}
                                    />
                                    <Button
                                        disabled={loading}
                                        onClick={() => handleChangePassword(passwordData.currentPassword, passwordData.newPassword, passwordData.confirmPassword)}
                                        style={{
                                            background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontWeight: '600',
                                            padding: '0.6rem 1.5rem',
                                            fontSize: '0.9rem'
                                        }}
                                        className="mt-2"
                                    >
                                        {loading ? 'Updating...' : 'Update Password'}
                                    </Button>
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        {/* Privacy Settings */}
                        <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                            <Card.Header style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0', borderRadius: '12px 12px 0 0' }}>
                                <h5 className="mb-0 fw-bold">👁️ Privacy Settings</h5>
                            </Card.Header>
                            <Card.Body className="pt-4">
                                <Form.Group className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <Form.Label className="fw-bold mb-1">Private Profile</Form.Label>
                                            <p style={{ color: '#666', marginBottom: 0, fontSize: '0.9rem' }}>Only allow certain users to view your profile</p>
                                        </div>
                                        <Form.Check
                                            type="switch"
                                            checked={settings.privateProfile}
                                            onChange={(e) => handleSettingChange('privateProfile', e.target.checked)}
                                            style={{ zIndex: 1 }}
                                        />
                                    </div>
                                </Form.Group>

                                <Form.Group className="mb-0">
                                    <Form.Label className="fw-bold mb-2">Data Download</Form.Label>
                                    <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>Download a copy of your personal data</p>
                                    <Button
                                        variant="outline-primary"
                                        disabled={loading}
                                        onClick={handleDownloadData}
                                        style={{
                                            borderRadius: '10px',
                                            fontWeight: '600',
                                            padding: '0.6rem 1.5rem',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        {loading ? 'Downloading...' : 'Download Data'}
                                    </Button>
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        {/* Danger Zone */}
                        <Card className="border-0 shadow-sm mt-4" style={{ borderRadius: '12px', borderLeft: '4px solid #dc3545' }}>
                            <Card.Header style={{ background: '#fff5f5', borderBottom: '2px solid #f8d7da', borderRadius: '12px 12px 0 0' }}>
                                <h5 className="mb-0 fw-bold" style={{ color: '#dc3545' }}>⚠️ Danger Zone</h5>
                            </Card.Header>
                            <Card.Body className="pt-4">
                                <Form.Group className="mb-0">
                                    <Form.Label className="fw-bold mb-2">Delete Account</Form.Label>
                                    <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>Permanently delete your account and all associated data</p>
                                    <Button
                                        variant="danger"
                                        disabled={loading}
                                        onClick={handleDeleteAccount}
                                        style={{
                                            borderRadius: '10px',
                                            fontWeight: '600',
                                            padding: '0.6rem 1.5rem',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        {loading ? 'Deleting...' : 'Delete Account'}
                                    </Button>
                                </Form.Group>
                            </Card.Body>
                        </Card>
                    </>
                )}
            </div>
        </div>
</div>
    );
};
export default StudentDashboard;
