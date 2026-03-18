import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Table, Badge } from 'react-bootstrap';
import { FaIdCard, FaPlus, FaTrash } from 'react-icons/fa';
import api from '../services/api';
import '../styles/Dashboard.css';

const AdminTPCIDs = () => {
    const [tpcUsers, setTpcUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTPCId, setNewTPCId] = useState('');
    const [newTPCPassword, setNewTPCPassword] = useState('');

    useEffect(() => {
        loadTPCUsers();
    }, []);

    const loadTPCUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/users');
            const tpcList = response.data.users.filter(u => u.role === 'tpc');
            setTpcUsers(tpcList);
        } catch (error) {
            console.error('Failed to load TPC users');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTPC = async () => {
        if (!newTPCId || !newTPCPassword) {
            alert('Please fill all fields');
            return;
        }
        if (!/^\d{8}$/.test(newTPCId)) {
            alert('TPC ID must be 8 digits');
            return;
        }
        try {
            await api.post('/admin/create-tpc', {
                studentId: newTPCId,
                password: newTPCPassword,
                name: `TPC User ${newTPCId}`
            });
            setShowCreateModal(false);
            setNewTPCId('');
            setNewTPCPassword('');
            loadTPCUsers();
            alert('TPC user created successfully!');
        } catch (error) {
            alert('Failed to create TPC user');
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
                <h1 className="fw-bold text-dark"><FaIdCard className="me-2" />TPC Management</h1>
                <p className="text-muted">Create and manage TPC department credentials</p>
            </div>

            <Row className="mb-4">
                <Col md={8}>
                    <h5 className="fw-bold">Manage TPC Credentials</h5>
                </Col>
                <Col md={4} className="text-end">
                    <Button
                        variant="success"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <FaPlus /> Create New TPC ID
                    </Button>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                    <h6 className="mb-0 fw-bold">TPC Users ({tpcUsers.length})</h6>
                </Card.Header>
                <Card.Body>
                    {tpcUsers.length === 0 ? (
                        <Alert variant="info" className="mb-0">No TPC users created yet</Alert>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>TPC ID</th>
                                        <th>Name</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tpcUsers.map((tpc) => (
                                        <tr key={tpc._id}>
                                            <td className="fw-bold">{tpc.studentId}</td>
                                            <td>{tpc.name}</td>
                                            <td><Badge bg="success">Active</Badge></td>
                                            <td>{new Date(tpc.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <Button variant="outline-danger" size="sm">
                                                    <FaTrash />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Create TPC Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create New TPC User</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>TPC ID (8 digits)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g., 10000002"
                                value={newTPCId}
                                onChange={(e) => setNewTPCId(e.target.value)}
                                maxLength="8"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Enter a secure password"
                                value={newTPCPassword}
                                onChange={(e) => setNewTPCPassword(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleCreateTPC}>
                        Create TPC User
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AdminTPCIDs;
