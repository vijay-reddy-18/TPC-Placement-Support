import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaTachometerAlt, FaClipboardList, FaChartBar, FaUser, FaBell, FaSignOutAlt, FaChevronDown, FaBars } from 'react-icons/fa';
import '../styles/TPCLayout.css';

const sidebarItems = [
    { label: 'Dashboard', icon: <FaTachometerAlt />, path: '/dashboard' },
    { label: 'Tickets', icon: <FaClipboardList />, path: '/tpc/tickets', hasBadge: true },
    { label: 'Analytics', icon: <FaChartBar />, path: '/tpc/analytics' },
    { label: 'Profile', icon: <FaUser />, path: '/tpc/profile' },
];

const TPCLayout = ({ children, pageTitle, openTicketCount }) => {
    const { user, logout, features } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Check if an admin feature toggle is active for TPC
    const isFeatureActive = (featureName, defaultState = true) => {
        if (!features) return defaultState;
        const feature = features.find(f => f.name.toLowerCase() === featureName.toLowerCase() && f.targetRole === 'tpc');
        return feature ? feature.isActive : defaultState;
    };

    const isActive = (path) => {
        if (path === '/dashboard') return location.pathname === '/dashboard';
        return location.pathname.startsWith(path);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'T';

    return (
        <div className="tpc-layout">
            {/* Sidebar */}
            <aside className={`tpc-sidebar${sidebarOpen ? ' open' : ''}`}>
                <div className="tpc-sidebar-header">
                    <div className="tpc-sidebar-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                        🎓
                    </div>
                    <div className="tpc-sidebar-brand">
                        <span className="tpc-sidebar-brand-title">Placement</span>
                        <span className="tpc-sidebar-brand-title">Portal</span>
                    </div>
                </div>

                <nav className="tpc-sidebar-nav">
                    {sidebarItems.filter(item => isFeatureActive(item.label)).map((item) => (
                        <button
                            key={item.label}
                            className={`tpc-sidebar-link${isActive(item.path) ? ' active' : ''}`}
                            onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                        >
                            <span className="tpc-sidebar-link-icon">{item.icon}</span>
                            <span className="tpc-sidebar-link-text">{item.label}</span>
                            {item.hasBadge && openTicketCount > 0 && (
                                <span className="tpc-sidebar-badge">{openTicketCount}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="tpc-sidebar-footer">
                    <div className="tpc-sidebar-user" onClick={() => navigate('/tpc/profile')}>
                        <div className="tpc-sidebar-user-avatar">
                            {user?.profilePhoto ? (
                                <img src={user.profilePhoto} alt={user.name} />
                            ) : userInitial}
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

            {/* Main Content */}
            <main className="tpc-main">
                <div className="tpc-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            className="tpc-mobile-menu"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{
                                display: 'none',
                                background: 'none',
                                border: 'none',
                                fontSize: '1.3rem',
                                cursor: 'pointer',
                                color: '#374151'
                            }}
                        >
                            <FaBars />
                        </button>
                        <h1 className="tpc-topbar-title">{pageTitle || 'TPC Support Dashboard'}</h1>
                    </div>
                    <div className="tpc-topbar-right">
                        <button className="tpc-notification-btn">
                            <FaBell />
                            {openTicketCount > 0 && (
                                <span className="tpc-notification-dot">{openTicketCount > 9 ? '9+' : openTicketCount}</span>
                            )}
                        </button>
                        <div className="tpc-user-dropdown" onClick={() => navigate('/tpc/profile')}>
                            <div className="tpc-user-dropdown-avatar">
                                {user?.profilePhoto ? (
                                    <img src={user.profilePhoto} alt={user.name} />
                                ) : userInitial}
                            </div>
                            <span className="tpc-user-dropdown-name">{user?.name || 'TPC Staff'}</span>
                            <FaChevronDown className="tpc-user-dropdown-arrow" />
                        </div>
                    </div>
                </div>
                <div className="tpc-content">
                    {children}
                </div>
            </main>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.4)', zIndex: 999
                    }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default TPCLayout;
