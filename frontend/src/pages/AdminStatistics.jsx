import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ProgressBar } from 'react-bootstrap';
import { FaChartBar } from 'react-icons/fa';
import { ticketAPI } from '../services/api';
import '../styles/Dashboard.css';

const AdminStatistics = () => {
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStatistics();
    }, []);

    const loadStatistics = async () => {
        try {
            setLoading(true);
            const [ticketsRes, statsRes] = await Promise.all([
                ticketAPI.getAllTickets(null, null, null, 1, 100),
                ticketAPI.getDashboardStats(),
            ]);
            setTickets(ticketsRes.data.tickets || []);
            setStats(statsRes.data.stats);
        } catch (error) {
            console.error('Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStats = () => {
        return {
            'Open': tickets.filter(t => t.status === 'open').length,
            'In Progress': tickets.filter(t => t.status === 'in-progress').length,
            'Resolved': tickets.filter(t => t.status === 'resolved').length,
            'Closed': tickets.filter(t => t.status === 'closed').length,
        };
    };

    const statusStats = getStatusStats();
    const resolutionRate = tickets.length > 0
        ? Math.round((statusStats['Resolved'] / tickets.length) * 100)
        : 0;

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
                <h1 className="fw-bold text-dark"><FaChartBar className="me-2" />Statistics & Analytics</h1>
                <p className="text-muted">System-wide statistics and performance metrics</p>
            </div>

            {/* Status Distribution */}
            <h5 className="fw-bold mb-3">Query Status Distribution</h5>
            <Row className="mb-4">
                {Object.entries(statusStats).map(([status, count]) => {
                    const colors = {
                        'Open': 'danger',
                        'In Progress': 'warning',
                        'Resolved': 'success',
                        'Closed': 'secondary'
                    };
                    return (
                        <Col md={6} lg={3} key={status} className="mb-3">
                            <Card className="border-0 shadow-sm">
                                <Card.Body className="text-center">
                                    <h5>{status}</h5>
                                    <h3 className={`fw-bold text-${colors[status]}`}>{count}</h3>
                                    <small className="text-muted">queries</small>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {/* System Health */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-light">
                    <h6 className="mb-0 fw-bold">System Health</h6>
                </Card.Header>
                <Card.Body>
                    <div className="mb-3">
                        <div className="d-flex justify-content-between mb-2">
                            <span>Resolution Rate</span>
                            <strong>{resolutionRate}%</strong>
                        </div>
                        <ProgressBar now={resolutionRate} variant="success" />
                    </div>
                    <Row>
                        <Col md={6}>
                            <p className="mb-1"><strong>Total Queries:</strong> {tickets.length}</p>
                            <p className="mb-0"><strong>Pending Responses:</strong> {stats?.openTickets || 0}</p>
                        </Col>
                        <Col md={6}>
                            <p className="mb-1"><strong>Average Response Time:</strong> -</p>
                            <p className="mb-0"><strong>System Health:</strong> <span className="badge bg-success">Good</span></p>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Priority Analysis */}
            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                    <h6 className="mb-0 fw-bold">Priority Breakdown</h6>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={4}>
                            <h5>
                                <span className="badge bg-danger">
                                    {tickets.filter(t => t.priority === 'high').length}
                                </span>
                                &nbsp; High Priority
                            </h5>
                        </Col>
                        <Col md={4}>
                            <h5>
                                <span className="badge bg-warning">
                                    {tickets.filter(t => t.priority === 'medium').length}
                                </span>
                                &nbsp; Medium Priority
                            </h5>
                        </Col>
                        <Col md={4}>
                            <h5>
                                <span className="badge bg-info">
                                    {tickets.filter(t => t.priority === 'low').length}
                                </span>
                                &nbsp; Low Priority
                            </h5>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AdminStatistics;
