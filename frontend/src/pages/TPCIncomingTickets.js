import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TPCLayout from '../components/TPCLayout';
import { ticketAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Badge, Button, Modal, Form, Card } from 'react-bootstrap';

const PRIORITY_COLORS = { urgent:'#ef4444', high:'#f97316', medium:'#f59e0b', low:'#10b981' };
const PRIORITY_BG     = { urgent:'#fef2f2', high:'#fff7ed', medium:'#fffbeb', low:'#f0fdf4' };
const AI_CATEGORIES   = { placement:'🏢 Placement', internship:'💼 Internship', document:'📄 Document', 'company-eligibility':'✅ Eligibility', 'offer-letter':'📝 Offer Letter', 'interview-schedule':'📅 Schedule', other:'📌 Other' };

const TPCIncomingTickets = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tpcMembers, setTpcMembers] = useState([]);
    const [sortBy, setSortBy] = useState('priority');

    // Reject modal
    const [rejectTicket, setRejectTicket] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejecting, setRejecting] = useState(false);

    // Assign modal
    const [assignTicket, setAssignTicket] = useState(null);
    const [assignTo, setAssignTo] = useState('');
    const [assigning, setAssigning] = useState(false);

    const [accepting, setAccepting] = useState({});

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const res = await ticketAPI.getAllTickets('open', null, null, 1, 100);
            const unassigned = (res.data.tickets || []).filter(t => !t.assignedTo);
            setTickets(unassigned);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        load();
        // Load TPC members for assignment dropdown
        const loadMembers = async () => {
            try {
                const api = (await import('../services/api')).default;
                const res = await api.get('/admin/users');
                setTpcMembers((res.data.users || []).filter(u => u.role === 'tpc'));
            } catch (e) {}
        };
        loadMembers();
    }, [load]);

    const PRIORITY_SORT = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...tickets].sort((a, b) => {
        if (sortBy === 'priority') return (PRIORITY_SORT[a.priority]||2) - (PRIORITY_SORT[b.priority]||2);
        if (sortBy === 'time') return new Date(a.createdAt) - new Date(b.createdAt);
        return 0;
    });

    const handleAccept = async (ticket) => {
        try {
            setAccepting(p => ({ ...p, [ticket._id]: true }));
            await ticketAPI.assignTicket(ticket._id, user.userId || user._id);
            await ticketAPI.updateTicket(ticket._id, { status: 'in-progress' });
            toast.success(`✅ Ticket accepted and assigned to you!`);
            load();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to accept ticket');
        } finally {
            setAccepting(p => ({ ...p, [ticket._id]: false }));
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) { toast.warning('Please provide a reason'); return; }
        try {
            setRejecting(true);
            await ticketAPI.updateTicket(rejectTicket._id, {
                status: 'closed',
                tpcResponse: `Ticket rejected: ${rejectReason.trim()}`
            });
            toast.success('Ticket rejected with reason noted');
            setRejectTicket(null); setRejectReason('');
            load();
        } catch (e) { toast.error('Failed to reject ticket'); }
        finally { setRejecting(false); }
    };

    const handleAssign = async () => {
        if (!assignTo) { toast.warning('Please select a team member'); return; }
        try {
            setAssigning(true);
            await ticketAPI.assignTicket(assignTicket._id, assignTo);
            await ticketAPI.updateTicket(assignTicket._id, { status: 'in-progress' });
            toast.success('Ticket assigned successfully!');
            setAssignTicket(null); setAssignTo('');
            load();
        } catch (e) { toast.error('Failed to assign ticket'); }
        finally { setAssigning(false); }
    };

    const timeAgo = (date) => {
        const diff = (new Date() - new Date(date)) / 60000;
        if (diff < 60) return `${Math.round(diff)}m ago`;
        if (diff < 1440) return `${Math.round(diff/60)}h ago`;
        return `${Math.round(diff/1440)}d ago`;
    };

    return (
        <TPCLayout pageTitle="Incoming Tickets — Queue" openTicketCount={tickets.length}>
            {/* Controls */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>
                <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                    <span style={{ fontSize:'0.85rem', color:'#64748b', fontWeight:600 }}>
                        📥 {sorted.length} unassigned ticket{sorted.length !== 1 ? 's' : ''}
                    </span>
                    {sorted.filter(t=>t.priority==='urgent').length > 0 && (
                        <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#ef4444', background:'#fef2f2', padding:'2px 8px', borderRadius:999 }}>
                            ⚡ {sorted.filter(t=>t.priority==='urgent').length} URGENT
                        </span>
                    )}
                </div>
                <div style={{ display:'flex', gap:'0.5rem' }}>
                    <span style={{ fontSize:'0.82rem', color:'#64748b', alignSelf:'center' }}>Sort:</span>
                    {['priority','time'].map(s => (
                        <button key={s} onClick={() => setSortBy(s)} style={{
                            padding:'6px 14px', borderRadius:999, border:'1px solid #e2e8f0',
                            background: sortBy===s ? '#3b82f6' : '#fff',
                            color: sortBy===s ? '#fff' : '#374151',
                            cursor:'pointer', fontWeight:600, fontSize:'0.8rem', transition:'all 0.15s'
                        }} id={`incoming-sort-${s}`}>{s === 'priority' ? '🎯 Priority' : '🕐 Time'}</button>
                    ))}
                    <button onClick={load} style={{ padding:'6px 14px', borderRadius:999, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:'0.8rem', color:'#374151' }}>↺ Refresh</button>
                </div>
            </div>

            {/* Ticket Queue */}
            {loading ? (
                <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                    {[1,2,3].map(i => <div key={i} style={{ height:100, borderRadius:12, background:'#f1f5f9', animation:'pulse 1.5s infinite' }} />)}
                </div>
            ) : sorted.length === 0 ? (
                <div style={{ textAlign:'center', padding:'4rem', background:'#fff', borderRadius:12, border:'1px dashed #cbd5e1' }}>
                    <div style={{ fontSize:'3rem', marginBottom:'0.75rem' }}>🎉</div>
                    <div style={{ fontWeight:700, color:'#0f172a', fontSize:'1.1rem', marginBottom:'0.5rem' }}>Queue Empty!</div>
                    <div style={{ color:'#64748b', fontSize:'0.88rem' }}>No unassigned tickets waiting. Great job team!</div>
                </div>
            ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                    {sorted.map((ticket) => {
                        const isAccepting = accepting[ticket._id];
                        return (
                            <div key={ticket._id} style={{
                                background:'#fff', borderRadius:12, border:`1px solid ${ticket.priority==='urgent'?'#fecaca':ticket.priority==='high'?'#fed7aa':'#e2e8f0'}`,
                                padding:'1.1rem 1.25rem', display:'flex', gap:'1rem', alignItems:'flex-start',
                                boxShadow: ticket.priority==='urgent' ? '0 0 0 1px #ef4444, 0 2px 8px rgba(239,68,68,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
                                transition:'box-shadow 0.15s'
                            }}>
                                {/* Priority indicator */}
                                <div style={{ width:4, alignSelf:'stretch', borderRadius:4, background:PRIORITY_COLORS[ticket.priority]||'#64748b', flexShrink:0 }} />

                                <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', alignItems:'center', marginBottom:'0.4rem' }}>
                                        <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#94a3b8' }}>#{ticket._id.slice(-6).toUpperCase()}</span>
                                        <span style={{ fontSize:'0.72rem', fontWeight:700, color:PRIORITY_COLORS[ticket.priority], background:PRIORITY_BG[ticket.priority], padding:'2px 8px', borderRadius:999 }}>
                                            {ticket.priority?.toUpperCase()}
                                        </span>
                                        <span style={{ fontSize:'0.72rem', color:'#64748b', background:'#f1f5f9', padding:'2px 8px', borderRadius:999 }}>
                                            {AI_CATEGORIES[ticket.category] || ticket.category}
                                        </span>
                                        <span style={{ fontSize:'0.7rem', color:'#94a3b8', marginLeft:'auto' }}>
                                            🕐 {timeAgo(ticket.createdAt)}
                                        </span>
                                    </div>
                                    <div style={{ fontWeight:700, color:'#0f172a', fontSize:'0.95rem', marginBottom:'0.3rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                        {ticket.title}
                                    </div>
                                    <div style={{ fontSize:'0.82rem', color:'#475569', lineHeight:1.5, marginBottom:'0.5rem', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                                        {ticket.description}
                                    </div>
                                    <div style={{ fontSize:'0.78rem', color:'#64748b' }}>
                                        👤 Student: <strong>{ticket.studentId}</strong>
                                        {ticket.department && <> &nbsp;|&nbsp; 🏫 {ticket.department.toUpperCase()}</>}
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', flexShrink:0 }}>
                                    <button
                                        id={`accept-${ticket._id}`}
                                        onClick={() => handleAccept(ticket)}
                                        disabled={isAccepting}
                                        style={{ padding:'8px 18px', background:'#10b981', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:'0.82rem', cursor:'pointer', transition:'all 0.15s', minWidth:100 }}
                                    >
                                        {isAccepting ? '⏳ Accepting...' : '✅ Accept'}
                                    </button>
                                    <button
                                        id={`assign-${ticket._id}`}
                                        onClick={() => { setAssignTicket(ticket); setAssignTo(''); }}
                                        style={{ padding:'8px 18px', background:'#3b82f6', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:'0.82rem', cursor:'pointer', transition:'all 0.15s' }}
                                    >
                                        👤 Assign
                                    </button>
                                    <button
                                        id={`view-${ticket._id}`}
                                        onClick={() => navigate(`/tpc/tickets/${ticket._id}`)}
                                        style={{ padding:'8px 18px', background:'#f1f5f9', color:'#374151', border:'1px solid #e2e8f0', borderRadius:8, fontWeight:600, fontSize:'0.82rem', cursor:'pointer' }}
                                    >
                                        👁 View
                                    </button>
                                    <button
                                        id={`reject-${ticket._id}`}
                                        onClick={() => { setRejectTicket(ticket); setRejectReason(''); }}
                                        style={{ padding:'8px 18px', background:'#fef2f2', color:'#ef4444', border:'1px solid #fecaca', borderRadius:8, fontWeight:600, fontSize:'0.82rem', cursor:'pointer' }}
                                    >
                                        ❌ Reject
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Reject Modal */}
            <Modal show={!!rejectTicket} onHide={() => setRejectTicket(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize:'1rem', fontWeight:700 }}>❌ Reject Ticket</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p style={{ fontSize:'0.88rem', color:'#475569', marginBottom:'1rem' }}>
                        Ticket: <strong>{rejectTicket?.title}</strong>
                    </p>
                    <Form.Group>
                        <Form.Label style={{ fontWeight:600, fontSize:'0.85rem' }}>Reason for rejection *</Form.Label>
                        <Form.Control
                            as="textarea" rows={3}
                            placeholder="Please explain why this ticket is being rejected..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            id="reject-reason-input"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={() => setRejectTicket(null)}>Cancel</Button>
                    <Button variant="danger" size="sm" onClick={handleReject} disabled={rejecting || !rejectReason.trim()}>
                        {rejecting ? 'Rejecting...' : 'Confirm Reject'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Assign Modal */}
            <Modal show={!!assignTicket} onHide={() => setAssignTicket(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize:'1rem', fontWeight:700 }}>👤 Assign Ticket</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p style={{ fontSize:'0.88rem', color:'#475569', marginBottom:'1rem' }}>
                        Assign: <strong>{assignTicket?.title}</strong>
                    </p>
                    <Form.Group>
                        <Form.Label style={{ fontWeight:600, fontSize:'0.85rem' }}>Select TPC Member *</Form.Label>
                        <Form.Select value={assignTo} onChange={e => setAssignTo(e.target.value)} id="assign-member-select">
                            <option value="">-- Choose team member --</option>
                            {tpcMembers.map(m => (
                                <option key={m._id} value={m._id}>{m.name} ({m.studentId})</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={() => setAssignTicket(null)}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={handleAssign} disabled={assigning || !assignTo}>
                        {assigning ? 'Assigning...' : '✅ Assign Ticket'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </TPCLayout>
    );
};

export default TPCIncomingTickets;
