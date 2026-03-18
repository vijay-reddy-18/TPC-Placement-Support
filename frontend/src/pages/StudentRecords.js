import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Table, Form, InputGroup } from 'react-bootstrap';
import { FaSearch, FaDownload, FaEye, FaFilter } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { ticketAPI, userAPI } from '../services/api';
import '../styles/Dashboard.css';

const StudentRecords = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search and filters
    const [searchStudent, setSearchStudent] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('All');
    const [filterYear, setFilterYear] = useState('All');
    const [filterQueryStatus, setFilterQueryStatus] = useState('Active');
    const [filterDateRange, setFilterDateRange] = useState('Last 30 Days');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Selection
    const [selectedRows, setSelectedRows] = useState(new Set());

    useEffect(() => {
        loadStudentRecords();
    }, []);

    const loadStudentRecords = async () => {
        try {
            setLoading(true);
            const ticketsRes = await ticketAPI.getAllTickets(null, null, null, 1, 1000);
            const tickets = ticketsRes.data.tickets;

            // Group tickets by student ID
            const studentMap = new Map();
            tickets.forEach(ticket => {
                if (!studentMap.has(ticket.studentId)) {
                    studentMap.set(ticket.studentId, {
                        studentId: ticket.studentId,
                        totalQueries: 0,
                        openQueries: 0,
                        inProgressQueries: 0,
                        resolvedQueries: 0,
                        lastActive: ticket.createdAt,
                        tickets: []
                    });
                }
                const student = studentMap.get(ticket.studentId);
                student.totalQueries++;
                student.tickets.push(ticket);

                if (ticket.status === 'open') student.openQueries++;
                else if (ticket.status === 'in-progress') student.inProgressQueries++;
                else if (ticket.status === 'resolved') student.resolvedQueries++;

                if (new Date(ticket.createdAt) > new Date(student.lastActive)) {
                    student.lastActive = ticket.createdAt;
                }
            });

            const studentList = Array.from(studentMap.values());
            setStudents(studentList);
            setFilteredStudents(studentList);
        } catch (error) {
            console.error('Failed to load student records:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = students;

        // Search by student ID or name
        if (searchStudent.trim()) {
            filtered = filtered.filter(s =>
                s.studentId.toLowerCase().includes(searchStudent.toLowerCase())
            );
        }

        // Filter by query status
        if (filterQueryStatus !== 'All') {
            if (filterQueryStatus === 'Active') {
                filtered = filtered.filter(s => s.openQueries > 0 || s.inProgressQueries > 0);
            } else if (filterQueryStatus === 'Resolved') {
                filtered = filtered.filter(s => s.resolvedQueries > 0);
            }
        }

        setFilteredStudents(filtered);
        setCurrentPage(1);
        setSelectedRows(new Set());
    };

    useEffect(() => {
        applyFilters();
    }, [searchStudent, filterQueryStatus, filterDepartment, filterDateRange]);

    // Pagination
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const newSet = new Set();
            currentStudents.forEach(s => newSet.add(s.studentId));
            setSelectedRows(newSet);
        } else {
            setSelectedRows(new Set());
        }
    };

    const handleSelectRow = (studentId) => {
        const newSet = new Set(selectedRows);
        if (newSet.has(studentId)) {
            newSet.delete(studentId);
        } else {
            newSet.add(studentId);
        }
        setSelectedRows(newSet);
    };

    const handleExport = () => {
        const headers = ['Student ID', 'Total Queries', 'Open', 'In Progress', 'Resolved', 'Last Active'];
        const rows = filteredStudents.map(s => [
            s.studentId,
            s.totalQueries,
            s.openQueries,
            s.inProgressQueries,
            s.resolvedQueries,
            new Date(s.lastActive).toLocaleDateString()
        ]);

        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.join(',') + '\n';
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'student_records.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: '2rem' }}>
            <Container fluid>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>
                            Student Records
                        </h1>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <InputGroup style={{ maxWidth: '300px' }}>
                                <InputGroup.Text style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px 0 0 8px' }}>
                                    <FaSearch style={{ color: '#999' }} />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Search Students"
                                    value={searchStudent}
                                    onChange={(e) => setSearchStudent(e.target.value)}
                                    style={{ border: '1px solid #ddd', borderRadius: '0 8px 8px 0' }}
                                />
                            </InputGroup>
                            <Button
                                variant="light"
                                onClick={handleExport}
                                style={{
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.625rem 1rem',
                                    fontWeight: '600'
                                }}
                            >
                                <FaDownload /> Export
                            </Button>
                            <Button
                                variant="light"
                                style={{
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.625rem 1rem',
                                    fontWeight: '600'
                                }}
                            >
                                <FaFilter /> Filter
                            </Button>
                        </div>
                    </div>

                    {/* Filter Chips */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: '#f0f0f0',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.9rem'
                        }}>
                            <span style={{ color: '#666', fontWeight: '500' }}>Department:</span>
                            <Form.Select
                                size="sm"
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                                style={{
                                    border: 'none',
                                    background: 'white',
                                    borderRadius: '4px',
                                    padding: '0.25rem 0.5rem',
                                    minWidth: '100px'
                                }}
                            >
                                <option value="All">All</option>
                                <option value="CSE">CSE</option>
                                <option value="ECE">ECE</option>
                                <option value="MECH">MECH</option>
                                <option value="CIVIL">CIVIL</option>
                                <option value="EEE">EEE</option>
                                <option value="IT">IT</option>
                            </Form.Select>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: '#f0f0f0',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.9rem'
                        }}>
                            <span style={{ color: '#666', fontWeight: '500' }}>Year:</span>
                            <Form.Select
                                size="sm"
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value)}
                                style={{
                                    border: 'none',
                                    background: 'white',
                                    borderRadius: '4px',
                                    padding: '0.25rem 0.5rem',
                                    minWidth: '100px'
                                }}
                            >
                                <option value="All">All</option>
                                <option value="1st">1st Year</option>
                                <option value="2nd">2nd Year</option>
                                <option value="3rd">3rd Year</option>
                                <option value="4th">4th Year</option>
                            </Form.Select>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: '#f0f0f0',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.9rem'
                        }}>
                            <span style={{ color: '#666', fontWeight: '500' }}>Query Status:</span>
                            <Form.Select
                                size="sm"
                                value={filterQueryStatus}
                                onChange={(e) => setFilterQueryStatus(e.target.value)}
                                style={{
                                    border: 'none',
                                    background: 'white',
                                    borderRadius: '4px',
                                    padding: '0.25rem 0.5rem',
                                    minWidth: '100px'
                                }}
                            >
                                <option value="All">All</option>
                                <option value="Active">Active</option>
                                <option value="Resolved">Resolved</option>
                            </Form.Select>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: '#f0f0f0',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.9rem'
                        }}>
                            <span style={{ color: '#666', fontWeight: '500' }}>Date Range:</span>
                            <Form.Select
                                size="sm"
                                value={filterDateRange}
                                onChange={(e) => setFilterDateRange(e.target.value)}
                                style={{
                                    border: 'none',
                                    background: 'white',
                                    borderRadius: '4px',
                                    padding: '0.25rem 0.5rem',
                                    minWidth: '120px'
                                }}
                            >
                                <option value="Last 7 Days">Last 7 Days</option>
                                <option value="Last 30 Days">Last 30 Days</option>
                                <option value="Last 90 Days">Last 90 Days</option>
                                <option value="All Time">All Time</option>
                            </Form.Select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <Table hover responsive style={{ marginBottom: 0 }}>
                            <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                                <tr>
                                    <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.85rem', color: '#666' }}>
                                        <Form.Check
                                            type="checkbox"
                                            checked={selectedRows.size === currentStudents.length && currentStudents.length > 0}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.85rem', color: '#666' }}>
                                        Student ID
                                    </th>
                                    <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.85rem', color: '#666' }}>
                                        Student Name
                                    </th>
                                    <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.85rem', color: '#666' }}>
                                        Department
                                    </th>
                                    <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.85rem', color: '#666' }}>
                                        Total Queries
                                    </th>
                                    <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.85rem', color: '#666' }}>
                                        Last Active
                                    </th>
                                    <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.85rem', color: '#666' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                                            Loading...
                                        </td>
                                    </tr>
                                ) : currentStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                                            No students found
                                        </td>
                                    </tr>
                                ) : (
                                    currentStudents.map((student) => (
                                        <tr
                                            key={student.studentId}
                                            style={{
                                                borderBottom: '1px solid #eee',
                                                background: selectedRows.has(student.studentId) ? '#f0f4ff' : 'white'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!selectedRows.has(student.studentId)) {
                                                    e.currentTarget.style.background = '#f9f9f9';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!selectedRows.has(student.studentId)) {
                                                    e.currentTarget.style.background = 'white';
                                                }
                                            }}
                                        >
                                            <td style={{ padding: '1rem' }}>
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={selectedRows.has(student.studentId)}
                                                    onChange={() => handleSelectRow(student.studentId)}
                                                />
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: '600', color: '#1a1a1a' }}>
                                                {student.studentId}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        background: '#667eea',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.9rem'
                                                    }}>
                                                        {student.studentId.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>
                                                            Student Name
                                                        </div>
                                                        <div style={{ color: '#999', fontSize: '0.75rem' }}>
                                                            student@university.edu
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', color: '#333' }}>
                                                Computer Science
                                            </td>
                                            <td style={{ padding: '1rem', color: '#333', fontWeight: '600' }}>
                                                {student.totalQueries}
                                            </td>
                                            <td style={{ padding: '1rem', color: '#666', fontSize: '0.9rem' }}>
                                                {new Date(student.lastActive).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit'
                                                })}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <Button
                                                    size="sm"
                                                    style={{
                                                        background: '#4a7ba7',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        padding: '0.4rem 1rem',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    View Profile
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {/* Pagination Footer */}
                    {currentStudents.length > 0 && (
                        <div style={{
                            padding: '1.5rem',
                            borderTop: '1px solid #e0e0e0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f8f9fa',
                            flexWrap: 'wrap',
                            gap: '1rem'
                        }}>
                            <div style={{ color: '#666', fontSize: '0.9rem' }}>
                                {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length} students
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ color: '#666', fontSize: '0.9rem' }}>Rows per page:</span>
                                <Form.Select
                                    size="sm"
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                        setRowsPerPage(parseInt(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    style={{ width: '80px' }}
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </Form.Select>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <Button
                                    size="sm"
                                    variant="light"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    style={{ borderRadius: '6px', border: '1px solid #ddd' }}
                                >
                                    ◀
                                </Button>
                                <Button
                                    size="sm"
                                    variant="light"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    style={{ borderRadius: '6px', border: '1px solid #ddd' }}
                                >
                                    ‹
                                </Button>

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
                                                borderRadius: '6px',
                                                padding: '0.4rem 0.8rem',
                                                minWidth: '30px'
                                            }}
                                        >
                                            {pageNum}
                                        </Button>
                                    ) : null;
                                })}

                                <Button
                                    size="sm"
                                    variant="light"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    style={{ borderRadius: '6px', border: '1px solid #ddd' }}
                                >
                                    ›
                                </Button>
                                <Button
                                    size="sm"
                                    variant="light"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    style={{ borderRadius: '6px', border: '1px solid #ddd' }}
                                >
                                    ▶
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </Container>
        </div>
    );
};

export default StudentRecords;
