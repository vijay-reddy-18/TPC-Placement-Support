import React, { useState, useEffect } from 'react';
import TPCLayout from '../components/TPCLayout';
import { ticketAPI } from '../services/api';

const TPCTeamPage = () => {
    const [tickets, setTickets] = useState([]);
    const [tpcMembers, setTpcMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const api = (await import('../services/api')).default;
                const [ticketsRes, usersRes] = await Promise.all([
                    ticketAPI.getAllTickets(null, null, null, 1, 500),
                    api.get('/admin/users')
                ]);
                setTickets(ticketsRes.data.tickets || []);
                setTpcMembers((usersRes.data.users || []).filter(u => u.role === 'tpc'));
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    // Compute per-agent stats from ticket data
    const agentStats = tpcMembers.map(member => {
        const assigned = tickets.filter(t => t.assignedTo?._id === member._id || t.assignedTo === member._id);
        const active = assigned.filter(t => ['open','in-progress'].includes(t.status));
        const resolved = assigned.filter(t => t.status === 'resolved');
        const closed = assigned.filter(t => t.status === 'closed');

        // Avg response time (time from created to first response)
        const responseTimes = assigned
            .filter(t => t.responses && t.responses.length > 0 && t.responses[0].senderRole !== 'student')
            .map(t => {
                const firstResp = t.responses.find(r => r.senderRole !== 'student');
                if (!firstResp) return null;
                return (new Date(firstResp.timestamp) - new Date(t.createdAt)) / 3600000; // hours
            })
            .filter(v => v !== null && v > 0);

        const avgResponse = responseTimes.length > 0
            ? (responseTimes.reduce((a,b) => a+b, 0) / responseTimes.length).toFixed(1)
            : null;

        const resolutionRate = assigned.length > 0
            ? Math.round(((resolved.length + closed.length) / assigned.length) * 100)
            : 0;

        return { member, assigned: assigned.length, active: active.length, resolved: resolved.length, avgResponse, resolutionRate };
    });

    const filtered = agentStats.filter(a =>
        !search.trim() || a.member.name?.toLowerCase().includes(search.toLowerCase()) || a.member.studentId?.includes(search)
    );

    const totalActive = tickets.filter(t => ['open','in-progress'].includes(t.status)).length;

    return (
        <TPCLayout pageTitle="Team Management" openTicketCount={0}>
            {/* Summary row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
                {[
                    { icon:'👥', label:'TPC Members', value:tpcMembers.length, color:'#3b82f6', bg:'#eff6ff' },
                    { icon:'🎫', label:'Active Tickets', value:totalActive, color:'#f59e0b', bg:'#fffbeb' },
                    { icon:'✅', label:'Total Resolved', value:tickets.filter(t=>t.status==='resolved').length, color:'#10b981', bg:'#f0fdf4' },
                    { icon:'📊', label:'Avg Load / Agent', value:tpcMembers.length ? (totalActive / tpcMembers.length).toFixed(1) : 0, color:'#8b5cf6', bg:'#f5f3ff' },
                ].map(c => (
                    <div key={c.label} style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:'1.1rem 1.25rem', display:'flex', alignItems:'center', gap:'1rem', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div style={{ width:44, height:44, borderRadius:10, background:c.bg, color:c.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0 }}>{c.icon}</div>
                        <div>
                            <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.04em' }}>{c.label}</div>
                            <div style={{ fontSize:'1.75rem', fontWeight:800, color:c.color, lineHeight:1.1 }}>{c.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:'7px 12px', marginBottom:'1.25rem', maxWidth:350 }}>
                <span style={{ color:'#94a3b8' }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team members..." style={{ flex:1, border:'none', outline:'none', fontSize:'0.85rem' }} id="team-search" />
                {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>✕</button>}
            </div>

            {/* Team Cards */}
            {loading ? (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1rem' }}>
                    {[1,2,3].map(i => <div key={i} style={{ height:200, borderRadius:12, background:'#f1f5f9' }} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign:'center', padding:'3rem', background:'#fff', borderRadius:12, border:'1px dashed #cbd5e1', color:'#94a3b8' }}>
                    {search ? 'No team members match your search' : 'No TPC staff accounts found'}
                </div>
            ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1rem' }}>
                    {filtered.map(({ member, assigned, active, resolved, avgResponse, resolutionRate }) => {
                        const loadColor = active > 6 ? '#ef4444' : active > 3 ? '#f59e0b' : '#10b981';
                        return (
                            <div key={member._id} style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', overflow:'hidden', transition:'box-shadow 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'}
                            >
                                {/* Card header */}
                                <div style={{ background:'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', padding:'1.1rem 1.25rem', display:'flex', alignItems:'center', gap:'0.875rem' }}>
                                    <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', color:'#fff', fontWeight:700, flexShrink:0 }}>
                                        {member.name?.charAt(0) || 'T'}
                                    </div>
                                    <div style={{ flex:1, minWidth:0 }}>
                                        <div style={{ fontWeight:700, color:'#fff', fontSize:'0.95rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{member.name || 'TPC Staff'}</div>
                                        <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:1 }}>ID: {member.studentId} &nbsp;|&nbsp; {member.department?.toUpperCase() || 'N/A'}</div>
                                    </div>
                                    <div style={{ textAlign:'right' }}>
                                        <div style={{ fontSize:'0.7rem', fontWeight:700, color:member.isActive !== false ? '#34d399' : '#f87171', background: member.isActive !== false ? '#064e3b' : '#450a0a', padding:'2px 8px', borderRadius:999 }}>
                                            {member.isActive !== false ? '● Online' : '● Offline'}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats grid */}
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderBottom:'1px solid #e2e8f0' }}>
                                    {[
                                        { label:'Assigned', value:assigned, color:'#3b82f6' },
                                        { label:'Active', value:active, color:loadColor },
                                        { label:'Resolved', value:resolved, color:'#10b981' },
                                    ].map(stat => (
                                        <div key={stat.label} style={{ padding:'0.875rem', textAlign:'center', borderRight:'1px solid #f1f5f9' }}>
                                            <div style={{ fontSize:'1.4rem', fontWeight:800, color:stat.color }}>{stat.value}</div>
                                            <div style={{ fontSize:'0.7rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>{stat.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Performance */}
                                <div style={{ padding:'0.875rem 1.1rem' }}>
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
                                        <span style={{ fontSize:'0.78rem', fontWeight:600, color:'#475569' }}>Resolution Rate</span>
                                        <span style={{ fontSize:'0.78rem', fontWeight:700, color: resolutionRate > 70 ? '#10b981' : resolutionRate > 40 ? '#f59e0b' : '#ef4444' }}>{resolutionRate}%</span>
                                    </div>
                                    <div style={{ height:6, borderRadius:4, background:'#e2e8f0', overflow:'hidden', marginBottom:'0.5rem' }}>
                                        <div style={{ height:'100%', width:`${resolutionRate}%`, background: resolutionRate > 70 ? '#10b981' : resolutionRate > 40 ? '#f59e0b' : '#ef4444', borderRadius:4, transition:'width 0.3s' }} />
                                    </div>
                                    <div style={{ fontSize:'0.75rem', color:'#94a3b8' }}>
                                        Avg Response: <strong style={{ color:'#475569' }}>{avgResponse ? `${avgResponse}h` : 'N/A'}</strong>
                                        &nbsp;|&nbsp; Load: <strong style={{ color:loadColor }}>{active > 6 ? 'Heavy' : active > 3 ? 'Moderate' : 'Light'}</strong>
                                    </div>
                                </div>

                                {/* Workload bar */}
                                <div style={{ padding:'0 1.1rem 0.875rem' }}>
                                    <div style={{ height:4, borderRadius:4, background:'#e2e8f0', overflow:'hidden' }}>
                                        <div style={{ height:'100%', width:`${Math.min(100,(active/10)*100)}%`, background:loadColor, borderRadius:4, transition:'width 0.3s' }} />
                                    </div>
                                    <div style={{ fontSize:'0.68rem', color:'#94a3b8', marginTop:3 }}>Current workload ({active}/10 max estimate)</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </TPCLayout>
    );
};

export default TPCTeamPage;
