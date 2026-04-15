import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Badge, Modal, Row, Col } from 'react-bootstrap';
import { FaEye, FaSearch, FaFilter, FaDownload, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaChevronDown, FaCog } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import AdminLayout from '../components/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { ticketAPI } from '../services/api';
import api from '../services/api';
import { toast } from 'react-toastify';

// Sub-components
import AdminOverview from './admin/AdminOverview';
import AdminUsers from './admin/AdminUsers';
import AdminSettings from './admin/AdminSettings';
import AdminKnowledgeBase from './admin/AdminKnowledgeBase';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale);

const AdminDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [tickets, setTickets] = useState([]);
    const [students, setStudents] = useState([]);
    const [tpcUsers, setTpcUsers] = useState([]);
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [systemSettings, setSystemSettings] = useState(null);

    // Categories state (fed from systemSettings)
    const [auditLogs, setAuditLogs] = useState([]);
    const [kbArticles, setKbArticles] = useState([]);

    // Tickets Filter State
    const [ticketFilterDate, setTicketFilterDate] = useState('');
    const [ticketFilterStatus, setTicketFilterStatus] = useState('all');
    const [ticketFilterCategory, setTicketFilterCategory] = useState('all');

    // Modals
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showTicketModal, setShowTicketModal] = useState(false);

    // Features
    const [newFeatureName, setNewFeatureName] = useState('');
    const [settingsTab, setSettingsTab] = useState('student');

    useEffect(() => { loadData(); }, []);

    // Auto-refresh every 30 seconds for real-time dashboard
    useEffect(() => {
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);


    const loadData = async () => {
        try {
            setLoading(true);
            const [ticketsRes, usersRes, featuresRes, analyticsRes, settingsRes] = await Promise.all([
                ticketAPI.getAllTickets(null, null, null, 1, 1000),
                api.get('/admin/users'),
                api.get('/admin/features'),
                api.get('/admin/analytics').catch(() => ({ data: { analytics: null } })),
                api.get('/admin/settings').catch(() => ({ data: { settings: null } })),
            ]);
            setTickets(ticketsRes.data.tickets || []);
            const allUsers = usersRes.data.users || [];
            setStudents(allUsers.filter(u => u.role === 'student'));
            setTpcUsers(allUsers.filter(u => u.role === 'tpc'));
            setFeatures(featuresRes.data.features || []);
            if (analyticsRes.data.analytics) setAnalytics(analyticsRes.data.analytics);
            if (settingsRes.data.settings) setSystemSettings(settingsRes.data.settings);
        } catch (error) {
            console.error('Failed to load dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        const csvRows = ['Ticket ID,Student ID,Category,Status,Priority,Date'];
        tickets.forEach(t => {
            csvRows.push(`${t._id},${t.studentId},${t.category},${t.status},${t.priority},${t.createdAt}`);
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'tickets_export.csv'; a.click();
    };

    // Feature Toggles
    const handleAddFeature = async (targetRole) => {
        if (!newFeatureName) return;
        try { await api.post('/admin/features', { name: newFeatureName, targetRole }); setNewFeatureName(''); loadData(); } catch { toast.error('Failed to add feature'); }
    };
    const handleToggleFeature = async (id) => {
        try { await api.put(`/admin/features/${id}/toggle`); loadData(); } catch { }
    };
    const handleDeleteFeature = async (id) => {
        if (!window.confirm('Delete feature toggle permanently?')) return;
        try { await api.delete(`/admin/features/${id}`); loadData(); } catch { }
    };

    // ─── Tickets Tab ───
    const renderTickets = () => {
        const filteredTickets = tickets.filter(t => {
            const matchStatus = ticketFilterStatus === 'all' || t.status === ticketFilterStatus;
            const matchCat = ticketFilterCategory === 'all' || t.category === ticketFilterCategory;
            const matchDate = !ticketFilterDate || new Date(t.createdAt).toISOString().startsWith(ticketFilterDate);
            return matchStatus && matchCat && matchDate;
        });

        const STATUS_COLORS = { open: ['#dbeafe', '#1d4ed8'], 'in-progress': ['#fef9c3', '#a16207'], resolved: ['#dcfce7', '#15803d'], closed: ['#f1f5f9', '#64748b'] };
        const PRIORITY_COLORS = { urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981', med: '#f59e0b' };

        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>🎫 Global Ticket Oversight</h2>
                        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{filteredTickets.length} tickets shown</span>
                    </div>
                    <button onClick={handleExportCSV} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaDownload /> Export CSV
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Total', value: tickets.length, color: '#6366f1', bg: '#eef2ff' },
                        { label: 'Open', value: tickets.filter(t => t.status === 'open').length, color: '#0ea5e9', bg: '#f0f9ff' },
                        { label: 'In Progress', value: tickets.filter(t => t.status === 'in-progress').length, color: '#f59e0b', bg: '#fffbeb' },
                        { label: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length, color: '#10b981', bg: '#f0fdf4' },
                    ].map(s => (
                        <div key={s.label} style={{ padding: '8px 16px', borderRadius: 10, background: s.bg, color: s.color, fontWeight: 700, fontSize: '0.82rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.1rem' }}>{s.value}</span>
                            <span style={{ opacity: 0.7 }}>{s.label}</span>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', background: '#fff', padding: '1rem', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                    <select style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: '0.87rem', color: '#475569', outline: 'none' }}
                        value={ticketFilterStatus} onChange={e => setTicketFilterStatus(e.target.value)}>
                        <option value="all">Any Status</option>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                    <select style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: '0.87rem', color: '#475569', outline: 'none' }}
                        value={ticketFilterCategory} onChange={e => setTicketFilterCategory(e.target.value)}>
                        <option value="all">Any Category</option>
                        {(systemSettings?.ticketCategories || []).map(cat => (
                            <option key={cat.id} value={cat.name.toLowerCase().replace(/ /g, '-')}>{cat.name}</option>
                        ))}
                    </select>
                    <input type="date" value={ticketFilterDate} onChange={e => setTicketFilterDate(e.target.value)}
                        style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: '0.87rem', color: '#475569', outline: 'none' }} />
                    <button onClick={() => { setTicketFilterStatus('all'); setTicketFilterCategory('all'); setTicketFilterDate(''); }}
                        style={{ padding: '8px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
                        Clear
                    </button>
                </div>

                <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                {['Ticket ID', 'Student', 'Category', 'Subject', 'Status', 'Priority', 'Assigned', 'Date', 'Action'].map(h => (
                                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.length === 0
                                ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No tickets found.</td></tr>
                                : filteredTickets.map((t, i) => {
                                    const [sBg, sFg] = STATUS_COLORS[t.status] || STATUS_COLORS.open;
                                    const pColor = PRIORITY_COLORS[t.priority] || '#64748b';
                                    return (
                                        <tr key={t._id} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>#TICK-{t._id.slice(-4).toUpperCase()}</td>
                                            <td style={{ padding: '10px 14px', color: '#475569', fontWeight: 500 }}>{t.studentId}</td>
                                            <td style={{ padding: '10px 14px', color: '#64748b' }}>{t.category}</td>
                                            <td style={{ padding: '10px 14px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#0f172a', fontWeight: 500 }}>{t.title}</td>
                                            <td style={{ padding: '10px 14px' }}>
                                                <span style={{ background: sBg, color: sFg, padding: '2px 9px', borderRadius: 999, fontSize: '0.73rem', fontWeight: 700 }}>{t.status}</span>
                                            </td>
                                            <td style={{ padding: '10px 14px' }}>
                                                <span style={{ color: pColor, fontWeight: 700, fontSize: '0.78rem', textTransform: 'capitalize' }}>● {t.priority}</span>
                                            </td>
                                            <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.82rem' }}>{t.assignedTo ? t.assignedTo.name : <span style={{ color: '#ef4444', fontWeight: 600 }}>Unassigned</span>}</td>
                                            <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.78rem' }}>{new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                                            <td style={{ padding: '10px 14px' }}>
                                                <button onClick={() => { setSelectedTicket(t); setShowTicketModal(true); }}
                                                    style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: '#eef2ff', color: '#6366f1', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <FaEye /> View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // ─── Knowledge Base ───
    const renderKnowledge = () => <AdminKnowledgeBase />;

    // ─── Reports ───
    const renderReports = () => {
        const last7Days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().split('T')[0]; }).reverse();
        const dailyCounts = last7Days.map(dateStr => tickets.filter(t => t.createdAt && t.createdAt.startsWith(dateStr)).length);
        const catMap = {};
        tickets.forEach(t => { const c = t.category || 'other'; catMap[c] = (catMap[c] || 0) + 1; });
        const avgResolution = analytics?.overview?.avgResolutionDays || 0;
        const agentPerf = analytics?.agentPerformance || {};

        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>📊 Reports & Analytics</h2>
                        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>System-wide performance insights</span>
                    </div>
                    <button onClick={handleExportCSV} id="admin-export-csv"
                        style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaDownload /> Export CSV
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                        { icon: '🎫', label: 'Total Tickets', value: tickets.length, color: '#6366f1' },
                        { icon: '✅', label: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length, color: '#10b981' },
                        { icon: '⏱️', label: 'Avg Resolution', value: `${avgResolution.toFixed(1)}d`, color: '#8b5cf6' },
                        { icon: '👥', label: 'Total Users', value: students.length + tpcUsers.length, color: '#f59e0b' },
                    ].map(c => (
                        <div key={c.label} style={{ background: '#fff', borderRadius: 14, padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>{c.icon}</div>
                            <div>
                                <div style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: 14, padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                        <h6 style={{ fontWeight: 700, marginBottom: '1rem' }}>📈 Tickets Last 7 Days</h6>
                        <div style={{ height: 220 }}>
                            <Bar data={{ labels: last7Days.map(d => d.slice(5)), datasets: [{ label: 'Tickets', data: dailyCounts, backgroundColor: (ctx) => { const g = ctx.chart.ctx.createLinearGradient(0,0,0,180); g.addColorStop(0,'rgba(99,102,241,0.9)'); g.addColorStop(1,'rgba(99,102,241,0.3)'); return g; }, borderRadius: 6 }] }}
                                options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } }} />
                        </div>
                    </div>
                    <div style={{ background: '#fff', borderRadius: 14, padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                        <h6 style={{ fontWeight: 700, marginBottom: '1rem' }}>🍩 Category Split</h6>
                        <div style={{ height: 220, display: 'flex', justifyContent: 'center' }}>
                            <Doughnut data={{ labels: Object.keys(catMap).map(c => c.slice(0, 10)), datasets: [{ data: Object.values(catMap), backgroundColor: ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'], borderWidth: 0, cutout: '70%' }] }}
                                options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8, font: { size: 10 } } } } }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ─── Audit Logs ───
    const renderAuditLogs = () => {
        const logs = [];
        tickets.forEach(t => {
            logs.push({ id: t._id, time: t.createdAt, user: t.studentId, action: 'Ticket Created', detail: t.title?.slice(0, 40), type: 'create' });
            if (t.assignedTo) logs.push({ id: t._id + 'a', time: t.updatedAt, user: t.assignedTo?.name || 'TPC', action: 'Ticket Assigned', detail: `#${t._id.slice(-5).toUpperCase()}`, type: 'assign' });
            if (t.status === 'resolved') logs.push({ id: t._id + 'r', time: t.resolvedAt || t.updatedAt, user: t.assignedTo?.name || 'TPC', action: 'Ticket Resolved', detail: `#${t._id.slice(-5).toUpperCase()}`, type: 'resolve' });
            if (t.isEscalated) logs.push({ id: t._id + 'e', time: t.updatedAt, user: 'System', action: 'Ticket Escalated', detail: `#${t._id.slice(-5).toUpperCase()} — SLA breach`, type: 'escalate' });
        });
        logs.sort((a, b) => new Date(b.time) - new Date(a.time));
        const TC = { create: '#6366f1', assign: '#8b5cf6', resolve: '#10b981', escalate: '#ef4444' };
        const TI = { create: '📝', assign: '👤', resolve: '✅', escalate: '⚡' };

        return (
            <div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>📑 Audit Logs</h2>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{logs.length} activity events tracked from ticket data</span>
                </div>
                <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    {['Time', 'User / System', 'Action', 'Detail', 'Type'].map(h => (
                                        <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.73rem', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {logs.slice(0, 50).map((log, i) => (
                                    <tr key={log.id + i} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                                        <td style={{ padding: '9px 14px', color: '#64748b', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>{new Date(log.time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                                        <td style={{ padding: '9px 14px', fontWeight: 600, color: '#0f172a' }}>{log.user}</td>
                                        <td style={{ padding: '9px 14px', fontWeight: 600, color: TC[log.type] || '#374151' }}>{TI[log.type]} {log.action}</td>
                                        <td style={{ padding: '9px 14px', color: '#475569', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.detail}</td>
                                        <td style={{ padding: '9px 14px' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: TC[log.type], background: `${TC[log.type]}15`, padding: '2px 8px', borderRadius: 999 }}>{log.type?.toUpperCase()}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // ─── Feature Toggles ───
    const renderFeatureSettings = () => {
        const tpcFeatures = [
            { icon: '📋', name: 'Ticket Management', sub: 'View and manage all tickets', type: 'Edit' },
            { icon: '👤', name: 'Ticket Assignment', sub: 'Assign tickets to self', req: 'Requires "Ticket Management"' },
            { icon: '📝', name: 'Internal Notes', sub: 'Private staff notes', type: 'EditRemove' },
            { icon: '🔄', name: 'Status Workflow', sub: 'Change ticket status', type: 'Edit' },
            { icon: '⏱️', name: 'SLA Tracking', sub: 'Response time monitoring', type: 'Configure' },
            { icon: '⬆️', name: 'Escalation', sub: 'Escalate to admin', type: 'Edit' },
            { icon: '📊', name: 'Analytics', sub: 'View reports and charts', type: 'EditRemove' },
            { icon: '📢', name: 'Announcements', sub: 'Create/publish announcements', type: 'Edit' },
        ];
        const studentFeatures = [
            { icon: '🎫', name: 'Submit Ticket', sub: 'Raise new support requests', type: 'Edit' },
            { icon: '📄', name: 'View Ticket History', sub: 'Track previously raised tickets', type: 'Edit' },
            { icon: '💬', name: 'Ticket Comments', sub: 'Add follow-up comments', type: 'EditRemove' },
            { icon: '🔔', name: 'Email Notifications', sub: 'Notify on ticket updates', type: 'Configure' },
            { icon: '📁', name: 'File Attachments', sub: 'Upload supporting files', type: 'Edit' },
            { icon: '⭐', name: 'Feedback & Rating', sub: 'Rate resolved tickets', type: 'EditRemove' },
            { icon: '👤', name: 'Profile Management', sub: 'Edit personal info', type: 'Edit' },
        ];
        const advancedFeatures = [
            { icon: '🔐', name: 'Two-Factor Auth', sub: 'Enforce 2FA for all logins', type: 'Configure' },
            { icon: '🕒', name: 'Session Timeout', sub: 'Auto logout after inactivity', type: 'Configure' },
            { icon: '📦', name: 'Data Archiving', sub: 'Archive old resolved tickets', type: 'Edit' },
            { icon: '🛡️', name: 'IP Whitelisting', sub: 'Restrict login by IP range', type: 'Configure' },
            { icon: '🌐', name: 'API Access', sub: 'Enable external API integrations', type: 'EditRemove' },
            { icon: '⚙️', name: 'Maintenance Mode', sub: 'Take portal offline for updates', type: 'Configure' },
        ];

        const tabStyle = (tab) => ({
            paddingBottom: '0.5rem', cursor: 'pointer',
            color: settingsTab === tab ? '#6366f1' : '#64748b',
            fontWeight: settingsTab === tab ? 700 : 500,
            borderBottom: settingsTab === tab ? '3px solid #6366f1' : '3px solid transparent',
            marginBottom: '-1px', fontSize: '0.9rem',
        });

        const featureMap = {
            tpc: { list: tpcFeatures, title: 'TPC Staff Features', desc: 'Manage features available to TPC staff' },
            student: { list: studentFeatures, title: 'Student Portal Features', desc: 'Control what students can access and do' },
            advanced: { list: advancedFeatures, title: 'Advanced System Settings', desc: 'Security, integrations & system-level controls' },
        };
        const current = featureMap[settingsTab];

        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>🎛️ Feature Management</h2>
                        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Configure portal capabilities and access controls</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1.5rem', marginTop: '1.25rem' }}>
                    <div style={tabStyle('student')} onClick={() => setSettingsTab('student')}>Student Portal</div>
                    <div style={tabStyle('tpc')} onClick={() => setSettingsTab('tpc')}>TPC Staff</div>
                    <div style={tabStyle('advanced')} onClick={() => setSettingsTab('advanced')}>Advanced</div>
                </div>

                <h5 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>{current.title}</h5>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{current.desc}</p>

                <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                    {current.list.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', borderBottom: '1px solid #f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                <span style={{ width: 28, marginRight: '0.875rem', fontSize: '1.2rem', display: 'flex', justifyContent: 'center' }}>{item.icon}</span>
                                <span style={{ width: 200, fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>{item.name}</span>
                                <span style={{ color: '#64748b', fontSize: '0.82rem' }}>{item.sub}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {item.req && <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginRight: '0.5rem' }}>{item.req}</span>}
                                <Form.Check type="switch" id={`switch-${settingsTab}-${idx}`} checked={!item.inactive} onChange={() => { }} style={{ transform: 'scale(1.1)' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
            <div className="spinner-border text-primary" style={{ width: '2.5rem', height: '2.5rem' }} />
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading Admin Control Center...</span>
        </div>
    );

    return (
        <AdminLayout
            pageTitle={activeTab === 'overview' ? 'Admin Dashboard' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            systemSettings={systemSettings}
        >
            <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: '100vh' }}>
                {activeTab === 'overview' && (
                    <AdminOverview
                        analytics={analytics}
                        tickets={tickets}
                        onExport={handleExportCSV}
                    />
                )}
                {activeTab === 'users' && (
                    <AdminUsers
                        students={students}
                        tpcUsers={tpcUsers}
                        onRefresh={loadData}
                    />
                )}
                {activeTab === 'tickets' && renderTickets()}
                {activeTab === 'knowledge' && <AdminKnowledgeBase />}
                {activeTab === 'reports' && renderReports()}
                {activeTab === 'audit' && renderAuditLogs()}
                {activeTab === 'settings' && systemSettings && (
                    <AdminSettings
                        settings={systemSettings}
                        onSettingsChange={setSystemSettings}
                    />
                )}
                {activeTab === 'features' && renderFeatureSettings()}
                {activeTab === 'security' && (
                    <AdminSettings
                        settings={systemSettings || {}}
                        onSettingsChange={setSystemSettings}
                    />
                )}
            </div>

            {/* Ticket View Modal — Premium Case Panel */}
            <Modal show={showTicketModal} onHide={() => setShowTicketModal(false)} size="xl" centered dialogClassName="admin-ticket-modal">
                <Modal.Body style={{ padding: 0, borderRadius: 16, overflow: 'hidden' }}>
                    {selectedTicket && (() => {
                        const t = selectedTicket;
                        const STATUS_META = {
                            open:        { color: '#3b82f6', bg: '#eff6ff', label: 'Open',        icon: '🔵' },
                            'in-progress':{ color: '#f59e0b', bg: '#fffbeb', label: 'In Progress', icon: '🟡' },
                            resolved:    { color: '#10b981', bg: '#f0fdf4', label: 'Resolved',     icon: '🟢' },
                            closed:      { color: '#64748b', bg: '#f8fafc', label: 'Closed',       icon: '⚫' },
                        };
                        const PRIORITY_META = {
                            urgent: { color: '#ef4444', label: 'Urgent' },
                            high:   { color: '#f97316', label: 'High'   },
                            medium: { color: '#f59e0b', label: 'Medium' },
                            low:    { color: '#10b981', label: 'Low'    },
                            med:    { color: '#f59e0b', label: 'Medium' },
                        };
                        const sm = STATUS_META[t.status] || STATUS_META.open;
                        const pm = PRIORITY_META[t.priority] || PRIORITY_META.medium;
                        const agent = t.assignedTo;
                        const agentInitial = agent?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
                        const responses = t.responses || [];

                        // Build timeline events
                        const events = [
                            { icon: '📝', color: '#6366f1', label: 'Ticket Created',    time: t.createdAt,    user: t.studentId, desc: 'Student submitted a new support request' },
                            agent ? { icon: '👤', color: '#0ea5e9', label: 'Assigned to Agent',  time: t.updatedAt,    user: agent.name,  desc: `Routed to ${agent.name} for handling` } : null,
                            t.status === 'in-progress' || t.status === 'resolved' || t.status === 'closed'
                                ? { icon: '⚙️', color: '#f59e0b', label: 'Work In Progress',  time: t.updatedAt,    user: agent?.name || 'TPC', desc: 'Agent has started working on this case' } : null,
                            t.isEscalated ? { icon: '⚡', color: '#ef4444', label: 'Escalated',          time: t.updatedAt,    user: 'System',    desc: t.escalationReason || 'SLA breach — escalated to admin' } : null,
                            (t.status === 'resolved' || t.status === 'closed')
                                ? { icon: '✅', color: '#10b981', label: 'Case Resolved',      time: t.resolvedAt || t.updatedAt, user: agent?.name || 'TPC', desc: t.tpcResponse?.slice(0, 60) || 'Ticket resolved successfully' } : null,
                        ].filter(Boolean);

                        const slaConfig = { 'on-track': { color: '#10b981', bg: '#f0fdf4', label: 'On Track', icon: '🟢' }, 'at-risk': { color: '#f59e0b', bg: '#fffbeb', label: 'At Risk', icon: '🟡' }, breached: { color: '#ef4444', bg: '#fef2f2', label: 'Breached', icon: '🔴' } };
                        const sla = slaConfig[t.slaStatus] || slaConfig['on-track'];

                        return (
                            <div>
                                <style>{`
                                    .admin-ticket-modal .modal-dialog { max-width: 860px; }
                                    .atm-section { background:#fff; border:1px solid #f1f5f9; border-radius:12px; overflow:hidden; margin-bottom:1rem; }
                                    .atm-section-header { padding:0.75rem 1.1rem; background:#f8fafc; border-bottom:1px solid #f1f5f9; font-weight:700; font-size:0.83rem; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; display:flex; align-items:center; gap:0.4rem; }
                                    .atm-event { display:flex; gap:0.875rem; padding:0.75rem 1.1rem; border-bottom:1px solid #f8fafc; position:relative; }
                                    .atm-event:last-child { border-bottom:none; }
                                    .atm-event-dot { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.9rem; flex-shrink:0; margin-top:2px; }
                                    .atm-bubble-student { background:linear-gradient(135deg,#6366f1,#818cf8); color:#fff; border-radius:14px 14px 14px 2px; padding:0.6rem 0.875rem; font-size:0.86rem; max-width:100%; }
                                    .atm-bubble-tpc, .atm-bubble-admin { background:#f1f5f9; color:#0f172a; border-radius:14px 14px 2px 14px; padding:0.6rem 0.875rem; font-size:0.86rem; max-width:100%; }
                                `}</style>

                                {/* ─ TOP HEADER BAR ─ */}
                                <div style={{ background: `linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)`, padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                                            CASE #{t._id.slice(-6).toUpperCase()} · {t.category?.replace(/-/g, ' ')?.toUpperCase()}
                                        </div>
                                        <h4 style={{ color: '#fff', margin: 0, fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.3 }}>{t.title}</h4>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                                            <span style={{ padding: '3px 12px', borderRadius: 999, fontWeight: 700, fontSize: '0.75rem', background: sm.bg, color: sm.color }}>
                                                {sm.icon} {sm.label}
                                            </span>
                                            <span style={{ padding: '3px 12px', borderRadius: 999, fontWeight: 700, fontSize: '0.75rem', background: `${pm.color}22`, color: pm.color }}>
                                                ● {pm.label} Priority
                                            </span>
                                            {t.isEscalated && <span style={{ padding: '3px 12px', borderRadius: 999, fontWeight: 700, fontSize: '0.75rem', background: '#fef2f2', color: '#ef4444' }}>⚡ Escalated</span>}
                                            <span style={{ padding: '3px 12px', borderRadius: 999, fontWeight: 700, fontSize: '0.75rem', background: sla.bg, color: sla.color }}>
                                                {sla.icon} SLA: {sla.label}
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowTicketModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                </div>

                                <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem', alignItems: 'start' }}>

                                        {/* ─ LEFT COLUMN ─ */}
                                        <div>
                                            {/* Problem Description */}
                                            <div className="atm-section">
                                                <div className="atm-section-header">📋 Problem Description</div>
                                                <div style={{ padding: '1rem 1.1rem', color: '#475569', fontSize: '0.88rem', lineHeight: 1.7 }}>{t.description}</div>
                                            </div>

                                            {/* Case Timeline */}
                                            <div className="atm-section">
                                                <div className="atm-section-header">⚡ Case Activity Timeline</div>
                                                {events.map((ev, i) => (
                                                    <div key={i} className="atm-event">
                                                        <div className="atm-event-dot" style={{ background: `${ev.color}18` }}>
                                                            <span>{ev.icon}</span>
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                                                                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.86rem' }}>{ev.label}</span>
                                                                <span style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: 8 }}>
                                                                    {ev.time ? new Date(ev.time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                                                                </span>
                                                            </div>
                                                            <div style={{ fontSize: '0.79rem', color: '#64748b', marginBottom: 2 }}>{ev.desc}</div>
                                                            <div style={{ fontSize: '0.73rem', color: ev.color, fontWeight: 600 }}>by {ev.user}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Conversation Thread */}
                                            {responses.length > 0 && (
                                                <div className="atm-section">
                                                    <div className="atm-section-header">💬 Conversation Thread ({responses.length})</div>
                                                    <div style={{ padding: '0.875rem 1.1rem', maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                        {responses.map((r, i) => {
                                                            const isStudent = r.senderRole === 'student';
                                                            return (
                                                                <div key={i} style={{ display: 'flex', gap: '0.6rem', flexDirection: isStudent ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                                                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: isStudent ? 'linear-gradient(135deg,#6366f1,#818cf8)' : '#e2e8f0', color: isStudent ? '#fff' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.72rem', flexShrink: 0 }}>
                                                                        {(r.senderName || 'U').charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div style={{ maxWidth: '72%' }}>
                                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: 3, textAlign: isStudent ? 'right' : 'left' }}>
                                                                            {isStudent ? t.studentId : r.senderName || 'TPC'} · {new Date(r.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                        </div>
                                                                        <div className={`atm-bubble-${r.senderRole || 'tpc'}`}>{r.message}</div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Resolution */}
                                            {t.tpcResponse && (
                                                <div className="atm-section">
                                                    <div className="atm-section-header" style={{ color: '#10b981' }}>✅ Resolution Notes</div>
                                                    <div style={{ padding: '1rem 1.1rem' }}>
                                                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '0.875rem 1rem', color: '#166534', fontSize: '0.87rem', lineHeight: 1.65 }}>
                                                            {t.tpcResponse}
                                                        </div>
                                                        {agent && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.75rem', fontSize: '0.78rem', color: '#64748b' }}>
                                                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.65rem' }}>
                                                                    {agentInitial}
                                                                </div>
                                                                Resolved by <strong style={{ color: '#0f172a' }}>{agent.name}</strong>
                                                                {t.resolvedAt && <span>on {new Date(t.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* ─ RIGHT COLUMN ─ */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                            {/* Case Handler Card */}
                                            <div className="atm-section">
                                                <div className="atm-section-header">🧑‍💼 Case Handler</div>
                                                <div style={{ padding: '1.1rem', textAlign: 'center' }}>
                                                    {agent ? (
                                                        <>
                                                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.3rem', margin: '0 auto 0.75rem', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
                                                                {agent.profilePhoto ? <img src={agent.profilePhoto} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" /> : agentInitial}
                                                            </div>
                                                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{agent.name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>TPC Staff · {agent.department?.toUpperCase() || 'General'}</div>
                                                            <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: 8 }}>
                                                                {[
                                                                    { label: 'Staff ID', value: agent.studentId || '—' },
                                                                    { label: 'Email',    value: agent.email || '—' },
                                                                ].map(i => (
                                                                    <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '0.73rem' }}>
                                                                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>{i.label}</span>
                                                                        <span style={{ color: '#475569', fontWeight: 600, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>{i.value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div style={{ marginTop: '0.5rem' }}>
                                                                <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: 999, background: t.status === 'resolved' ? '#f0fdf4' : '#fffbeb', color: t.status === 'resolved' ? '#15803d' : '#a16207', fontWeight: 700 }}>
                                                                    {t.status === 'resolved' ? '✅ Resolved this case' : '⚙️ Actively handling'}
                                                                </span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                                                            <div style={{ fontSize: '2rem', marginBottom: 8 }}>⏳</div>
                                                            Awaiting assignment
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Ticket Meta */}
                                            <div className="atm-section">
                                                <div className="atm-section-header">📌 Case Details</div>
                                                <div style={{ padding: '0.75rem 1.1rem' }}>
                                                    {[
                                                        { label: 'Student ID',  value: t.studentId },
                                                        { label: 'Category',    value: t.category?.replace(/-/g, ' ') },
                                                        { label: 'Department',  value: t.department?.toUpperCase() || 'N/A' },
                                                        { label: 'Created',     value: new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) },
                                                        { label: 'Updated',     value: new Date(t.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) },
                                                        ...(t.resolvedAt ? [{ label: 'Resolved', value: new Date(t.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) }] : []),
                                                    ].map(i => (
                                                        <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f8fafc', fontSize: '0.78rem' }}>
                                                            <span style={{ color: '#94a3b8', fontWeight: 600 }}>{i.label}</span>
                                                            <span style={{ color: '#0f172a', fontWeight: 600, textAlign: 'right', maxWidth: 130, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Feedback */}
                                            {t.feedback?.rating && (
                                                <div className="atm-section">
                                                    <div className="atm-section-header">⭐ Student Feedback</div>
                                                    <div style={{ padding: '0.875rem 1.1rem', textAlign: 'center' }}>
                                                        <div style={{ fontSize: '1.4rem', color: '#f59e0b' }}>{'★'.repeat(t.feedback.rating)}{'☆'.repeat(5 - t.feedback.rating)}</div>
                                                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>{t.feedback.comment || 'No comment provided'}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </Modal.Body>
            </Modal>
        </AdminLayout>
    );
};

export default AdminDashboard;
