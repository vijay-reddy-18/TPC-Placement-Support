import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TPCLayout from '../components/TPCLayout';
import { ticketAPI } from '../services/api';

const SLA_RULES = [
    { priority: 'urgent', label: '🔥 Urgent',  hours: 4,  color: '#ef4444', bg: '#fef2f2' },
    { priority: 'high',   label: '🔴 High',    hours: 24, color: '#f97316', bg: '#fff7ed' },
    { priority: 'medium', label: '🟡 Medium',  hours: 48, color: '#f59e0b', bg: '#fffbeb' },
    { priority: 'low',    label: '🟢 Low',     hours: 72, color: '#10b981', bg: '#f0fdf4' },
];

const getSLAInfo = (ticket) => {
    const rule = SLA_RULES.find(r => r.priority === ticket.priority) || SLA_RULES[2];
    const created = new Date(ticket.createdAt);
    const deadline = new Date(created.getTime() + rule.hours * 3600000);
    const now = new Date();
    const remainMs = deadline - now;
    const remainHrs = remainMs / 3600000;
    const elapsed = ((now - created) / (rule.hours * 3600000)) * 100;

    let status, statusColor, statusBg;
    if (remainHrs < 0) { status = 'BREACHED'; statusColor = '#ef4444'; statusBg = '#fef2f2'; }
    else if (remainHrs < 2) { status = 'AT RISK'; statusColor = '#f59e0b'; statusBg = '#fffbeb'; }
    else { status = 'ON TRACK'; statusColor = '#10b981'; statusBg = '#f0fdf4'; }

    const formatRemain = () => {
        if (remainHrs < 0) {
            const over = Math.abs(remainHrs);
            return `${Math.floor(over)}h ${Math.round((over%1)*60)}m overdue`;
        }
        if (remainHrs < 1) return `${Math.round(remainHrs*60)}m left`;
        return `${remainHrs.toFixed(1)}h left`;
    };

    return { status, statusColor, statusBg, elapsed: Math.min(100, Math.max(0, elapsed)), remain: formatRemain(), deadline };
};

const CountdownTimer = ({ ticket }) => {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(interval);
    }, []);
    const info = getSLAInfo(ticket);
    return (
        <span style={{ fontSize:'0.75rem', fontWeight:700, color:info.statusColor, background:info.statusBg, padding:'3px 8px', borderRadius:999 }}>
            {info.remain}
        </span>
    );
};

