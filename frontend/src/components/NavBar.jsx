import React from 'react';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import '../styles/Navbar.css';

const NavBar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getRoleLabel = () => {
        if (user?.role === 'admin') return 'Admin';
        if (user?.role === 'tpc') return 'TPC Staff';
        return 'Student';
    };

    return (
        <Navbar bg="primary" variant="dark" expand="lg" className="navbar">
            <Container fluid>
                <Navbar.Brand onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                    🎓 TPC Support System
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {user?.role === 'student' && (
                            <>
                                <Nav.Link onClick={() => navigate('/dashboard')}>
                                    🏠 Dashboard
                                </Nav.Link>
                            </>
                        )}
                        {user?.role === 'admin' && (
                            <>
                                <Nav.Link onClick={() => navigate('/dashboard')}>
                                    🏠 Dashboard
                                </Nav.Link>
                                <Nav.Link onClick={() => navigate('/admin/queries')}>
                                    📊 Queries
                                </Nav.Link>
                                <Nav.Link onClick={() => navigate('/admin/tpc-ids')}>
                                    🔑 TPC IDs
                                </Nav.Link>
                                <Nav.Link onClick={() => navigate('/admin/statistics')}>
                                    📈 Statistics
                                </Nav.Link>
                            </>
                        )}
                    </Nav>

                    <Nav className="align-items-center">
                        <span className="text-white me-2">
                            <FaUser className="me-2" />
                            {user?.name || 'User'}
                        </span>
                        <span className="badge bg-success me-3">
                            {getRoleLabel()}
                        </span>
                        <Dropdown>
                            <Dropdown.Toggle variant="light" id="dropdown-basic">
                                Menu
                            </Dropdown.Toggle>

                            <Dropdown.Menu align="end">
                                <Dropdown.Item onClick={() => navigate('/dashboard')}>
                                    Dashboard
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={handleLogout} className="text-danger">
                                    <FaSignOutAlt className="me-2" />
                                    Logout
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default NavBar;
