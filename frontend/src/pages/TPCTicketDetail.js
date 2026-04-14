import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBold, FaItalic, FaUnderline, FaListOl, FaLink, FaPaperclip, FaChevronDown, FaChevronUp, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import TPCLayout from '../components/TPCLayout';
import { ticketAPI, userAPI, activityLogAPI } from '../services/api';
import '../styles/TPCTicketDetail.css';

const TPCTicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [studentInfo, setStudentInfo] = useState(null);
    const [previousTickets, setPreviousTickets] = useState([]);
    const [activityLog, setActivityLog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [responseText, setResponseText] = useState('');
    const [internalNote, setInternalNote] = useState('');
    const [showInternalNotes, setShowInternalNotes] = useState(true);
    const [sendingResponse, setSendingResponse] = useState(false);

    useEffect(() => { loadTicketDetail(); }, [id]);

    const loadTicketDetail = async () => {
        try {
            setLoading(true);
            const res = await ticketAPI.getTicket(id);
            setTicket(res.data.ticket);
            setStudentInfo(res.data.studentInfo);
            setPreviousTickets(res.data.previousTickets || []);

            // Load activity log
            try {
                const actRes = await activityLogAPI.getTicketActivity(id);
                setActivityLog(actRes.data.logs || []);
            } catch { setActivityLog([]); }
        } catch (error) {
            console.error('Failed to load ticket:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await ticketAPI.updateTicket(id, { status: newStatus });
            loadTicketDetail();
        } catch (err) { console.error('Status update failed:', err); }
    };

    const handleSendResponse = async () => {
        if (!responseText.trim()) return;
        try {
            setSendingResponse(true);
            await ticketAPI.updateTicket(id, {
                tpcResponse: responseText,
                status: ticket.status === 'open' ? 'in-progress' : ticket.status
            });
            setResponseText('');
            loadTicketDetail();
        } catch (err) {
            console.error('Send response failed:', err);
        } finally {
            setSendingResponse(false);
        }
    };

    const handleResolve = async () => {
        try {
            setSendingResponse(true);
            await ticketAPI.updateTicket(id, { 
                status: 'resolved',
                tpcResponse: responseText.trim() || 'Ticket resolved by TPC staff'
            });
            toast.success('Ticket marked as resolved successfully');
            setResponseText('');
            loadTicketDetail();
        } catch (err) { 
            console.error('Resolve failed:', err);
            toast.error('Failed to resolve ticket');
        } finally {
            setSendingResponse(false);
        }
    };

    const handleEscalate = async () => {
        const reason = prompt('Please enter the reason for escalation:');
        if (reason === null) return; // Cancelled
        
        try {
            await ticketAPI.escalateTicket(id, reason || 'Escalated by TPC staff');
            toast.success('Ticket escalated successfully');
            loadTicketDetail();
        } catch (err) { 
            console.error('Escalate failed:', err);
            toast.error('Failed to escalate ticket');
        }
    };

    const handleClose = async () => {
        if (!window.confirm('Are you sure you want to close this ticket?')) return;
        try {
            await ticketAPI.updateTicket(id, { status: 'closed' });
            toast.success('Ticket closed successfully');
            loadTicketDetail();
        } catch (err) { 
            console.error('Close failed:', err);
            toast.error('Failed to close ticket');
        }
    };

    const handleReopen = async () => {
        const reason = window.prompt('Please describe the reason for reopening this ticket:');
        if (reason === null) return; // cancelled
        if (!reason.trim()) {
            toast.error('A reason is required to reopen the ticket');
            return;
        }
        
        try {
            await ticketAPI.reopenTicket(id, reason.trim());
            toast.success('Ticket reopened successfully');
            loadTicketDetail();
        } catch (err) {
            console.error('Reopen failed:', err);
            toast.error('Failed to reopen ticket');
        }
    };

    const handleReassign = async () => {
        const staffId = prompt('Enter the ID or email of the TPC Member to Assign:');
        if (!staffId) return;
        try {
            await ticketAPI.assignTicket(id, staffId);
            toast.success('Ticket actively reassigned!');
            loadTicketDetail();
        } catch (err) {
            toast.error('Failed to reassign');
        }
    };

    const handleForward = async () => {
        const department = prompt('Enter target Department/Team to forward this to:');
        if (!department) return;
        try {
            // Re-using escalate logic physically but semantically changing department conceptually
            await ticketAPI.updateTicket(id, { category: department.toLowerCase(), tpcResponse: `Forwarded to ${department}` });
            toast.success('Ticket successfully forwarded');
            loadTicketDetail();
        } catch (err) {
            toast.error('Forward failed');
        }
    };

    const handleFollowup = async () => {
        const days = prompt('How many days until follow-up?');
        if (!days || isNaN(days)) return;
        toast.info(`Follow-up notification scheduled in ${days} days.`);
        // Note: Real implementation would save to DB nextFollowup date
    };

    const handleAddNote = async () => {
        if (!internalNote.trim()) return;
        try {
            await ticketAPI.addInternalNote(id, internalNote);
            setInternalNote('');
            alert('Internal note added successfully');
            loadTicketDetail();
        } catch (err) {
            console.error('Add note failed:', err);
            alert('Failed to add internal note');
        }
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const formatTime = (d) => new Date(d).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const getStatusBadgeClass = (s) => {
        const map = { 'open': 'open', 'in-progress': 'in-progress', 'resolved': 'resolved', 'closed': 'closed' };
        return map[s] || 'closed';
    };

    const categoryNames = {
        'company-eligibility': 'Academic',
        'internship-confirmation': 'Financial Aid',
        'offer-letter': 'Housing',
        'document-verification': 'IT Support',
        'interview-schedule': 'Admissions',
        'placement-process': 'Technical Support',
        'other': 'Other',
    };

    if (loading) {
        return (
            <TPCLayout pageTitle="Ticket Detail" openTicketCount={0}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <p style={{ color: '#9ca3af' }}>Loading ticket...</p>
                </div>
            </TPCLayout>
        );
    }

    if (!ticket) {
        return (
            <TPCLayout pageTitle="Ticket Detail" openTicketCount={0}>
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <p style={{ color: '#9ca3af' }}>Ticket not found</p>
                    <button className="tpc-btn tpc-btn-primary" onClick={() => navigate('/tpc/tickets')}>Back to Tickets</button>
                </div>
            </TPCLayout>
        );
    }

    const studentInitial = studentInfo?.name?.charAt(0)?.toUpperCase() || 'S';

    return (
        <TPCLayout pageTitle="" openTicketCount={0}>
            {/* Back button */}
            <button
                onClick={() => navigate('/tpc/tickets')}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'none', border: 'none', color: '#3b82f6',
                    fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
                    marginBottom: '1.25rem', padding: 0
                }}
            >
                <FaArrowLeft /> Back to Tickets
            </button>

            <div className="ticket-detail-layout">
                {/* ===== LEFT: Student Info ===== */}
                <div>
                    <div className="ticket-student-panel">
                        <div className="ticket-student-header">
                            <div className="ticket-student-avatar">
                                {studentInfo?.profilePhoto ? (
                                    <img src={studentInfo.profilePhoto} alt={studentInfo.name} />
                                ) : studentInitial}
                            </div>
                            <p className="ticket-student-name">{studentInfo?.name || 'Student'}</p>
                        </div>
                        <div className="ticket-student-body">
                            <div className="ticket-student-field">
                                <div className="ticket-student-label">Student ID</div>
                                <div className="ticket-student-value">{ticket.studentId}</div>
                            </div>
                            <div className="ticket-student-field">
                                <div className="ticket-student-label">Department</div>
                                <div className="ticket-student-value">{studentInfo?.department?.toUpperCase() || 'N/A'}</div>
                            </div>
                            <div className="ticket-student-field">
                                <div className="ticket-student-label">Email</div>
                                <div className="ticket-student-value" style={{ fontSize: '0.82rem', wordBreak: 'break-all' }}>
                                    {studentInfo?.email || studentInfo?.studentEmail || 'N/A'}
                                </div>
                            </div>
                            <div className="ticket-student-field">
                                <div className="ticket-student-label">Phone</div>
                                <div className="ticket-student-value">{studentInfo?.mobileNumber || 'N/A'}</div>
                            </div>
                        </div>

                        {/* Previous Tickets */}
                        {previousTickets.length > 0 && (
                            <div className="ticket-prev-tickets">
                                <h4>Previous Tickets</h4>
                                {previousTickets.slice(0, 4).map(pt => (
                                    <div key={pt._id} className="ticket-prev-item" onClick={() => navigate(`/tpc/tickets/${pt._id}`)}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="ticket-prev-id">TPC-{pt._id.slice(-4).toUpperCase()}</span>
                                            <span className={`tpc-badge ${getStatusBadgeClass(pt.status)}`} style={{ fontSize: '0.65rem' }}>
                                                {pt.status === 'in-progress' ? 'In Progress' : pt.status?.charAt(0).toUpperCase() + pt.status?.slice(1)}
                                            </span>
                                        </div>
                                        <div className="ticket-prev-title">{pt.title}</div>
                                        <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: 2 }}>{formatDate(pt.createdAt)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ===== CENTER: Ticket Content ===== */}
                <div className="ticket-main-panel">
                    {/* Header */}
                    <div className="ticket-main-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h2 className="ticket-id-title">Ticket #TPC-{ticket._id.slice(-4).toUpperCase()}</h2>
                            <select
                                className="ticket-status-dropdown"
                                value={ticket.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                style={{
                                    background: ticket.status === 'in-progress' ? '#eff6ff' :
                                        ticket.status === 'open' ? '#fef2f2' :
                                        ticket.status === 'resolved' ? '#f0fdf4' : '#f3f4f6',
                                    color: ticket.status === 'in-progress' ? '#2563eb' :
                                        ticket.status === 'open' ? '#dc2626' :
                                        ticket.status === 'resolved' ? '#16a34a' : '#6b7280'
                                }}
                            >
                                <option value="open">Open</option>
                                <option value="in-progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                        <div className="ticket-meta-badges">
                            <span className={`tpc-badge ${ticket.priority === 'urgent' || ticket.priority === 'high' ? 'high' : ticket.priority}`}>
                                {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)} Priority
                            </span>
                            <span className="tpc-badge" style={{ background: '#f3f4f6', color: '#374151' }}>
                                Category: {categoryNames[ticket.category] || ticket.category}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            <strong>Subject:</strong> {ticket.title}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="ticket-description-section">
                        <div className="ticket-description-label">Description</div>
                        <p className="ticket-description-text">{ticket.description}</p>
                    </div>

                    {/* Attachments (placeholder) */}
                    <div className="ticket-attachments">
                        <div className="ticket-description-label">Attachments</div>
                        <div className="ticket-attachment-item">
                            <div className="ticket-attachment-icon">📎</div>
                            <div>
                                <div className="ticket-attachment-name">screenshot_error.png</div>
                                <div className="ticket-attachment-size">2.1 MB</div>
                            </div>
                            <FaDownload className="ticket-attachment-download" />
                        </div>
                    </div>

                    {/* Conversation Thread */}
                    <div className="ticket-conversation">
                        <h4>Conversation Thread</h4>

                        {/* Student's original message */}
                        <div className="ticket-message student">
                            <div className="ticket-message-avatar">{studentInitial}</div>
                            <div className="ticket-message-bubble">
                                <div className="ticket-message-header">
                                    <div>
                                        <span className="ticket-message-sender">{studentInfo?.name || 'Student'}</span>
                                    </div>
                                    <span className="ticket-message-time">{formatTime(ticket.createdAt)}</span>
                                </div>
                                <p className="ticket-message-text">{ticket.description}</p>
                            </div>
                        </div>

                        {/* Full Response Thread */}
                        {ticket.responses && ticket.responses.length > 0 ? (
                            ticket.responses.map((res, i) => (
                                <div key={i} className={`ticket-message ${res.senderRole === 'student' ? 'student' : 'staff'}`}>
                                    <div className="ticket-message-avatar">{res.senderName?.charAt(0) || 'U'}</div>
                                    <div className="ticket-message-bubble">
                                        <div className="ticket-message-header">
                                            <div>
                                                <span className="ticket-message-sender">{res.senderName}</span>
                                                {res.senderRole !== 'student' && <span className="ticket-message-badge" style={{ marginLeft: '0.5rem' }}>Staff Message</span>}
                                            </div>
                                            <span className="ticket-message-time">{formatTime(res.timestamp)}</span>
                                        </div>
                                        <p className="ticket-message-text">{res.message}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            ticket.tpcResponse && (
                                <div className="ticket-message staff">
                                    <div className="ticket-message-avatar">T</div>
                                    <div className="ticket-message-bubble">
                                        <div className="ticket-message-header">
                                            <div>
                                                <span className="ticket-message-sender">TPC Staff</span>
                                                <span className="ticket-message-badge" style={{ marginLeft: '0.5rem' }}>Staff Message</span>
                                            </div>
                                            <span className="ticket-message-time">{formatTime(ticket.updatedAt)}</span>
                                        </div>
                                        <p className="ticket-message-text">{ticket.tpcResponse}</p>
                                    </div>
                                </div>
                            )
                        )}
                    </div>

                    {/* Add Response */}
                    <div className="ticket-add-response">
                        <h4>Add Response</h4>
                        <div className="ticket-response-toolbar">
                            <button className="ticket-toolbar-btn"><FaBold /></button>
                            <button className="ticket-toolbar-btn"><FaItalic /></button>
                            <button className="ticket-toolbar-btn"><FaUnderline /></button>
                            <button className="ticket-toolbar-btn"><FaListOl /></button>
                            <button className="ticket-toolbar-btn"><FaLink /></button>
                            <button className="ticket-toolbar-btn"><FaPaperclip /></button>
                        </div>
                        <textarea
                            className="ticket-response-textarea"
                            placeholder="Type your reply here..."
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                        />
                        <button
                            className="ticket-send-btn"
                            onClick={handleSendResponse}
                            disabled={sendingResponse || !responseText.trim()}
                        >
                            {sendingResponse ? 'Sending...' : 'Send Reply'}
                        </button>
                        <div style={{ clear: 'both' }} />
                    </div>

                    {/* Internal Notes */}
                    <div className="ticket-internal-notes">
                        <div className="ticket-internal-header" onClick={() => setShowInternalNotes(!showInternalNotes)}>
                            <h4>🔒 Internal Notes (Only visible to staff)</h4>
                            {showInternalNotes ? <FaChevronUp style={{ color: '#92400e' }} /> : <FaChevronDown style={{ color: '#92400e' }} />}
                        </div>
                        {showInternalNotes && (
                            <>
                                {ticket.internalNotes && ticket.internalNotes.length > 0 ? (
                                    ticket.internalNotes.map((note, i) => (
                                        <div key={i} className="ticket-note-item">
                                            <div className="ticket-note-author">{note.authorName} ({formatTime(note.timestamp)})</div>
                                            <div className="ticket-note-text">{note.note}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="ticket-note-item">
                                        <div className="ticket-note-text" style={{ color: '#9ca3af' }}>No internal notes yet</div>
                                    </div>
                                )}
                                <div style={{ marginTop: '0.75rem' }}>
                                    <textarea
                                        value={internalNote}
                                        onChange={(e) => setInternalNote(e.target.value)}
                                        placeholder="Add internal note..."
                                        style={{
                                            width: '100%', minHeight: 60, border: '1px solid #fde68a',
                                            borderRadius: 8, padding: '0.6rem', fontSize: '0.82rem',
                                            fontFamily: 'Inter, sans-serif', resize: 'vertical', outline: 'none',
                                            background: '#fffbeb'
                                        }}
                                    />
                                    <button
                                        className="tpc-btn tpc-btn-outline"
                                        style={{ marginTop: '0.5rem', fontSize: '0.78rem' }}
                                        onClick={handleAddNote}
                                    >
                                        Add Note
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ===== RIGHT: Actions & Activity ===== */}
                <div className="ticket-actions-panel">
                    {/* Action Buttons */}
                    <div className="ticket-actions-card">
                        <h4>Action Buttons Stack</h4>
                        <button className="ticket-action-btn ticket-action-resolve" onClick={handleResolve}>
                            ✓ Resolve
                        </button>
                        <button className="ticket-action-btn ticket-action-escalate" onClick={() => handleEscalate()}>
                            ⚡ Escalate
                        </button>
                        <button className="ticket-action-btn ticket-action-close" onClick={handleForward} style={{background:'#f3f4f6', color:'#3b82f6', border:'1px solid #bfdbfe', marginTop:'8px'}}>
                            ↪️ Forward
                        </button>
                        <button className="ticket-action-btn ticket-action-close" onClick={handleFollowup} style={{background:'#fffbeb', color:'#d97706', border:'1px solid #fde68a', marginTop:'8px', marginBottom: '8px'}}>
                            ⏰ Set Follow-up
                        </button>
                        <button className="ticket-action-btn ticket-action-close" onClick={handleClose}>
                            Close
                        </button>
                        <button className="ticket-action-btn ticket-action-reopen" onClick={handleReopen}>
                            ↻ Reopen
                        </button>
                    </div>

                    {/* Activity Log */}
                    <div className="ticket-actions-card">
                        <h4>Activity Log</h4>
                        <div className="ticket-activity-log">
                            {activityLog.length > 0 ? (
                                activityLog.map((log, i) => (
                                    <div key={i} className="ticket-activity-item">
                                        <div className="ticket-activity-icon">
                                            {log.action === 'ticket-created' ? '📝' :
                                             log.action === 'escalated' ? '⚡' :
                                             log.action === 'ticket-reopened' ? '↻' : '📋'}
                                        </div>
                                        <div className="ticket-activity-content">
                                            <div className="ticket-activity-text">
                                                {log.description || log.action?.replace(/-/g, ' ')}
                                            </div>
                                            <div className="ticket-activity-time">{formatTime(log.timestamp)}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="ticket-activity-item">
                                        <div className="ticket-activity-icon">📝</div>
                                        <div className="ticket-activity-content">
                                            <div className="ticket-activity-text">Ticket created</div>
                                            <div className="ticket-activity-time">{formatTime(ticket.createdAt)}</div>
                                        </div>
                                    </div>
                                    {ticket.tpcResponse && (
                                        <div className="ticket-activity-item">
                                            <div className="ticket-activity-icon">💬</div>
                                            <div className="ticket-activity-content">
                                                <div className="ticket-activity-text">Response sent by TPC Staff</div>
                                                <div className="ticket-activity-time">{formatTime(ticket.updatedAt)}</div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Assigned Staff */}
                    <div className="ticket-actions-card">
                        <h4>Assigned Staff</h4>
                        <div className="ticket-assigned-staff">
                            <div className="ticket-assigned-avatar">T</div>
                            <div>
                                <div className="ticket-assigned-name">{ticket?.assignedTo?.name || 'TPC Staff'}</div>
                                <div className="ticket-assigned-role">Support Specialist</div>
                                <button className="ticket-reassign-btn" onClick={handleReassign}>Reassign Ticket</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TPCLayout>
    );
};

export default TPCTicketDetail;
