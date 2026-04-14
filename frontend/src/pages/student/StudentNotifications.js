import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../../services/api';
import StudentLayout from '../../components/StudentLayout';

const NOTIF_TYPES = {
  'status-changed':    { icon: '🔄', label: 'Status Update',   bg: '#eff6ff', color: '#3b82f6' },
  'response-added':    { icon: '💬', label: 'New Reply',        bg: '#f0fdf4', color: '#10b981' },
  'ticket-created':    { icon: '🎫', label: 'Ticket Created',   bg: '#f5f3ff', color: '#8b5cf6' },
  'ticket-reopened':   { icon: '🔄', label: 'Ticket Reopened',  bg: '#fffbeb', color: '#f59e0b' },
  'escalated':         { icon: '⚡', label: 'Escalated',        bg: '#fef2f2', color: '#ef4444' },
  'feedback-submitted':{ icon: '⭐', label: 'Feedback',         bg: '#fffbeb', color: '#f59e0b' },
  'default':           { icon: '🔔', label: 'Update',           bg: '#f8fafc', color: '#64748b' },
};

const StudentNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [read, setRead] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sp_read_notifs') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    const load = async () => {
      try {
        // Get tickets and build notifications from ticket history
        const res = await ticketAPI.getAllTickets(null, null, null, 1, 50);
        const tickets = res.data.tickets || [];
        const notifs = [];

        for (const t of tickets) {
          // Status change notifications
          if (t.status === 'in-progress') {
            notifs.push({
              id: `${t._id}-progress`,
              type: 'status-changed',
              title: 'Ticket In Progress',
              message: `Your ticket "${t.title.substring(0, 40)}" is being worked on`,
              ticketId: t._id,
              time: t.updatedAt,
            });
          }
          if (t.status === 'resolved') {
            notifs.push({
              id: `${t._id}-resolved`,
              type: 'status-changed',
              title: 'Ticket Resolved! 🎉',
              message: `"${t.title.substring(0, 40)}" has been resolved by TPC`,
              ticketId: t._id,
              time: t.resolvedAt || t.updatedAt,
            });
          }
          // Replies
          if (t.responses && t.responses.length > 0) {
            const tpcReplies = t.responses.filter(r => r.senderRole !== 'student');
            if (tpcReplies.length > 0) {
              const last = tpcReplies[tpcReplies.length - 1];
              notifs.push({
                id: `${t._id}-reply-${last.timestamp}`,
                type: 'response-added',
                title: 'New Reply from TPC',
                message: `${last.senderName || 'TPC'} replied on "${t.title.substring(0, 35)}"`,
                ticketId: t._id,
                time: last.timestamp,
              });
            }
          }
          // Escalated
          if (t.isEscalated) {
            notifs.push({
              id: `${t._id}-escalated`,
              type: 'escalated',
              title: 'Ticket Escalated',
              message: `"${t.title.substring(0, 40)}" has been escalated for priority handling`,
              ticketId: t._id,
              time: t.updatedAt,
            });
          }
        }

        // Sort by time desc
        notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
        setNotifications(notifs.slice(0, 30));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const markRead = (id) => {
    const next = [...new Set([...read, id])];
    setRead(next);
    localStorage.setItem('sp_read_notifs', JSON.stringify(next));
  };

  const markAllRead = () => {
    const all = notifications.map(n => n.id);
    setRead(all);
    localStorage.setItem('sp_read_notifs', JSON.stringify(all));
  };

  const TABS = ['all', 'unread', 'replies', 'updates'];

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !read.includes(n.id);
    if (filter === 'replies') return n.type === 'response-added';
    if (filter === 'updates') return n.type === 'status-changed' || n.type === 'escalated';
    return true;
  });

  const unreadCount = notifications.filter(n => !read.includes(n.id)).length;

  return (
    <StudentLayout title="Notifications" subtitle="Stay updated on your ticket activity">
      <div className="sp-card">
        {/* Header with tabs and Mark All */}
        <div className="sp-card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {TABS.map(tab => (
              <button
                key={tab}
                id={`notif-tab-${tab}`}
                onClick={() => setFilter(tab)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  background: filter === tab ? 'var(--sp-accent)' : '#f1f5f9',
                  color: filter === tab ? '#fff' : 'var(--sp-text-secondary)',
                  transition: 'all 0.2s',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'unread' && unreadCount > 0 && (
                  <span style={{ marginLeft: 6, background: '#ef4444', color: '#fff', borderRadius: 999, padding: '1px 5px', fontSize: '0.7rem' }}>{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button className="sp-btn sp-btn-ghost sp-btn-sm" onClick={markAllRead} id="notif-mark-all">
              ✓ Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        {loading ? (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1,2,3,4].map(i => <div key={i} className="sp-skeleton" style={{ height: 70 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-icon">🔔</div>
            <div className="sp-empty-title">No notifications</div>
            <div className="sp-empty-sub">
              {filter === 'unread' ? 'All caught up! No unread notifications.' : 'You\'ll be notified when there are ticket updates.'}
            </div>
          </div>
        ) : (
          <div className="sp-notif-list">
            {filtered.map((n) => {
              const cfg = NOTIF_TYPES[n.type] || NOTIF_TYPES.default;
              const isUnread = !read.includes(n.id);
              return (
                <div
                  key={n.id}
                  className={`sp-notif-item ${isUnread ? 'unread' : ''}`}
                  onClick={() => {
                    markRead(n.id);
                    if (n.ticketId) navigate(`/student/tickets/${n.ticketId}`);
                  }}
                  id={`notif-${n.id}`}
                >
                  <div className="sp-notif-icon" style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="sp-notif-title">{n.title}</div>
                    <div className="sp-notif-msg">{n.message}</div>
                    <div className="sp-notif-time">
                      {new Date(n.time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {isUnread && <div className="sp-notif-unread-dot" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentNotifications;
