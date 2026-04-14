import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import StudentLayout from '../../components/StudentLayout';
import { toast } from 'react-toastify';

const TABS = [
  { id: 'info',          label: '👤 Personal Info' },
  { id: 'security',      label: '🔒 Security' },
  { id: 'notifications', label: '🔔 Notifications' },
  { id: 'privacy',       label: '👁️ Privacy' },
];

const ToggleSwitch = ({ checked, onChange, id }) => (
  <div
    id={id}
    onClick={() => onChange(!checked)}
    style={{
      width: 44, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative',
      background: checked ? 'var(--sp-accent)' : '#d1d5db',
      transition: 'background 0.2s', flexShrink: 0,
    }}
  >
    <div style={{
      position: 'absolute', top: 3, left: checked ? 23 : 3,
      width: 18, height: 18, borderRadius: '50%', background: '#fff',
      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }} />
  </div>
);

const StudentProfile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({ name: '', email: '', mobileNumber: '', studentEmail: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [settings, setSettings] = useState({ emailNotifications: true, smsNotifications: false, pushNotifications: true, twoFactorAuth: false, privateProfile: false });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await userAPI.getProfile();
        const u = res.data.user;
        setProfileData({ name: u.name || '', email: u.email || '', mobileNumber: u.mobileNumber || '', studentEmail: u.studentEmail || '' });
        setSettings({
          emailNotifications: u.emailNotifications !== false,
          smsNotifications: u.smsNotifications || false,
          pushNotifications: u.pushNotifications !== false,
          twoFactorAuth: u.twoFactorAuth || false,
          privateProfile: u.privateProfile || false,
        });
        if (u.profilePhoto) setPhotoPreview(u.profilePhoto);
      } catch (e) {
        console.error(e);
      }
    };
    if (user) fetch();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!profileData.name.trim()) { toast.error('Full name is required'); return; }
    try {
      setLoading(true);
      await userAPI.updateProfile(profileData);
      toast.success('✅ Profile updated!');
      setIsEditing(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!profilePhoto) return;
    try {
      setLoading(true);
      await userAPI.uploadProfilePhoto(profilePhoto);
      toast.success('📷 Photo uploaded!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error('All password fields are required'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      setLoading(true);
      await userAPI.changePassword(currentPassword, newPassword, confirmPassword);
      toast.success('🔒 Password changed!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingToggle = async (key, value) => {
    try {
      setSettings(prev => ({ ...prev, [key]: value }));
      await userAPI.updateSettings({ [key]: value });
      toast.success('Setting updated');
    } catch (e) {
      setSettings(prev => ({ ...prev, [key]: !value }));
      toast.error('Failed to update setting');
    }
  };

  const handleDownloadData = async () => {
    try {
      setLoading(true);
      const res = await userAPI.downloadData();
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('📥 Data downloaded');
    } catch (e) { toast.error('Failed to download data'); }
    finally { setLoading(false); }
  };

  return (
    <StudentLayout title="My Profile" subtitle="Manage your account and preferences">
      {/* Profile Hero Card */}
      <div className="sp-card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #3b82f6 100%)', padding: '2.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Avatar with photo upload */}
          <div style={{ position: 'relative' }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              {photoPreview
                ? <img src={photoPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '2.2rem', color: '#fff', fontWeight: 700 }}>{user?.name?.charAt(0) || 'S'}</span>}
            </div>
            <label htmlFor="profile-photo-input" style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, background: 'var(--sp-accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', border: '2px solid #fff' }}>
              <span style={{ fontSize: '0.75rem' }}>📷</span>
            </label>
            <input
              id="profile-photo-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files[0]) {
                  setProfilePhoto(e.target.files[0]);
                  const reader = new FileReader();
                  reader.onloadend = () => setPhotoPreview(reader.result);
                  reader.readAsDataURL(e.target.files[0]);
                }
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.35rem', margin: '0 0 4px' }}>{user?.name || 'Student'}</h2>
            <p style={{ color: '#94a3b8', margin: '0 0 0.75rem', fontSize: '0.9rem' }}>Student ID: {user?.studentId || '—'}</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(59,130,246,0.3)', color: '#93c5fd', padding: '4px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700 }}>👨‍🎓 Student</span>
              <span style={{ background: 'rgba(16,185,129,0.3)', color: '#6ee7b7', padding: '4px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700 }}>✅ Active</span>
            </div>
          </div>

          {profilePhoto && (
            <button className="sp-btn sp-btn-primary sp-btn-sm" onClick={handlePhotoUpload} disabled={loading} id="upload-photo-btn">
              {loading ? '⏳' : '📷 Upload Photo'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="sp-card">
        <div className="sp-card-body" style={{ padding: '0 1.5rem' }}>
          <div className="sp-profile-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`sp-profile-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
                id={`profile-tab-${t.id}`}
              >{t.label}</button>
            ))}
          </div>
        </div>

        <div className="sp-card-body">
          {/* ===== PERSONAL INFO ===== */}
          {activeTab === 'info' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button
                  className={`sp-btn sp-btn-sm ${isEditing ? 'sp-btn-ghost' : 'sp-btn-outline'}`}
                  onClick={() => setIsEditing(e => !e)}
                  id="toggle-edit-profile"
                >
                  {isEditing ? '✕ Cancel' : '✏️ Edit Profile'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="sp-form-group">
                  <label className="sp-label">Student ID</label>
                  <input className="sp-input" value={user?.studentId || ''} disabled />
                </div>
                <div className="sp-form-group">
                  <label className="sp-label">Full Name *</label>
                  <input id="profile-name" className="sp-input" value={profileData.name} onChange={(e) => setProfileData(p => ({ ...p, name: e.target.value }))} disabled={!isEditing} placeholder="Your full name" />
                </div>
                <div className="sp-form-group">
                  <label className="sp-label">Personal Email</label>
                  <input id="profile-email" className="sp-input" type="email" value={profileData.email} onChange={(e) => setProfileData(p => ({ ...p, email: e.target.value }))} disabled={!isEditing} placeholder="personal@email.com" />
                </div>
                <div className="sp-form-group">
                  <label className="sp-label">Student Email</label>
                  <input id="profile-student-email" className="sp-input" type="email" value={profileData.studentEmail} onChange={(e) => setProfileData(p => ({ ...p, studentEmail: e.target.value }))} disabled={!isEditing} placeholder="student@college.edu" />
                </div>
                <div className="sp-form-group">
                  <label className="sp-label">Mobile Number</label>
                  <input id="profile-mobile" className="sp-input" type="tel" value={profileData.mobileNumber} onChange={(e) => setProfileData(p => ({ ...p, mobileNumber: e.target.value }))} disabled={!isEditing} placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>

              {isEditing && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button className="sp-btn sp-btn-primary" onClick={handleSaveProfile} disabled={loading} id="save-profile-btn">
                    {loading ? '⏳ Saving...' : '✅ Save Changes'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===== SECURITY ===== */}
          {activeTab === 'security' && (
            <div style={{ maxWidth: 480 }}>
              <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--sp-text-primary)' }}>🔐 Change Password</h4>
              <div className="sp-form-group">
                <label className="sp-label">Current Password</label>
                <input id="cur-password" className="sp-input" type="password" placeholder="Current password" value={passwordData.currentPassword} onChange={(e) => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))} />
              </div>
              <div className="sp-form-group">
                <label className="sp-label">New Password</label>
                <input id="new-password" className="sp-input" type="password" placeholder="Min 6 characters" value={passwordData.newPassword} onChange={(e) => setPasswordData(p => ({ ...p, newPassword: e.target.value }))} />
              </div>
              <div className="sp-form-group">
                <label className="sp-label">Confirm New Password</label>
                <input id="confirm-password" className="sp-input" type="password" placeholder="Confirm new password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))} />
              </div>
              <button className="sp-btn sp-btn-primary" onClick={handleChangePassword} disabled={loading} id="change-password-btn">
                {loading ? '⏳ Updating...' : '🔒 Update Password'}
              </button>
            </div>
          )}

          {/* ===== NOTIFICATIONS ===== */}
          {activeTab === 'notifications' && (
            <div style={{ maxWidth: 520 }}>
              {[
                { key: 'emailNotifications',  label: 'Email Notifications',  desc: 'Get ticket updates via email' },
                { key: 'smsNotifications',    label: 'SMS Notifications',    desc: 'Receive SMS for urgent updates' },
                { key: 'pushNotifications',   label: 'Push Notifications',   desc: 'Browser push notifications' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="sp-toggle-row">
                  <div>
                    <div className="sp-toggle-label">{label}</div>
                    <div className="sp-toggle-desc">{desc}</div>
                  </div>
                  <ToggleSwitch id={`toggle-${key}`} checked={settings[key]} onChange={(v) => handleSettingToggle(key, v)} />
                </div>
              ))}
            </div>
          )}

          {/* ===== PRIVACY ===== */}
          {activeTab === 'privacy' && (
            <div style={{ maxWidth: 520 }}>
              <div className="sp-toggle-row">
                <div>
                  <div className="sp-toggle-label">Private Profile</div>
                  <div className="sp-toggle-desc">Restrict who can view your profile details</div>
                </div>
                <ToggleSwitch id="toggle-private" checked={settings.privateProfile} onChange={(v) => handleSettingToggle('privateProfile', v)} />
              </div>
              <div className="sp-toggle-row">
                <div>
                  <div className="sp-toggle-label">Two-Factor Authentication</div>
                  <div className="sp-toggle-desc">Add an extra layer of security to your account</div>
                </div>
                <ToggleSwitch id="toggle-2fa" checked={settings.twoFactorAuth} onChange={(v) => handleSettingToggle('twoFactorAuth', v)} />
              </div>

              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--sp-border)' }}>
                <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--sp-text-primary)', fontSize: '0.9rem' }}>📥 Data Download</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--sp-text-muted)', marginBottom: '0.875rem' }}>Download a copy of all your personal data and ticket history (JSON format)</div>
                <button className="sp-btn sp-btn-outline" onClick={handleDownloadData} disabled={loading} id="download-data-btn">
                  {loading ? '⏳ Preparing...' : '📥 Download My Data'}
                </button>
              </div>

              <div style={{ marginTop: '2rem', padding: '1.25rem', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
                <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 4, fontSize: '0.9rem' }}>⚠️ Danger Zone</div>
                <div style={{ fontSize: '0.82rem', color: '#7f1d1d', marginBottom: '0.875rem' }}>Permanently delete your account. This action cannot be undone.</div>
                <button
                  className="sp-btn sp-btn-danger sp-btn-sm"
                  id="delete-account-btn"
                  onClick={async () => {
                    const pwd = window.prompt('Enter your password to confirm deletion:');
                    if (!pwd) return;
                    if (window.confirm('Are you sure? This will permanently delete your account!')) {
                      try {
                        setLoading(true);
                        await userAPI.deleteAccount(pwd);
                        window.location.href = '/login';
                      } catch (e) {
                        toast.error(e.response?.data?.message || 'Failed to delete account');
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                >
                  🗑️ Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentProfile;
