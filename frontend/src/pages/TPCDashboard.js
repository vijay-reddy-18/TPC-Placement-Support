import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Table, Modal, Form, Nav, InputGroup } from 'react-bootstrap';
import { FaClipboardList, FaSearch, FaTimes } from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { ticketAPI, userAPI } from '../services/api';
import '../styles/Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const TPCDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [tickets, setTickets] = useState([]);
    const [allTickets, setAllTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [categoryAnalytics, setCategoryAnalytics] = useState([]);
    const [weeklyTrends, setWeeklyTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters for tickets table
    const [searchStudentId, setSearchStudentId] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    
    // Modals
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [tpcResponse, setTpcResponse] = useState('');
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentLoading, setStudentLoading] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const [ticketsRes, statsRes, categoryRes, trendsRes] = await Promise.all([
                ticketAPI.getAllTickets(null, null, null, 1, 1000),
                ticketAPI.getDashboardStats(),
                ticketAPI.getCategoryAnalytics(),
                ticketAPI.getWeeklyTrends(),
            ]);

            setAllTickets(ticketsRes.data.tickets);
            setTickets(ticketsRes.data.tickets);
            setStats(statsRes.data.stats);
            setCategoryAnalytics(categoryRes.data.analytics);
            setWeeklyTrends(trendsRes.data.trends);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = allTickets;

        if (searchStudentId.trim()) {
            filtered = filtered.filter(t => 
                t.studentId.toLowerCase().includes(searchStudentId.toLowerCase())
            );
        }

        if (filterStatus) {
            filtered = filtered.filter(t => t.status === filterStatus);
        }

        if (filterPriority) {
            filtered = filtered.filter(t => t.priority === filterPriority);
        }

        if (filterCategory) {
            filtered = filtered.filter(t => t.category === filterCategory);
        }

        setTickets(filtered);
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearchStudentId('');
        setFilterStatus('');
        setFilterPriority('');
        setFilterCategory('');
        setTickets(allTickets);
        setCurrentPage(1);
    };

    useEffect(() => {
        applyFilters();
    }, [searchStudentId, filterStatus, filterPriority, filterCategory]);

    const handleRespond = async () => {
        if (!tpcResponse.trim()) {
            alert('Please enter a response');
            return;
        }
        try {
            await ticketAPI.updateTicket(selectedTicket._id, {
                tpcResponse,
                status: 'in-progress'
            });
            setShowResponseModal(false);
            setTpcResponse('');
            loadDashboard();
        } catch (error) {
            alert('Failed to respond');
        }
    };

    const handleResolve = async (ticketId) => {
        try {
            await ticketAPI.updateTicket(ticketId, {
                status: 'resolved'
            });
            loadDashboard();
        } catch (error) {
            alert('Failed to resolve ticket');
        }
    };

    const handleViewProfile = async (studentId) => {
        try {
            setStudentLoading(true);
            const response = await userAPI.getStudentProfile(studentId);
            setSelectedStudent(response.data.user);
            setShowProfileModal(true);
        } catch (error) {
            alert('Failed to load student profile');
            console.error('Profile load error:', error);
        } finally {
            setStudentLoading(false);
        }
    };

    // Tab filtering helpers
    const getNewQueries = () => allTickets.filter(t => t.status === 'open');
    const getInProgressQueries = () => allTickets.filter(t => t.status === 'in-progress');
    const getResolvedQueries = () => allTickets.filter(t => t.status === 'resolved');

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTickets = tickets.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(tickets.length / itemsPerPage);

    const getStatusColor = (status) => {
        const colors = {
            open: 'danger',
            'in-progress': 'warning',
            resolved: 'success',
            closed: 'secondary'
        };
        return colors[status] || 'secondary';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'success',
            medium: 'warning',
            high: 'danger',
            urgent: 'danger'
        };
        return colors[priority] || 'secondary';
    };

    // Chart data
    const pieChartData = {
        labels: categoryAnalytics.map(c => c.category),
        datasets: [
            {
                data: categoryAnalytics.map(c => c.total),
                backgroundColor: ['#667eea', '#f5576c', '#4facfe', '#43e97b', '#fa709a'],
                borderColor: '#fff',
                borderWidth: 2,
            },
        ],
    };

    const barChartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Tickets',
                data: weeklyTrends.map(t => t.count) || [2000, 3000, 3500, 3000, 3500, 4000, 3500],
                backgroundColor: '#667eea',
                borderColor: '#667eea',
                borderWidth: 0,
                borderRadius: 8,
            },
        ],
    };

    const renderTable = (tableTickets) => (
        <div style={{ overflowX: 'auto' }}>
            <Table hover responsive style={{ marginBottom: 0 }}>
                <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                    <tr>
                        <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>Ticket ID</th>
                        <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>Student ID</th>
                        <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>Category</th>
                        <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>Subject</th>
                        <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>Priority</th>
                        <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>Date</th>
                        <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tableTickets.length === 0 ? (
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No tickets found</td>
                        </tr>
                    ) : (
                        tableTickets.map((ticket) => (
                            <tr key={ticket._id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem', fontWeight: '600', color: '#1a1a1a' }}>#{ticket._id.slice(-6).toUpperCase()}</td>
                                <td style={{ padding: '1rem', color: '#333' }}>{ticket.studentId}</td>
                                <td style={{ padding: '1rem' }}>
                                    <Badge bg="light" text="dark" style={{ borderRadius: '6px', fontSize: '0.75rem' }}>{ticket.category}</Badge>
                                </td>
                                <td style={{ padding: '1rem', color: '#333', maxWidth: '200px' }}>{ticket.title}</td>
                                <td style={{ padding: '1rem' }}>
                                    <Badge bg={getPriorityColor(ticket.priority)} style={{ borderRadius: '6px', fontSize: '0.75rem' }}>
                                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                                    </Badge>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <Badge bg={getStatusColor(ticket.status)} style={{ borderRadius: '6px', fontSize: '0.75rem' }}>
                                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('-', ' ')}
                                    </Badge>
                                </td>
                                <td style={{ padding: '1rem', color: '#666' }}>
                                    {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {ticket.status === 'open' ? (
                                        <Button
                                            size="sm"
                                            style={{
                                                background: '#4a7ba7',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '0.4rem 1rem',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}
                                            onClick={() => {
                                                setSelectedTicket(ticket);
                                                setShowResponseModal(true);
                                            }}
                                        >
                                            Respond
                                        </Button>
                                    ) : ticket.status === 'in-progress' ? (
                                        <Button
                                            size="sm"
                                            variant="success"
                                            style={{ borderRadius: '6px', padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: '600' }}
                                            onClick={() => handleResolve(ticket._id)}
                                        >
                                            Resolve
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="light"
                                            style={{ borderRadius: '6px', padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: '600', border: '1px solid #ddd' }}
                                            onClick={() => handleViewProfile(ticket.studentId)}
                                        >
                                            View
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: '2rem' }}>
            <Container fluid>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#1a1a1a' }}>
                            Placement Tickets
                            <Badge bg="primary" style={{ marginLeft: '1rem', fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
                                {allTickets.length}
                            </Badge>
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Button variant="light" onClick={() => handleViewProfile(user?.studentId)} style={{ borderRadius: '8px', border: '1px solid #ddd', padding: '0.625rem 1rem' }}>⚙️ Settings</Button>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#667eea',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold'
                        }}>
                            {user?.name?.charAt(0).toUpperCase() || 'T'}
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div style={{ marginBottom: '2rem' }}>
                    <h6 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#666', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Stats Row</h6>
                    <Row style={{ gap: '1rem' }}>
                        <Col md={6} lg={3}>
                            <Card style={{ border: '1px solid #e0e0e0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <Card.Body style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <p style={{ margin: 0, color: '#999', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Total Tickets</p>
                                            <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#1a1a1a' }}>{allTickets.length}</h3>
                                        </div>
                                        <div style={{ fontSize: '2rem' }}>📋</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6} lg={3}>
                            <Card style={{ border: '1px solid #ffe0e0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(255,0,0,0.05)' }}>
                                <Card.Body style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <p style={{ margin: 0, color: '#999', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Open Tickets</p>
                                            <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#1a1a1a' }}>{getNewQueries().length}</h3>
                                        </div>
                                        <div style={{ fontSize: '2rem' }}>✉️</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6} lg={3}>
                            <Card style={{ border: '1px solid #fff3cd', borderRadius: '12px', boxShadow: '0 1px 3px rgba(255,193,7,0.05)' }}>
                                <Card.Body style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <p style={{ margin: 0, color: '#999', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>In Progress Tickets</p>
                                            <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#1a1a1a' }}>{getInProgressQueries().length}</h3>
                                        </div>
                                        <div style={{ fontSize: '2rem' }}>⏱️</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6} lg={3}>
                            <Card style={{ border: '1px solid #d4edda', borderRadius: '12px', boxShadow: '0 1px 3px rgba(40,167,69,0.05)' }}>
                                <Card.Body style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <p style={{ margin: 0, color: '#999', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Resolved Tickets</p>
                                            <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#1a1a1a' }}>{getResolvedQueries().length}</h3>
                                        </div>
                                        <div style={{ fontSize: '2rem' }}>✅</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>

                {/* Tab Navigation */}
                <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
                    <Card.Body style={{ padding: '1.5rem' }}>
                        <Nav variant="pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #e0e0e0', paddingBottom: '1rem' }}>
                            <Nav.Item>
                                <Nav.Link eventKey="overview" style={{ borderRadius: '8px', fontWeight: '600', color: activeTab === 'overview' ? 'white' : '#666', background: activeTab === 'overview' ? '#667eea' : 'transparent' }}>
                                    📊 Overview & Analytics
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="new-queries" style={{ borderRadius: '8px', fontWeight: '600', color: activeTab === 'new-queries' ? 'white' : '#666', background: activeTab === 'new-queries' ? '#667eea' : 'transparent' }}>
                                    🆕 New Queries
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="in-progress" style={{ borderRadius: '8px', fontWeight: '600', color: activeTab === 'in-progress' ? 'white' : '#666', background: activeTab === 'in-progress' ? '#667eea' : 'transparent' }}>
                                    ⏳ In Progress
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="resolved" style={{ borderRadius: '8px', fontWeight: '600', color: activeTab === 'resolved' ? 'white' : '#666', background: activeTab === 'resolved' ? '#667eea' : 'transparent' }}>
                                    ✅ Resolved
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="student-records" style={{ borderRadius: '8px', fontWeight: '600', color: activeTab === 'student-records' ? 'white' : '#666', background: activeTab === 'student-records' ? '#667eea' : 'transparent' }}>
                                    👥 Student Records
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Card.Body>
                </Card>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div>
                        <Row style={{ marginBottom: '2rem', gap: '1rem' }}>
                            <Col lg={6}>
                                <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <Card.Header style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '1.5rem' }}>
                                        <h6 style={{ margin: 0, fontWeight: '600', color: '#333' }}>📈 Query Analytics by Category</h6>
                                    </Card.Header>
                                    <Card.Body style={{ padding: '1.5rem', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {categoryAnalytics.length > 0 ? (
                                            <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                                        ) : (
                                            <p style={{ color: '#999' }}>No data available</p>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col lg={6}>
                                <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <Card.Header style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '1.5rem' }}>
                                        <h6 style={{ margin: 0, fontWeight: '600', color: '#333' }}>📊 Weekly Trends</h6>
                                    </Card.Header>
                                    <Card.Body style={{ padding: '1.5rem', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {weeklyTrends.length > 0 ? (
                                            <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'x' }} />
                                        ) : (
                                            <p style={{ color: '#999' }}>No data available</p>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* Recent Queries */}
                        <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <Card.Header style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '1.5rem' }}>
                                <h6 style={{ margin: 0, fontWeight: '600', color: '#333' }}>📋 Recent Queries</h6>
                            </Card.Header>
                            <Card.Body style={{ padding: 0 }}>
                                {renderTable(allTickets.slice(0, 6))}
                            </Card.Body>
                        </Card>
                    </div>
                )}

                {/* New Queries Tab */}
                {activeTab === 'new-queries' && (
                    <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <Card.Header style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '1.5rem' }}>
                            <h6 style={{ margin: 0, fontWeight: '600', color: '#333' }}>🆕 New Queries ({getNewQueries().length})</h6>
                        </Card.Header>
                        <Card.Body style={{ padding: 0 }}>
                            {renderTable(getNewQueries())}
                        </Card.Body>
                    </Card>
                )}

                {/* In Progress Tab */}
                {activeTab === 'in-progress' && (
                    <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <Card.Header style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '1.5rem' }}>
                            <h6 style={{ margin: 0, fontWeight: '600', color: '#333' }}>⏳ In Progress Queries ({getInProgressQueries().length})</h6>
                        </Card.Header>
                        <Card.Body style={{ padding: 0 }}>
                            {renderTable(getInProgressQueries())}
                        </Card.Body>
                    </Card>
                )}

                {/* Resolved Tab */}
                {activeTab === 'resolved' && (
                    <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <Card.Header style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '1.5rem' }}>
                            <h6 style={{ margin: 0, fontWeight: '600', color: '#333' }}>✅ Resolved Queries ({getResolvedQueries().length})</h6>
                        </Card.Header>
                        <Card.Body style={{ padding: 0 }}>
                            {renderTable(getResolvedQueries())}
                        </Card.Body>
                    </Card>
                )}

                {/* Student Records Tab */}
                {activeTab === 'student-records' && (
                    <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <Card.Header style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '1.5rem' }}>
                            <h6 style={{ margin: 0, fontWeight: '600', color: '#333' }}>👥 Student Records</h6>
                        </Card.Header>
                        <Card.Body style={{ padding: '1.5rem' }}>
                            <Row style={{ marginBottom: '1rem', gap: '1rem' }}>
                                <Col md={6} lg={2}>
                                    <InputGroup>
                                        <InputGroup.Text style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '0.625rem' }}>
                                            <FaSearch style={{ color: '#999', fontSize: '0.9rem' }} />
                                        </InputGroup.Text>
                                        <Form.Control
                                            placeholder="Search by Student ID"
                                            value={searchStudentId}
                                            onChange={(e) => setSearchStudentId(e.target.value)}
                                            style={{ border: '1px solid #ddd', borderRadius: '8px', marginLeft: '-1px' }}
                                        />
                                    </InputGroup>
                                </Col>
                                <Col md={6} lg={2}>
                                    <Form.Select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        style={{ borderRadius: '8px', border: '1px solid #ddd', padding: '0.625rem' }}
                                    >
                                        <option value="">Select Status</option>
                                        <option value="open">Open</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                    </Form.Select>
                                </Col>
                                <Col md={6} lg={2}>
                                    <Form.Select
                                        value={filterPriority}
                                        onChange={(e) => setFilterPriority(e.target.value)}
                                        style={{ borderRadius: '8px', border: '1px solid #ddd', padding: '0.625rem' }}
                                    >
                                        <option value="">Select Priority</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </Form.Select>
                                </Col>
                                <Col md={6} lg={2}>
                                    <Form.Select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        style={{ borderRadius: '8px', border: '1px solid #ddd', padding: '0.625rem' }}
                                    >
                                        <option value="">Select Category</option>
                                        <option value="company-eligibility">Company Eligibility</option>
                                        <option value="internship-confirmation">Internship Confirmation</option>
                                        <option value="offer-letter">Offer Letter</option>
                                        <option value="document-verification">Document Verification</option>
                                        <option value="interview-schedule">Interview Schedule</option>
                                        <option value="placement-process">Placement Process</option>
                                        <option value="other">Other</option>
                                    </Form.Select>
                                </Col>
                                <Col md={6} lg={2}>
                                    <Button
                                        onClick={clearFilters}
                                        style={{
                                            width: '100%',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            background: 'white',
                                            color: '#666',
                                            fontWeight: '600',
                                            padding: '0.625rem'
                                        }}
                                    >
                                        <FaTimes style={{ fontSize: '0.8rem', marginRight: '0.5rem' }} /> Clear
                                    </Button>
                                </Col>
                            </Row>
                            {renderTable(currentTickets)}
                            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e0e0e0', marginTop: '1rem' }}>
                                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, tickets.length)} of {tickets.length} entries
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Button size="sm" variant="light" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} style={{ borderRadius: '6px', border: '1px solid #ddd' }}>First</Button>
                                    <Button size="sm" variant="light" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ borderRadius: '6px', border: '1px solid #ddd' }}>Prev</Button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const pageNum = currentPage > 3 ? currentPage - 2 + i : i + 1;
                                        return pageNum <= totalPages ? (
                                            <Button
                                                key={pageNum}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                style={{
                                                    background: currentPage === pageNum ? '#667eea' : 'white',
                                                    color: currentPage === pageNum ? 'white' : '#333',
                                                    border: currentPage === pageNum ? 'none' : '1px solid #ddd',
                                                    borderRadius: '6px'
                                                }}
                                            >
                                                {pageNum}
                                            </Button>
                                        ) : null;
                                    })}
                                    <Button size="sm" variant="light" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ borderRadius: '6px', border: '1px solid #ddd' }}>Next</Button>
                                    <Button size="sm" variant="light" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} style={{ borderRadius: '6px', border: '1px solid #ddd' }}>Last</Button>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                )}
            </Container>

            {/* Response Modal */}
            <Modal show={showResponseModal} onHide={() => setShowResponseModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Respond to Query</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedTicket && (
                        <>
                            <p className="text-muted small"><strong>Student:</strong> {selectedTicket.studentId}</p>
                            <p className="text-muted small"><strong>Query:</strong> {selectedTicket.title}</p>
                            <Form.Group className="mb-3">
                                <Form.Label>Your Response</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    value={tpcResponse}
                                    onChange={(e) => setTpcResponse(e.target.value)}
                                    placeholder="Enter your response here..."
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowResponseModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleRespond}>Send Response</Button>
                </Modal.Footer>
            </Modal>

            {/* Student Profile Modal */}
            <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} centered size="md">
                <Modal.Header closeButton>
                    <Modal.Title>Student Profile</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {studentLoading ? (
                        <p className="text-center text-muted">Loading...</p>
                    ) : selectedStudent ? (
                        <div>
                            <div className="text-center mb-4">
                                {selectedStudent.profilePhoto ? (
                                    <img src={selectedStudent.profilePhoto} alt="Profile" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #667eea' }} />
                                ) : (
                                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '2rem' }}>👤</div>
                                )}
                            </div>
                            <div>
                                <div className="mb-3"><strong>Name:</strong> <p className="text-muted mb-0">{selectedStudent.name}</p></div>
                                <div className="mb-3"><strong>Student ID:</strong> <p className="text-muted mb-0">{selectedStudent.studentId}</p></div>
                                <div className="mb-3"><strong>Department:</strong> <p className="text-muted mb-0">{selectedStudent.department ? selectedStudent.department.toUpperCase() : 'Not specified'}</p></div>
                                <div className="mb-3"><strong>Email:</strong> <p className="text-muted mb-0">{selectedStudent.email || selectedStudent.studentEmail || 'N/A'}</p></div>
                                <div className="mb-3"><strong>Mobile:</strong> <p className="text-muted mb-0">{selectedStudent.mobileNumber || 'N/A'}</p></div>
                                <div className="mb-3"><strong>Member Since:</strong> <p className="text-muted mb-0">{new Date(selectedStudent.createdAt).toLocaleDateString()}</p></div>
                                <div><strong>Query Status:</strong> <div style={{ marginTop: '0.5rem', gap: '1rem', display: 'flex' }}><Badge bg="danger">Open: {allTickets.filter(t => t.studentId === selectedStudent.studentId && t.status === 'open').length}</Badge><Badge bg="warning" text="dark">In Progress: {allTickets.filter(t => t.studentId === selectedStudent.studentId && t.status === 'in-progress').length}</Badge><Badge bg="success">Resolved: {allTickets.filter(t => t.studentId === selectedStudent.studentId && t.status === 'resolved').length}</Badge></div></div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-muted">No profile data available</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowProfileModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default TPCDashboard;
