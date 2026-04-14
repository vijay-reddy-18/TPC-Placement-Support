import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FaTachometerAlt, FaInbox, FaClipboardList, FaListAlt,
    FaExclamationTriangle, FaChartBar, FaBook, FaUsers,
    FaUser, FaBell, FaSignOutAlt, FaChevronDown, FaBars,
    FaSearch, FaPlus, FaTimes, FaBolt
} from 'react-icons/fa';
import '../styles/TPCLayout.css';

const sidebarItems = [
    { label: 'Dashboard',       icon: <FaTachometerAlt />, path: '/tpc/dashboard',  exact: true },
    { label: 'Incoming',        icon: <FaInbox />,         path: '/tpc/incoming',   hasBadge: true, badgeType: 'open' },
    { label: 'Assigned to Me',  icon: <FaClipboardList />, path: '/tpc/tickets?assigned=me' },
    { label: 'All Tickets',     icon: <FaListAlt />,       path: '/tpc/tickets' },
    { label: 'SLA & Escalations', icon: <FaExclamationTriangle />, path: '/tpc/sla' },
    { label: 'Analytics',       icon: <FaChartBar />,      path: '/tpc/analytics' },
    { label: 'Knowledge Base',  icon: <FaBook />,          path: '/tpc/knowledge' },
    { label: 'Team',            icon: <FaUsers />,         path: '/tpc/team' },
    { label: 'Profile',         icon: <FaUser />,          path: '/tpc/profile' },
];

