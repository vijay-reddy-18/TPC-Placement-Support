import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ticketAPI } from '../../services/api';
import StudentLayout from '../../components/StudentLayout';

const STATUS_OPTIONS = ['all', 'open', 'in-progress', 'resolved', 'closed'];
const PRIORITY_OPTIONS = ['all', 'low', 'medium', 'high', 'urgent'];
const CATEGORY_OPTIONS = ['all', 'placement', 'internship', 'document', 'company-eligibility', 'offer-letter', 'interview-schedule', 'other'];

const PRIORITY_ICONS = { low: '🟢', medium: '🟡', high: '🔴', urgent: '🔥' };
const CATEGORY_ICONS = { placement: '🏢', internship: '💼', document: '📄', 'company-eligibility': '✅', 'offer-letter': '📝', 'interview-schedule': '📅', other: '📌' };

const StatusBadge = ({ status }) => {
  const map = { open: ['sp-badge-open', '🔵'], 'in-progress': ['sp-badge-progress', '🟡'], resolved: ['sp-badge-resolved', '🟢'], closed: ['sp-badge-closed', '⚫'] };
  const [cls, dot] = map[status] || ['sp-badge-closed', '⚫'];
  return <span className={`sp-badge ${cls}`}>{dot} {status === 'in-progress' ? 'In Progress' : status?.charAt(0).toUpperCase() + status?.slice(1)}</span>;
};

const PriorityBadge = ({ priority }) => {
  const map = { low: 'sp-badge-low', medium: 'sp-badge-medium', high: 'sp-badge-high', urgent: 'sp-badge-urgent' };
  return <span className={`sp-badge ${map[priority] || 'sp-badge-medium'}`}>{PRIORITY_ICONS[priority] || ''} {priority}</span>;
};

const StudentTickets = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        status: statusFilter !== 'all' ? statusFilter : null,
        priority: priorityFilter !== 'all' ? priorityFilter : null,
        category: categoryFilter !== 'all' ? categoryFilter : null,
        page,
        limit: LIMIT,
      };
      if (search.trim()) params.search = search.trim();
      const res = await ticketAPI.getAllTickets(params.status, params.priority, params.category, params.page, params.limit);
      let data = res.data.tickets || [];
      // client-side search filter if backend doesn't support it well
      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter(t => t.title.toLowerCase().includes(q) || t._id.includes(q) || t.description.toLowerCase().includes(q));
      }
      setTickets(data);
      setTotal(res.data.pagination?.total || data.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, categoryFilter, page]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.max(1, Math.ceil(total / LIMIT));

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    let av = a[sortField];
    let bv = b[sortField];
    if (typeof av === 'string') { av = av.toLowerCase(); bv = bv?.toLowerCase() || ''; }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4, color: 'var(--sp-accent)' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <StudentLayout title="My Tickets" subtitle="Track and manage all your support tickets">
      <div className="sp-card">
        {/* Filter Bar */}
        <div className="sp-filter-bar">
          <div className="sp-filter-search">
            <span style={{ color: '#94a3b8' }}>🔍</span>
            <input
              id="tickets-search"
              placeholder="Search by title, ID or description..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem' }}>✕</button>
            )}
          </div>

          <select id="filter-status" className="sp-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>

          <select id="filter-priority" className="sp-filter-select" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}>
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p === 'all' ? 'All Priority' : p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>

          <select id="filter-category" className="sp-filter-select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.replace(/-/g, ' ')}</option>)}
          </select>

          <button className="sp-btn sp-btn-primary sp-btn-sm" onClick={() => navigate('/student/create-ticket')} id="tickets-raise-btn">
            ➕ Raise Ticket
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1,2,3,4,5].map(i => <div key={i} className="sp-skeleton" style={{ height: 52 }} />)}
          </div>
        ) : sortedTickets.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-icon">🎫</div>
            <div className="sp-empty-title">No tickets found</div>
            <div className="sp-empty-sub">
              {search || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try changing your filters'
                : 'Raise your first ticket to get started'}
            </div>
            <button className="sp-btn sp-btn-primary" onClick={() => navigate('/student/create-ticket')}>➕ Create Ticket</button>
          </div>
        ) : (
          <>
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('_id')} style={{ cursor: 'pointer' }}>Ticket ID <SortIcon field="_id" /></th>
                    <th onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>Subject <SortIcon field="title" /></th>
                    <th>Category</th>
                    <th onClick={() => handleSort('priority')} style={{ cursor: 'pointer' }}>Priority <SortIcon field="priority" /></th>
                    <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status <SortIcon field="status" /></th>
                    <th>Assigned To</th>
                    <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>Date <SortIcon field="createdAt" /></th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTickets.map((t) => (
                    <tr key={t._id} onClick={() => navigate(`/student/tickets/${t._id}`)}>
                      <td><span className="sp-ticket-id">#{t._id.slice(-6).toUpperCase()}</span></td>
                      <td style={{ maxWidth: 260 }}>
                        <div className="sp-ticket-title">{t.title}</div>
                        <div className="sp-ticket-desc">{t.description}</div>
                      </td>
                      <td><span className="sp-badge sp-badge-closed" style={{ background: '#f1f5f9', color: '#475569' }}>{CATEGORY_ICONS[t.category] || '📌'} {t.category?.replace(/-/g, ' ')}</span></td>
                      <td><PriorityBadge priority={t.priority} /></td>
                      <td><StatusBadge status={t.status} /></td>
                      <td>
                        {t.assignedTo
                          ? <span style={{ fontSize: '0.82rem', color: 'var(--sp-text-secondary)' }}>👤 {t.assignedTo?.name || 'TPC Staff'}</span>
                          : <span style={{ fontSize: '0.78rem', color: 'var(--sp-text-muted)' }}>Unassigned</span>}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--sp-text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td onClick={(e) => { e.stopPropagation(); navigate(`/student/tickets/${t._id}`); }}>
                        <button className="sp-btn sp-btn-outline sp-btn-sm" id={`view-ticket-${t._id}`}>👁 View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid var(--sp-border)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--sp-text-muted)' }}>
                Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total} tickets
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="sp-btn sp-btn-ghost sp-btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} id="tickets-prev">← Prev</button>
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      className={`sp-btn sp-btn-sm ${page === p ? 'sp-btn-primary' : 'sp-btn-ghost'}`}
                      onClick={() => setPage(p)}
                      id={`tickets-page-${p}`}
                    >{p}</button>
                  );
                })}
                <button className="sp-btn sp-btn-ghost sp-btn-sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} id="tickets-next">Next →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentTickets;
