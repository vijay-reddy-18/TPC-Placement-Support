import React, { useState } from 'react';
import { FaSave, FaTimes, FaPlus, FaTrash, FaGripVertical, FaCog, FaBell, FaShieldAlt, FaTags, FaRobot, FaGlobe } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-toastify';

const SECTION_STYLE = { background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', marginBottom: '1.25rem' };
const LABEL_STYLE = { fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 };
const INPUT_STYLE = { width: '100%', padding: '9px 13px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.9rem', outline: 'none', color: '#0f172a', background: '#f8fafc' };
const NUMBER_INPUT_STYLE = { width: 90, padding: '7px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.88rem', fontWeight: 600, outline: 'none', textAlign: 'center' };

const PRIORITY_META = [
  { key: 'urgent', label: 'Urgent', emoji: '🔥', color: '#ef4444' },
  { key: 'high',   label: 'High',   emoji: '🔴', color: '#f97316' },
  { key: 'medium', label: 'Medium', emoji: '🟡', color: '#f59e0b' },
  { key: 'low',    label: 'Low',    emoji: '🟢', color: '#10b981' },
];

const MODULES = ['Tickets', 'Users', 'Knowledge', 'Analytics', 'Settings', 'Announcements'];
const ROLES = ['student', 'tpc', 'admin'];
const ACTIONS = ['view', 'create', 'edit', 'delete'];

function Toggle({ checked, onChange, id }) {
  return (
    <div onClick={onChange} id={id}
      style={{ width: 44, height: 24, borderRadius: 12, background: checked ? '#6366f1' : '#e2e8f0', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', width: 18, height: 18, borderRadius: '50%', background: '#fff', top: 3, left: checked ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '9px 16px', border: 'none', borderRadius: 10, background: active ? '#eef2ff' : 'transparent', color: active ? '#6366f1' : '#64748b', fontWeight: active ? 700 : 500, fontSize: '0.87rem', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
      {icon} {label}
    </button>
  );
}

export default function AdminSettings({ settings, onSettingsChange }) {
  const [tab, setTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📌');

  const set = (path, value) => {
    const parts = path.split('.');
    const updated = JSON.parse(JSON.stringify(settings));
    let obj = updated;
    for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
    obj[parts[parts.length - 1]] = value;
    onSettingsChange(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    const cats = [...(settings.ticketCategories || [])];
    cats.push({ id: `cat_${Date.now()}`, name: newCatName.trim(), icon: newCatIcon, color: '#6366f1', isActive: true });
    onSettingsChange({ ...settings, ticketCategories: cats });
    setNewCatName(''); setNewCatIcon('📌');
  };

  const removeCategory = (id) => {
    onSettingsChange({ ...settings, ticketCategories: settings.ticketCategories.filter(c => c.id !== id) });
  };

  const toggleCat = (id) => {
    onSettingsChange({ ...settings, ticketCategories: settings.ticketCategories.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c) });
  };

  const updateSLA = (priority, field, val) => {
    const updated = (settings.slaRules || []).map(r => r.priority === priority ? { ...r, [field]: +val } : r);
    onSettingsChange({ ...settings, slaRules: updated });
  };

  const toggleAutomation = (id) => {
    const updated = (settings.automationRules || []).map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    onSettingsChange({ ...settings, automationRules: updated });
  };

  const setNotif = (key, val) => {
    onSettingsChange({ ...settings, notifications: { ...settings.notifications, [key]: val } });
  };

  const setPermission = (role, module_, action, val) => {
    const perms = JSON.parse(JSON.stringify(settings.permissions || {}));
    const roleKey = role.toLowerCase();
    const modKey = module_.toLowerCase();
    if (!perms[roleKey]) perms[roleKey] = {};
    if (!perms[roleKey][modKey]) perms[roleKey][modKey] = {};
    perms[roleKey][modKey][action] = val;
    onSettingsChange({ ...settings, permissions: perms });
  };

  const getPermission = (role, module_, action) => {
    return settings.permissions?.[role]?.[module_.toLowerCase()]?.[action] ?? false;
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set('appLogo', ev.target.result);
    reader.readAsDataURL(file);
  };

  const tabs = [
    { id: 'general',      icon: <FaGlobe />,    label: 'General' },
    { id: 'permissions',  icon: <FaShieldAlt />, label: 'Permissions' },
    { id: 'ticketconfig', icon: <FaTags />,      label: 'Ticket Config' },
    { id: 'sla',          icon: <FaRobot />,     label: 'SLA & Automation' },
    { id: 'notifications',icon: <FaBell />,      label: 'Notifications' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>⚙️ Settings Engine</h2>
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Configure the entire system — changes are saved to the database</span>
        </div>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: '9px 22px', borderRadius: 12, border: 'none', background: saving ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #818cf8)', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }} id="settings-save-btn">
          <FaSave /> {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.5rem', background: '#f8fafc', borderRadius: 12, padding: 5, flexWrap: 'wrap' }}>
        {tabs.map(t => <TabBtn key={t.id} active={tab === t.id} onClick={() => setTab(t.id)} icon={t.icon} label={t.label} />)}
      </div>

      {/* ─── GENERAL ─── */}
      {tab === 'general' && (
        <div>
          <div style={SECTION_STYLE}>
            <h5 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>🌐 Application Identity</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={LABEL_STYLE}>Application Name</label>
                <input style={INPUT_STYLE} value={settings.appName || ''} onChange={e => set('appName', e.target.value)} id="setting-appname" />
              </div>
              <div>
                <label style={LABEL_STYLE}>Timezone</label>
                <select style={INPUT_STYLE} value={settings.timezone || 'Asia/Kolkata'} onChange={e => set('timezone', e.target.value)} id="setting-timezone">
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>Language</label>
                <select style={INPUT_STYLE} value={settings.language || 'en'} onChange={e => set('language', e.target.value)} id="setting-language">
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>Theme</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {['light', 'dark', 'auto'].map(t => (
                    <button key={t} type="button" onClick={() => set('theme', t)}
                      style={{ flex: 1, padding: '9px', borderRadius: 10, border: `2px solid ${settings.theme === t ? '#6366f1' : '#e2e8f0'}`, background: settings.theme === t ? '#eef2ff' : '#fff', color: settings.theme === t ? '#6366f1' : '#475569', fontWeight: settings.theme === t ? 700 : 500, cursor: 'pointer', textTransform: 'capitalize', fontSize: '0.85rem' }}>
                      {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '🔄'} {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={SECTION_STYLE}>
            <h5 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>🖼️ Branding — Logo</h5>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ width: 80, height: 80, borderRadius: 16, border: '2px dashed #c7d2fe', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {settings.appLogo
                  ? <img src={settings.appLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <span style={{ fontSize: '2rem' }}>🛡️</span>}
              </div>
              <div>
                <label style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #c7d2fe', background: '#eef2ff', color: '#6366f1', fontWeight: 600, cursor: 'pointer', fontSize: '0.87rem' }}>
                  📤 Upload Logo
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} id="setting-logo-upload" />
                </label>
                <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 6, marginBottom: 0 }}>PNG/SVG, max 200KB. Replaces sidebar logo immediately.</p>
                {settings.appLogo && (
                  <button onClick={() => set('appLogo', '')} style={{ marginTop: 6, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: 0 }}>
                    ✕ Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={SECTION_STYLE}>
            <h5 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>🔌 Integrations</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={LABEL_STYLE}>SMTP Host</label>
                <input style={INPUT_STYLE} placeholder="smtp.gmail.com" value={settings.integrations?.smtpHost || ''} onChange={e => set('integrations.smtpHost', e.target.value)} id="setting-smtp-host" />
              </div>
              <div>
                <label style={LABEL_STYLE}>SMTP Port</label>
                <input style={INPUT_STYLE} type="number" value={settings.integrations?.smtpPort || 587} onChange={e => set('integrations.smtpPort', +e.target.value)} id="setting-smtp-port" />
              </div>
              <div>
                <label style={LABEL_STYLE}>SMTP Username</label>
                <input style={INPUT_STYLE} placeholder="your@email.com" value={settings.integrations?.smtpUser || ''} onChange={e => set('integrations.smtpUser', e.target.value)} id="setting-smtp-user" />
              </div>
              <div>
                <label style={LABEL_STYLE}>SMTP Password</label>
                <input style={INPUT_STYLE} type="password" placeholder="••••••••" value={settings.integrations?.smtpPass || ''} onChange={e => set('integrations.smtpPass', e.target.value)} id="setting-smtp-pass" />
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Toggle checked={settings.integrations?.aiEnabled || false} onChange={() => set('integrations.aiEnabled', !settings.integrations?.aiEnabled)} id="setting-ai-toggle" />
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>🤖 AI Auto-Classification</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Automatically classify incoming tickets using AI</div>
              </div>
            </div>
          </div>

          <div style={SECTION_STYLE}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h5 style={{ fontWeight: 700, color: '#ef4444', margin: 0 }}>⚠️ Maintenance Mode</h5>
                <p style={{ color: '#64748b', fontSize: '0.83rem', margin: '0.25rem 0 0' }}>Enabling this will take the portal offline for students and TPC staff</p>
              </div>
              <Toggle checked={settings.maintenanceMode || false} onChange={() => set('maintenanceMode', !settings.maintenanceMode)} id="setting-maintenance-toggle" />
            </div>
          </div>
        </div>
      )}

      {/* ─── PERMISSIONS ─── */}
      {tab === 'permissions' && (
        <div style={SECTION_STYLE}>
          <h5 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>🔐 Role & Permission Matrix</h5>
          <p style={{ color: '#64748b', fontSize: '0.83rem', marginBottom: '1.5rem' }}>Define what each role can do across every module</p>
          {ROLES.map(role => (
            <div key={role} style={{ marginBottom: '2rem' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: '0.75rem', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ padding: '3px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: role === 'admin' ? '#fdf2f8' : role === 'tpc' ? '#f0f9ff' : '#eef2ff', color: role === 'admin' ? '#d946ef' : role === 'tpc' ? '#0ea5e9' : '#6366f1' }}>{role}</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.73rem', textTransform: 'uppercase', minWidth: 120 }}>Module</th>
                      {ACTIONS.map(a => (
                        <th key={a} style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.73rem', textTransform: 'uppercase', width: 80 }}>{a}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map((mod, i) => (
                      <tr key={mod} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{mod}</td>
                        {ACTIONS.map(action => {
                          const checked = getPermission(role, mod, action);
                          const disabled = role === 'admin'; // admin always has all
                          return (
                            <td key={action} style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <input type="checkbox" checked={disabled || checked} disabled={disabled}
                                onChange={() => setPermission(role, mod, action, !checked)}
                                id={`perm-${role}-${mod}-${action}`}
                                style={{ width: 16, height: 16, accentColor: '#6366f1', cursor: disabled ? 'not-allowed' : 'pointer' }} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── TICKET CONFIG ─── */}
      {tab === 'ticketconfig' && (
        <div>
          <div style={SECTION_STYLE}>
            <h5 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>🏷️ Ticket Categories</h5>
            <p style={{ color: '#64748b', fontSize: '0.83rem', marginBottom: '1.25rem' }}>These are the categories students see when creating a ticket</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {(settings.ticketCategories || []).map(cat => (
                <div key={cat.id} style={{ borderRadius: 12, border: `1.5px solid ${cat.isActive ? '#e0e7ff' : '#f1f5f9'}`, padding: '0.875rem', background: cat.isActive ? '#fafbff' : '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cat.color || '#6366f1'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>{cat.icon}</div>
                    <div style={{ flex: 1, fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>{cat.name}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Toggle checked={cat.isActive} onChange={() => toggleCat(cat.id)} id={`cat-toggle-${cat.id}`} />
                    <button onClick={() => removeCategory(cat.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>🗑 Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input style={{ ...INPUT_STYLE, flex: 1, minWidth: 180 }} placeholder="New category name..." value={newCatName} onChange={e => setNewCatName(e.target.value)} id="new-cat-name" />
              <input style={{ width: 60, padding: '9px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '1.3rem', textAlign: 'center', outline: 'none' }} value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} placeholder="📌" id="new-cat-icon" />
              <button onClick={addCategory} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.87rem' }} id="add-cat-btn">
                + Add Category
              </button>
            </div>
          </div>

          <div style={SECTION_STYLE}>
            <h5 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>📊 Status Flow</h5>
            <p style={{ color: '#64748b', fontSize: '0.83rem', marginBottom: '1rem' }}>Ticket lifecycle stages (displayed in order)</p>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {(settings.ticketStatuses || []).sort((a, b) => a.order - b.order).map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '7px 14px', borderRadius: 99, border: `2px solid ${s.color}30`, background: `${s.color}10`, color: s.color, fontWeight: 700, fontSize: '0.82rem' }}>
                  {s.label}
                  <span style={{ color: s.color, opacity: 0.6 }}>→</span>
                </div>
              ))}
            </div>
          </div>

          <div style={SECTION_STYLE}>
            <h5 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>🔒 Security Policy</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={LABEL_STYLE}>Min Password Length</label>
                <input type="number" style={INPUT_STYLE} min={6} max={20} value={settings.security?.minPasswordLength || 6} onChange={e => set('security.minPasswordLength', +e.target.value)} id="setting-pw-length" />
              </div>
              <div>
                <label style={LABEL_STYLE}>JWT Expiry (Days)</label>
                <input type="number" style={INPUT_STYLE} min={1} max={90} value={settings.security?.jwtExpiryDays || 7} onChange={e => set('security.jwtExpiryDays', +e.target.value)} id="setting-jwt-expiry" />
              </div>
              <div>
                <label style={LABEL_STYLE}>Session Timeout (Minutes)</label>
                <input type="number" style={INPUT_STYLE} min={5} value={settings.security?.sessionTimeoutMins || 30} onChange={e => set('security.sessionTimeoutMins', +e.target.value)} id="setting-session-timeout" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Toggle checked={settings.security?.require2FA || false} onChange={() => set('security.require2FA', !settings.security?.require2FA)} id="setting-2fa-toggle" />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>Enforce 2FA</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Require 2FA for all logins</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SLA & AUTOMATION ─── */}
      {tab === 'sla' && (
        <div>
          <div style={SECTION_STYLE}>
            <h5 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>⏱️ SLA Rules by Priority</h5>
            <p style={{ color: '#64748b', fontSize: '0.83rem', marginBottom: '1.25rem' }}>Define resolution and escalation time limits per priority level</p>
            {PRIORITY_META.map(p => {
              const rule = (settings.slaRules || []).find(r => r.priority === p.key) || { resolutionHours: 24, escalateAfterHours: 4 };
              return (
                <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1rem 1.25rem', borderRadius: 12, border: `1.5px solid ${p.color}20`, background: `${p.color}06`, marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 110 }}>
                    <span style={{ fontSize: '1.3rem' }}>{p.emoji}</span>
                    <span style={{ fontWeight: 700, color: p.color, textTransform: 'uppercase', fontSize: '0.88rem' }}>{p.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Resolution:</label>
                    <input type="number" value={rule.resolutionHours} min={1}
                      onChange={e => updateSLA(p.key, 'resolutionHours', e.target.value)}
                      style={NUMBER_INPUT_STYLE} id={`sla-res-${p.key}`} />
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>hrs</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Escalate After:</label>
                    <input type="number" value={rule.escalateAfterHours} min={1}
                      onChange={e => updateSLA(p.key, 'escalateAfterHours', e.target.value)}
                      style={NUMBER_INPUT_STYLE} id={`sla-esc-${p.key}`} />
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>hrs over</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={SECTION_STYLE}>
            <h5 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>🤖 Automation Rules (IF → THEN)</h5>
            <p style={{ color: '#64748b', fontSize: '0.83rem', marginBottom: '1.25rem' }}>Toggle workflow automation rules. Changes apply to new events after saving.</p>
            {(settings.automationRules || []).map(rule => (
              <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem', borderRadius: 12, border: `1.5px solid ${rule.isActive ? '#e0e7ff' : '#f1f5f9'}`, background: rule.isActive ? '#fafbff' : '#f8fafc', marginBottom: '0.6rem', transition: 'all 0.2s' }}>
                <div style={{ fontSize: '1.3rem' }}>
                  {rule.trigger === 'ticket_created' ? '🎫' : rule.trigger === 'sla_at_risk' ? '⚠️' : rule.trigger === 'sla_breached' ? '🔴' : rule.trigger === 'ticket_resolved' ? '⭐' : '🔄'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>{rule.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                    IF <strong>{rule.trigger?.replace(/_/g, ' ')}</strong> → <strong>{rule.action?.replace(/_/g, ' ')}</strong>
                  </div>
                </div>
                <Toggle checked={rule.isActive} onChange={() => toggleAutomation(rule.id)} id={`automation-${rule.id}`} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: rule.isActive ? '#10b981' : '#94a3b8', minWidth: 60 }}>{rule.isActive ? '● Active' : '○ Off'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── NOTIFICATIONS ─── */}
      {tab === 'notifications' && (
        <div style={SECTION_STYLE}>
          <h5 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>🔔 Notification Channels & Triggers</h5>
          <p style={{ color: '#64748b', fontSize: '0.83rem', marginBottom: '1.5rem' }}>Control when and how notifications are sent to users</p>
          {[
            { key: 'emailOnCreate',   icon: '📧', label: 'Email on Ticket Created',  desc: 'Notify student when ticket is received by the system' },
            { key: 'emailOnResolve',  icon: '✅', label: 'Email on Ticket Resolved', desc: 'Alert the student when their ticket is marked resolved' },
            { key: 'emailOnEscalate', icon: '⚡', label: 'Email on Escalation',      desc: 'Notify TPC head + Admin when a ticket is escalated' },
            { key: 'emailOnComment',  icon: '💬', label: 'Email on New Comment',      desc: 'Notify users when a new comment is added to their ticket' },
            { key: 'smsOnUrgent',     icon: '📱', label: 'SMS for Urgent Tickets',   desc: 'Send SMS alert when an urgent-priority ticket is raised' },
            { key: 'inAppAll',        icon: '🔔', label: 'In-App Notifications',      desc: 'Show bell notifications inside the portal for all events' },
          ].map(n => {
            const checked = settings.notifications?.[n.key] ?? true;
            return (
              <div key={n.key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderRadius: 12, border: `1.5px solid ${checked ? '#e0e7ff' : '#f1f5f9'}`, background: checked ? '#fafbff' : '#f8fafc', marginBottom: '0.75rem', transition: 'all 0.2s' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: checked ? '#eef2ff' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{n.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{n.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{n.desc}</div>
                </div>
                <Toggle checked={checked} onChange={() => setNotif(n.key, !checked)} id={`notif-${n.key}`} />
              </div>
            );
          })}
          <div style={{ padding: '0.875rem 1.25rem', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', fontSize: '0.83rem', color: '#166534', marginTop: '0.5rem' }}>
            ✅ Email notifications require SMTP configuration in the General → Integrations section.
          </div>
        </div>
      )}
    </div>
  );
}
