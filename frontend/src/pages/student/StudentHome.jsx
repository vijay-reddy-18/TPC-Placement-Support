import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketAPI } from '../../services/api';
import StudentLayout from '../../components/StudentLayout';

const CATEGORY_ICONS = {
  placement: '🏢', internship: '💼', document: '📄',
  'company-eligibility': '✅', 'offer-letter': '📝',
  'interview-schedule': '📅', other: '📌',
};

const statusLabel = (s) => ({
  open: 'Open', 'in-progress': 'In Progress', resolved: 'Resolved', closed: 'Closed'
}[s] || s);

const StatusBadge = ({ status }) => {
  const cls = { open: 'sp-badge-open', 'in-progress': 'sp-badge-progress', resolved: 'sp-badge-resolved', closed: 'sp-badge-closed' }[status] || 'sp-badge-closed';
  const dot = { open: '🔵', 'in-progress': '🟡', resolved: '🟢', closed: '⚫' }[status] || '';
  return <span className={`sp-badge ${cls}`}>{dot} {statusLabel(status)}</span>;
};

const StudentHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t] = await Promise.all([
          ticketAPI.getDashboardStats(),
          ticketAPI.getAllTickets(null, null, null, 1, 5),
        ]);
        setStats(s.data.stats);
        setTickets(t.data.tickets || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();

    // Auto-refresh every 30s
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const recentActivity = tickets.slice(0, 4).map((t) => ({
    icon: t.status === 'resolved' ? '✅' : t.status === 'in-progress' ? '⚙️' : t.status === 'closed' ? '🔒' : '🎫',
    text: `Ticket "${t.title.substring(0, 40)}${t.title.length > 40 ? '...' : ''}" is ${statusLabel(t.status)}`,
    time: new Date(t.updatedAt || t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    bg: t.status === 'resolved' ? '#ecfdf5' : t.status === 'in-progress' ? '#fffbeb' : '#eff6ff',
    ticketId: t._id,
  }));

  // Compute most common category
  const categoryCount = {};
  tickets.forEach((t) => { categoryCount[t.category] = (categoryCount[t.category] || 0) + 1; });
  const topCat = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'placement';

  return (
    <StudentLayout title={`${greeting}, ${user?.name?.split(' ')[0] || 'Student'} 👋`} subtitle="Here's what's happening with your tickets today">
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => <div key={i} className="sp-skeleton" style={{ height: 80, borderRadius: 12 }} />)}
        </div>
      ) : (
        <>
          {/* ---- Stat Cards ---- */}
          <div className="sp-stats-grid">
            {[
              { label: 'Total Tickets', value: stats?.totalTickets ?? 0, icon: '📋', cls: 'sp-stat-blue' },
              { label: 'Open Tickets',  value: stats?.openTickets ?? 0,  icon: '⚠️', cls: 'sp-stat-red' },
              { label: 'In Progress',   value: stats?.inProgressTickets ?? 0, icon: '⏳', cls: 'sp-stat-amber' },
              { label: 'Resolved',      value: stats?.resolvedTickets ?? 0,   icon: '✅', cls: 'sp-stat-green' },
            ].map((card) => (
              <div key={card.label} className={`sp-stat-card ${card.cls}`}>
                <div className="sp-stat-card-icon">{card.icon}</div>
                <div>
                  <div className="sp-stat-label">{card.label}</div>
                  <div className="sp-stat-value">{card.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ---- Smart Insights ---- */}
          <div className="sp-insight-grid" style={{ marginBottom: '1.75rem' }}>
            <div className="sp-insight-card">
              <div className="sp-insight-label">Top Category</div>
              <div className="sp-insight-value">{CATEGORY_ICONS[topCat] || '📌'} {topCat.replace(/-/g, ' ')}</div>
            </div>
            <div className="sp-insight-card" style={{ borderLeftColor: '#10b981' }}>
              <div className="sp-insight-label">Resolution Rate</div>
              <div className="sp-insight-value">
                {stats?.totalTickets
                  ? Math.round(((stats.resolvedTickets) / stats.totalTickets) * 100)
                  : 0}%
              </div>
            </div>
            <div className="sp-insight-card" style={{ borderLeftColor: '#f59e0b' }}>
              <div className="sp-insight-label">Active Issues</div>
              <div className="sp-insight-value">{(stats?.openTickets ?? 0) + (stats?.inProgressTickets ?? 0)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
            {/* ---- Quick Actions ---- */}
            <div className="sp-card">
              <div className="sp-card-header"><h3>⚡ Quick Actions</h3></div>
              <div className="sp-card-body">
                <div className="sp-quick-actions">
                  {[
                    { icon: '➕', label: 'Raise Ticket',  path: '/student/create-ticket', id: 'qa-raise' },
                    { icon: '📋', label: 'My Tickets',   path: '/student/tickets',       id: 'qa-tickets' },
                    { icon: '🔔', label: 'Notifications', path: '/student/notifications', id: 'qa-notif' },
                    { icon: '⭐', label: 'Feedback',      path: '/student/feedback',      id: 'qa-feedback' },
                    { icon: '❓', label: 'Help Center',   path: '/student/help',          id: 'qa-help' },
                    { icon: '👤', label: 'Profile',       path: '/student/profile',       id: 'qa-profile' },
                  ].map((a) => (
                    <button key={a.id} id={a.id} className="sp-quick-btn" onClick={() => navigate(a.path)}>
                      <span className="sp-quick-btn-icon">{a.icon}</span>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ---- Recent Activity ---- */}
            <div className="sp-card">
              <div className="sp-card-header">
                <h3>🕐 Recent Activity</h3>
                <button className="sp-btn sp-btn-ghost sp-btn-sm" onClick={() => navigate('/student/tickets')}>View All</button>
              </div>
              <div className="sp-card-body" style={{ padding: '0.75rem 1.5rem' }}>
                {recentActivity.length === 0 ? (
                  <div className="sp-empty" style={{ padding: '2rem' }}>
                    <div className="sp-empty-icon">📭</div>
                    <div className="sp-empty-sub">No recent activity</div>
                  </div>
                ) : (
                  recentActivity.map((a, i) => (
                    <div
                      key={i}
                      className="sp-activity-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/student/tickets/${a.ticketId}`)}
                    >
                      <div className="sp-activity-icon" style={{ background: a.bg }}>
                        {a.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="sp-activity-text">{a.text}</div>
                        <div className="sp-activity-time">{a.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ---- Recent Tickets Table ---- */}
          <div className="sp-card">
            <div className="sp-card-header">
              <h3>🎫 Recent Tickets</h3>
              <button className="sp-btn sp-btn-primary sp-btn-sm" onClick={() => navigate('/student/create-ticket')} id="home-raise-btn">
                ➕ Raise New
              </button>
            </div>
            {tickets.length === 0 ? (
              <div className="sp-empty">
                <div className="sp-empty-icon">🎫</div>
                <div className="sp-empty-title">No tickets yet</div>
                <div className="sp-empty-sub">Raise your first ticket and track it here</div>
                <button className="sp-btn sp-btn-primary" onClick={() => navigate('/student/create-ticket')}>
                  ➕ Create Ticket
                </button>
              </div>
            ) : (
              <div className="sp-table-wrap">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Subject</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t._id} onClick={() => navigate(`/student/tickets/${t._id}`)}>
                        <td><span className="sp-ticket-id">#{t._id.slice(-6).toUpperCase()}</span></td>
                        <td>
                          <div className="sp-ticket-title">{t.title}</div>
                          <div className="sp-ticket-desc">{t.description}</div>
                        </td>
                        <td><span className="sp-badge sp-badge-closed">{CATEGORY_ICONS[t.category] || '📌'} {t.category}</span></td>
                        <td><StatusBadge status={t.status} /></td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--sp-text-muted)' }}>
                          {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </StudentLayout>
  );
};

export default StudentHome;
