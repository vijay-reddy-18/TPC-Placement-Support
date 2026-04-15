import React, { useState, useEffect } from 'react';
import { Container, Card, Table } from 'react-bootstrap';
import { FaUsers } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { ticketAPI } from '../services/api';
import '../styles/Dashboard.css';

const TPCStudentRecords = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        try {
            setLoading(true);
            const response = await ticketAPI.getAllTickets(null, null, null, 1, 100);
            setTickets(response.data.tickets || []);
        } catch (error) {
            console.error('Failed to load records');
        } finally {
            setLoading(false);
        }
    };

    // Get unique students
    const students = Array.from(new Map(tickets.map(t => [t.studentId, t])).values());

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
                <h1 className="fw-bold text-dark"><FaUsers className="me-2 text-info" />Student Records</h1>
                <p className="text-muted">View all student query records</p>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                    <h6 className="mb-0 fw-bold">Student Query Records ({students.length})</h6>
                </Card.Header>
                <Card.Body>
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Student ID</th>
                                    <th>Open Queries</th>
                                    <th>In Progress</th>
                                    <th>Resolved</th>
                                    <th>Total Queries</th>
                                    <th>Last Query Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => {
                                    const studentQueries = tickets.filter(t => t.studentId === student.studentId);
                                    return (
                                        <tr key={student._id}>
                                            <td className="fw-bold">{student.studentId}</td>
                                            <td>
                                                <span className="badge bg-danger">
                                                    {studentQueries.filter(t => t.status === 'open').length}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge bg-warning">
                                                    {studentQueries.filter(t => t.status === 'in-progress').length}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge bg-success">
                                                    {studentQueries.filter(t => t.status === 'resolved').length}
                                                </span>
                                            </td>
                                            <td className="fw-bold">{studentQueries.length}</td>
                                            <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default TPCStudentRecords;
