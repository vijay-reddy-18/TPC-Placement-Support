import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Badge, Modal, Row, Col } from 'react-bootstrap';
import { FaEye, FaSearch, FaFilter, FaDownload, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import AdminLayout from '../components/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { ticketAPI } from '../services/api';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [tickets, setTickets] = useState([]);
    const [students, setStudents] = useState([]);
    const [tpcUsers, setTpcUsers] = useState([]);
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);

    // Users Tab State
    const [userSubTab, setUserSubTab] = useState('students');
    const [userSearch, setUserSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, active, blocked
    const [showCreateTpcModal, setShowCreateTpcModal] = useState(false);
    const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
    
    // Create User States
    const [newTpcData, setNewTpcData] = useState({ fullName: '', email: '', department: 'it', tpcId: '', password: '', confirmPassword: '' });
    const [newStudentData, setNewStudentData] = useState({ fullName: '', email: '', department: 'cse', studentId: '', dob: '', password: '', confirmPassword: '' });

    // Modals State
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [adminResetPasswordValue, setAdminResetPasswordValue] = useState('');
    
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showTicketModal, setShowTicketModal] = useState(false);

    // Tickets Filter State
    const [ticketFilterDate, setTicketFilterDate] = useState('');
    const [ticketFilterStatus, setTicketFilterStatus] = useState('all');
    const [ticketFilterCategory, setTicketFilterCategory] = useState('all');

    // Features State
    const [newFeatureName, setNewFeatureName] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [ticketsRes, usersRes, featuresRes] = await Promise.all([
                ticketAPI.getAllTickets(null, null, null, 1, 1000), 
                api.get('/admin/users'),
                api.get('/admin/features')
            ]);
            setTickets(ticketsRes.data.tickets || []);
            const allUsers = usersRes.data.users || [];
            setStudents(allUsers.filter(u => u.role === 'student'));
            setTpcUsers(allUsers.filter(u => u.role === 'tpc'));
            setFeatures(featuresRes.data.features || []);
        } catch (error) {
            console.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    // User Management Actions
    const handleCreateTpc = async () => {
        if (!newTpcData.tpcId || !newTpcData.password || !newTpcData.fullName) return alert('Fill required fields');
        if (newTpcData.password !== newTpcData.confirmPassword) return alert('Passwords do not match');

        try {
            await api.post('/admin/create-tpc', {
                studentId: newTpcData.tpcId, password: newTpcData.password,
                name: newTpcData.fullName, email: newTpcData.email, department: newTpcData.department 
            });
            setShowCreateTpcModal(false);
            setNewTpcData({ fullName: '', email: '', department: 'it', tpcId: '', password: '', confirmPassword: '' });
            alert('TPC Account Created!');
            loadData();
        } catch (error) { alert(error.response?.data?.message || 'Creation failed'); }
    };

    const handleCreateStudent = async () => {
        if (!newStudentData.studentId || !newStudentData.password || !newStudentData.fullName) return alert('Fill required fields');
        if (newStudentData.password !== newStudentData.confirmPassword) return alert('Passwords do not match');

        try {
            await api.post('/admin/create-student', {
                studentId: newStudentData.studentId, password: newStudentData.password,
                name: newStudentData.fullName, email: newStudentData.email, 
                department: newStudentData.department, dateOfBirth: newStudentData.dob 
            });
            setShowCreateStudentModal(false);
            setNewStudentData({ fullName: '', email: '', department: 'cse', studentId: '', dob: '', password: '', confirmPassword: '' });
            alert('Student Account Created!');
            loadData();
        } catch (error) { alert(error.response?.data?.message || 'Creation failed'); }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            await api.put(`/admin/users/${userId}/status`, { isActive: !currentStatus });
            loadData();
        } catch (err) { alert('Failed to update status'); }
    };

    const handleOverridePassword = async () => {
        if (!adminResetPasswordValue || adminResetPasswordValue.length < 6) return alert('Password must be 6+ characters');
        if (!window.confirm(`Are you sure you want to forcibly overwrite ${selectedUser.name}'s password?`)) return;

        try {
            await api.put(`/admin/users/${selectedUser._id}/reset-password`, { newPassword: adminResetPasswordValue });
            alert('Password successfully overwritten!');
            setAdminResetPasswordValue('');
            setShowUserModal(false);
        } catch (err) { alert(err.response?.data?.message || 'Failed to reset password'); }
    };

    const openUserDetails = (u) => { setSelectedUser(u); setAdminResetPasswordValue(''); setShowUserModal(true); };
    const openTicketDetails = (t) => { setSelectedTicket(t); setShowTicketModal(true); };

    // Feature Toggles Actions
    const handleAddFeature = async (targetRole) => {
        if (!newFeatureName) return;
        try {
            await api.post('/admin/features', { name: newFeatureName, targetRole });
            setNewFeatureName('');
            loadData();
        } catch (err) { alert('Failed to add feature'); }
    };
    const handleToggleFeature = async (id) => {
        try { await api.put(`/admin/features/${id}/toggle`); loadData(); } catch (err) {}
    };
    const handleDeleteFeature = async (id) => {
        if(!window.confirm('Delete feature toggle permanently?')) return;
        try { await api.delete(`/admin/features/${id}`); loadData(); } catch (err) {}
    };

    // --- Analytics Computation (Real Data) ---
    const getStudentActivityData = () => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date(); d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const counts = last7Days.map(dateStr => {
            return tickets.filter(t => t.createdAt.startsWith(dateStr)).length;
        });

        return {
            labels: last7Days.map(d => d.slice(5)), // MM-DD
            datasets: [{
                label: 'Tickets Created',
                data: counts,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };
    };

    const getStaffPerformanceData = () => {
        const staffMap = {};
        tickets.filter(t => t.status === 'resolved' && t.assignedTo).forEach(t => {
            const name = t.assignedTo.name;
            staffMap[name] = (staffMap[name] || 0) + 1;
        });
        
        const labels = Object.keys(staffMap);
        const data = Object.values(staffMap);

        return {
            labels: labels.length > 0 ? labels : ['No Resolutions Yet'],
            datasets: [{
                label: 'Resolved Tickets',
                data: data.length > 0 ? data : [0],
                backgroundColor: '#3b82f6',
                borderRadius: 4,
            }]
        };
    };

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>System Overview</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                <Card style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', color: 'white', border: 'none', borderRadius: '12px' }}>
                    <Card.Body className="d-flex justify-content-between align-items-center">
                        <div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Students</div>
                            <h3 style={{ margin: 0, fontWeight: 'bold' }}>{students.length}</h3>
                        </div>
                        <div style={{ height: '40px', width: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'}}>🎓</div>
                    </Card.Body>
                </Card>
                <Card style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', color: 'white', border: 'none', borderRadius: '12px' }}>
                    <Card.Body className="d-flex justify-content-between align-items-center">
                        <div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Staff</div>
                            <h3 style={{ margin: 0, fontWeight: 'bold' }}>{tpcUsers.length}</h3>
                        </div>
                        <div style={{ height: '40px', width: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'}}>👥</div>
                    </Card.Body>
                </Card>
                <Card style={{ background: 'linear-gradient(135deg, #eab308, #facc15)', color: 'white', border: 'none', borderRadius: '12px' }}>
                    <Card.Body className="d-flex justify-content-between align-items-center">
                        <div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Tickets</div>
                            <h3 style={{ margin: 0, fontWeight: 'bold' }}>{tickets.length}</h3>
                        </div>
                        <div style={{ height: '40px', width: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'}}>🎫</div>
                    </Card.Body>
                </Card>
                <Card style={{ background: 'linear-gradient(135deg, #10b981, #34d399)', color: 'white', border: 'none', borderRadius: '12px' }}>
                    <Card.Body className="d-flex justify-content-between align-items-center">
                        <div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Active Features</div>
                            <h3 style={{ margin: 0, fontWeight: 'bold' }}>{features.filter(f=>f.isActive).length}</h3>
                        </div>
                        <div style={{ height: '40px', width: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'}}>❤️</div>
                    </Card.Body>
                </Card>
            </div>

            <Row>
                <Col md={6}>
                    <Card className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
                        <Card.Body>
                            <h6 className="fw-bold mb-3">Student Activity (Last 7 Days)</h6>
                            <div style={{ height: '200px' }}>
                                <Line data={getStudentActivityData()} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
                        <Card.Body>
                            <h6 className="fw-bold mb-3">Staff Performance (Resolutions)</h6>
                            <div style={{ height: '200px' }}>
                                <Bar data={getStaffPerformanceData()} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );

    const renderUsers = () => {
        const displayUsers = userSubTab === 'students' ? students : tpcUsers;
        const filtered = displayUsers.filter(u => {
            const matchesSearch = u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.studentId?.includes(userSearch);
            const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? u.isActive : !u.isActive;
            return matchesSearch && matchesStatus;
        });

        return (
            <div style={{ padding: '1rem', background: 'white', minHeight: '80vh', borderRadius: '8px' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>User Management</h2>
                    <div className="d-flex gap-2">
                        {userSubTab === 'tpc' ? (
                            <Button variant="primary" style={{ background: '#2563eb', border: 'none' }} onClick={() => setShowCreateTpcModal(true)}>Create TPC Account</Button>
                        ) : (
                            <Button variant="success" style={{ border: 'none' }} onClick={() => setShowCreateStudentModal(true)}>Create Student Account</Button>
                        )}
                    </div>
                </div>

                <div className="d-flex border-bottom mb-4">
                    <div 
                        style={{ padding: '0.75rem 2rem', cursor: 'pointer', borderBottom: userSubTab === 'students' ? '2px solid #2563eb' : '2px solid transparent', color: userSubTab === 'students' ? '#2563eb' : '#6b7280', fontWeight: userSubTab === 'students' ? 600 : 400 }}
                        onClick={() => {setUserSubTab('students'); setStatusFilter('all'); setUserSearch('');}}
                    >
                        Students <Badge bg="secondary" className="ms-2 rounded-pill">{students.length}</Badge>
                    </div>
                    <div 
                        style={{ padding: '0.75rem 2rem', cursor: 'pointer', borderBottom: userSubTab === 'tpc' ? '2px solid #2563eb' : '2px solid transparent', color: userSubTab === 'tpc' ? '#2563eb' : '#6b7280', fontWeight: userSubTab === 'tpc' ? 600 : 400 }}
                        onClick={() => {setUserSubTab('tpc'); setStatusFilter('all'); setUserSearch('');}}
                    >
                        Staff (TPC) <Badge bg="secondary" className="ms-2 rounded-pill">{tpcUsers.length}</Badge>
                    </div>
                </div>

                <div className="d-flex justify-content-between mb-3 align-items-center">
                    <div className="position-relative" style={{ width: '300px' }}>
                        <FaSearch className="position-absolute" style={{ left: '10px', top: '10px', color: '#9ca3af' }} />
                        <Form.Control type="text" placeholder="Search by name or ID..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} style={{ paddingLeft: '32px' }} />
                    </div>
                    <div className="d-flex gap-3 align-items-center">
                        <Form.Select size="sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{width: '150px'}}>
                            <option value="all">All Statuses</option>
                            <option value="active">Active Only</option>
                            <option value="blocked">Blocked Only</option>
                        </Form.Select>
                    </div>
                </div>

                <table className="table table-hover align-middle" style={{ fontSize: '0.9rem' }}>
                    <thead style={{ background: '#f9fafb', color: '#4b5563' }}>
                        <tr>
                            <th>User ID</th>
                            <th>Avatar + Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? <tr><td colSpan="8" className="text-center py-4">No users found.</td></tr> : filtered.map(u => (
                            <tr key={u._id} style={{ background: u.isActive ? 'white' : '#fef2f2' }}>
                                <td className="fw-bold">{u.studentId}</td>
                                <td>
                                    <div className="d-flex align-items-center gap-2">
                                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {u.profilePhoto ? <img src={u.profilePhoto} alt="u" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}}/> : (u.name?.[0] || '?')}
                                        </div>
                                        <span className="fw-bold text-dark">{u.name}</span>
                                    </div>
                                </td>
                                <td>{u.email || u.studentEmail || '-'}</td>
                                <td><Badge bg={u.role === 'tpc' ? 'dark' : 'secondary'} className="rounded-pill">{u.role === 'tpc' ? 'TPC Staff' : 'Student'}</Badge></td>
                                <td><span className="text-uppercase">{u.department || 'OTHER'}</span></td>
                                <td><Badge bg={u.isActive ? 'success' : 'danger'} className="rounded-pill px-3 py-2">{u.isActive ? 'Active' : 'Blocked'}</Badge></td>
                                <td>
                                    <div className="d-flex align-items-center gap-2">
                                        <Button variant="outline-secondary" size="sm" onClick={() => openUserDetails(u)}>View Details</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderTickets = () => {
        const filteredTickets = tickets.filter(t => {
            const matchStatus = ticketFilterStatus === 'all' || t.status === ticketFilterStatus;
            const matchCat = ticketFilterCategory === 'all' || t.category === ticketFilterCategory;
            const matchDate = !ticketFilterDate || new Date(t.createdAt).toISOString().startsWith(ticketFilterDate);
            return matchStatus && matchCat && matchDate;
        });

        return (
            <div style={{ padding: '1rem', background: 'white', minHeight: '80vh', borderRadius: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1.5rem' }}>Global Ticket Oversight</h2>
                
                <div className="d-flex gap-3 mb-4">
                    <Form.Select style={{ width: '150px' }} value={ticketFilterStatus} onChange={e => setTicketFilterStatus(e.target.value)}>
                        <option value="all">Any Status</option><option value="open">Open</option><option value="in-progress">In Progress</option><option value="resolved">Resolved</option>
                    </Form.Select>
                    <Form.Select style={{ width: '150px' }} value={ticketFilterCategory} onChange={e => setTicketFilterCategory(e.target.value)}>
                        <option value="all">Any Category</option><option value="software">Software</option><option value="hardware">Hardware</option><option value="network">Network</option><option value="other">Other</option>
                    </Form.Select>
                    <Form.Control type="date" style={{ width: '180px' }} value={ticketFilterDate} onChange={e => setTicketFilterDate(e.target.value)} />
                    <Button variant="outline-dark" onClick={() => {setTicketFilterStatus('all'); setTicketFilterCategory('all'); setTicketFilterDate('');}}>Clear</Button>
                </div>

                <table className="table table-hover align-middle table-bordered" style={{ fontSize: '0.85rem' }}>
                    <thead style={{ background: '#f9fafb' }}>
                        <tr>
                            <th>Ticket ID</th><th>Student</th><th>Category</th><th>Subject</th><th>Status</th><th>Assigned To</th><th>Date</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTickets.map(t => (
                            <tr key={t._id}>
                                <td className="fw-bold">#TICK-{t._id.slice(-4)}</td>
                                <td>{t.studentId}</td><td>{t.category}</td>
                                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace:'nowrap' }}>{t.title}</td>
                                <td><Badge bg={t.status === 'resolved' ? 'success' : (t.status === 'in-progress' ? 'warning' : 'primary')}>{t.status}</Badge></td>
                                <td>{!t.assignedTo ? <Badge bg="danger">Unassigned ⚠️</Badge> : t.assignedTo.name}</td>
                                <td>{new Date(t.createdAt).toISOString().split('T')[0]}</td>
                                <td><Button variant="success" size="sm" className="rounded-pill px-3" onClick={() => openTicketDetails(t)}><FaEye /> View Case</Button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderSettings = () => {
        const studentFeatures = features.filter(f => f.targetRole === 'student');
        const tpcFeatures = features.filter(f => f.targetRole === 'tpc');

        return (
            <div style={{ padding: '1rem', minHeight: '80vh' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>System Settings</h2>
                        <span style={{fontSize: '0.85rem', color: '#6b7280'}}>Manage core system parameters</span>
                    </div>
                    <Button variant="primary" style={{ background: '#2563eb' }}>Save Changes</Button>
                </div>

                {/* Original Settings Cards */}
                <Row className="g-4 mb-5">
                    <Col md={4}>
                        <Card className="h-100 shadow-sm border-0 rounded-4">
                            <Card.Body>
                                <h5 className="fw-bold mb-4">Categories</h5>
                                {['Software', 'Hardware', 'Network', 'Placement', 'Other'].map(cat => (
                                    <div key={cat} className="d-flex justify-content-between align-items-center border px-3 py-2 rounded-2 mb-2 bg-light">
                                        <span>{cat}</span>
                                        <div className="d-flex gap-2 text-muted">
                                            <FaEdit style={{cursor:'pointer', color:'#3b82f6'}} />
                                            <FaTrash style={{cursor:'pointer', color:'#ef4444'}} />
                                        </div>
                                    </div>
                                ))}
                                <Button variant="outline-primary" className="w-100 mt-2 rounded-pill">Add Category</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="h-100 shadow-sm border-0 rounded-4">
                            <Card.Body>
                                <h5 className="fw-bold mb-4">Priorities</h5>
                                {[
                                    {name: 'Urgent', color: '#ef4444'},
                                    {name: 'High', color: '#f59e0b'},
                                    {name: 'Medium', color: '#eab308'},
                                    {name: 'Low', color: '#22c55e'}
                                ].map(pri => (
                                    <div key={pri.name} className="d-flex justify-content-between align-items-center border px-3 py-2 rounded-2 mb-2 bg-light">
                                        <div className="d-flex align-items-center gap-2"><div style={{width:10, height:10, borderRadius:'50%', background:pri.color}}/> {pri.name}</div>
                                        <FaEdit style={{cursor:'pointer', color:'#3b82f6'}} />
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="h-100 shadow-sm border-0 rounded-4">
                            <Card.Body>
                                <h5 className="fw-bold mb-4">System Health</h5>
                                <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                                    <span className="fw-bold">Server Status</span>
                                    <Badge bg="success" className="rounded-pill px-3 py-2 text-white">● Online</Badge>
                                </div>
                                <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                                    <span className="fw-bold">Database</span>
                                    <span>{tickets.length > 0 ? 'Connected' : 'Connecting...'}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                                    <span className="fw-bold">Active Staff Users</span>
                                    <span>{tpcUsers.filter(u=>u.isActive).length}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                                    <span className="fw-bold">Active Student Users</span>
                                    <span>{students.filter(u=>u.isActive).length}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="fw-bold">Uptime</span>
                                    <span>99.9%</span>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <hr className="mb-5" />

                {/* Feature Toggles Section */}
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1.5rem' }}>Dynamic System Feature Toggles</h2>
                <Row className="g-4 mb-4">
                    <Col md={6}>
                        <Card className="h-100 shadow-sm border-0 rounded-4">
                            <Card.Body>
                                <h5 className="fw-bold mb-4">Student Dashboard Features</h5>
                                {studentFeatures.map(f => (
                                    <div key={f._id} className="d-flex justify-content-between align-items-center border px-3 py-2 rounded-2 mb-2 bg-light">
                                        <span className="fw-bold">{f.name}</span>
                                        <div className="d-flex gap-3 align-items-center">
                                            {f.isActive ? <FaCheckCircle className="text-success" /> : <FaTimesCircle className="text-danger" />}
                                            <Form.Check type="switch" checked={f.isActive} onChange={() => handleToggleFeature(f._id)} />
                                            <FaTrash className="text-danger ms-2" style={{cursor:'pointer'}} onClick={() => handleDeleteFeature(f._id)} />
                                        </div>
                                    </div>
                                ))}
                                <div className="d-flex gap-2 mt-3">
                                    <Form.Control size="sm" placeholder="New Feature Name" value={newFeatureName} onChange={e=>setNewFeatureName(e.target.value)} />
                                    <Button size="sm" variant="primary" onClick={() => handleAddFeature('student')}>Add Feature</Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    
                    <Col md={6}>
                        <Card className="h-100 shadow-sm border-0 rounded-4">
                            <Card.Body>
                                <h5 className="fw-bold mb-4">Staff / TPC Features</h5>
                                {tpcFeatures.map(f => (
                                    <div key={f._id} className="d-flex justify-content-between align-items-center border px-3 py-2 rounded-2 mb-2 bg-light">
                                        <span className="fw-bold">{f.name}</span>
                                        <div className="d-flex gap-3 align-items-center">
                                            {f.isActive ? <FaCheckCircle className="text-success" /> : <FaTimesCircle className="text-danger" />}
                                            <Form.Check type="switch" checked={f.isActive} onChange={() => handleToggleFeature(f._id)} />
                                            <FaTrash className="text-danger ms-2" style={{cursor:'pointer'}} onClick={() => handleDeleteFeature(f._id)} />
                                        </div>
                                    </div>
                                ))}
                                <div className="d-flex gap-2 mt-3">
                                    <Form.Control size="sm" placeholder="New Feature Name" value={newFeatureName} onChange={e=>setNewFeatureName(e.target.value)} />
                                    <Button size="sm" variant="success" onClick={() => handleAddFeature('tpc')}>Add Staff Feature</Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" /></div>;

    return (
        <AdminLayout pageTitle={activeTab.toUpperCase()} activeTab={activeTab} setActiveTab={setActiveTab}>
            <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: '100vh' }}>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'tickets' && renderTickets()}
                {activeTab === 'settings' && renderSettings()}
            </div>

            {/* Create TPC Modal */}
            <Modal show={showCreateTpcModal} onHide={() => setShowCreateTpcModal(false)} centered backdrop="static">
                <Modal.Header closeButton><Modal.Title>Create Staff Member</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-2"><Form.Control placeholder="Full Name" onChange={e=>setNewTpcData({...newTpcData, fullName: e.target.value})}/></Form.Group>
                    <Form.Group className="mb-2"><Form.Control placeholder="Email Address" onChange={e=>setNewTpcData({...newTpcData, email: e.target.value})}/></Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Select onChange={e=>setNewTpcData({...newTpcData, department: e.target.value})}>
                            <option value="it">IT Support</option><option value="cse">CSE</option><option value="civil">Civil</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-2"><Form.Control placeholder="TPC ID (8 Digits)" onChange={e=>setNewTpcData({...newTpcData, tpcId: e.target.value})}/></Form.Group>
                    <Form.Group className="mb-2"><Form.Control type="password" placeholder="Password" onChange={e=>setNewTpcData({...newTpcData, password: e.target.value})}/></Form.Group>
                    <Form.Group className="mb-2"><Form.Control type="password" placeholder="Confirm Password" onChange={e=>setNewTpcData({...newTpcData, confirmPassword: e.target.value})}/></Form.Group>
                </Modal.Body>
                <Modal.Footer><Button variant="primary" onClick={handleCreateTpc}>Create Account</Button></Modal.Footer>
            </Modal>

            {/* Create Student Modal */}
            <Modal show={showCreateStudentModal} onHide={() => setShowCreateStudentModal(false)} centered backdrop="static">
                <Modal.Header closeButton><Modal.Title>Create Student Account</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-2"><Form.Control placeholder="Full Name" onChange={e=>setNewStudentData({...newStudentData, fullName: e.target.value})}/></Form.Group>
                    <Form.Group className="mb-2"><Form.Control placeholder="Email Address" onChange={e=>setNewStudentData({...newStudentData, email: e.target.value})}/></Form.Group>
                    <Form.Group className="mb-2"><Form.Label className="small mb-0">Date of Birth</Form.Label><Form.Control type="date" onChange={e=>setNewStudentData({...newStudentData, dob: e.target.value})}/></Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Select onChange={e=>setNewStudentData({...newStudentData, department: e.target.value})}>
                            <option value="cse">Computer Science</option><option value="ece">Electronics</option><option value="mech">Mechanical</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-2"><Form.Control placeholder="Student ID (8 Digits)" onChange={e=>setNewStudentData({...newStudentData, studentId: e.target.value})}/></Form.Group>
                    <Form.Group className="mb-2"><Form.Control type="password" placeholder="Password" onChange={e=>setNewStudentData({...newStudentData, password: e.target.value})}/></Form.Group>
                    <Form.Group className="mb-2"><Form.Control type="password" placeholder="Confirm Password" onChange={e=>setNewStudentData({...newStudentData, confirmPassword: e.target.value})}/></Form.Group>
                </Modal.Body>
                <Modal.Footer><Button variant="success" onClick={handleCreateStudent}>Create Account</Button></Modal.Footer>
            </Modal>

            {/* View User Modal (Includes DOB & Password Override) */}
            <Modal show={showUserModal} onHide={() => setShowUserModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>User Detailed Profile</Modal.Title></Modal.Header>
                <Modal.Body>
                    {selectedUser && (
                        <div>
                            <div className="text-center mb-3 pt-2">
                                <h5>{selectedUser.name}</h5>
                                <Badge bg={selectedUser.role === 'tpc' ? 'dark' : 'secondary'}>{selectedUser.role.toUpperCase()}</Badge>
                            </div>
                            <ul className="list-group list-group-flush mb-4">
                                <li className="list-group-item d-flex justify-content-between px-0"><strong>ID:</strong> <span>{selectedUser.studentId}</span></li>
                                <li className="list-group-item d-flex justify-content-between px-0"><strong>Email:</strong> <span>{selectedUser.email || selectedUser.studentEmail || 'N/A'}</span></li>
                                <li className="list-group-item d-flex justify-content-between px-0"><strong>DOB:</strong> <span>{selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : 'Not Set'}</span></li>
                                <li className="list-group-item d-flex justify-content-between px-0"><strong>Status:</strong> <Badge bg={selectedUser.isActive?'success':'danger'}>{selectedUser.isActive?'Active':'Blocked'}</Badge></li>
                                <li className="list-group-item d-flex justify-content-between px-0"><strong>Current Password:</strong> <span>{selectedUser.plainPassword || (selectedUser.role === 'admin' ? 'Hidden (Admin)' : 'Not Captured (Hashed)')}</span></li>
                            </ul>

                            <div className="p-3 border rounded border-danger bg-light">
                                <h6 className="text-danger fw-bold mb-3"><FaEdit/> Admin Actions: Overwrite Password</h6>
                                <p className="small text-muted mb-2">Passwords are irreversibly hashed. Enter a new password below to instantly override this user's access.</p>
                                <div className="d-flex gap-2">
                                    <Form.Control type="password" placeholder="New Password (min 6 chars)" value={adminResetPasswordValue} onChange={e => setAdminResetPasswordValue(e.target.value)} />
                                    <Button variant="danger" disabled={!adminResetPasswordValue} onClick={handleOverridePassword}>Force Override</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {selectedUser && (
                        <Form.Check type="switch" label={selectedUser.isActive ? "Block Account Access" : "Unblock Account"} checked={selectedUser.isActive} onChange={() => toggleUserStatus(selectedUser._id, selectedUser.isActive)} className={selectedUser.isActive ? 'text-danger fw-bold' : 'text-success fw-bold'} />
                    )}
                </Modal.Footer>
            </Modal>

            {/* View Ticket Modal */}
            <Modal show={showTicketModal} onHide={() => setShowTicketModal(false)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title>{selectedTicket && `Ticket #TICK-${selectedTicket._id.slice(-4)}`}</Modal.Title></Modal.Header>
                <Modal.Body className="p-4">
                    {selectedTicket && (
                        <div>
                            <h5 className="fw-bold mb-3">Topic: {selectedTicket.title}</h5>
                            <div className="mb-4 bg-light p-3">{selectedTicket.description}</div>
                            <Card className="bg-light border-0"><Card.Body>
                                <h6>Resolution notes by {selectedTicket.assignedTo?.name || 'Unassigned'}</h6>
                                <div className="bg-white p-2 border">{selectedTicket.tpcResponse || 'None'}</div>
                            </Card.Body></Card>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </AdminLayout>
    );
};

export default AdminDashboard;
