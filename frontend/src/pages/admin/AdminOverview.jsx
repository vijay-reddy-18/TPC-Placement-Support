import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { FaDownload, FaTicketAlt, FaUsers, FaClock, FaExclamationTriangle, FaArrowUp, FaArrowDown, FaFireAlt } from 'react-icons/fa';

const chartDefaults = {
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f1f5f9', drawBorder: false }, ticks: { color: '#94a3b8', fontSize: 11 } },
    x: { grid: { display: false }, ticks: { color: '#94a3b8', fontSize: 11 } }
  }
};

const PRIORITIES_ORDER = ['urgent', 'high', 'medium', 'low'];
const PRIORITY_COLORS = { urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' };

export default function AdminOverview({ analytics, tickets, onExport }) {
  const [timeRange, setTimeRange] = useState('7d');

  const ov = analytics?.overview || {};
  const {
    total = 0, resolved = 0, open = 0, inProgress = 0,
    avgResolutionDays = 0, slaBreachRate = 0,
    totalStudents = 0, totalTpc = 0, breached = 0, escalated = 0,
  } = ov;

  const ticketsLast7 = analytics?.ticketsLast7 || [];
  const catDist = analytics?.categoryDistribution || {};
  const agentPerf = analytics?.agentPerformance || {};
  const monthlyTrend = analytics?.monthlyTrend || [];
  const priorityDist = analytics?.priorityDistribution || {};

  // Build chart data
  const days7Labels = ticketsLast7.map(d => d.date.slice(5));
  const days7Data = ticketsLast7.map(d => d.count);

  const monthlyLabels = monthlyTrend.map(m => m.label);
  const monthlyData = monthlyTrend.map(m => m.count);

  const catLabels = Object.keys(catDist).map(c => c.charAt(0).toUpperCase() + c.slice(1));
  const catData = Object.values(catDist);
  const catColors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

  const agentLabels = Object.keys(agentPerf);
  const agentData = Object.values(agentPerf);

  const resolveRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;

  const statCards = [
    {
      label: 'Total Tickets', value: total, icon: <FaTicketAlt />,
      sub: `${open} open`, subColor: '#3b82f6',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
      shadow: '0 8px 24px rgba(99,102,241,0.35)',
    },
    {
      label: 'Resolved', value: resolved, icon: '✅',
      sub: `${resolveRate}% resolution rate`, subColor: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      shadow: '0 8px 24px rgba(16,185,129,0.35)',
    },
    {
      label: 'Avg. Resolution', value: `${avgResolutionDays}d`, icon: <FaClock />,
      sub: `${inProgress} in progress`, subColor: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      shadow: '0 8px 24px rgba(245,158,11,0.35)',
    },
    {
      label: 'SLA Breach Rate', value: `${slaBreachRate}%`, icon: <FaExclamationTriangle />,
      sub: `${breached} breached`, subColor: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
      shadow: '0 8px 24px rgba(239,68,68,0.35)',
    },
    {
      label: 'Students', value: totalStudents, icon: '🎓',
      sub: `Total enrolled`, subColor: '#6366f1',
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
      shadow: '0 8px 24px rgba(14,165,233,0.35)',
    },
    {
      label: 'TPC Staff', value: totalTpc, icon: '👔',
      sub: `Active agents`, subColor: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
      shadow: '0 8px 24px rgba(139,92,246,0.35)',
    },
  ];

  return (
    <div>
      <style>{`
        .stat-card { transition: transform 0.2s, box-shadow 0.2s; cursor: default; }
        .stat-card:hover { transform: translateY(-3px); }
        .chart-card { background:#fff; border-radius:16px; padding:1.25rem 1.5rem; box-shadow:0 2px 12px rgba(0,0,0,0.06); border:1px solid #f1f5f9; }
      `}</style>

      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>System Overview</h2>
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Real-time metrics from the database</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 3, gap: 2 }}>
            {[{ v: '7d', label: '7 Days' }, { v: '30d', label: '30 Days' }, { v: '6m', label: '6 Months' }].map(t => (
              <button key={t.v} onClick={() => setTimeRange(t.v)}
                style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: timeRange === t.v ? '#fff' : 'transparent', color: timeRange === t.v ? '#6366f1' : '#64748b', fontWeight: timeRange === t.v ? 700 : 500, fontSize: '0.8rem', cursor: 'pointer', boxShadow: timeRange === t.v ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={onExport} style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#475569', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaDownload /> Export
          </button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {statCards.map((c, i) => (
          <div key={i} className="stat-card" style={{ borderRadius: 16, background: c.gradient, padding: '1.25rem', boxShadow: c.shadow, color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -10, top: -10, fontSize: '4rem', opacity: 0.15 }}>{typeof c.icon === 'string' ? c.icon : null}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.85, marginBottom: '0.5rem' }}>{c.label}</div>
              {typeof c.icon !== 'string' && <div style={{ opacity: 0.7, fontSize: '1.1rem' }}>{c.icon}</div>}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, marginBottom: '0.4rem' }}>{c.value}</div>
            <div style={{ fontSize: '0.77rem', opacity: 0.8 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Line/Bar Chart — tickets over time */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h6 style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>📈 Ticket Volume</h6>
          </div>
          <div style={{ height: 220 }}>
            {timeRange === '6m'
              ? <Bar data={{
                  labels: monthlyLabels,
                  datasets: [{ label: 'Tickets', data: monthlyData, backgroundColor: (ctx) => {
                    const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
                    g.addColorStop(0, 'rgba(99,102,241,0.8)'); g.addColorStop(1, 'rgba(99,102,241,0.1)');
                    return g;
                  }, borderRadius: 6 }]
                }} options={chartDefaults} />
              : <Line data={{
                  labels: days7Labels,
                  datasets: [{ label: 'Tickets', data: days7Data, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)', fill: true, tension: 0.4, pointBackgroundColor: '#6366f1', pointRadius: 5, pointHoverRadius: 7 }]
                }} options={{ ...chartDefaults, plugins: { legend: { display: false } } }} />
            }
          </div>
        </div>

        {/* Donut — Category */}
        <div className="chart-card">
          <h6 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>🍩 Categories</h6>
          <div style={{ height: 200, display: 'flex', justifyContent: 'center' }}>
            {catLabels.length > 0
              ? <Doughnut data={{ labels: catLabels, datasets: [{ data: catData, backgroundColor: catColors, borderWidth: 0, cutout: '70%', hoverOffset: 6 }] }}
                  options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8, font: { size: 10 }, color: '#475569' } } } }} />
              : <div style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>No data yet</div>
            }
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

        {/* Priority Distribution */}
        <div className="chart-card">
          <h6 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>🔥 Priority Breakdown</h6>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {PRIORITIES_ORDER.map(p => {
              const count = priorityDist[p] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={p}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 600, color: '#475569', textTransform: 'capitalize' }}>{p}</span>
                    <span style={{ fontWeight: 700, color: PRIORITY_COLORS[p] }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: PRIORITY_COLORS[p], borderRadius: 99, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agent Performance */}
        <div className="chart-card">
          <h6 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>👤 Agent Performance</h6>
          {agentLabels.length > 0
            ? <div style={{ height: 160 }}>
                <Bar data={{ labels: agentLabels, datasets: [{ label: 'Resolved', data: agentData, backgroundColor: '#10b981', borderRadius: 6, hoverBackgroundColor: '#059669' }] }}
                  options={{ ...chartDefaults, plugins: { legend: { display: false } } }} />
              </div>
            : <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>No resolutions yet</div>
          }
        </div>
      </div>

      {/* Recent Tickets */}
      {tickets.length > 0 && (
        <div className="chart-card">
          <h6 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>🎫 Recent Tickets</h6>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['ID', 'Title', 'Student', 'Status', 'Priority', 'Date'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.slice(0, 8).map((t, i) => {
                  const sc = { open: ['#dbeafe', '#1d4ed8'], 'in-progress': ['#fef9c3', '#a16207'], resolved: ['#dcfce7', '#15803d'], closed: ['#f1f5f9', '#64748b'] };
                  const pc = { urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981', med: '#f59e0b' };
                  const [sBg, sFg] = sc[t.status] || sc.open;
                  return (
                    <tr key={t._id} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ padding: '9px 12px', fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>#TICK-{t._id.slice(-4).toUpperCase()}</td>
                      <td style={{ padding: '9px 12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#0f172a', fontWeight: 500 }}>{t.title}</td>
                      <td style={{ padding: '9px 12px', color: '#64748b' }}>{t.studentId}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ background: sBg, color: sFg, padding: '2px 9px', borderRadius: 999, fontSize: '0.73rem', fontWeight: 700 }}>{t.status}</span>
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ color: pc[t.priority] || '#64748b', fontWeight: 700, fontSize: '0.8rem', textTransform: 'capitalize' }}>● {t.priority}</span>
                      </td>
                      <td style={{ padding: '9px 12px', color: '#94a3b8', fontSize: '0.78rem' }}>{new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
