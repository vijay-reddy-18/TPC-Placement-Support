import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme, LANGUAGES } from '../context/ThemeContext';
import {
    FaTachometerAlt, FaUsers, FaClipboardList,
    FaClock, FaBell, FaBook, FaChartBar, FaScroll,
    FaCog, FaSignOutAlt, FaBars, FaSearch, FaShieldAlt,
    FaToggleOn, FaTicketAlt
} from 'react-icons/fa';
import '../styles/TPCLayout.css';

const AdminLayout = ({ children, pageTitle, activeTab, setActiveTab, systemSettings }) => {
    const { user, logout } = useAuth();
    const { theme, language, changeTheme, changeLanguage } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);

    const isDark = theme === 'dark';
    const topbarBg = isDark ? '#1e293b' : '#fff';
    const topbarBorder = isDark ? '#334155' : '#f1f5f9';
    const topbarText = isDark ? '#f1f5f9' : '#0f172a';
    const btnBg = isDark ? '#0f172a' : '#f8fafc';
    const btnBorder = isDark ? '#334155' : '#e2e8f0';

    const appName = systemSettings?.appName || 'Admin';
    const appLogo = systemSettings?.appLogo || '';

    const sidebarItems = [
        { id: 'overview',  label: 'Dashboard',     icon: <FaTachometerAlt /> },
        { id: 'users',     label: 'Users',          icon: <FaUsers /> },
        { id: 'tickets',   label: 'Tickets',        icon: <FaClipboardList /> },
        { id: 'reports',   label: 'Reports',        icon: <FaChartBar /> },
        { id: 'settings',  label: 'Settings',       icon: <FaCog /> },
        { id: 'features',  label: 'Features',       icon: <FaToggleOn /> },
        { id: 'knowledge', label: 'Knowledge Base', icon: <FaBook /> },
        { id: 'audit',     label: 'Audit Logs',     icon: <FaScroll /> },
    ];

    const handleLogout = () => { logout(); window.location.href = '/login'; };
    const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'A';

    return (
        <div className="tpc-layout">
            {/* Sidebar */}
            <aside className={`tpc-sidebar${sidebarOpen ? ' open' : ''}`} style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%)' }}>
                {/* Logo / Brand */}
                <div className="tpc-sidebar-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {appLogo
                            ? <img src={appLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            : <span style={{ fontSize: '1.4rem' }}>🛡️</span>}
                    </div>
                    <div className="tpc-sidebar-brand">
                        <span className="tpc-sidebar-brand-title" style={{ color: '#fff', fontWeight: 700 }}>{appName}</span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 500, opacity: 0.55, color: '#c7d2fe', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Control Panel</span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="tpc-sidebar-nav" style={{ paddingTop: '0.5rem' }}>
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            className={`tpc-sidebar-link${activeTab === item.id ? ' active' : ''}`}
                            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                            title={item.label}
                            style={{
                                background: activeTab === item.id ? 'rgba(255,255,255,0.12)' : 'transparent',
                                color: activeTab === item.id ? '#fff' : 'rgba(255,255,255,0.55)',
                                borderLeft: activeTab === item.id ? '3px solid #a5b4fc' : '3px solid transparent',
                                transition: 'all 0.15s',
                            }}
                        >
                            <span className="tpc-sidebar-link-icon" style={{ color: activeTab === item.id ? '#a5b4fc' : 'rgba(255,255,255,0.45)' }}>{item.icon}</span>
                            <span className="tpc-sidebar-link-text">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* User Footer */}
                <div className="tpc-sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="tpc-sidebar-user">
                        <div className="tpc-sidebar-user-avatar" style={{ background: '#a5b4fc', color: '#312e81', fontWeight: 700 }}>
                            {user?.profilePhoto ? <img src={user.profilePhoto} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : userInitial}
                        </div>
                        <div className="tpc-sidebar-user-info">
                            <span className="tpc-sidebar-user-name" style={{ color: '#fff', fontWeight: 600 }}>{user?.name || 'Admin'}</span>
                            <span className="tpc-sidebar-user-role" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>System Administrator</span>
                        </div>
                    </div>
                    <button className="tpc-sidebar-logout" onClick={handleLogout} style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '0.6rem 1rem', fontSize: '0.82rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', marginTop: '0.5rem', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                        <FaSignOutAlt /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="tpc-main">
                {/* Top Bar */}
                <div className="tpc-topbar" style={{ borderBottom: `1px solid ${topbarBorder}`, background: topbarBg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className="tpc-mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{ display: 'none', background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#374151' }}>
                            <FaBars />
                        </button>
                        <div>
                            <h1 className="tpc-topbar-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{pageTitle || 'Admin Dashboard'}</h1>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                        </div>
                    </div>
                    <div className="tpc-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {/* Search */}
                        <button onClick={() => setSearchOpen(o => !o)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: btnBg, border: `1.5px solid ${btnBorder}`, borderRadius: 10, padding: '7px 14px', cursor: 'pointer', color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.84rem', fontWeight: 500 }}
                            id="admin-search-btn">
                            <FaSearch style={{ fontSize: '0.8rem' }} /> Search
                        </button>

                        {/* Theme Toggle Pill */}
                        <div style={{ display: 'flex', alignItems: 'center', background: btnBg, border: `1.5px solid ${btnBorder}`, borderRadius: 10, overflow: 'hidden' }}>
                            {[{ key: 'light', icon: '☀️' }, { key: 'dark', icon: '🌙' }, { key: 'auto', icon: '🔄' }].map(t => (
                                <button key={t.key} onClick={() => changeTheme(t.key)}
                                    title={t.key.charAt(0).toUpperCase() + t.key.slice(1) + ' mode'}
                                    id={`admin-theme-${t.key}`}
                                    style={{ background: theme === t.key ? '#6366f1' : 'transparent', border: 'none', padding: '6px 9px', cursor: 'pointer', fontSize: '0.85rem', borderRadius: 0, transition: 'all 0.15s' }}>
                                    {t.icon}
                                </button>
                            ))}
                        </div>

                        {/* Language Pill */}
                        <div style={{ position: 'relative' }}>
                            <button onClick={() => setShowLangMenu(o => !o)} id="admin-lang-btn"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: btnBg, border: `1.5px solid ${btnBorder}`, borderRadius: 10, padding: '6px 11px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>
                                {LANGUAGES.find(l => l.code === language)?.flag || '🌍'}
                                <span>{language.toUpperCase()}</span>
                                <span style={{ fontSize: '0.6rem' }}>▾</span>
                            </button>
                            {showLangMenu && (
                                <div style={{ position: 'absolute', top: '110%', right: 0, background: isDark ? '#1e293b' : '#fff', border: `1px solid ${btnBorder}`, borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 999, minWidth: 160, overflow: 'hidden' }}>
                                    {LANGUAGES.map(l => (
                                        <button key={l.code} onClick={() => { changeLanguage(l.code); setShowLangMenu(false); }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '9px 14px', border: 'none', background: language === l.code ? (isDark ? '#1e1b4b' : '#eef2ff') : 'transparent', cursor: 'pointer', fontWeight: language === l.code ? 700 : 500, color: language === l.code ? '#6366f1' : (isDark ? '#94a3b8' : '#475569'), fontSize: '0.83rem' }}>
                                            <span style={{ fontSize: '1.1rem' }}>{l.flag}</span>
                                            <div style={{ textAlign: 'left' }}>
                                                <div>{l.nativeLabel}</div>
                                                <div style={{ fontSize: '0.68rem', opacity: 0.6 }}>{l.label}</div>
                                            </div>
                                            {language === l.code && <span style={{ marginLeft: 'auto', color: '#6366f1' }}>✓</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Bell */}
                        <div style={{ position: 'relative' }}>
                            <button className="tpc-notification-btn" onClick={() => setActiveTab('audit')} id="admin-alert-btn" title="Audit Logs"
                                style={{ background: btnBg, border: `1.5px solid ${btnBorder}`, borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6366f1', fontSize: '1rem' }}>
                                <FaBell />
                            </button>
                        </div>

                        {/* Settings Quick-Link */}
                        <button onClick={() => setActiveTab('settings')}
                            style={{ background: activeTab === 'settings' ? '#eef2ff' : btnBg, border: '1.5px solid ' + (activeTab === 'settings' ? '#c7d2fe' : btnBorder), borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: activeTab === 'settings' ? '#6366f1' : (isDark ? '#94a3b8' : '#64748b'), fontSize: '1rem', transition: 'all 0.15s' }}>
                            <FaCog />
                        </button>

                        {/* Admin Avatar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '6px 12px', background: btnBg, border: `1.5px solid ${btnBorder}`, borderRadius: 12, cursor: 'pointer' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                                {user?.profilePhoto ? <img src={user.profilePhoto} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : userInitial}
                            </div>
                            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: topbarText }}>{user?.name?.split(' ')[0] || 'Admin'}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="tpc-content">{children}</div>

                {/* Footer */}
                <footer style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid #f1f5f9', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.73rem', color: '#94a3b8', fontWeight: 500 }}>
                        © {new Date().getFullYear()} <strong style={{ color: '#64748b' }}>Vijay Reddy</strong> · TPC Admin Control Panel · All rights reserved
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#c7d2fe', fontWeight: 600 }}>⚡ Powered by TPC Support System</span>
                </footer>
            </main>

            {/* Mobile Overlay */}
            {sidebarOpen && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999 }} onClick={() => setSidebarOpen(false)} />}

            {/* Search Overlay */}
            {searchOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh', backdropFilter: 'blur(4px)' }}
                    onClick={() => setSearchOpen(false)}>
                    <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 500, boxShadow: '0 25px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', gap: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                            <FaSearch style={{ color: '#94a3b8' }} />
                            <input autoFocus placeholder="Search users, tickets, logs..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem', color: '#0f172a' }} id="admin-search-input" />
                        </div>
                        <div style={{ padding: '1rem 1.25rem' }}>
                            <div style={{ fontSize: '0.73rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jump to Section</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {sidebarItems.map(item => (
                                    <button key={item.id} onClick={() => { setActiveTab(item.id); setSearchOpen(false); }}
                                        style={{ padding: '6px 14px', borderRadius: 999, border: '1.5px solid #e2e8f0', background: activeTab === item.id ? '#eef2ff' : '#f8fafc', cursor: 'pointer', fontSize: '0.82rem', color: activeTab === item.id ? '#6366f1' : '#374151', fontWeight: activeTab === item.id ? 700 : 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        {item.icon} {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLayout;
