import React, { useState, useEffect } from 'react';
import { FaCamera, FaGoogle, FaLinkedin } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { Line } from 'react-chartjs-2';
import TPCLayout from '../components/TPCLayout';
import { useAuth } from '../context/AuthContext';
import { userAPI, ticketAPI } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

const TPCProfilePage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [profilePhoto, setProfilePhoto] = useState('');
    const [photoPreview, setPhotoPreview] = useState('');

    const [profileData, setProfileData] = useState({
        name: '', email: '', mobileNumber: '', studentEmail: '', studentId: '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '', newPassword: '', confirmPassword: '',
    });

    // Notification toggles
    const [notifications, setNotifications] = useState({
        emailAlerts: true, pushNotifications: true,
        newTicketAlerts: true, escalationAlerts: true, dailyDigest: false,
    });

    // Status control
    const [isActive, setIsActive] = useState(true);
    const [performance, setPerformance] = useState({
        totalAssigned: 0, resolvedByMe: 0, closedByMe: 0, openByMe: 0,
        resolutionRate: 0, avgResponseHours: 0, resolvedThisMonth: 0
    });

    useEffect(() => { loadProfile(); loadPerformance(); }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const res = await userAPI.getProfile();
            if (res.data.success) {
                const u = res.data.user;
                setProfileData({
                    name: u.name || '', email: u.email || '',
                    mobileNumber: u.mobileNumber || '', studentEmail: u.studentEmail || '',
                    studentId: u.studentId || '',
                });
                if (u.profilePhoto) setPhotoPreview(u.profilePhoto);
                setIsActive(u.isActive !== false);
                setNotifications({
                    emailAlerts: u.emailNotifications !== false,
                    pushNotifications: u.pushNotifications !== false,
                    newTicketAlerts: true, escalationAlerts: true,
                    dailyDigest: false,
                });
            }
        } catch (err) {
            setMessage({ type: 'danger', text: 'Failed to load profile' });
        } finally { setLoading(false); }
    };

    const loadPerformance = async () => {
        try {
            const res = await ticketAPI.getPerformanceStats();
            if (res.data.success) {
                setPerformance(res.data.performance);
            }
        } catch (err) {
            console.error('Failed to load performance stats:', err);
        }
    };

    const handlePhotoSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result);
            reader.readAsDataURL(file);
            setProfilePhoto(file);
        }
    };

    const handleUploadPhoto = async () => {
        if (!profilePhoto) return;
        try {
            setLoading(true);
            await userAPI.uploadProfilePhoto(profilePhoto);
            setMessage({ type: 'success', text: 'Photo uploaded!' });
            setProfilePhoto('');
            setTimeout(() => loadProfile(), 1000);
        } catch (err) {
            setMessage({ type: 'danger', text: 'Upload failed' });
        } finally { setLoading(false); }
    };

    const handleSaveAll = async () => {
        try {
            setLoading(true);
            await userAPI.updateProfile(profileData);
            await userAPI.updateSettings({
                emailNotifications: notifications.emailAlerts,
                pushNotifications: notifications.pushNotifications,
                isActive,
            });
            setMessage({ type: 'success', text: 'Changes saved successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'danger', text: 'Failed to save changes' });
        } finally { setLoading(false); }
    };

    const handleChangePassword = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setMessage({ type: 'warning', text: 'All password fields required' }); return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'warning', text: 'Passwords do not match' }); return;
        }
        try {
            setLoading(true);
            await userAPI.changePassword(passwordData.currentPassword, passwordData.newPassword, passwordData.confirmPassword);
            setMessage({ type: 'success', text: 'Password changed!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setMessage({ type: 'danger', text: err.response?.data?.message || 'Password change failed' });
        } finally { setLoading(false); }
    };

    // Performance mini chart
    const perfChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            data: [60, 55, 65, 70, 85, 95],
            borderColor: '#22c55e', borderWidth: 2.5, tension: 0.4,
            pointRadius: 0, fill: false,
        }]
    };
    const perfOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
    };

    const ToggleSwitch = ({ value, onChange }) => (
        <button className={`tpc-toggle${value ? ' on' : ''}`} onClick={() => onChange(!value)} type="button" />
    );

    const inputStyle = {
        width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8,
        border: '1px solid #e5e7eb', fontSize: '0.88rem', fontFamily: 'Inter, sans-serif',
        outline: 'none', background: 'white', transition: 'border-color 0.2s',
    };

    const labelStyle = {
        fontSize: '0.78rem', fontWeight: 600, color: '#374151',
        marginBottom: '0.35rem', display: 'block',
    };

    return (
        <TPCLayout pageTitle="Profile & Settings" openTicketCount={0}>
            {/* Message */}
            {message.text && (
                <div style={{
                    padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1.25rem',
                    background: message.type === 'success' ? '#f0fdf4' : message.type === 'danger' ? '#fef2f2' : '#fffbeb',
                    color: message.type === 'success' ? '#16a34a' : message.type === 'danger' ? '#dc2626' : '#d97706',
                    fontSize: '0.85rem', fontWeight: 500, display: 'flex', justifyContent: 'space-between',
                }}>
                    <span>{message.text}</span>
                    <span style={{ cursor: 'pointer' }} onClick={() => setMessage({ type: '', text: '' })}>✕</span>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr', gap: '1.25rem', alignItems: 'start' }}>
                {/* ===== Column 1: My Profile ===== */}
                <div className="tpc-card">
                    <div className="tpc-card-header">
                        <h3 className="tpc-card-title">My Profile</h3>
                    </div>
                    <div className="tpc-card-body">
                        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            {/* Avatar */}
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
                                    background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '3px solid #3b82f6', flexShrink: 0,
                                }}>
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '2.5rem', color: '#9ca3af' }}>👤</span>
                                    )}
                                </div>
                                <label style={{
                                    position: 'absolute', bottom: 0, right: 0,
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', border: '2px solid white',
                                }}>
                                    <FaCamera style={{ color: 'white', fontSize: '0.7rem' }} />
                                    <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
                                </label>
                            </div>
                            {profilePhoto && (
                                <button className="tpc-btn tpc-btn-primary" style={{ alignSelf: 'center', fontSize: '0.78rem' }} onClick={handleUploadPhoto}>
                                    Upload
                                </button>
                            )}
                            <div>
                                <span style={{
                                    display: 'inline-block', padding: '3px 10px', borderRadius: 6,
                                    background: '#eff6ff', color: '#2563eb', fontSize: '0.72rem', fontWeight: 600,
                                    marginBottom: '0.5rem',
                                }}>TPC Staff</span>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Name</label>
                                <input style={inputStyle} value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} />
                            </div>
                            <div>
                                <label style={labelStyle}>Email</label>
                                <input style={inputStyle} value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} />
                            </div>
                            <div>
                                <label style={labelStyle}>Department</label>
                                <input style={{ ...inputStyle, background: '#f9fafb' }} value="Student & Corporate Relations" disabled />
                            </div>
                            <div>
                                <label style={labelStyle}>Join Date</label>
                                <input style={{ ...inputStyle, background: '#f9fafb' }} value={new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} disabled />
                            </div>
                        </div>

                        {/* Status Control */}
                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.25rem' }}>
                            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1f2937', margin: '0 0 0.75rem 0' }}>Status Control</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 500 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#22c55e' : '#ef4444' }} />
                                    Status: <strong style={{ color: isActive ? '#22c55e' : '#ef4444' }}>{isActive ? 'Active' : 'Inactive'}</strong>
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                                <ToggleSwitch value={!isActive} onChange={(v) => setIsActive(!v)} />
                                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>Set Inactive</span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.35rem' }}>
                                Mark yourself as unavailable for new ticket assignments and urgent requests.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ===== Column 2: Performance ===== */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="tpc-card">
                        <div className="tpc-card-header">
                            <h3 className="tpc-card-title">Performance</h3>
                        </div>
                        <div className="tpc-card-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.3rem' }}>📊</span>
                                    <div>
                                        <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Tickets Resolved</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>{performance.resolvedByMe} <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 400 }}>(this month: {performance.resolvedThisMonth})</span></div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.3rem' }}>⏱</span>
                                    <div>
                                        <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Avg Response Time</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>{performance.avgResponseHours} hours</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.3rem' }}>✅</span>
                                    <div>
                                        <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Resolution Rate</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>{performance.resolutionRate}%</div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ height: 80, marginTop: '1rem' }}>
                                <Line data={perfChartData} options={perfOptions} />
                            </div>
                            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.35rem' }}>Monthly Performance</p>
                        </div>
                    </div>

                    {/* Password Change */}
                    <div className="tpc-card">
                        <div className="tpc-card-header">
                            <h3 className="tpc-card-title">Password Change</h3>
                        </div>
                        <div className="tpc-card-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <input
                                    type="password" placeholder="Current Password" style={inputStyle}
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                />
                                <input
                                    type="password" placeholder="New Password" style={inputStyle}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                />
                                <input
                                    type="password" placeholder="Confirm New Password" style={inputStyle}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                />
                                <button className="tpc-btn tpc-btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={handleChangePassword}>
                                    Update Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== Column 3: Notifications & Connected Accounts ===== */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="tpc-card">
                        <div className="tpc-card-header">
                            <h3 className="tpc-card-title">Notifications</h3>
                        </div>
                        <div className="tpc-card-body">
                            {[
                                { key: 'emailAlerts', label: 'Email Alerts' },
                                { key: 'pushNotifications', label: 'Push Notifications' },
                                { key: 'newTicketAlerts', label: 'New Ticket Alerts' },
                                { key: 'escalationAlerts', label: 'Escalation Alerts' },
                                { key: 'dailyDigest', label: 'Daily Digest' },
                            ].map(item => (
                                <div key={item.key} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.65rem 0', borderBottom: '1px solid #f3f4f6',
                                }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>{item.label}</span>
                                    <ToggleSwitch
                                        value={notifications[item.key]}
                                        onChange={(v) => setNotifications({ ...notifications, [item.key]: v })}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Connected Accounts */}
                    <div className="tpc-card">
                        <div className="tpc-card-header">
                            <h3 className="tpc-card-title">Connected Accounts</h3>
                        </div>
                        <div className="tpc-card-body">
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '0.65rem 0', borderBottom: '1px solid #f3f4f6',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FaGoogle style={{ color: '#ea4335', fontSize: '1rem' }} />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Google</span>
                                </div>
                                <span style={{ cursor: 'pointer', color: '#9ca3af' }}>🔗</span>
                            </div>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '0.65rem 0',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FaLinkedin style={{ color: '#0077b5', fontSize: '1rem' }} />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>LinkedIn</span>
                                </div>
                                <span style={{ cursor: 'pointer', color: '#9ca3af' }}>🔗</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Changes Button */}
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <button
                    className="tpc-btn tpc-btn-primary"
                    style={{ padding: '0.7rem 2rem', fontSize: '0.9rem' }}
                    onClick={handleSaveAll}
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </TPCLayout>
    );
};

export default TPCProfilePage;
