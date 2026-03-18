import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Alert, Table, Badge } from 'react-bootstrap';
import { FaClipboardList } from 'react-icons/fa';
import { ticketAPI } from '../services/api';
import '../styles/Dashboard.css';

const AdminQueries = () => {
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        loadQueries();
    }, []);

    useEffect(() => {
        filterQueries();
    }, [tickets, categoryFilter, statusFilter]);

    const loadQueries = async () => {
        try {
            setLoading(true);
            const response = await ticketAPI.getAllTickets(null, null, null, 1, 100);
            setTickets(response.data.tickets || []);
        } catch (error) {
            console.error('Failed to load queries');
        } finally {
            setLoading(false);
        }
    };

    const filterQueries = () => {
        let filtered = tickets;
        if (categoryFilter) {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }
        if (statusFilter) {
            filtered = filtered.filter(t => t.status === statusFilter);
        }
        setFilteredTickets(filtered);
    };

    const getQueryStats = () => {
        return {
            'Placement': tickets.filter(t => t.category === 'placement').length,
            'Internship': tickets.filter(t => t.category === 'internship').length,
            'Resume': tickets.filter(t => t.category === 'resume').length,
            'Interview': tickets.filter(t => t.category === 'interview').length,
            'General': tickets.filter(t => t.category === 'general').length,
        };
    };

    const queryStats = getQueryStats();

    if (loading) {
        return (
            <Container className="d-flex align-items-center justify-content-center min-vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            <div className="mb-4">
                <h1 className="fw-bold text-dark"><FaClipboardList className="me-2" />Queries by Category</h1>
                <p className="text-muted">View and analyze student queries</p>
            </div>

            {/* Category Distribution */}
            <Row className="mb-4">
                {Object.entries(queryStats).map(([category, count]) => (
                    <Col md={6} lg={4} key={category} className="mb-3">
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="text-center">
                                <h5>{category}</h5>
                                <h3 className="fw-bold text-primary">{count}</h3>
                                <small className="text-muted">queries</small>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Detailed Query List */}
            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                    <h6 className="mb-0 fw-bold">All Queries</h6>
                </Card.Header>
                <Card.Body>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Filter by Category</Form.Label>
                                <Form.Select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    <option value="placement">Placement</option>
                                    <option value="internship">Internship</option>
                                    <option value="resume">Resume</option>
                                    <option value="interview">Interview</option>
                                    <option value="general">General</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Filter by Status</Form.Label>
                                <Form.Select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="">All Status</option>
                                    <option value="open">Open</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    {filteredTickets.length === 0 ? (
                        <Alert variant="info" className="mb-0">No queries found</Alert>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Title</th>
                                        <th>Student ID</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Priority</th>
                                        <th>Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTickets.map((ticket) => (
                                        <tr key={ticket._id}>
                                            <td className="fw-bold">{ticket.title}</td>
                                            <td>{ticket.studentId}</td>
                                            <td><Badge bg="primary">{ticket.category}</Badge></td>
                                            <td>
                                                <Badge bg={ticket.status === 'resolved' ? 'success' : ticket.status === 'open' ? 'danger' : 'warning'}>
                                                    {ticket.status.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td>{ticket.priority}</td>
                                            <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AdminQueries;
