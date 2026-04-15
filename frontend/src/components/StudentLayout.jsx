import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme, LANGUAGES } from '../context/ThemeContext';
import api from '../services/api';
import '../styles/StudentPortal.css';

const NAV_ITEMS = [
  { id: 'home',           path: '/student/dashboard',       icon: '🏠', label: 'Dashboard' },
  { id: 'tickets',        path: '/student/tickets',         icon: '🎫', label: 'My Tickets' },
  { id: 'create',         path: '/student/create-ticket',   icon: '➕', label: 'Raise Ticket' },
  { id: 'notifications',  path: '/student/notifications',   icon: '🔔', label: 'Notifications', badge: true },
  { id: 'help',           path: '/student/help',            icon: '❓', label: 'Help Center' },
  { id: 'feedback',       path: '/student/feedback',        icon: '⭐', label: 'Feedback' },
  { id: 'profile',        path: '/student/profile',         icon: '👤', label: 'Profile' },
];

const StudentLayout = ({ children, title, subtitle }) => {
  const { user, logout } = useAuth();
  const { theme, language, changeTheme, changeLanguage } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const isDark = theme === 'dark';
  const topbarBg = isDark ? '#1e293b' : '#fff';
  const topbarBorder = isDark ? '#334155' : '#f1f5f9';

  const handleNav = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Fetch unread notification count
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications');
        const notifs = res.data.notifications || [];
        const unread = notifs.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } catch { /* silently fail */ }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000); // poll every 60s
    return () => clearInterval(interval);
  }, []);

  const YEAR = new Date().getFullYear();

  return (
    <div className="sp-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 999, display: 'none'
          }}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className={`sp-sidebar${sidebarOpen ? ' open' : ''}`}>
        {/* Brand */}
        <div className="sp-brand">
          <div className="sp-brand-icon">🎓</div>
          <div className="sp-brand-text">
            <div className="sp-brand-title">Student Portal</div>
            <div className="sp-brand-sub">TPC Support System</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sp-nav">
          <div className="sp-nav-section-label">Navigation</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sp-nav-item${isActive(item.path) ? ' active' : ''}`}
              onClick={() => handleNav(item.path)}
              id={`sp-nav-${item.id}`}
            >
              <span className="sp-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && unreadCount > 0 && (
                <span className="sp-nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer user card + logout */}
        <div className="sp-sidebar-footer">
          <div className="sp-user-card">
            <div className="sp-user-avatar">
              {user?.profilePhoto
                ? <img src={user.profilePhoto} alt="avatar" />
                : (user?.name?.charAt(0) || 'S')}
            </div>
            <div>
              <div className="sp-user-name" style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Student'}
              </div>
              <div className="sp-user-role">{user?.studentId || 'Student'}</div>
            </div>
          </div>
          <button className="sp-logout-btn" onClick={logout} id="sp-logout-btn">
            <span>🚪</span> Logout
          </button>
          {/* Copyright */}
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '0.75rem', lineHeight: 1.5 }}>
            © {YEAR} Vijay Reddy<br />All rights reserved
          </div>
        </div>
      </aside>

      {/* ===== MAIN AREA ===== */}
      <div className="sp-main">
        {/* Topbar */}
        <header className="sp-topbar">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ display: 'none', background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}
            id="sp-mobile-menu"
          >
            ☰
          </button>

          <div className="sp-topbar-title">
            {title && <h1>{title}</h1>}
            {subtitle && <p>{subtitle}</p>}
          </div>

          <div className="sp-topbar-actions">
            {/* Search */}
            <div className="sp-search-box">
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>🔍</span>
              <input
                placeholder={language === 'hi' ? 'टिकट खोजें...' : language === 'ta' ? 'டிக்கெட்கள் தேடு...' : language === 'te' ? 'టిక్కెట్లు శోధించు...' : 'Search tickets...'}
                id="sp-global-search"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    navigate(`/student/tickets?search=${encodeURIComponent(e.target.value.trim())}`);
                  }
                }}
              />
            </div>

            {/* Theme Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', background: isDark ? '#0f172a' : '#f1f5f9', borderRadius: 10, overflow: 'hidden', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
              {[{ key: 'light', icon: '☀️' }, { key: 'dark', icon: '🌙' }, { key: 'auto', icon: '🔄' }].map(t => (
                <button key={t.key} onClick={() => changeTheme(t.key)}
                  title={t.key} id={`sp-theme-${t.key}`}
                  style={{ background: theme === t.key ? '#6366f1' : 'transparent', border: 'none', padding: '5px 8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                  {t.icon}
                </button>
              ))}
            </div>

            {/* Language Button */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowLangMenu(o => !o)} id="sp-lang-btn"
                style={{ background: isDark ? '#0f172a' : '#f1f5f9', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: 10, padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {LANGUAGES.find(l => l.code === language)?.flag || '🌍'} {language.toUpperCase()}
              </button>
              {showLangMenu && (
                <div style={{ position: 'absolute', top: '110%', right: 0, background: isDark ? '#1e293b' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 999, minWidth: 150, overflow: 'hidden' }}>
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => { changeLanguage(l.code); setShowLangMenu(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '8px 12px', border: 'none', background: language === l.code ? '#eef2ff' : 'transparent', cursor: 'pointer', fontWeight: language === l.code ? 700 : 500, color: language === l.code ? '#6366f1' : (isDark ? '#94a3b8' : '#475569'), fontSize: '0.8rem' }}>
                      {l.flag} {l.nativeLabel}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications bell */}
            <button
              className="sp-icon-btn"
              onClick={() => navigate('/student/notifications')}
              title="Notifications"
              id="sp-topbar-notif"
              style={{ position: 'relative' }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4, width: 18, height: 18,
                  borderRadius: '50%', background: '#ef4444', color: '#fff',
                  fontSize: '0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #fff',
                }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {/* Profile */}
            <div
              className="sp-topbar-profile"
              onClick={() => navigate('/student/profile')}
              id="sp-topbar-profile"
            >
              <div className="sp-topbar-avatar">
                {user?.profilePhoto
                  ? <img src={user.profilePhoto} alt="avatar" />
                  : (user?.name?.charAt(0) || 'S')}
              </div>
              <div>
                <div className="sp-topbar-name">{user?.name || 'Student'}</div>
                <div className="sp-topbar-role">Student</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="sp-content">
          {children}
        </main>

        {/* Footer */}
        <footer style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
            © {YEAR} <strong style={{ color: '#64748b' }}>Vijay Reddy</strong> · TPC Support System · All rights reserved
          </span>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => navigate('/student/help')} style={{ background: 'none', border: 'none', fontSize: '0.73rem', color: '#94a3b8', cursor: 'pointer', fontWeight: 500 }}>Help Center</button>
            <button onClick={() => navigate('/student/feedback')} style={{ background: 'none', border: 'none', fontSize: '0.73rem', color: '#94a3b8', cursor: 'pointer', fontWeight: 500 }}>Feedback</button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default StudentLayout;