const TPCLayout = ({ children, pageTitle, openTicketCount }) => {
    const { user, logout, features } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [quickActionsOpen, setQuickActionsOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const qaRef = useRef(null);
    const notifRef = useRef(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (qaRef.current && !qaRef.current.contains(e.target)) setQuickActionsOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const isFeatureActive = (featureName, defaultState = true) => {
        if (!features) return defaultState;
        const feature = features.find(f => f.name.toLowerCase() === featureName.toLowerCase() && f.targetRole === 'tpc');
        return feature ? feature.isActive : defaultState;
    };

    const isActive = (item) => {
        if (item.exact || item.path === '/tpc/dashboard') {
            return location.pathname === '/tpc/dashboard';
        }
        if (item.path.includes('?assigned=me')) {
            return location.pathname === '/tpc/tickets' && location.search.includes('assigned=me');
        }
        if (item.path === '/tpc/tickets') {
            return location.pathname === '/tpc/tickets' && !location.search.includes('assigned=me');
        }
        return location.pathname.startsWith(item.path.split('?')[0]);
    };

    const handleLogout = () => { logout(); navigate('/login'); };
    const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'T';

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/tpc/tickets?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
            setSearchQuery('');
        }
    };

    return (
        <div className="tpc-layout">
            {/* ===== SIDEBAR ===== */}
            <aside className={`tpc-sidebar${sidebarOpen ? ' open' : ''}`}>
                <div className="tpc-sidebar-header">
                    <div className="tpc-sidebar-logo" onClick={() => navigate('/tpc/dashboard')} style={{ cursor: 'pointer' }}>
                        🎓
                    </div>
                    <div className="tpc-sidebar-brand">
                        <span className="tpc-sidebar-brand-title">TPC</span>
                        <span className="tpc-sidebar-brand-title" style={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.7 }}>Staff Portal</span>
                    </div>
                </div>

                <nav className="tpc-sidebar-nav">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.label}
                            className={`tpc-sidebar-link${isActive(item) ? ' active' : ''}`}
                            onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                            title={item.label}
                        >
                            <span className="tpc-sidebar-link-icon">{item.icon}</span>
                            <span className="tpc-sidebar-link-text">{item.label}</span>
                            {item.badgeType === 'open' && openTicketCount > 0 && (
                                <span className="tpc-sidebar-badge">{openTicketCount > 99 ? '99+' : openTicketCount}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="tpc-sidebar-footer">
                    <div className="tpc-sidebar-user" onClick={() => navigate('/tpc/profile')}>
                        <div className="tpc-sidebar-user-avatar">
                            {user?.profilePhoto ? <img src={user.profilePhoto} alt={user.name} /> : userInitial}
                        </div>
                        <div className="tpc-sidebar-user-info">
                            <span className="tpc-sidebar-user-name">{user?.name || 'TPC Staff'}</span>
                            <span className="tpc-sidebar-user-role">TPC Staff</span>
                        </div>
                    </div>
                    <button className="tpc-sidebar-logout" onClick={handleLogout}>
                        <FaSignOutAlt style={{ marginRight: '0.5rem' }} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* ===== MAIN ===== */}
            <main className="tpc-main">
                <div className="tpc-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            className="tpc-mobile-menu"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{ display: 'none', background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#374151' }}
                        >
                            <FaBars />
                        </button>
                        <h1 className="tpc-topbar-title">{pageTitle || 'TPC Dashboard'}</h1>
                    </div>

                    <div className="tpc-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {/* Global Search */}
                        <button
                            onClick={() => setSearchOpen(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: '#f1f5f9', border: '1px solid #e2e8f0',
                                borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
                                color: '#64748b', fontSize: '0.85rem', fontWeight: 500,
                                transition: 'all 0.15s'
                            }}
                            id="tpc-global-search-btn"
                        >
                            <FaSearch style={{ fontSize: '0.8rem' }} />
                            <span style={{ display: 'none' }} className="search-label">Search tickets...</span>
                        </button>

                        {/* Quick Actions */}
                        <div ref={qaRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setQuickActionsOpen(o => !o)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    background: '#3b82f6', border: 'none',
                                    borderRadius: '8px', padding: '7px 14px', cursor: 'pointer',
                                    color: '#fff', fontSize: '0.83rem', fontWeight: 600,
                                }}
                                id="tpc-quick-actions-btn"
                            >
                                <FaPlus style={{ fontSize: '0.75rem' }} />
                                Actions
                                <FaChevronDown style={{ fontSize: '0.65rem' }} />
                            </button>
                            {quickActionsOpen && (
                                <div style={{
                                    position: 'absolute', top: '110%', right: 0,
                                    background: '#fff', borderRadius: '10px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                    border: '1px solid #e2e8f0', minWidth: 200, zIndex: 1000,
                                    padding: '0.5rem 0', overflow: 'hidden'
                                }}>
                                    {[
                                        { icon: '📥', label: 'View Incoming',      action: () => navigate('/tpc/incoming') },
                                        { icon: '🎫', label: 'All Tickets',        action: () => navigate('/tpc/tickets') },
                                        { icon: '⚡', label: 'SLA Escalations',  action: () => navigate('/tpc/sla') },
                                        { icon: '📊', label: 'Analytics',         action: () => navigate('/tpc/analytics') },
                                    ].map(a => (
                                        <button key={a.label} onClick={() => { a.action(); setQuickActionsOpen(false); }} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                                            width: '100%', padding: '0.6rem 1rem', background: 'none',
                                            border: 'none', cursor: 'pointer', textAlign: 'left',
                                            fontSize: '0.85rem', color: '#374151', fontWeight: 500,
                                            transition: 'background 0.15s'
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                        >
                                            {a.icon} {a.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Notifications */}
                        <div ref={notifRef} style={{ position: 'relative' }}>
                            <button
                                className="tpc-notification-btn"
                                onClick={() => setNotifOpen(o => !o)}
                                id="tpc-bell-btn"
                            >
                                <FaBell />
                                {openTicketCount > 0 && (
                                    <span className="tpc-notification-dot">{openTicketCount > 9 ? '9+' : openTicketCount}</span>
                                )}
                            </button>
                            {notifOpen && (
                                <div style={{
                                    position: 'absolute', top: '110%', right: 0,
                                    background: '#fff', borderRadius: '10px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                    border: '1px solid #e2e8f0', width: 300, zIndex: 1000
                                }}>
                                    <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', display: 'flex', justifyContent: 'space-between' }}>
                                        Notifications
                                        <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><FaTimes /></button>
                                    </div>
                                    {openTicketCount > 0 ? (
                                        <div style={{ padding: '0.875rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer' }}
                                            onClick={() => { navigate('/tpc/incoming'); setNotifOpen(false); }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>📥</div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>{openTicketCount} New Ticket{openTicketCount > 1 ? 's' : ''} Awaiting</div>
                                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>Unassigned tickets need attention</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>🎉 All caught up!</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* User */}
                        <div className="tpc-user-dropdown" onClick={() => navigate('/tpc/profile')}>
                            <div className="tpc-user-dropdown-avatar">
                                {user?.profilePhoto ? <img src={user.profilePhoto} alt={user.name} /> : userInitial}
                            </div>
                            <span className="tpc-user-dropdown-name">{user?.name || 'TPC Staff'}</span>
                            <FaChevronDown className="tpc-user-dropdown-arrow" />
                        </div>
                    </div>
                </div>

                <div className="tpc-content">{children}</div>
            </main>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999 }}
                    onClick={() => setSidebarOpen(false)} />
            )}

            {/* Global Search Modal */}
            {searchOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', width: '90%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', gap: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
                            <FaSearch style={{ color: '#94a3b8', fontSize: '1rem', flexShrink: 0 }} />
                            <input
                                autoFocus
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search tickets by ID, title, student ID..."
                                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem', color: '#0f172a', background: 'transparent' }}
                                id="tpc-search-input"
                            />
                            <button type="button" onClick={() => setSearchOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.1rem' }}><FaTimes /></button>
                        </form>
                        <div style={{ padding: '1rem 1.25rem' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Access</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {[
                                    { label: '📥 Incoming', path: '/tpc/incoming' },
                                    { label: '⚡ SLA Alerts', path: '/tpc/sla' },
                                    { label: '📊 Analytics', path: '/tpc/analytics' },
                                    { label: '📚 Knowledge Base', path: '/tpc/knowledge' },
                                    { label: '👥 Team', path: '/tpc/team' },
                                ].map(q => (
                                    <button key={q.label} onClick={() => { navigate(q.path); setSearchOpen(false); }} style={{
                                        padding: '6px 14px', borderRadius: '999px', border: '1px solid #e2e8f0',
                                        background: '#f8fafc', cursor: 'pointer', fontSize: '0.82rem', color: '#374151', fontWeight: 500
                                    }}>{q.label}</button>
                                ))}
                            </div>
                            {searchQuery.trim() && (
                                <button type="button" onClick={handleSearch} style={{
                                    marginTop: '1rem', width: '100%', padding: '0.75rem',
                                    background: '#3b82f6', color: '#fff', border: 'none',
                                    borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem'
                                }}>
                                    🔍 Search for "{searchQuery}"
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TPCLayout;
