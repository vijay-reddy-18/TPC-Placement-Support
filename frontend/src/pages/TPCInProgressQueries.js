import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Modal, Form, Button } from 'react-bootstrap';
import { FaClock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { ticketAPI } from '../services/api';
import '../styles/Dashboard.css';

const TPCInProgressQueries = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [updateResponse, setUpdateResponse] = useState('');

    useEffect(() => {
        loadQueries();
    }, []);

    const loadQueries = async () => {
        try {
            setLoading(true);
            const response = await ticketAPI.getAllTickets('in-progress', null, null, 1, 100);
            setTickets(response.data.tickets || []);
        } catch (error) {
            console.error('Failed to load queries');
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async () => {
        try {
            await ticketAPI.updateTicket(selectedTicket._id, {
                tpcResponse: updateResponse,
                status: 'resolved'
            });
            setShowUpdateModal(false);
            setUpdateResponse('');
            loadQueries();
        } catch (error) {
            alert('Failed to update query');
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
                <h1 className="fw-bold text-dark"><FaClock className="me-2 text-warning" />In Progress Queries</h1>
                <p className="text-muted">Queries currently being handled</p>
            </div>

            <Row className="mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #fff3e0 0%, #fffbf0 100%)', borderLeft: '4px solid #ffc107' }}>
                        <Card.Body className="text-center">
                            <h3 className="fw-bold text-warning mb-0">{tickets.length}</h3>
                            <p className="text-muted small mb-0">In Progress</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                    <h6 className="mb-0 fw-bold">In Progress Query List ({tickets.length})</h6>
                </Card.Header>
                <Card.Body>
                    {tickets.length === 0 ? (
                        <p className="text-muted mb-0">No in-progress queries</p>
                    ) : (
                        <div className="list-group list-group-flush">
                            {tickets.map((ticket) => (
                                <div key={ticket._id} className="list-group-item border-0 border-bottom p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <h6 className="fw-bold mb-1">{ticket.title}</h6>
                                            <p className="text-muted small mb-2">{ticket.description}</p>
                                            {ticket.tpcResponse && (
                                                <div className="alert alert-info small mb-2 p-2">
                                                    <strong>Response:</strong> {ticket.tpcResponse}
                                                </div>
                                            )}
                                            <div className="d-flex gap-2 align-items-center">
                                                <Badge bg="primary">{ticket.category}</Badge>
                                                <Badge bg="warning">IN PROGRESS</Badge>
                                                <span className="text-muted small">Student: {ticket.studentId}</span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="success"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedTicket(ticket);
                                                setUpdateResponse(ticket.tpcResponse || '');
                                                setShowUpdateModal(true);
                                            }}
                                        >
                                            ✓ Resolve
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Update Modal */}
            <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Resolve Query: {selectedTicket?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Final Response</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={5}
                            placeholder="Enter final response..."
                            value={updateResponse}
                            onChange={(e) => setUpdateResponse(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="success" onClick={handleResolve}>
                        Mark as Resolved
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default TPCInProgressQueries;
