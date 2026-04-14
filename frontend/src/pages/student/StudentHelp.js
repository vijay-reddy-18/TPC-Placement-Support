import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/StudentLayout';

const FAQ_SECTIONS = [
  {
    title: '🎫 Raising a Ticket',
    icon: '🎫',
    items: [
      { q: 'How do I raise a new ticket?', a: 'Go to "Raise Ticket" from the sidebar or click the ➕ button. Fill in the category, priority, subject and description. Click Submit. You\'ll be redirected to your ticket\'s detail page.' },
      { q: 'What categories are available?', a: 'We support: Placement, Internship, Documents, Company Eligibility, Interview Schedule, Offer Letter, and Other. Choose the one that best matches your issue.' },
      { q: 'What priority level should I choose?', a: 'Low — can wait a few days. Medium — standard query. High — needs resolution within 24–48 hours. Urgent — critical, time-sensitive (e.g., company deadline today).' },
      { q: 'How many tickets can I raise?', a: 'There is no hard limit. However, we encourage you to search for existing solutions in the Help Center before raising a ticket.' },
    ],
  },
  {
    title: '⏳ Ticket Processing',
    icon: '⚙️',
    items: [
      { q: 'How long does TPC take to respond?', a: 'Standard response time is 24–48 hours on working days. Urgent tickets are prioritized and typically get a response within 4–8 hours.' },
      { q: 'What is the ticket timeline?', a: 'Tickets go through 4 stages: Created → Assigned → In Progress → Resolved. You can see the real-time progress on your ticket\'s detail page.' },
      { q: 'Why is my ticket still "Open"?', a: 'Open means your ticket is received but not yet picked up. Our TPC team automatically assigns tickets using round-robin. If urgent, please add a comment.' },
      { q: 'Can I add more information after submitting?', a: 'Yes! Go to your ticket\'s detail page and use the chat/message section to add more details. TPC will see your updates.' },
    ],
  },
  {
    title: '🔁 Managing Your Tickets',
    icon: '🔁',
    items: [
      { q: 'Can I reopen a resolved ticket?', a: 'Yes. If the issue was not properly resolved, click "Reopen" on the ticket detail page. Please describe the reason for reopening in a message.' },
      { q: 'How do I close a ticket?', a: 'Once your issue is resolved to your satisfaction, click "Close" on the ticket detail page. You can still view closed tickets in "My Tickets".' },
      { q: 'Can I track which TPC member is handling my ticket?', a: 'Yes! The "Assigned To" panel on the right side of the ticket detail page shows the TPC member assigned to your ticket.' },
      { q: 'What does "Escalated" mean?', a: 'Escalated means your ticket has been flagged for priority attention or referred to senior TPC staff. You\'ll see an ⚡ escalated badge on the ticket.' },
    ],
  },
  {
    title: '👤 Account & Profile',
    icon: '👤',
    items: [
      { q: 'How do I update my profile?', a: 'Go to Profile (sidebar) → Edit → update your name, email or mobile number → Save Changes.' },
      { q: 'Can I change my Student ID?', a: 'No. Your Student ID is permanently linked to your account and cannot be changed.' },
      { q: 'How do I change my password?', a: 'Go to Profile → Security tab → enter your current password → enter and confirm your new password → Update Password.' },
      { q: 'How do I enable/disable email notifications?', a: 'Go to Profile → Notifications tab → toggle Email Notifications on or off.' },
    ],
  },
  {
    title: '📊 SLA & Priorities',
    icon: '📊',
    items: [
      { q: 'What is SLA?', a: 'SLA stands for Service Level Agreement. It is the expected time within which TPC commits to resolving your ticket. The SLA status is shown on each ticket.' },
      { q: 'What do SLA statuses mean?', a: '🟢 On Track — within resolution time. 🟡 At Risk — nearing deadline. 🔴 Breached — SLA exceeded. Contact TPC directly if your ticket is breached.' },
      { q: 'What is the standard SLA?', a: 'Standard response: 24 hours. Standard resolution: 5 working days. Urgent tickets have a shorter SLA of 1 working day.' },
    ],
  },
];

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="sp-faq-item">
      <div className="sp-faq-q" onClick={() => setOpen(o => !o)}>
        {q}
        <span style={{ fontSize: '1.1rem', transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'none', flexShrink: 0 }}>+</span>
      </div>
      <div className={`sp-faq-a ${open ? 'open' : ''}`}>{a}</div>
    </div>
  );
};

const StudentHelp = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = search.trim().length > 1
    ? FAQ_SECTIONS.map(sec => ({
        ...sec,
        items: sec.items.filter(item =>
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(sec => sec.items.length > 0)
    : FAQ_SECTIONS;

  return (
    <StudentLayout title="Help Center" subtitle="Find answers to common questions about the TPC Support System">
      {/* Search */}
      <div className="sp-card" style={{ marginBottom: '1.5rem' }}>
        <div className="sp-card-body" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
          <h2 style={{ fontWeight: 800, color: 'var(--sp-text-primary)', marginBottom: '0.5rem' }}>How can we help you?</h2>
          <p style={{ color: 'var(--sp-text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>Search our knowledge base for instant answers</p>
          <div className="sp-search-box" style={{ maxWidth: 500, margin: '0 auto', borderRadius: 10 }}>
            <span style={{ color: '#94a3b8' }}>🔍</span>
            <input
              id="help-search"
              placeholder="Search FAQs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 0 }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { icon: '➕', label: 'Raise a Ticket',   action: () => navigate('/student/create-ticket'), id: 'help-raise' },
          { icon: '📋', label: 'View My Tickets',  action: () => navigate('/student/tickets'),       id: 'help-tickets' },
          { icon: '⭐', label: 'Submit Feedback',  action: () => navigate('/student/feedback'),      id: 'help-feedback' },
          { icon: '👤', label: 'Edit Profile',     action: () => navigate('/student/profile'),       id: 'help-profile' },
        ].map((l) => (
          <button key={l.id} id={l.id} className="sp-quick-btn" onClick={l.action}>
            <span className="sp-quick-btn-icon">{l.icon}</span>
            {l.label}
          </button>
        ))}
      </div>

      {/* FAQ Sections */}
      {filtered.length === 0 ? (
        <div className="sp-card">
          <div className="sp-empty">
            <div className="sp-empty-icon">🔍</div>
            <div className="sp-empty-title">No results found</div>
            <div className="sp-empty-sub">Try a different search term</div>
            <button className="sp-btn sp-btn-ghost" onClick={() => setSearch('')}>Clear Search</button>
          </div>
        </div>
      ) : (
        filtered.map((sec) => (
          <div key={sec.title} className="sp-card" style={{ marginBottom: '1.25rem' }}>
            <div className="sp-card-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{sec.title}</h3>
            </div>
            <div className="sp-card-body">
              {sec.items.map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Contact Support Banner */}
      <div className="sp-card" style={{ marginTop: '1.5rem' }}>
        <div className="sp-card-body" style={{ textAlign: 'center', padding: '2rem', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderRadius: 'var(--sp-radius-lg)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
          <h3 style={{ fontWeight: 800, color: 'var(--sp-text-primary)', marginBottom: '0.5rem' }}>Still have questions?</h3>
          <p style={{ color: 'var(--sp-text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            If you couldn't find the answer, raise a support ticket and our TPC team will help you out.
          </p>
          <button className="sp-btn sp-btn-primary" onClick={() => navigate('/student/create-ticket')} id="help-raise-ticket">
            🎫 Raise a Support Ticket
          </button>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentHelp;