const TPCSLAPage = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('breached');

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await ticketAPI.getAllTickets(null, null, null, 1, 500);
                const active = (res.data.tickets || []).filter(t => !['resolved','closed'].includes(t.status));
                setTickets(active);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const categorize = (tix) => {
        const breached = [], atRisk = [], onTrack = [];
        tix.forEach(t => {
            const info = getSLAInfo(t);
            if (info.status === 'BREACHED') breached.push({ ...t, _sla: info });
            else if (info.status === 'AT RISK') atRisk.push({ ...t, _sla: info });
            else onTrack.push({ ...t, _sla: info });
        });
        return { breached, atRisk, onTrack };
    };

    const { breached, atRisk, onTrack } = categorize(tickets);
    const escalated = tickets.filter(t => t.isEscalated);

    const TABS = [
        { id: 'breached', label: '🔴 Breached',  count: breached.length,  color: '#ef4444' },
        { id: 'atrisk',   label: '🟡 At Risk',   count: atRisk.length,   color: '#f59e0b' },
        { id: 'escalated',label: '⚡ Escalated', count: escalated.length, color: '#7c3aed' },
        { id: 'rules',    label: '📋 SLA Rules',  count: null,             color: '#3b82f6' },
    ];

    const currentList = tab === 'breached' ? breached
        : tab === 'atrisk' ? atRisk
        : tab === 'escalated' ? escalated.map(t => ({ ...t, _sla: getSLAInfo(t) }))
        : [];

    return (
        <TPCLayout pageTitle="SLA & Escalation Dashboard" openTicketCount={breached.length + atRisk.length}>
            {/* Summary cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
                {[
                    { icon:'🔴', label:'SLA Breached', value:breached.length, color:'#ef4444', bg:'#fef2f2', action:()=>setTab('breached') },
                    { icon:'🟡', label:'At Risk (< 2h)', value:atRisk.length,  color:'#f59e0b', bg:'#fffbeb', action:()=>setTab('atrisk') },
                    { icon:'⚡', label:'Escalated',    value:escalated.length, color:'#7c3aed', bg:'#f5f3ff', action:()=>setTab('escalated') },
                    { icon:'🟢', label:'On Track',     value:onTrack.length,  color:'#10b981', bg:'#f0fdf4', action:()=>setTab('rules') },
                ].map(c => (
                    <div key={c.label} onClick={c.action} style={{
                        background:'#fff', borderRadius:12, border:`1px solid ${c.color}25`,
                        padding:'1.1rem 1.25rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'1rem',
                        boxShadow:'0 2px 8px rgba(0,0,0,0.04)', transition:'transform 0.15s, box-shadow 0.15s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'; }}
                    >
                        <div style={{ width:44, height:44, borderRadius:10, background:c.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0 }}>{c.icon}</div>
                        <div>
                            <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.04em' }}>{c.label}</div>
                            <div style={{ fontSize:'1.75rem', fontWeight:800, color:c.color, lineHeight:1.1 }}>{c.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden' }}>
                <div style={{ display:'flex', borderBottom:'1px solid #e2e8f0', overflowX:'auto' }}>
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)} style={{
                            padding:'0.875rem 1.25rem', border:'none', background:'none', cursor:'pointer',
                            fontWeight:700, fontSize:'0.85rem', whiteSpace:'nowrap',
                            color: tab === t.id ? t.color : '#64748b',
                            borderBottom: tab === t.id ? `3px solid ${t.color}` : '3px solid transparent',
                            transition:'all 0.15s', display:'flex', alignItems:'center', gap:'0.5rem'
                        }} id={`sla-tab-${t.id}`}>
                            {t.label}
                            {t.count !== null && (
                                <span style={{ background: tab===t.id ? t.color : '#e2e8f0', color: tab===t.id ? '#fff' : '#64748b', borderRadius:999, padding:'1px 7px', fontSize:'0.7rem', fontWeight:800 }}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {tab === 'rules' ? (
                    <div style={{ padding:'1.5rem' }}>
                        <h3 style={{ fontWeight:700, color:'#0f172a', marginBottom:'0.5rem', fontSize:'1rem' }}>📋 SLA Configuration Rules</h3>
                        <p style={{ color:'#64748b', fontSize:'0.85rem', marginBottom:'1.25rem' }}>Maximum resolution time targets per priority level</p>
                        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                            {SLA_RULES.map(rule => (
                                <div key={rule.priority} style={{ display:'flex', alignItems:'center', gap:'1.5rem', padding:'1rem 1.25rem', background:'#f8fafc', borderRadius:10, border:`1px solid ${rule.color}20` }}>
                                    <div style={{ width:120, fontWeight:700, fontSize:'0.9rem', color:rule.color }}>{rule.label}</div>
                                    <div style={{ flex:1 }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:6 }}>
                                            <span style={{ fontSize:'0.85rem', fontWeight:600, color:'#0f172a' }}>Resolve within <strong style={{ color:rule.color }}>{rule.hours} hours</strong></span>
                                        </div>
                                        <div style={{ height:6, borderRadius:4, background:'#e2e8f0', overflow:'hidden' }}>
                                            <div style={{ height:'100%', width:`${(rule.hours/72)*100}%`, background:rule.color, borderRadius:4 }} />
                                        </div>
                                    </div>
                                    <div style={{ minWidth:120, textAlign:'right' }}>
                                        <span style={{ fontSize:'0.78rem', fontWeight:600, color:'#64748b' }}>
                                            Breached if &gt; {rule.hours}h
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop:'1.5rem', padding:'1rem 1.25rem', background:'#eff6ff', borderRadius:10, border:'1px solid #bfdbfe', fontSize:'0.85rem', color:'#1e40af' }}>
                            ℹ️ <strong>Escalation Rule:</strong> Tickets breaching SLA are automatically flagged. If breached for more than 1 additional hour, they are escalated to Admin for override.
                        </div>
                    </div>
                ) : loading ? (
                    <div style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>
                        <div className="spinner-border text-primary" style={{ width:30, height:30 }} />
                    </div>
                ) : currentList.length === 0 ? (
                    <div style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>
                        <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>🎉</div>
                        <div style={{ fontWeight:700, color:'#0f172a', marginBottom:'0.35rem' }}>All Clear!</div>
                        <div style={{ fontSize:'0.85rem' }}>No tickets in this category right now.</div>
                    </div>
                ) : (
                    <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
                            <thead>
                                <tr style={{ background:'#f8fafc' }}>
                                    {['Ticket ID','Title','Priority','Student','Assigned To','SLA Status','Time Remaining','Action'].map(h => (
                                        <th key={h} style={{ padding:'0.875rem 1rem', textAlign:'left', fontWeight:700, color:'#64748b', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.04em', borderBottom:'1px solid #e2e8f0' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentList.map((t, i) => {
                                    const sla = t._sla || getSLAInfo(t);
                                    return (
                                        <tr key={t._id} style={{ borderBottom:'1px solid #f1f5f9', background: sla.status==='BREACHED' ? '#fff5f5' : i%2===0 ? '#fff' : '#fafafa' }}>
                                            <td style={{ padding:'0.875rem 1rem', fontWeight:700, color:'#0f172a' }}>#{t._id.slice(-6).toUpperCase()}</td>
                                            <td style={{ padding:'0.875rem 1rem', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#1e293b' }}>{t.title}</td>
                                            <td style={{ padding:'0.875rem 1rem' }}>
                                                <span style={{ fontSize:'0.72rem', fontWeight:700, color:SLA_RULES.find(r=>r.priority===t.priority)?.color||'#64748b', background:SLA_RULES.find(r=>r.priority===t.priority)?.bg||'#f1f5f9', padding:'2px 8px', borderRadius:999 }}>
                                                    {t.priority?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding:'0.875rem 1rem', color:'#475569' }}>{t.studentId}</td>
                                            <td style={{ padding:'0.875rem 1rem', color:'#475569' }}>{t.assignedTo?.name || <span style={{ color:'#ef4444', fontWeight:600 }}>Unassigned</span>}</td>
                                            <td style={{ padding:'0.875rem 1rem' }}>
                                                <span style={{ fontSize:'0.72rem', fontWeight:700, color:sla.statusColor, background:sla.statusBg, padding:'3px 10px', borderRadius:999 }}>
                                                    {sla.status}
                                                </span>
                                            </td>
                                            <td style={{ padding:'0.875rem 1rem' }}>
                                                <CountdownTimer ticket={t} />
                                            </td>
                                            <td style={{ padding:'0.875rem 1rem' }}>
                                                <button onClick={() => navigate(`/tpc/tickets/${t._id}`)} style={{
                                                    padding:'5px 12px', background:'#3b82f6', color:'#fff', border:'none', borderRadius:6, fontWeight:600, fontSize:'0.78rem', cursor:'pointer'
                                                }} id={`sla-view-${t._id}`}>
                                                    View →
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </TPCLayout>
    );
};

export default TPCSLAPage;
