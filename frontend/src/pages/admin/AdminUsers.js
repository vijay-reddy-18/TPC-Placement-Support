import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { FaSearch, FaUserPlus, FaLock, FaCheck, FaEye, FaEyeSlash, FaTimes, FaChevronRight } from 'react-icons/fa';
import api from '../../services/api';

/* ─── Password Strength ─── */
const getStrength = (pw) => {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
const STRENGTH_COLORS = ['', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#059669'];

function PasswordField({ placeholder, value, onChange, id }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={inputStyle}
      />
      <button type="button" onClick={() => setShow(s => !s)}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', padding: 0 }}>
        {show ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
}

/* ─── Shared input style ─── */
const inputStyle = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0',
  borderRadius: 10, fontSize: '0.9rem', outline: 'none', color: '#0f172a',
  background: '#f8fafc', transition: 'border-color 0.2s',
};

const DEPT_OPTIONS_STUDENT = [
  { value: 'cse', label: 'Computer Science (CSE)', emoji: '💻' },
  { value: 'ece', label: 'Electronics (ECE)', emoji: '📡' },
  { value: 'mech', label: 'Mechanical (MECH)', emoji: '⚙️' },
  { value: 'civil', label: 'Civil Engineering', emoji: '🏗️' },
  { value: 'eee', label: 'Electrical (EEE)', emoji: '⚡' },
  { value: 'it', label: 'Information Technology (IT)', emoji: '🖥️' },
  { value: 'other', label: 'Other', emoji: '📚' },
];
const DEPT_OPTIONS_TPC = [
  { value: 'it', label: 'IT Support', emoji: '🖥️' },
  { value: 'cse', label: 'CSE Department', emoji: '💻' },
  { value: 'civil', label: 'Civil Department', emoji: '🏗️' },
  { value: 'other', label: 'General', emoji: '🏢' },
];

/* ─── 3-Step Wizard Modal ─── */
function CreateAccountModal({ type, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const isStudent = type === 'student';
  const deptOpts = isStudent ? DEPT_OPTIONS_STUDENT : DEPT_OPTIONS_TPC;

  const [form, setForm] = useState({
    fullName: '', email: '', department: deptOpts[0].value,
    userId: '', dob: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const strength = getStrength(form.password);

  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (!form.fullName.trim()) e.fullName = 'Full name is required';
      if (!form.email || !/\S+@\S+/.test(form.email)) e.email = 'Valid email required';
      if (!form.department) e.department = 'Select a department';
      if (isStudent && !form.dob) e.dob = 'Date of birth required';
    }
    if (step === 2) {
      const idLabel = isStudent ? 'Student ID' : 'TPC ID';
      if (!form.userId || !/^\d{8}$/.test(form.userId)) e.userId = `${idLabel} must be exactly 8 digits`;
    }
    if (step === 3) {
      if (!form.password || form.password.length < 6) e.password = 'Min 6 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const payload = {
        studentId: form.userId, password: form.password,
        name: form.fullName, email: form.email, department: form.department,
        ...(isStudent ? { dateOfBirth: form.dob } : {}),
      };
      const endpoint = isStudent ? '/admin/create-student' : '/admin/create-tpc';
      await api.post(endpoint, payload);
      setDone(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1800);
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Creation failed' });
    } finally {
      setLoading(false);
    }
  };

  const initials = form.fullName ? form.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : (isStudent ? '🎓' : '👔');
  const roleColor = isStudent ? '#6366f1' : '#0ea5e9';
  const roleBg = isStudent ? '#eef2ff' : '#f0f9ff';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 20, width: 520, maxWidth: '95vw', boxShadow: '0 25px 80px rgba(0,0,0,0.25)', overflow: 'hidden', animation: 'slideUp 0.3s ease' }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${roleColor} 0%, ${isStudent ? '#818cf8' : '#38bdf8'} 100%)`, padding: '1.75rem 2rem 1.25rem', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
            <FaTimes />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: form.fullName ? '1.2rem' : '1.8rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', border: '2px solid rgba(255,255,255,0.4)' }}>
              {initials}
            </div>
            <div>
              <h5 style={{ color: '#fff', margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>
                {isStudent ? 'Create Student Account' : 'Create TPC Staff Account'}
              </h5>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem' }}>
                {form.fullName || 'Enter details below'}
              </span>
            </div>
          </div>

          {/* Step Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.25rem', gap: 0 }}>
            {['Personal Info', 'User ID', 'Security'].map((label, i) => {
              const idx = i + 1;
              const active = step === idx;
              const done_ = step > idx;
              return (
                <React.Fragment key={label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: done_ ? '#fff' : active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: roleColor, transition: 'all 0.2s' }}>
                      {done_ ? <FaCheck style={{ color: roleColor }} /> : idx}
                    </div>
                    <span style={{ color: active ? '#fff' : 'rgba(255,255,255,0.65)', fontSize: '0.78rem', fontWeight: active ? 600 : 400 }}>{label}</span>
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: 2, background: done_ ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)', margin: '0 0.5rem', minWidth: 24 }} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.75rem 2rem' }}>

          {/* SUCCESS STATE */}
          {done && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '2rem' }}>✅</div>
              <h5 style={{ fontWeight: 700, color: '#15803d' }}>Account Created!</h5>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>{form.fullName}'s account is ready.</p>
            </div>
          )}

          {/* STEP 1: Personal Info */}
          {!done && step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input id="create-fullname" placeholder="e.g. Priya Sharma" value={form.fullName} onChange={e => set('fullName', e.target.value)} style={{...inputStyle, borderColor: errors.fullName ? '#ef4444' : '#e2e8f0'}} />
                {errors.fullName && <span style={errStyle}>{errors.fullName}</span>}
              </div>
              <div>
                <label style={labelStyle}>Email Address *</label>
                <input id="create-email" type="email" placeholder="user@example.com" value={form.email} onChange={e => set('email', e.target.value)} style={{...inputStyle, borderColor: errors.email ? '#ef4444' : '#e2e8f0'}} />
                {errors.email && <span style={errStyle}>{errors.email}</span>}
              </div>
              <div>
                <label style={labelStyle}>Department *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {deptOpts.map(d => (
                    <button key={d.value} type="button" onClick={() => set('department', d.value)}
                      style={{ padding: '8px 12px', borderRadius: 10, border: `1.5px solid ${form.department === d.value ? roleColor : '#e2e8f0'}`, background: form.department === d.value ? roleBg : '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: form.department === d.value ? 700 : 400, color: form.department === d.value ? roleColor : '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s' }}>
                      <span>{d.emoji}</span>{d.label}
                    </button>
                  ))}
                </div>
              </div>
              {isStudent && (
                <div>
                  <label style={labelStyle}>Date of Birth *</label>
                  <input id="create-dob" type="date" value={form.dob} onChange={e => set('dob', e.target.value)} style={{...inputStyle, borderColor: errors.dob ? '#ef4444' : '#e2e8f0'}} />
                  {errors.dob && <span style={errStyle}>{errors.dob}</span>}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: User ID */}
          {!done && step === 2 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: roleBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 0.75rem' }}>
                  {isStudent ? '🆔' : '🔖'}
                </div>
                <h6 style={{ fontWeight: 700, color: '#0f172a' }}>Assign a Unique {isStudent ? 'Student' : 'TPC'} ID</h6>
                <p style={{ color: '#64748b', fontSize: '0.83rem', margin: 0 }}>Must be exactly 8 digits. This is the login ID.</p>
              </div>
              <label style={labelStyle}>{isStudent ? 'Student ID' : 'TPC ID'} (8 digits) *</label>
              <input
                id="create-userid"
                type="text"
                placeholder="e.g. 20210001"
                maxLength={8}
                value={form.userId}
                onChange={e => set('userId', e.target.value.replace(/\D/g, ''))}
                style={{ ...inputStyle, fontSize: '1.4rem', letterSpacing: 6, textAlign: 'center', fontWeight: 700, borderColor: errors.userId ? '#ef4444' : '#e2e8f0' }}
              />
              {errors.userId && <span style={errStyle}>{errors.userId}</span>}
              <div style={{ marginTop: '1rem', padding: '0.875rem', background: '#fffbeb', borderRadius: 10, border: '1px solid #fed7aa', display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontSize: '0.8rem', color: '#92400e' }}>
                ⚠️ <span>This ID will be used by the user to log in. It cannot be changed after creation.</span>
              </div>
            </div>
          )}

          {/* STEP 3: Password */}
          {!done && step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Create Password *</label>
                <PasswordField id="create-password" placeholder="Minimum 6 characters" value={form.password} onChange={e => set('password', e.target.value)} />
                {form.password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i <= strength ? STRENGTH_COLORS[strength] : '#e2e8f0', transition: 'background 0.2s' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: STRENGTH_COLORS[strength], fontWeight: 600 }}>{STRENGTH_LABELS[strength]}</span>
                  </div>
                )}
                {errors.password && <span style={errStyle}>{errors.password}</span>}
              </div>
              <div>
                <label style={labelStyle}>Confirm Password *</label>
                <PasswordField id="create-confirm-password" placeholder="Re-enter password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>✓ Passwords match</span>
                )}
                {errors.confirmPassword && <span style={errStyle}>{errors.confirmPassword}</span>}
              </div>

              {/* Summary Card */}
              <div style={{ padding: '0.875rem 1rem', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Account Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 1rem', fontSize: '0.83rem' }}>
                  <span style={{ color: '#64748b' }}>Name</span><span style={{ fontWeight: 600, color: '#0f172a' }}>{form.fullName}</span>
                  <span style={{ color: '#64748b' }}>ID</span><span style={{ fontWeight: 600, color: '#0f172a' }}>{form.userId}</span>
                  <span style={{ color: '#64748b' }}>Email</span><span style={{ fontWeight: 600, color: '#0f172a', overflow:'hidden', textOverflow:'ellipsis' }}>{form.email}</span>
                  <span style={{ color: '#64748b' }}>Role</span>
                  <span style={{ fontWeight: 700, color: roleColor }}>{isStudent ? 'Student' : 'TPC Staff'}</span>
                </div>
              </div>
              {errors.submit && <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>{errors.submit}</div>}
            </div>
          )}
        </div>

        {/* Footer */}
        {!done && (
          <div style={{ padding: '1rem 2rem 1.5rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', gap: '0.75rem' }}>
            {step > 1
              ? <button onClick={back} style={{ padding: '10px 24px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>← Back</button>
              : <div />}
            {step < 3
              ? <button onClick={next} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: roleColor, cursor: 'pointer', fontWeight: 600, color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Continue <FaChevronRight style={{ fontSize: '0.75rem' }} />
                </button>
              : <button onClick={handleSubmit} disabled={loading} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: loading ? '#94a3b8' : '#10b981', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                  {loading ? 'Creating...' : '✓ Create Account'}
                </button>}
          </div>
        )}
      </div>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(30px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
    </div>
  );
}

const labelStyle = { fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' };
const errStyle = { fontSize: '0.75rem', color: '#ef4444', marginTop: 4, display: 'block' };

/* ─── Main Admin Users Page ─── */
export default function AdminUsers({ students, tpcUsers, onRefresh }) {
  const [subTab, setSubTab] = useState('students');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createModal, setCreateModal] = useState(null); // 'student' | 'tpc' | null
  const [selectedUser, setSelectedUser] = useState(null);
  const [resetPw, setResetPw] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const displayed = subTab === 'students' ? students : tpcUsers;
  const filtered = displayed.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.studentId?.includes(search) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? u.isActive : !u.isActive;
    return matchSearch && matchStatus;
  });

  const toggleStatus = async (userId, current) => {
    setActionLoading(userId);
    try { await api.put(`/admin/users/${userId}/status`, { isActive: !current }); onRefresh(); }
    catch { }
    finally { setActionLoading(null); }
  };

  const handleResetPassword = async () => {
    if (!resetPw || resetPw.length < 6) return;
    if (!window.confirm(`Force override ${selectedUser.name}'s password?`)) return;
    try {
      await api.put(`/admin/users/${selectedUser._id}/reset-password`, { newPassword: resetPw });
      setShowReset(false);
      setResetPw('');
      alert('Password overridden successfully!');
      setSelectedUser(null);
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const ROLE_COLORS = { student: { bg: '#eef2ff', color: '#6366f1' }, tpc: { bg: '#f0f9ff', color: '#0ea5e9' }, admin: { bg: '#fdf2f8', color: '#d946ef' } };

  return (
    <div>
      <style>{`
        .u-table tr:hover { background: #f8fafc !important; }
        .u-table td { vertical-align: middle !important; }
        .avatar-circle { width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.9rem; flex-shrink:0; }
        .action-btn { padding:5px 12px; border-radius:7px; font-size:0.78rem; font-weight:600; cursor:pointer; border:1.5px solid; transition:all 0.15s; }
        .action-btn:hover { opacity:0.8; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>User Management</h2>
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Manage all student and TPC staff accounts</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setCreateModal('student')}
            style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.87rem', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}
            id="admin-create-student-btn"
          >
            <FaUserPlus /> New Student
          </button>
          <button
            onClick={() => setCreateModal('tpc')}
            style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.87rem', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(14,165,233,0.35)' }}
            id="admin-create-tpc-btn"
          >
            <FaUserPlus /> New TPC Staff
          </button>
        </div>
      </div>

      {/* Stats Chips */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Students', value: students.length, color: '#6366f1', bg: '#eef2ff' },
          { label: 'Active Students', value: students.filter(u => u.isActive).length, color: '#10b981', bg: '#f0fdf4' },
          { label: 'Blocked', value: students.filter(u => !u.isActive).length, color: '#ef4444', bg: '#fef2f2' },
          { label: 'TPC Staff', value: tpcUsers.length, color: '#0ea5e9', bg: '#f0f9ff' },
        ].map(s => (
          <div key={s.label} style={{ padding: '8px 16px', borderRadius: 10, background: s.bg, color: s.color, fontWeight: 700, fontSize: '0.82rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '1.05rem' }}>{s.value}</span>
            <span style={{ fontWeight: 500, color: s.color, opacity: 0.7 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Sub-Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #f1f5f9', marginBottom: '1rem' }}>
        {[{ id: 'students', label: 'Students', count: students.length }, { id: 'tpc', label: 'TPC Staff', count: tpcUsers.length }].map(t => (
          <button key={t.id} onClick={() => { setSubTab(t.id); setSearch(''); setStatusFilter('all'); }}
            style={{ padding: '0.7rem 1.75rem', background: 'none', border: 'none', borderBottom: subTab === t.id ? '3px solid #6366f1' : '3px solid transparent', marginBottom: -2, cursor: 'pointer', fontWeight: subTab === t.id ? 700 : 500, color: subTab === t.id ? '#6366f1' : '#64748b', fontSize: '0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'center', transition: 'all 0.15s' }}>
            {t.label} <span style={{ background: subTab === t.id ? '#eef2ff' : '#f1f5f9', color: subTab === t.id ? '#6366f1' : '#94a3b8', padding: '1px 8px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700 }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <FaSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }} />
          <input placeholder="Search by name, ID, or email..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.87rem', outline: 'none', color: '#0f172a', background: '#fff' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.87rem', color: '#475569', cursor: 'pointer', outline: 'none' }}>
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="blocked">Blocked Only</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
        <table className="u-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              {['User', 'ID', 'Email', 'Dept.', 'Role', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.9rem' }}>No users found.</td></tr>
              : filtered.map((u, i) => {
                  const rc = ROLE_COLORS[u.role] || ROLE_COLORS.student;
                  const initial = u.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
                  const avatarBg = u.role === 'tpc' ? '#dbeafe' : '#ede9fe';
                  const avatarColor = u.role === 'tpc' ? '#1d4ed8' : '#7c3aed';
                  return (
                    <tr key={u._id} style={{ borderBottom: '1px solid #f8fafc', background: u.isActive ? (i % 2 === 0 ? '#fff' : '#fafbfc') : '#fff5f5' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="avatar-circle" style={{ background: avatarBg, color: avatarColor }}>
                            {u.profilePhoto ? <img src={u.profilePhoto} alt={u.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Added {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontFamily: 'monospace' }}>{u.studentId}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{u.email || u.studentEmail || '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#475569', textTransform: 'uppercase', fontSize: '0.78rem', fontWeight: 600 }}>{u.department || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 999, fontWeight: 700, fontSize: '0.75rem', background: rc.bg, color: rc.color }}>
                          {u.role === 'tpc' ? 'TPC Staff' : 'Student'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 999, fontWeight: 700, fontSize: '0.75rem', background: u.isActive ? '#f0fdf4' : '#fef2f2', color: u.isActive ? '#15803d' : '#dc2626' }}>
                          {u.isActive ? '● Active' : '○ Blocked'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="action-btn" onClick={() => toggleStatus(u._id, u.isActive)} disabled={actionLoading === u._id}
                            style={{ borderColor: u.isActive ? '#fca5a5' : '#86efac', background: u.isActive ? '#fef2f2' : '#f0fdf4', color: u.isActive ? '#dc2626' : '#16a34a' }}>
                            {actionLoading === u._id ? '...' : u.isActive ? 'Block' : 'Unblock'}
                          </button>
                          <button className="action-btn" onClick={() => { setSelectedUser(u); setResetPw(''); setShowReset(true); }}
                            style={{ borderColor: '#c7d2fe', background: '#eef2ff', color: '#4f46e5' }}>
                            <FaLock /> Reset
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Create Account Wizard */}
      {createModal && (
        <CreateAccountModal
          type={createModal}
          onClose={() => setCreateModal(null)}
          onSuccess={onRefresh}
        />
      )}

      {/* Reset Password Side Panel */}
      {showReset && selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowReset(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, width: 420, maxWidth: '95vw', padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🔐</div>
              <div>
                <h6 style={{ margin: 0, fontWeight: 700 }}>Force Reset Password</h6>
                <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>For: {selectedUser.name}</span>
              </div>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.83rem', marginBottom: '1rem' }}>
              This will immediately override the user's password. They must use this new password to log in.
            </p>
            <PasswordField placeholder="New password (min 6 chars)" value={resetPw} onChange={e => setResetPw(e.target.value)} id="reset-pw-field" />
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button onClick={() => setShowReset(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>Cancel</button>
              <button onClick={handleResetPassword} disabled={!resetPw || resetPw.length < 6}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: resetPw.length >= 6 ? '#ef4444' : '#fca5a5', color: '#fff', cursor: resetPw.length >= 6 ? 'pointer' : 'default', fontWeight: 700 }}>
                Override Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
