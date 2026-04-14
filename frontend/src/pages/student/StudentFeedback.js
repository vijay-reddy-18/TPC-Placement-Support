import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../../services/api';
import StudentLayout from '../../components/StudentLayout';
import { toast } from 'react-toastify';

const StarRating = ({ value, onChange, readonly }) => (
  <div className="sp-stars">
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={`sp-star ${star <= value ? 'active' : ''}`}
        onClick={() => !readonly && onChange && onChange(star)}
        style={{ cursor: readonly ? 'default' : 'pointer' }}
        title={['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][star]}
        id={`star-${star}`}
      >
        {star <= value ? '★' : '☆'}
      </span>
    ))}
  </div>
);

const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

const StudentFeedback = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [submitting, setSubmitting] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await ticketAPI.getAllTickets('resolved', null, null, 1, 50);
        const resolved = res.data.tickets || [];
        const res2 = await ticketAPI.getAllTickets('closed', null, null, 1, 50);
        const closed = res2.data.tickets || [];
        const all = [...resolved, ...closed].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setTickets(all);
        // Pre-fill existing feedback
        const existingRatings = {};
        const existingComments = {};
        all.forEach(t => {
          if (t.feedback?.rating) {
            existingRatings[t._id] = t.feedback.rating;
            existingComments[t._id] = t.feedback.comment || '';
          }
        });
        setRatings(existingRatings);
        setComments(existingComments);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (ticketId) => {
    const rating = ratings[ticketId];
    if (!rating) {
      toast.warning('Please select a star rating first');
      return;
    }
    try {
      setSubmitting(prev => ({ ...prev, [ticketId]: true }));
      await ticketAPI.submitFeedback(ticketId, rating, comments[ticketId] || '');
      toast.success('⭐ Feedback submitted! Thank you!');
      // Refresh to show submitted state
      setTickets(prev => prev.map(t => t._id === ticketId
        ? { ...t, feedback: { rating, comment: comments[ticketId] || '', submittedAt: new Date() } }
        : t
      ));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(prev => ({ ...prev, [ticketId]: false }));
    }
  };

  const avgRating = Object.values(ratings).length
    ? (Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length).toFixed(1)
    : 0;

  const ratedCount = tickets.filter(t => t.feedback?.rating).length;

  return (
    <StudentLayout title="Feedback" subtitle="Rate your experience and help us improve">
      {/* Summary */}
      {tickets.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.75rem' }}>
          {[
            { icon: '🎫', label: 'Resolved Tickets', value: tickets.length, bg: '#eff6ff', color: '#3b82f6' },
            { icon: '⭐', label: 'Feedback Submitted', value: ratedCount, bg: '#fffbeb', color: '#f59e0b' },
            { icon: '📊', label: 'Avg. Rating', value: avgRating > 0 ? `${avgRating}/5` : 'N/A', bg: '#f0fdf4', color: '#10b981' },
          ].map(c => (
            <div key={c.label} style={{ background: c.bg, padding: '1.25rem', borderRadius: 'var(--sp-radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>{c.icon}</span>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: c.color, textTransform: 'uppercase', marginBottom: 2 }}>{c.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sp-text-primary)' }}>{c.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map(i => <div key={i} className="sp-skeleton" style={{ height: 160, borderRadius: 12 }} />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="sp-card">
          <div className="sp-empty">
            <div className="sp-empty-icon">⭐</div>
            <div className="sp-empty-title">No resolved tickets yet</div>
            <div className="sp-empty-sub">You can rate tickets once they're resolved by TPC</div>
            <button className="sp-btn sp-btn-primary" onClick={() => navigate('/student/tickets')}>📋 View My Tickets</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {tickets.map((ticket) => {
            const hasExisting = !!ticket.feedback?.rating;
            const currentRating = ratings[ticket._id] || 0;
            const isSubmitting = submitting[ticket._id];

            return (
              <div key={ticket._id} className="sp-card">
                <div className="sp-card-body" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sp-text-muted)' }}>#{ticket._id.slice(-6).toUpperCase()}</span>
                        <span className={`sp-badge ${ticket.status === 'resolved' ? 'sp-badge-resolved' : 'sp-badge-closed'}`}>
                          {ticket.status === 'resolved' ? '🟢 Resolved' : '⚫ Closed'}
                        </span>
                        {hasExisting && <span className="sp-badge" style={{ background: '#fffbeb', color: '#f59e0b' }}>⭐ Rated</span>}
                      </div>
                      <h3 style={{ fontWeight: 700, color: 'var(--sp-text-primary)', margin: '0 0 0.25rem', fontSize: '1rem' }}>{ticket.title}</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--sp-text-muted)', margin: 0 }}>
                        {ticket.resolvedAt
                          ? `Resolved on ${new Date(ticket.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
                          : `Updated ${new Date(ticket.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                      </p>
                    </div>
                    <button
                      className="sp-btn sp-btn-ghost sp-btn-sm"
                      onClick={() => navigate(`/student/tickets/${ticket._id}`)}
                      id={`fb-view-${ticket._id}`}
                    >
                      👁 View Ticket
                    </button>
                  </div>

                  {/* TPC Response Preview */}
                  {ticket.tpcResponse && (
                    <div style={{ background: '#f0f9ff', padding: '0.875rem', borderRadius: 8, borderLeft: '4px solid #3b82f6', marginBottom: '1.25rem', fontSize: '0.875rem', color: 'var(--sp-text-secondary)', lineHeight: 1.6 }}>
                      <div style={{ fontWeight: 600, color: '#3b82f6', marginBottom: 4, fontSize: '0.78rem' }}>💡 TPC RESPONSE</div>
                      {ticket.tpcResponse.substring(0, 150)}{ticket.tpcResponse.length > 150 ? '...' : ''}
                    </div>
                  )}

                  {/* Rating UI */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sp-text-primary)', marginBottom: '0.5rem' }}>
                        How would you rate the resolution?
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <StarRating
                          value={currentRating}
                          onChange={(v) => setRatings(prev => ({ ...prev, [ticket._id]: v }))}
                          readonly={hasExisting}
                        />
                        {currentRating > 0 && (
                          <span style={{ fontSize: '0.82rem', color: 'var(--sp-text-muted)', fontWeight: 600 }}>
                            {RATING_LABELS[currentRating]}
                          </span>
                        )}
                      </div>
                    </div>

                    {!hasExisting && (
                      <>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sp-text-primary)', marginBottom: '0.5rem' }}>
                            Additional comments (optional)
                          </div>
                          <textarea
                            id={`fb-comment-${ticket._id}`}
                            className="sp-textarea"
                            rows={2}
                            placeholder="Share your experience with TPC's resolution..."
                            value={comments[ticket._id] || ''}
                            onChange={(e) => setComments(prev => ({ ...prev, [ticket._id]: e.target.value }))}
                            style={{ minHeight: 70 }}
                          />
                        </div>
                        <button
                          className="sp-btn sp-btn-primary"
                          style={{ alignSelf: 'flex-end' }}
                          onClick={() => handleSubmit(ticket._id)}
                          disabled={isSubmitting || !currentRating}
                          id={`fb-submit-${ticket._id}`}
                        >
                          {isSubmitting ? '⏳ Submitting...' : '⭐ Submit Feedback'}
                        </button>
                      </>
                    )}

                    {hasExisting && (
                      <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: 8, fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>
                        ✅ Feedback submitted on {new Date(ticket.feedback.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {ticket.feedback.comment && (
                          <div style={{ fontWeight: 400, color: 'var(--sp-text-secondary)', marginTop: 4 }}>"{ticket.feedback.comment}"</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
};

export default StudentFeedback;
