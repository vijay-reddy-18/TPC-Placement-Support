import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { FaDownload } from 'react-icons/fa';
import TPCLayout from '../components/TPCLayout';
import { ticketAPI } from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler);

const TPCAnalyticsPage = () => {
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [categoryAnalytics, setCategoryAnalytics] = useState([]);
    const [weeklyTrends, setWeeklyTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('week');

    useEffect(() => { loadAnalytics(); }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const [ticketsRes, statsRes, categoryRes, trendsRes, slaRes] = await Promise.all([
                ticketAPI.getAllTickets(null, null, null, 1, 1000),
                ticketAPI.getDashboardStats(),
                ticketAPI.getCategoryAnalytics(),
                ticketAPI.getWeeklyTrends(),
                ticketAPI.getSLADashboard().catch(() => ({ data: { slaMetrics: {} } })),
            ]);
            setTickets(ticketsRes.data.tickets);
            setStats({ ...statsRes.data.stats, sla: slaRes.data.slaMetrics });
            setCategoryAnalytics(categoryRes.data.analytics);
            setWeeklyTrends(trendsRes.data.trends);
        } catch (err) { console.error('Analytics load failed:', err); }
        finally { setLoading(false); }
    };

    const resolved = stats?.resolvedTickets || 0;
    const total = stats?.totalTickets || tickets.length || 0;
    const pending = (stats?.openTickets || 0) + (stats?.inProgressTickets || 0);
    
    // Calculate avg response time from tickets if possible, otherwise use a placeholder
    const ticketsWithSLA = tickets.filter(t => t.resolvedAt || (t.responses && t.responses.length > 0));
    let avgResponseHours = 0;
    if (ticketsWithSLA.length > 0) {
        const totalHours = ticketsWithSLA.reduce((acc, t) => {
            const start = new Date(t.createdAt);
            const end = t.responses?.[0]?.timestamp ? new Date(t.responses[0].timestamp) : (t.resolvedAt ? new Date(t.resolvedAt) : new Date());
            return acc + (end - start) / (1000 * 60 * 60);
        }, 0);
        avgResponseHours = parseFloat((totalHours / ticketsWithSLA.length).toFixed(1));
    }
    
    const slaPercent = stats?.sla?.compliancePercentage || 0;
    const urgentPending = tickets.filter(t => t.priority === 'urgent' && (t.status === 'open' || t.status === 'in-progress')).length;

    // Ticket Trends from API
    const trendLabels = weeklyTrends.map(t => {
        const d = new Date(t._id);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const trendData = weeklyTrends.map(t => t.count);

    const trendLineData = {
        labels: trendLabels.length > 0 ? trendLabels : ['No Data'],
        datasets: [
            {
                label: 'New Tickets', 
                data: trendData.length > 0 ? trendData : [0],
                borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.05)',
                tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#22c55e',
                pointBorderColor: '#fff', pointBorderWidth: 2, borderWidth: 2.5,
            }
        ]
    };

    const trendOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 15, font: { size: 11, family: 'Inter' } }
            }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { font: { size: 11, family: 'Inter' }, color: '#9ca3af' } },
            x: { grid: { display: false }, ticks: { font: { size: 11, family: 'Inter' }, color: '#9ca3af' } }
        }
    };

    // Category Analytics Bar Chart
    const catLabels = categoryAnalytics.length > 0
        ? categoryAnalytics.map(c => c.category)
        : ['No Data'];
    const catColors = ['#2563eb', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'];
    const resTimeData = {
        labels: catLabels,
        datasets: [{
            label: 'Total Tickets',
            data: categoryAnalytics.length > 0 ? categoryAnalytics.map(c => c.total) : [0],
            backgroundColor: catColors.slice(0, catLabels.length),
            borderRadius: 6, borderWidth: 0, barThickness: 40,
        }]
    };

    const barOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, padding: 15, font: { size: 11, family: 'Inter' } } }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { font: { size: 11, family: 'Inter' }, color: '#9ca3af' } },
            x: { grid: { display: false }, ticks: { font: { size: 11, family: 'Inter' }, color: '#9ca3af' } }
        }
    };

    // Category donut
    const catDataValues = categoryAnalytics.length > 0
        ? categoryAnalytics.map(c => c.total) : [1];
    const catDonutLabels = categoryAnalytics.length > 0
        ? categoryAnalytics.map(c => c.category) : ['No Data'];
    const catTotal = catDataValues.reduce((a, b) => a + b, 0) || 1;

    const donutData = {
        labels: catDonutLabels,
        datasets: [{ data: catDataValues, backgroundColor: catColors.slice(0, catDonutLabels.length), borderWidth: 0, cutout: '65%' }]
    };
    const donutOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } }
    };

    // Performance metrics (Real data mapped from categories)
    const metrics = categoryAnalytics.map(c => ({
        name: c.category,
        current: c.resolved,
        target: c.total,
        trend: Math.round((c.resolved / (c.total || 1)) * 100) + '%',
        status: c.pending === 0 ? 'Resolved' : 'Pending'
    }));

    if (loading) {
        return (
            <TPCLayout pageTitle="Analytics & Reports" openTicketCount={0}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <p style={{ color: '#9ca3af' }}>Loading analytics...</p>
                </div>
            </TPCLayout>
        );
    }

    return (
        <TPCLayout pageTitle="Analytics & Reports" openTicketCount={pending}>
            {/* Time Range & Export */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                        value={timeRange} onChange={(e) => setTimeRange(e.target.value)}
                        style={{
                            padding: '0.45rem 0.85rem', borderRadius: 8, border: '1px solid #e5e7eb',
                            fontSize: '0.85rem', background: 'white', cursor: 'pointer', fontWeight: 500
                        }}
                    >
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                </div>
                <button className="tpc-btn tpc-btn-primary" style={{ gap: '0.4rem' }}>
                    <FaDownload style={{ fontSize: '0.75rem' }} /> Export Report
                </button>
            </div>

            {/* Stat Cards */}
            <div className="tpc-stats-row">
                <div className="tpc-stat-card green">
                    <div className="tpc-stat-info">
                        <h6>Total Resolved</h6>
                        <p className="tpc-stat-number">{resolved}</p>
                        <p className="tpc-stat-sub">✓ +8% resolution rate</p>
                    </div>
                    <div className="tpc-stat-icon">✅</div>
                </div>
                <div className="tpc-stat-card blue">
                    <div className="tpc-stat-info">
                        <h6>Avg Response Time</h6>
                        <p className="tpc-stat-number">{avgResponseHours} hours</p>
                        <p className="tpc-stat-sub">↓ -10% vs last week</p>
                    </div>
                    <div className="tpc-stat-icon">⏱</div>
                </div>
                <div className="tpc-stat-card purple">
                    <div className="tpc-stat-info">
                        <h6>SLA Compliance %</h6>
                        <p className="tpc-stat-number">{slaPercent}%</p>
                        <p className="tpc-stat-sub">↑ +2% this week</p>
                    </div>
                    <div className="tpc-stat-icon">🛡️</div>
                </div>
                <div className="tpc-stat-card red">
                    <div className="tpc-stat-info">
                        <h6>Pending Tickets</h6>
                        <p className="tpc-stat-number">{pending}</p>
                        <p className="tpc-stat-sub">🔔 {urgentPending} urgent</p>
                    </div>
                    <div className="tpc-stat-icon">📋</div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="tpc-charts-row" style={{ marginBottom: '1.25rem' }}>
                <div className="tpc-card">
                    <div className="tpc-card-header">
                        <h3 className="tpc-card-title">Ticket Trends</h3>
                    </div>
                    <div className="tpc-card-body" style={{ height: '280px' }}>
                        <Line data={trendLineData} options={trendOptions} />
                    </div>
                </div>
                <div className="tpc-card">
                    <div className="tpc-card-header">
                        <h3 className="tpc-card-title">Resolution Time</h3>
                    </div>
                    <div className="tpc-card-body" style={{ height: '280px' }}>
                        <Bar data={resTimeData} options={barOptions} />
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '1.25rem' }}>
                {/* Category Distribution */}
                <div className="tpc-card">
                    <div className="tpc-card-header">
                        <h3 className="tpc-card-title">Category Distribution</h3>
                    </div>
                    <div className="tpc-card-body" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ width: '140px', height: '140px', flexShrink: 0 }}>
                            <Doughnut data={donutData} options={donutOptions} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {catDonutLabels.map((label, i) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                                    <span style={{ width: 12, height: 12, borderRadius: 3, background: ['#2563eb', '#22c55e', '#f59e0b', '#8b5cf6'][i], flexShrink: 0 }} />
                                    <span style={{ color: '#374151', fontWeight: 500 }}>{label}</span>
                                    <span style={{ color: '#9ca3af', fontWeight: 600, marginLeft: 'auto' }}>
                                        {Math.round(catDataValues[i] / catTotal * 100)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="tpc-card">
                    <div className="tpc-card-header">
                        <h3 className="tpc-card-title">Performance Metrics</h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="tpc-table">
                            <thead>
                                <tr>
                                    <th>Metric</th>
                                    <th>Current Value</th>
                                    <th>Target</th>
                                    <th>Trend</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.map((m, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{m.name}</td>
                                        <td>{m.current}</td>
                                        <td style={{ color: '#6b7280' }}>{m.target}</td>
                                        <td style={{ color: '#6b7280' }}>{m.trend}</td>
                                        <td>
                                            <span style={{
                                                background: '#f0fdf4', color: '#16a34a',
                                                padding: '3px 10px', borderRadius: 6,
                                                fontSize: '0.72rem', fontWeight: 600
                                            }}>
                                                {m.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </TPCLayout>
    );
};

export default TPCAnalyticsPage;
