import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaTachometerAlt, FaUsers, FaClipboardList, FaCog, FaSignOutAlt, FaChevronDown, FaBars, FaUserCircle } from 'react-icons/fa';
import '../styles/TPCLayout.css';

const AdminLayout = ({ children, pageTitle, activeTab, setActiveTab }) => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const sidebarItems = [
        { id: 'overview', label: 'Dashboard', icon: <FaTachometerAlt /> },
        { id: 'users', label: 'Users', icon: <FaUsers /> },
        { id: 'tickets', label: 'Tickets', icon: <FaClipboardList /> },
        { id: 'settings', label: 'Settings', icon: <FaCog /> },
    ];

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'A';

    return (
        <div className="tpc-layout">
            {/* Sidebar */}
            <aside className={`tpc-sidebar${sidebarOpen ? ' open' : ''}`}>
                <div className="tpc-sidebar-header">
                    <div className="tpc-sidebar-logo" style={{ cursor: 'pointer' }}>
                        🎓
                    </div>
                    <div className="tpc-sidebar-brand">
                        <span className="tpc-sidebar-brand-title">Placement</span>
                        <span className="tpc-sidebar-brand-title">Portal</span>
                    </div>
                </div>

                <nav className="tpc-sidebar-nav">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            className={`tpc-sidebar-link${activeTab === item.id ? ' active' : ''}`}
                            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                        >
                            <span className="tpc-sidebar-link-icon">{item.icon}</span>
                            <span className="tpc-sidebar-link-text">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="tpc-sidebar-footer">
                    <div className="tpc-sidebar-user">
                        <div className="tpc-sidebar-user-avatar">
                            {user?.profilePhoto ? (
                                <img src={user.profilePhoto} alt={user.name} />
                            ) : userInitial}
                        </div>
                        <div className="tpc-sidebar-user-info">
                            <span className="tpc-sidebar-user-name">{user?.name || 'Admin'}</span>
                            <span className="tpc-sidebar-user-role">Administrator</span>
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
                        <h1 className="tpc-topbar-title">{pageTitle || 'Admin Dashboard'}</h1>
                    </div>
                    <div className="tpc-topbar-right">
                        <div className="tpc-user-dropdown">
                            <div className="tpc-user-dropdown-avatar">
                                {user?.profilePhoto ? (
                                    <img src={user.profilePhoto} alt={user.name} />
                                ) : userInitial}
                            </div>
                            <span className="tpc-user-dropdown-name">{user?.name || 'Admin'}</span>
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

export default AdminLayout;
