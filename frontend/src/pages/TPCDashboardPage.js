import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TPCLayout from '../components/TPCLayout';
import { ticketAPI, activityLogAPI } from '../services/api';
import { Badge, Button, Row, Col, Card, Table } from 'react-bootstrap';

const SLADeadlineHours = { urgent: 4, high: 24, medium: 48, low: 72 };

const getSLAStatus = (ticket) => {
    const created = new Date(ticket.createdAt);
    const now = new Date();
    const limitHrs = SLADeadlineHours[ticket.priority] || 48;
    const deadlineMs = created.getTime() + limitHrs * 3600000;
    const remainMs = deadlineMs - now.getTime();
    const remainHrs = remainMs / 3600000;
    if (remainHrs < 0) return { label: 'BREACHED', color: '#ef4444', bg: '#fef2f2', pct: 100 };
    if (remainHrs < 2) return { label: `${Math.round(remainHrs * 60)}m left`, color: '#f59e0b', bg: '#fffbeb', pct: Math.max(0, 100 - (remainHrs / limitHrs) * 100) };
    return { label: `${remainHrs.toFixed(1)}h left`, color: '#10b981', bg: '#f0fdf4', pct: Math.max(0, 100 - (remainHrs / limitHrs) * 100) };
};

const TPCDashboardPage = () => {
    const { } = {};
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [activityLogs, setActivityLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadDashboard(); }, []);

    // Auto-refresh every 30s for real-time
    useEffect(() => {
        const interval = setInterval(loadDashboard, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const [ticketsRes, statsRes] = await Promise.all([
                ticketAPI.getAllTickets(null, null, null, 1, 200),
                ticketAPI.getDashboardStats()
            ]);
            const allTickets = ticketsRes.data.tickets || [];
            setTickets(allTickets);
            setStats(statsRes.data.stats || null);

            // Build activity from recent ticket changes
            const recent = allTickets
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .slice(0, 10)
                .map(t => ({
                    id: t._id,
                    icon: t.status === 'resolved' ? '✅' : t.status === 'in-progress' ? '⏳' : t.isEscalated ? '⚡' : '📋',
                    text: t.status === 'resolved'
                        ? `Ticket #${t._id.slice(-5).toUpperCase()} resolved`
                        : t.isEscalated
                        ? `Ticket #${t._id.slice(-5).toUpperCase()} escalated`
                        : t.assignedTo
                        ? `Ticket #${t._id.slice(-5).toUpperCase()} assigned to ${t.assignedTo?.name || 'TPC'}`
                        : `Ticket #${t._id.slice(-5).toUpperCase()} opened`,
                    time: t.updatedAt
                }));
            setActivityLogs(recent);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const openTickets      = tickets.filter(t => t.status === 'open');
    const inProgressTickets= tickets.filter(t => t.status === 'in-progress');
    const resolvedToday    = tickets.filter(t => t.status === 'resolved' && (t.resolvedAt || t.updatedAt || '').startsWith(todayStr));
    const pendingCount     = tickets.filter(t => ['open','in-progress'].includes(t.status)).length;
    const slaBreached      = tickets.filter(t => {
        if (['resolved','closed'].includes(t.status)) return false;
        const created = new Date(t.createdAt);
        const limitHrs = SLADeadlineHours[t.priority] || 48;
        return (now - created) / 3600000 > limitHrs;
    });
    const nearBreach       = tickets.filter(t => {
        if (['resolved','closed'].includes(t.status)) return false;
        const created = new Date(t.createdAt);
        const limitHrs = SLADeadlineHours[t.priority] || 48;
        const remainHrs = limitHrs - (now - created) / 3600000;
        return remainHrs >= 0 && remainHrs <= 2;
    });

    // Workload: tickets per agent
    const agentMap = {};
    tickets.filter(t => t.assignedTo && !['resolved','closed'].includes(t.status)).forEach(t => {
        const name = t.assignedTo?.name || 'Unknown';
        agentMap[name] = (agentMap[name] || 0) + 1;
    });
    const agentWorkload = Object.entries(agentMap).sort((a,b) => b[1]-a[1]).slice(0,5);
    const maxLoad = agentWorkload[0]?.[1] || 1;

    const KPIs = [
        { icon: '🎫', label: 'Total Tickets', value: tickets.length, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', action: () => navigate('/tpc/tickets') },
        { icon: '⏳', label: 'Pending',        value: pendingCount,   color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  action: () => navigate('/tpc/tickets?status=open') },
        { icon: '🔴', label: 'SLA Breached',   value: slaBreached.length, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', action: () => navigate('/tpc/sla') },
        { icon: '✅', label: 'Resolved Today', value: resolvedToday.length, color: '#10b981', bg: 'rgba(16,185,129,0.08)', action: () => navigate('/tpc/tickets?status=resolved') },
    ];

    if (loading) {
        return (
            <TPCLayout pageTitle="TPC Dashboard" openTicketCount={0}>
                <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
                    <div className="spinner-border text-primary" role="status" />
                </div>
            </TPCLayout>
        );
    }

    return (
        <TPCLayout pageTitle="TPC Dashboard — Control Center" openTicketCount={openTickets.length}>

            {/* ===== KPI Cards ===== */}
            <Row className="mb-4 g-3">
                {KPIs.map(kpi => (
                    <Col key={kpi.label} xs={6} md={3}>
                        <Card
                            style={{ borderRadius:12, border:'none', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', cursor:'pointer', transition:'transform 0.15s, box-shadow 0.15s' }}
                            onClick={kpi.action}
                            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.05)'; }}
                        >
                            <Card.Body style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1.1rem' }}>
                                <div style={{ width:48, height:48, borderRadius:12, background:kpi.bg, color:kpi.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0 }}>
                                    {kpi.icon}
                                </div>
                                <div>
                                    <div style={{ fontSize:'0.75rem', color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>{kpi.label}</div>
                                    <div style={{ fontSize:'1.8rem', fontWeight:800, color:'#0f172a', lineHeight:1.1 }}>{kpi.value}</div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* ===== SLA Monitor + Workload ===== */}
            <Row className="mb-4 g-3">
                {/* SLA Monitor */}
                <Col md={7}>
                    <Card style={{ borderRadius:12, border:'none', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', height:'100%' }}>
                        <Card.Header style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'1rem 1.25rem', display:'flex', justifyContent:'space-between', alignItems:'center', borderRadius:'12px 12px 0 0' }}>
                            <div style={{ fontWeight:700, color:'#0f172a' }}>⏱️ SLA Monitor</div>
                            <Button variant="link" size="sm" style={{ textDecoration:'none', color:'#3b82f6', fontWeight:600 }} onClick={() => navigate('/tpc/sla')}>
                                View All →
                            </Button>
                        </Card.Header>
                        <Card.Body style={{ padding:'1rem', maxHeight:280, overflowY:'auto' }}>
                            {slaBreached.length === 0 && nearBreach.length === 0 && (
                                <div style={{ textAlign:'center', padding:'2rem', color:'#94a3b8', fontSize:'0.88rem' }}>
                                    🎉 All tickets within SLA limits!
                                </div>
                            )}
                            {[...slaBreached, ...nearBreach].slice(0,8).map(t => {
                                const sla = getSLAStatus(t);
                                return (
                                    <div key={t._id}
                                        style={{ display:'flex', gap:'0.75rem', alignItems:'center', padding:'0.6rem 0.5rem', borderBottom:'1px solid #f1f5f9', cursor:'pointer' }}
                                        onClick={() => navigate(`/tpc/tickets/${t._id}`)}
                                    >
                                        <div style={{ minWidth:80, fontSize:'0.72rem', fontWeight:700, color:'#64748b' }}>
                                            #{t._id.slice(-5).toUpperCase()}
                                        </div>
                                        <div style={{ flex:1, fontSize:'0.82rem', color:'#1e293b', fontWeight:500,  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                            {t.title}
                                        </div>
                                        <div style={{ minWidth:90 }}>
                                            <div style={{ fontSize:'0.7rem', fontWeight:700, color:sla.color, background:sla.bg, padding:'2px 8px', borderRadius:999, textAlign:'center' }}>
                                                {sla.label}
                                            </div>
                                            <div style={{ height:4, borderRadius:4, background:'#e2e8f0', marginTop:4, overflow:'hidden' }}>
                                                <div style={{ height:'100%', width:`${Math.min(100,sla.pct)}%`, background:sla.color, borderRadius:4, transition:'width 0.3s' }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Workload View */}
                <Col md={5}>
                    <Card style={{ borderRadius:12, border:'none', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', height:'100%' }}>
                        <Card.Header style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'1rem 1.25rem', borderRadius:'12px 12px 0 0' }}>
                            <div style={{ fontWeight:700, color:'#0f172a' }}>👥 Team Workload</div>
                        </Card.Header>
                        <Card.Body style={{ padding:'1rem' }}>
                            {agentWorkload.length === 0 ? (
                                <div style={{ textAlign:'center', padding:'2rem', color:'#94a3b8', fontSize:'0.88rem' }}>No active assignments</div>
                            ) : agentWorkload.map(([name, count]) => (
                                <div key={name} style={{ marginBottom:'0.75rem' }}>
                                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.83rem', fontWeight:600, color:'#374151', marginBottom:4 }}>
                                        <span>👤 {name}</span>
                                        <span style={{ color: count > 5 ? '#ef4444' : count > 2 ? '#f59e0b' : '#10b981' }}>{count} active</span>
                                    </div>
                                    <div style={{ height:6, borderRadius:4, background:'#e2e8f0', overflow:'hidden' }}>
                                        <div style={{ height:'100%', width:`${(count/maxLoad)*100}%`, background: count > 5 ? '#ef4444' : count > 2 ? '#f59e0b' : '#10b981', borderRadius:4, transition:'width 0.3s' }} />
                                    </div>
                                </div>
                            ))}
                            <div style={{ marginTop:'1rem', padding:'0.75rem', background:'#f8fafc', borderRadius:8, fontSize:'0.8rem', color:'#64748b', textAlign:'center' }}>
                                Unassigned: <strong style={{ color:'#ef4444' }}>{openTickets.length}</strong> tickets
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* ===== New Queries + In Progress + Activity Feed ===== */}
            <Row className="mb-4 g-3">
                {/* New Queries */}
                <Col md={4}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 style={{ fontWeight:700, margin:0 }}>📥 New Queries</h6>
                        <Button variant="link" size="sm" style={{ textDecoration:'none', color:'#3b82f6', fontWeight:600, padding:0 }} onClick={() => navigate('/tpc/incoming')}>View All →</Button>
                    </div>
                    {openTickets.slice(0,4).length > 0 ? openTickets.slice(0,4).map(ticket => (
                        <Card key={ticket._id} className="mb-2 ticket-card-hover" style={{ borderRadius:10, border:'1px solid #e2e8f0', cursor:'pointer' }} onClick={() => navigate(`/tpc/tickets/${ticket._id}`)}>
                            <Card.Body style={{ padding:'0.875rem' }}>
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                    <div style={{ fontSize:'0.8rem', fontWeight:700, color:'#0f172a' }}>{ticket.studentId}</div>
                                    <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div style={{ fontSize:'0.83rem', color:'#1e293b', fontWeight:500, marginBottom:'0.5rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ticket.title}</div>
                                <Badge style={{ background: ticket.priority==='urgent'?'#fef2f2':ticket.priority==='high'?'#fef2f2':'#fffbeb', color: ticket.priority==='urgent'||ticket.priority==='high'?'#ef4444':'#d97706', padding:'3px 8px', borderRadius:6, fontSize:'0.7rem', fontWeight:700 }}>
                                    {ticket.priority?.toUpperCase()}
                                </Badge>
                            </Card.Body>
                        </Card>
                    )) : (
                        <div style={{ padding:'1.5rem', textAlign:'center', background:'#fff', borderRadius:10, border:'1px dashed #cbd5e1', color:'#94a3b8', fontSize:'0.85rem' }}>No new queries!</div>
                    )}
                </Col>

                {/* In Progress */}
                <Col md={4}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 style={{ fontWeight:700, margin:0 }}>⏳ In Progress</h6>
                        <Button variant="link" size="sm" style={{ textDecoration:'none', color:'#f59e0b', fontWeight:600, padding:0 }} onClick={() => navigate('/tpc/tickets?status=in-progress')}>View All →</Button>
                    </div>
                    {inProgressTickets.slice(0,4).length > 0 ? inProgressTickets.slice(0,4).map(ticket => {
                        const sla = getSLAStatus(ticket);
                        return (
                            <Card key={ticket._id} className="mb-2 ticket-card-hover" style={{ borderRadius:10, border:`1px solid ${sla.label==='BREACHED'?'#fecaca':'#e2e8f0'}`, cursor:'pointer' }} onClick={() => navigate(`/tpc/tickets/${ticket._id}`)}>
                                <Card.Body style={{ padding:'0.875rem' }}>
                                    <div style={{ fontSize:'0.83rem', fontWeight:600, color:'#0f172a', marginBottom:'0.4rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ticket.title}</div>
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                        <span style={{ fontSize:'0.72rem', color:'#64748b' }}>👤 {ticket.assignedTo?.name || 'Unassigned'}</span>
                                        <span style={{ fontSize:'0.7rem', fontWeight:700, color:sla.color, background:sla.bg, padding:'2px 7px', borderRadius:999 }}>{sla.label}</span>
                                    </div>
                                </Card.Body>
                            </Card>
                        );
                    }) : (
                        <div style={{ padding:'1.5rem', textAlign:'center', background:'#fff', borderRadius:10, border:'1px dashed #cbd5e1', color:'#94a3b8', fontSize:'0.85rem' }}>No active tickets</div>
                    )}
                </Col>

                {/* Live Activity Feed */}
                <Col md={4}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 style={{ fontWeight:700, margin:0 }}>⚡ Live Activity</h6>
                        <button onClick={loadDashboard} style={{ background:'none', border:'none', cursor:'pointer', color:'#3b82f6', fontSize:'0.8rem', fontWeight:600 }}>↺ Refresh</button>
                    </div>
                    <Card style={{ borderRadius:10, border:'1px solid #e2e8f0', height:'auto', maxHeight:340, overflowY:'auto' }}>
                        <Card.Body style={{ padding:'0.75rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                            {activityLogs.length === 0 ? (
                                <div style={{ textAlign:'center', padding:'1.5rem', color:'#94a3b8', fontSize:'0.85rem' }}>No recent activity</div>
                            ) : activityLogs.map((log, i) => (
                                <div key={i} style={{ display:'flex', gap:'0.6rem', alignItems:'flex-start', padding:'0.5rem', borderRadius:8, background: i===0?'#f0f9ff':'transparent', cursor:'pointer' }}
                                    onClick={() => navigate(`/tpc/tickets/${log.id}`)}>
                                    <span style={{ fontSize:'1rem', flexShrink:0 }}>{log.icon}</span>
                                    <div style={{ flex:1 }}>
                                        <div style={{ fontSize:'0.8rem', color:'#0f172a', fontWeight:500, lineHeight:1.3 }}>{log.text}</div>
                                        <div style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:2 }}>
                                            {new Date(log.time).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                                        </div>
                                    </div>
                                    {i===0 && <span style={{ fontSize:'0.65rem', fontWeight:700, color:'#3b82f6', background:'#eff6ff', padding:'2px 6px', borderRadius:999, flexShrink:0 }}>NEW</span>}
                                </div>
                            ))}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <style>{`
                .ticket-card-hover:hover { box-shadow: 0 4px 15px rgba(0,0,0,0.08) !important; transform: translateY(-1px); }
            `}</style>
        </TPCLayout>
    );
};

export default TPCDashboardPage;
