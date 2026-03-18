import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { ticketAPI } from '../services/api';
import '../styles/Dashboard.css';

const TPCResolvedQueries = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQueries();
    }, []);

    const loadQueries = async () => {
        try {
            setLoading(true);
            const response = await ticketAPI.getAllTickets('resolved', null, null, 1, 100);
            setTickets(response.data.tickets || []);
        } catch (error) {
            console.error('Failed to load queries');
        } finally {
            setLoading(false);
        }
    };

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
                <h1 className="fw-bold text-dark"><FaCheckCircle className="me-2 text-success" />Resolved Queries</h1>
                <p className="text-muted">Successfully resolved student queries</p>
            </div>

            <Row className="mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f6 100%)', borderLeft: '4px solid #28a745' }}>
                        <Card.Body className="text-center">
                            <h3 className="fw-bold text-success mb-0">{tickets.length}</h3>
                            <p className="text-muted small mb-0">Resolved</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                    <h6 className="mb-0 fw-bold">Resolved Query List ({tickets.length})</h6>
                </Card.Header>
                <Card.Body>
                    {tickets.length === 0 ? (
                        <p className="text-muted mb-0">No resolved queries</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Title</th>
                                        <th>Student ID</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Priority</th>
                                        <th>Resolved Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map((ticket) => (
                                        <tr key={ticket._id}>
                                            <td className="fw-bold">{ticket.title}</td>
                                            <td>{ticket.studentId}</td>
                                            <td><Badge bg="primary">{ticket.category}</Badge></td>
                                            <td><Badge bg="success">RESOLVED</Badge></td>
                                            <td>{ticket.priority}</td>
                                            <td>{new Date(ticket.updatedAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default TPCResolvedQueries;
