import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form } from 'react-bootstrap';
import { FaExclamationCircle, FaPaperPlane } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { ticketAPI } from '../services/api';
import '../styles/Dashboard.css';

const TPCNewQueries = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [tpcResponse, setTpcResponse] = useState('');

    useEffect(() => {
        loadQueries();
    }, []);

    const loadQueries = async () => {
        try {
            setLoading(true);
            const response = await ticketAPI.getAllTickets('open', null, null, 1, 100);
            setTickets(response.data.tickets || []);
        } catch (error) {
            console.error('Failed to load queries');
        } finally {
            setLoading(false);
        }
    };

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
            loadQueries();
        } catch (error) {
            alert('Failed to respond');
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
                <h1 className="fw-bold text-dark"><FaExclamationCircle className="me-2 text-danger" />New Queries</h1>
                <p className="text-muted">Manage and respond to new student queries</p>
            </div>

            <Row className="mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #ffe5e5 0%, #fff0f0 100%)', borderLeft: '4px solid #dc3545' }}>
                        <Card.Body className="text-center">
                            <h3 className="fw-bold text-danger mb-0">{tickets.length}</h3>
                            <p className="text-muted small mb-0">New Queries</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                    <h6 className="mb-0 fw-bold">New Query List ({tickets.length})</h6>
                </Card.Header>
                <Card.Body>
                    {tickets.length === 0 ? (
                        <p className="text-muted mb-0">No new queries</p>
                    ) : (
                        <div className="list-group list-group-flush">
                            {tickets.map((ticket) => (
                                <div key={ticket._id} className="list-group-item border-0 border-bottom p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <h6 className="fw-bold mb-1">{ticket.title}</h6>
                                            <p className="text-muted small mb-2">{ticket.description}</p>
                                            <div className="d-flex gap-2 align-items-center">
                                                <span className="badge bg-primary">{ticket.category}</span>
                                                <span className="badge bg-danger">OPEN</span>
                                                <span className="text-muted small">Student: {ticket.studentId}</span>
                                                <span className="text-muted small">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedTicket(ticket);
                                                setShowResponseModal(true);
                                            }}
                                        >
                                            <FaPaperPlane className="me-2" />
                                            Respond
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Response Modal */}
            <Modal show={showResponseModal} onHide={() => setShowResponseModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Respond to Query: {selectedTicket?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Your Response</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={5}
                            placeholder="Enter your response here..."
                            value={tpcResponse}
                            onChange={(e) => setTpcResponse(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowResponseModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleRespond}>
                        Send Response
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default TPCNewQueries;
