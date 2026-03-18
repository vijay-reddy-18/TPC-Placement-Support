import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import TPCLayout from '../components/TPCLayout';
import { useAuth } from '../context/AuthContext';
import { ticketAPI } from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

const TPCDashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [categoryAnalytics, setCategoryAnalytics] = useState([]);
    const [weeklyTrends, setWeeklyTrends] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const [ticketsRes, statsRes, categoryRes, trendsRes] = await Promise.all([
                ticketAPI.getAllTickets(null, null, null, 1, 1000),
                ticketAPI.getDashboardStats(),
                ticketAPI.getCategoryAnalytics(),
                ticketAPI.getWeeklyTrends(),
            ]);
            setTickets(ticketsRes.data.tickets);
            setStats(statsRes.data.stats);
            setCategoryAnalytics(categoryRes.data.analytics);
            setWeeklyTrends(trendsRes.data.trends);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const openCount = stats?.openTickets || 0;
    const urgentCount = tickets.filter(t => t.priority === 'urgent' && t.status === 'open').length;

    // Format current date
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Time ago helper
    const getTimeAgo = (date) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins} min ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    // Weekly Trends line chart
    const trendLabels = weeklyTrends.map(t => {
        const d = new Date(t._id);
        return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    });
    const trendData = weeklyTrends.map(t => t.count);

    const lineChartData = {
        labels: trendLabels.length > 0 ? trendLabels : ['No Data'],
        datasets: [{
            label: 'Tickets',
            data: trendData.length > 0 ? trendData : [0],
            fill: true,
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            borderColor: '#3b82f6',
            borderWidth: 2.5,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 6,
        }]
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#f3f4f6' },
                ticks: { font: { size: 11, family: 'Inter' }, color: '#9ca3af' }
            },
            x: {
                grid: { display: false },
                ticks: { font: { size: 11, family: 'Inter' }, color: '#9ca3af' }
            }
        }
    };

    // Category Breakdown donut
    const catColors = ['#2563eb', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'];
    const catLabels = categoryAnalytics.length > 0
        ? categoryAnalytics.map(c => c.category)
        : ['No Data'];
    const catDataValues = categoryAnalytics.length > 0
        ? categoryAnalytics.map(c => c.total)
        : [0];
    const catTotal = catDataValues.reduce((a, b) => a + b, 0) || 1;

    const donutData = {
        labels: catLabels,
        datasets: [{
            data: catDataValues,
            backgroundColor: catColors.slice(0, catLabels.length),
            borderWidth: 0,
            cutout: '65%',
        }]
    };

    const donutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.label}: ${ctx.parsed} (${Math.round(ctx.parsed / catTotal * 100)}%)`
                }
            }
        }
    };

    const getPriorityClass = (p) => {
        return p === 'urgent' || p === 'high' ? 'high' : p === 'medium' ? 'medium' : 'low';
    };

    const getStatusClass = (s) => {
        return s === 'open' ? 'open' : s === 'in-progress' ? 'in-progress' : s === 'resolved' ? 'resolved' : 'closed';
    };

    const recentTickets = tickets.slice(0, 5);
    const totalThisWeek = stats?.totalTickets || tickets.length;
    const resolutionRate = totalThisWeek > 0 ? Math.round((stats?.resolvedTickets || 0) / totalThisWeek * 100) : 0;

    if (loading) {
        return (
            <TPCLayout pageTitle="Support Dashboard" openTicketCount={0}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                        <p style={{ fontWeight: 500 }}>Loading dashboard...</p>
                    </div>
                </div>
            </TPCLayout>
        );
    }

    return (
        <TPCLayout pageTitle="TPC Support Dashboard" openTicketCount={openCount}>
            {/* Welcome Section */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
                    Welcome back, {user?.name || 'TPC Staff'}
                </h2>
                <p style={{ color: '#9ca3af', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{dateStr}</p>
            </div>

            {/* Stat Cards */}
            <div className="tpc-stats-row">
                <div className="tpc-stat-card blue">
                    <div className="tpc-stat-info">
                        <h6>Total Tickets</h6>
                        <p className="tpc-stat-number">{stats?.totalTickets || tickets.length}</p>
                        <p className="tpc-stat-sub">↑ +12% this week</p>
                    </div>
                    <div className="tpc-stat-icon">📋</div>
                </div>
                <div className="tpc-stat-card orange">
                    <div className="tpc-stat-info">
                        <h6>Open</h6>
                        <p className="tpc-stat-number">{openCount}</p>
                        <p className="tpc-stat-sub">
                            {urgentCount > 0 && <><span className="tpc-stat-badge">Urgent {urgentCount}</span></>}
                            {urgentCount === 0 && '⬇ Urgent'}
                        </p>
                    </div>
                    <div className="tpc-stat-icon">📨</div>
                </div>
                <div className="tpc-stat-card amber">
                    <div className="tpc-stat-info">
                        <h6>In Progress</h6>
                        <p className="tpc-stat-number">{stats?.inProgressTickets || 0}</p>
                        <p className="tpc-stat-sub">Active tickets</p>
                    </div>
                    <div className="tpc-stat-icon">⚙️</div>
                </div>
                <div className="tpc-stat-card green">
                    <div className="tpc-stat-info">
                        <h6>Resolved</h6>
                        <p className="tpc-stat-number">{stats?.resolvedTickets || 0}</p>
                        <p className="tpc-stat-sub">✓ +{resolutionRate}% resolution rate</p>
                    </div>
                    <div className="tpc-stat-icon">✅</div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="tpc-charts-row">
                {/* Weekly Trends */}
                <div className="tpc-card">
                    <div className="tpc-card-header">
                        <h3 className="tpc-card-title">Weekly Trends</h3>
                    </div>
                    <div className="tpc-card-body" style={{ height: '280px' }}>
                        <Line data={lineChartData} options={lineChartOptions} />
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="tpc-card">
                    <div className="tpc-card-header">
                        <h3 className="tpc-card-title">Category Breakdown</h3>
                    </div>
                    <div className="tpc-card-body" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ width: '160px', height: '160px', flexShrink: 0 }}>
                            <Doughnut data={donutData} options={donutOptions} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {catLabels.map((label, i) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                                    <span style={{
                                        width: 12, height: 12, borderRadius: 3,
                                        background: catColors[i], flexShrink: 0
                                    }} />
                                    <span style={{ color: '#374151', fontWeight: 500 }}>{label}</span>
                                    <span style={{ color: '#9ca3af', fontWeight: 600, marginLeft: 'auto' }}>
                                        {catTotal > 0 ? Math.round(catDataValues[i] / catTotal * 100) : 0}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Tickets */}
            <div className="tpc-card">
                <div className="tpc-card-header">
                    <h3 className="tpc-card-title">Recent Tickets</h3>
                    <span className="tpc-view-all" onClick={() => navigate('/tpc/tickets')}>View All</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="tpc-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Student</th>
                                <th>Subject</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Time Ago</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTickets.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No tickets yet</td></tr>
                            ) : (
                                recentTickets.map((t) => (
                                    <tr key={t._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/tpc/tickets/${t._id}`)}>
                                        <td style={{ fontWeight: 600 }}>#{t._id.slice(-4).toUpperCase()}</td>
                                        <td>{t.studentId}</td>
                                        <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</td>
                                        <td><span className={`tpc-badge ${getPriorityClass(t.priority)}`}>{t.priority?.charAt(0).toUpperCase() + t.priority?.slice(1)}</span></td>
                                        <td><span className={`tpc-badge ${getStatusClass(t.status)}`}>{t.status === 'in-progress' ? 'In Progress' : t.status?.charAt(0).toUpperCase() + t.status?.slice(1)}</span></td>
                                        <td className="tpc-time-ago">{getTimeAgo(t.createdAt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </TPCLayout>
    );
};

export default TPCDashboardPage;
