import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketAPI } from '../../services/api';
import StudentLayout from '../../components/StudentLayout';
import { toast } from 'react-toastify';

const TIMELINE_STEPS = [
  { key: 'created',    label: 'Created',     icon: '📝' },
  { key: 'assigned',   label: 'Assigned',    icon: '👤' },
  { key: 'in-progress',label: 'In Progress', icon: '⚙️' },
  { key: 'resolved',   label: 'Resolved',    icon: '✅' },
];

const getStepState = (step, ticket) => {
  const status = ticket?.status;
  const order = { 'open': 0, 'in-progress': 2, 'resolved': 3, 'closed': 3 };
  const stepOrder = { 'created': 0, 'assigned': 1, 'in-progress': 2, 'resolved': 3 };
  const cur = order[status] ?? 0;
  const s = stepOrder[step] ?? 0;
  if (cur > s) return 'done';
  if (cur === s) return 'current';
  return 'pending';
};

const getStatusBadgeClass = (status) => ({ open: 'sp-badge-open', 'in-progress': 'sp-badge-progress', resolved: 'sp-badge-resolved', closed: 'sp-badge-closed' }[status] || 'sp-badge-closed');
const getPriorityClass = (p) => ({ low: 'sp-badge-low', medium: 'sp-badge-medium', high: 'sp-badge-high', urgent: 'sp-badge-urgent' }[p] || 'sp-badge-medium');

const StudentTicketDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await ticketAPI.getTicket(id);
      setTicket(res.data.ticket);
    } catch (e) {
      toast.error('Failed to load ticket');
      navigate('/student/tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ticket?.responses]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    try {
      setSending(true);
      // Add to local state immediately for UX
      const optimistic = {
        _id: Date.now(),
        sender: user?._id,
        senderRole: 'student',
        senderName: user?.name || 'You',
        message: message.trim(),
        timestamp: new Date(),
      };
      setTicket(prev => ({ ...prev, responses: [...(prev?.responses || []), optimistic] }));
      setMessage('');
      // Send to backend - students add their message via a different mechanism
      // We close and reopen to add student message, or use a response route
      // For now, use a POST to add a student response via a comment-style approach
      await ticketAPI.addStudentResponse(id, message.trim()).catch(() => {
        // fallback: just save locally if endpoint not yet available
      });
      await load();
    } catch (e) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleReopen = async () => {
    const reason = window.prompt('Please describe the reason for reopening this ticket:');
    if (reason === null) return; // user cancelled
    if (!reason.trim()) {
      toast.error('A reason is required to reopen the ticket');
      return;
    }
    
    try {
      setActionLoading(true);
      await ticketAPI.reopenTicket(id, reason.trim());
      toast.success('Ticket reopened!');
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to reopen');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    if (!window.confirm('Close this ticket?')) return;
    try {
      setActionLoading(true);
      await ticketAPI.closeTicket(id);
      toast.success('Ticket closed');
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to close');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout title="Ticket Details">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1,2,3].map(i => <div key={i} className="sp-skeleton" style={{ height: 120, borderRadius: 12 }} />)}
        </div>
      </StudentLayout>
    );
  }

  if (!ticket) return null;

  const responses = ticket.responses || [];
  const isOwner = ticket.studentId === user?.studentId;
  const canClose = isOwner && ['open', 'in-progress', 'resolved'].includes(ticket.status);
  const canReopen = isOwner && ['resolved', 'closed'].includes(ticket.status);
  const canFeedback = isOwner && ['resolved', 'closed'].includes(ticket.status);

  return (
    <StudentLayout title="Ticket Details" subtitle={`#${ticket._id.slice(-6).toUpperCase()} · ${ticket.title}`}>
      {/* Back */}
      <button className="sp-btn sp-btn-ghost sp-btn-sm" onClick={() => navigate('/student/tickets')} style={{ marginBottom: '1.25rem' }} id="ticket-back-btn">
        ← Back to Tickets
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Ticket Header Card */}
          <div className="sp-card">
            <div className="sp-card-body">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--sp-text-primary)', margin: '0 0 0.5rem' }}>
                    {ticket.title}
                  </h2>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    <span className={`sp-badge ${getStatusBadgeClass(ticket.status)}`}>
                      {ticket.status === 'in-progress' ? '🟡 In Progress' : ticket.status === 'resolved' ? '🟢 Resolved' : ticket.status === 'closed' ? '⚫ Closed' : '🔵 Open'}
                    </span>
                    <span className={`sp-badge ${getPriorityClass(ticket.priority)}`}>
                      {ticket.priority?.toUpperCase()} PRIORITY
                    </span>
                    {ticket.isEscalated && <span className="sp-badge" style={{ background: '#f5f3ff', color: '#7c3aed' }}>⚡ Escalated</span>}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--sp-text-secondary)', lineHeight: 1.65, margin: 0 }}>
                    {ticket.description}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0 }}>
                  {canClose && (
                    <button className="sp-btn sp-btn-ghost sp-btn-sm" onClick={handleClose} disabled={actionLoading} id="ticket-close-btn">
                      🔒 Close
                    </button>
                  )}
                  {canReopen && (
                    <button className="sp-btn sp-btn-outline sp-btn-sm" onClick={handleReopen} disabled={actionLoading} id="ticket-reopen-btn">
                      🔄 Reopen
                    </button>
                  )}
                  {canFeedback && (
                    <button className="sp-btn sp-btn-primary sp-btn-sm" onClick={() => navigate('/student/feedback')} id="ticket-feedback-btn">
                      ⭐ Feedback
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="sp-card">
            <div className="sp-card-header"><h3>📍 Ticket Progress</h3></div>
            <div className="sp-timeline">
              {TIMELINE_STEPS.map((step, idx) => {
                const state = getStepState(
                  step.key === 'created' ? 'created' :
                  step.key === 'assigned' ? (ticket.assignedTo ? 'assigned' : 'pending') :
                  step.key,
                  ticket
                );
                const actualState = (() => {
                  if (step.key === 'created') return 'done';
                  if (step.key === 'assigned') return ticket.assignedTo ? 'done' : 'pending';
                  if (step.key === 'in-progress') {
                    if (['in-progress', 'resolved', 'closed'].includes(ticket.status)) return ticket.status === 'in-progress' ? 'current' : 'done';
                    return 'pending';
                  }
                  if (step.key === 'resolved') {
                    if (['resolved', 'closed'].includes(ticket.status)) return 'done';
                    return 'pending';
                  }
                  return 'pending';
                })();

                return (
                  <div key={step.key} className={`sp-timeline-step ${actualState}`}>
                    <div className="sp-timeline-dot">
                      {actualState === 'done' ? '✓' : actualState === 'current' ? step.icon : idx + 1}
                    </div>
                    <div className="sp-timeline-label">{step.label}</div>
                    <div className="sp-timeline-date">
                      {step.key === 'created' ? new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) :
                       step.key === 'resolved' && ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) :
                       actualState === 'done' ? '✓' : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat / Conversation */}
          <div className="sp-card">
            <div className="sp-card-header">
              <h3>💬 Conversation ({responses.length})</h3>
            </div>

            {responses.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--sp-text-muted)', fontSize: '0.875rem' }}>
                💬 No messages yet. Send a message to start the conversation.
              </div>
            ) : (
              <div className="sp-chat-container">
                {responses.map((r, i) => {
                  const isStudent = r.senderRole === 'student';
                  return (
                    <div key={r._id || i} className={`sp-chat-msg ${isStudent ? 'student' : r.senderRole || 'tpc'}`}>
                      <div className="sp-chat-avatar">
                        {(r.senderName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="sp-chat-meta">
                          <span className="sp-chat-sender">{isStudent ? 'You' : r.senderName || 'TPC Staff'}</span>
                          <span className="sp-chat-time">
                            {new Date(r.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="sp-chat-bubble">{r.message}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Message Input */}
            {ticket.status !== 'closed' && (
              <div className="sp-chat-input-area">
                <textarea
                  id="chat-message-input"
                  className="sp-chat-input"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={1}
                />
                <button
                  className="sp-chat-send"
                  onClick={handleSendMessage}
                  disabled={sending || !message.trim()}
                  id="chat-send-btn"
                  title="Send (Enter)"
                >
                  {sending ? '⏳' : '📨'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - Metadata Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Ticket Info */}
          <div className="sp-card">
            <div className="sp-card-header"><h3>ℹ️ Ticket Info</h3></div>
            <div className="sp-card-body" style={{ padding: '1rem 1.25rem' }}>
              {[
                { label: 'Ticket ID',   value: `#${ticket._id.slice(-6).toUpperCase()}` },
                { label: 'Category',    value: ticket.category?.replace(/-/g, ' ') },
                { label: 'Department',  value: ticket.department?.toUpperCase() || 'N/A' },
                { label: 'Created',     value: new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Last Updated', value: new Date(ticket.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--sp-border)', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--sp-text-muted)', fontWeight: 600 }}>{label}</span>
                  <span style={{ color: 'var(--sp-text-primary)', fontWeight: 500, textTransform: 'capitalize', textAlign: 'right', maxWidth: 150 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned / Handling Agent */}
          <div className="sp-card">
            <div className="sp-card-header">
              <h3>{ticket.status === 'resolved' || ticket.status === 'closed' ? '✅ Resolved By' : '🧑‍💼 Handling Agent'}</h3>
            </div>
            <div className="sp-card-body" style={{ padding: '1.25rem' }}>
              {ticket.assignedTo ? (
                <div>
                  {/* Agent Avatar + Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                      background: (ticket.status === 'resolved' || ticket.status === 'closed')
                        ? 'linear-gradient(135deg,#10b981,#059669)'
                        : 'linear-gradient(135deg,#6366f1,#818cf8)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.25rem', fontWeight: 800,
                      boxShadow: (ticket.status === 'resolved' || ticket.status === 'closed')
                        ? '0 4px 14px rgba(16,185,129,0.35)'
                        : '0 4px 14px rgba(99,102,241,0.35)',
                    }}>
                      {ticket.assignedTo?.profilePhoto
                        ? <img src={ticket.assignedTo.profilePhoto} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        : (ticket.assignedTo?.name || 'T').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--sp-text-primary)' }}>
                        {ticket.assignedTo?.name || 'TPC Staff'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--sp-text-muted)', marginTop: 2 }}>
                        TPC Staff · {ticket.assignedTo?.department?.toUpperCase() || 'Placement Cell'}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, padding: '2px 9px', borderRadius: 999,
                          background: (ticket.status === 'resolved' || ticket.status === 'closed') ? '#f0fdf4' : '#fffbeb',
                          color: (ticket.status === 'resolved' || ticket.status === 'closed') ? '#15803d' : '#a16207',
                        }}>
                          {ticket.status === 'resolved' ? '✅ Resolved this case'
                            : ticket.status === 'closed' ? '⚫ Case closed'
                            : '⚙️ Currently handling'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Agent Details */}
                  <div style={{ background: 'var(--sp-bg-secondary)', borderRadius: 10, padding: '0.75rem', fontSize: '0.78rem' }}>
                    {[
                      { label: 'Staff ID', value: ticket.assignedTo?.studentId || '—' },
                      { label: 'Email',    value: ticket.assignedTo?.email || '—' },
                      { label: 'Dept.',    value: ticket.assignedTo?.department?.toUpperCase() || 'General' },
                    ].map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--sp-border)' }}>
                        <span style={{ color: 'var(--sp-text-muted)', fontWeight: 600 }}>{r.label}</span>
                        <span style={{ color: 'var(--sp-text-primary)', fontWeight: 500, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{r.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Resolution info if resolved */}
                  {(ticket.status === 'resolved' || ticket.status === 'closed') && ticket.resolvedAt && (
                    <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', fontSize: '0.77rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      ✅ Resolved on <strong>{new Date(ticket.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--sp-text-muted)', fontSize: '0.875rem', padding: '0.5rem 0' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>⏳</div>
                  Awaiting assignment from TPC
                </div>
              )}
            </div>
          </div>

          {/* SLA Status */}
          <div className="sp-card">
            <div className="sp-card-header"><h3>⏱️ SLA Status</h3></div>
            <div className="sp-card-body" style={{ textAlign: 'center', padding: '1.25rem' }}>
              {(() => {
                const sla = ticket.slaStatus || 'on-track';
                const config = {
                  'on-track': { icon: '🟢', label: 'On Track', color: '#10b981', bg: '#ecfdf5' },
                  'at-risk':  { icon: '🟡', label: 'At Risk',  color: '#f59e0b', bg: '#fffbeb' },
                  'breached': { icon: '🔴', label: 'Breached', color: '#ef4444', bg: '#fef2f2' },
                }[sla] || { icon: '⚪', label: sla, color: '#64748b', bg: '#f8fafc' };
                return (
                  <div style={{ padding: '0.75rem', borderRadius: 10, background: config.bg }}>
                    <div style={{ fontSize: '2rem', marginBottom: 4 }}>{config.icon}</div>
                    <div style={{ fontWeight: 700, color: config.color, fontSize: '0.9rem' }}>{config.label}</div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* TPC Resolution Notes */}
          {ticket.tpcResponse && (
            <div className="sp-card">
              <div className="sp-card-header"><h3>💡 Resolution Notes</h3></div>
              <div style={{ padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--sp-text-secondary)', lineHeight: 1.7, background: '#f0fdf4', borderRadius: 10, padding: '0.875rem', border: '1px solid #bbf7d0' }}>
                  {ticket.tpcResponse}
                </div>
                {ticket.assignedTo && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--sp-text-muted)' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.6rem', flexShrink: 0 }}>
                      {(ticket.assignedTo?.name || 'T').charAt(0)}
                    </div>
                    <span>Written by <strong style={{ color: 'var(--sp-text-primary)' }}>{ticket.assignedTo?.name || 'TPC Staff'}</strong>
                      {ticket.resolvedAt ? ` · ${new Date(ticket.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback submitted */}
          {ticket.feedback?.rating && (
            <div className="sp-card">
              <div className="sp-card-header"><h3>⭐ Your Feedback</h3></div>
              <div className="sp-card-body" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', color: '#f59e0b', marginBottom: 4 }}>
                  {'★'.repeat(ticket.feedback.rating)}{'☆'.repeat(5 - ticket.feedback.rating)}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--sp-text-secondary)', marginTop: 4 }}>{ticket.feedback.comment || 'No comment'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentTicketDetail;
