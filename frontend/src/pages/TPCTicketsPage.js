import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaFilter, FaChevronDown } from 'react-icons/fa';
import TPCLayout from '../components/TPCLayout';
import { ticketAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TPCTicketsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('new');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(12);

    // Bulk selection
    const [selectedRows, setSelectedRows] = useState(new Set());

    useEffect(() => { 
        loadTickets(); 
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const status = params.get('status');
        if (status === 'open') setActiveTab('new');
        else if (status === 'in-progress') setActiveTab('in-progress');
        else if (status === 'resolved') setActiveTab('resolved');
    }, [location.search]);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const res = await ticketAPI.getAllTickets(null, null, null, 1, 1000);
            setTickets(res.data.tickets);
        } catch (error) {
            console.error('Failed to load tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    // Tab filtering
    const tabMap = { 'new': 'open', 'in-progress': 'in-progress', 'resolved': 'resolved' };
    const getTabTickets = (tab) => tickets.filter(t => t.status === tabMap[tab]);
    const newCount = getTabTickets('new').length;
    const inProgressCount = getTabTickets('in-progress').length;
    const resolvedCount = getTabTickets('resolved').length;

    // Apply filters on tab data
    let filteredTickets = getTabTickets(activeTab);

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filteredTickets = filteredTickets.filter(t =>
            t.studentId.toLowerCase().includes(q) ||
            t.title.toLowerCase().includes(q) ||
            t._id.toLowerCase().includes(q)
        );
    }
    if (priorityFilter) filteredTickets = filteredTickets.filter(t => t.priority === priorityFilter);
    if (statusFilter) filteredTickets = filteredTickets.filter(t => t.status === statusFilter);
    if (categoryFilter) filteredTickets = filteredTickets.filter(t => t.category === categoryFilter);

    // Pagination
    const totalPages = Math.ceil(filteredTickets.length / rowsPerPage);
    const startIdx = (currentPage - 1) * rowsPerPage;
    const currentTickets = filteredTickets.slice(startIdx, startIdx + rowsPerPage);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(new Set(currentTickets.map(t => t._id)));
        } else {
            setSelectedRows(new Set());
        }
    };

    const handleSelectRow = (id) => {
        const next = new Set(selectedRows);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelectedRows(next);
    };

    const handleAssignToMe = async (ticketId) => {
        try {
            await ticketAPI.assignTicket(ticketId, user.userId || user._id);
            loadTickets();
        } catch (err) { console.error('Assign failed:', err); }
    };

    const handleRespond = (ticketId) => {
        navigate(`/tpc/tickets/${ticketId}`);
    };

    const getPriorityClass = (p) => p === 'urgent' || p === 'high' ? 'high' : p === 'medium' ? 'medium' : 'low';
    const getPriorityLabel = (p) => p.charAt(0).toUpperCase() + p.slice(1);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
        setSelectedRows(new Set());
    };

    const categoryNames = {
        'company-eligibility': 'Academic',
        'internship-confirmation': 'Financial Aid',
        'offer-letter': 'Housing',
        'document-verification': 'IT Support',
        'interview-schedule': 'Admissions',
        'placement-process': 'Student Life',
        'other': 'Other',
    };

    return (
        <TPCLayout pageTitle="Ticket Management" openTicketCount={newCount}>
            {/* Tabs */}
            <div className="tpc-tabs">
                <button className={`tpc-tab${activeTab === 'new' ? ' active' : ''}`} onClick={() => handleTabChange('new')}>
                    New <span className="tpc-tab-count">{newCount}</span>
                </button>
                <button className={`tpc-tab${activeTab === 'in-progress' ? ' active' : ''}`} onClick={() => handleTabChange('in-progress')}>
                    In Progress <span className="tpc-tab-count">{inProgressCount}</span>
                </button>
                <button className={`tpc-tab${activeTab === 'resolved' ? ' active' : ''}`} onClick={() => handleTabChange('resolved')}>
                    Resolved <span className="tpc-tab-count">{resolvedCount}</span>
                </button>
            </div>

            {/* Filters */}
            <div className="tpc-filters">
                <div className="tpc-search">
                    <FaSearch className="tpc-search-icon" />
                    <input
                        placeholder="Search tickets..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6b7280' }}>Priority</span>
                    {['high', 'medium', 'low'].map(p => (
                        <button
                            key={p}
                            className={`tpc-filter-pill${priorityFilter === p ? ' active' : ''}`}
                            onClick={() => { setPriorityFilter(priorityFilter === p ? '' : p); setCurrentPage(1); }}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {['Open', 'Pending', 'On Hold', 'Escalated'].map(s => (
                        <button
                            key={s}
                            className={`tpc-filter-pill${statusFilter === s.toLowerCase().replace(' ', '-') ? ' active' : ''}`}
                            onClick={() => {
                                const val = s.toLowerCase().replace(' ', '-');
                                setStatusFilter(statusFilter === val ? '' : val);
                                setCurrentPage(1);
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <select
                    style={{
                        padding: '0.4rem 0.75rem', borderRadius: 6,
                        border: '1px solid #e5e7eb', fontSize: '0.82rem',
                        background: 'white', cursor: 'pointer', color: '#374151'
                    }}
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                >
                    <option value="">Category</option>
                    {Object.entries(categoryNames).map(([key, val]) => (
                        <option key={key} value={key}>{val}</option>
                    ))}
                </select>
            </div>

            {/* Bulk Actions */}
            {selectedRows.size > 0 && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem', background: '#eff6ff', borderRadius: 8,
                    marginBottom: '1rem', fontSize: '0.85rem'
                }}>
                    <span style={{ fontWeight: 600, color: '#2563eb' }}>{selectedRows.size} selected</span>
                    <button className="tpc-btn tpc-btn-primary" style={{ fontSize: '0.78rem' }}>Assign Selected</button>
                    <button className="tpc-btn tpc-btn-outline" style={{ fontSize: '0.78rem' }}>Change Priority</button>
                    <button className="tpc-btn tpc-btn-success" style={{ fontSize: '0.78rem' }}>Mark as Resolved</button>
                </div>
            )}

            {/* Table */}
            <div className="tpc-card">
                <div style={{ overflowX: 'auto' }}>
                    <table className="tpc-table">
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.size === currentTickets.length && currentTickets.length > 0}
                                        onChange={handleSelectAll}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </th>
                                <th>Ticket ID</th>
                                <th>Student ID</th>
                                <th>Category</th>
                                <th>Subject</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>Loading...</td></tr>
                            ) : currentTickets.length === 0 ? (
                                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>No tickets found</td></tr>
                            ) : (
                                currentTickets.map((t) => {
                                    const isUrgent = t.priority === 'urgent';
                                    const isOverdue = t.slaStatus === 'breached';
                                    return (
                                        <tr key={t._id} style={{
                                            background: selectedRows.has(t._id) ? '#f0f4ff' :
                                                isUrgent ? '#fef2f2' : 'white'
                                        }}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.has(t._id)}
                                                    onChange={() => handleSelectRow(t._id)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </td>
                                            <td style={{ fontWeight: 600 }}>
                                                #TICK-{t._id.slice(-4).toUpperCase()}
                                            </td>
                                            <td>{t.studentId}</td>
                                            <td style={{ fontSize: '0.82rem' }}>{categoryNames[t.category] || t.category}</td>
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {t.title}
                                            </td>
                                            <td>
                                                <span className={`tpc-badge ${getPriorityClass(t.priority)}`}>
                                                    {getPriorityLabel(t.priority)}
                                                    {isUrgent && ' 🔔'}
                                                </span>
                                                {isOverdue && (
                                                    <div style={{ fontSize: '0.68rem', color: '#dc2626', marginTop: 2 }}>⚠ overdue</div>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`tpc-badge ${t.status === 'open' ? 'new' : t.status === 'in-progress' ? 'in-progress' : 'resolved'}`}>
                                                    {t.status === 'in-progress' ? 'In Progress' : t.status === 'open' ? 'New' : 'Resolved'}
                                                </span>
                                            </td>
                                            <td style={{ color: '#6b7280', fontSize: '0.82rem' }}>
                                                {new Date(t.createdAt).toLocaleDateString('en-CA')}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                    {t.status === 'open' && (
                                                        <>
                                                            <button className="tpc-btn tpc-btn-primary" onClick={(e) => { e.stopPropagation(); handleAssignToMe(t._id); }}>
                                                                Assign to Me
                                                            </button>
                                                            <button className="tpc-btn tpc-btn-success" onClick={(e) => { e.stopPropagation(); handleRespond(t._id); }}>
                                                                Respond
                                                            </button>
                                                        </>
                                                    )}
                                                    {t.status === 'in-progress' && (
                                                        <button className="tpc-btn tpc-btn-success" onClick={(e) => { e.stopPropagation(); handleRespond(t._id); }}>
                                                            Respond
                                                        </button>
                                                    )}
                                                    <button
                                                        className="tpc-btn tpc-btn-outline"
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/tpc/tickets/${t._id}`); }}
                                                    >
                                                        👁 Quick View
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredTickets.length > 0 && (
                    <div className="tpc-pagination">
                        <div className="tpc-pagination-info">
                            Showing {startIdx + 1}-{Math.min(startIdx + rowsPerPage, filteredTickets.length)} of {filteredTickets.length} tickets
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="tpc-pagination-controls">
                                <button className="tpc-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const num = currentPage > 3 ? currentPage - 2 + i : i + 1;
                                    return num <= totalPages ? (
                                        <button key={num} className={`tpc-page-btn${currentPage === num ? ' active' : ''}`} onClick={() => setCurrentPage(num)}>{num}</button>
                                    ) : null;
                                })}
                                <button className="tpc-page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                            </div>
                            <div className="tpc-rows-select">
                                <span>Rows per page</span>
                                <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(+e.target.value); setCurrentPage(1); }}>
                                    <option value={10}>10</option>
                                    <option value={12}>12</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TPCLayout>
    );
};

export default TPCTicketsPage;
