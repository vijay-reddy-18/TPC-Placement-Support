import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { FaUserPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/Auth.css';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        studentId: '',
        name: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors = {};

        if (!formData.studentId) {
            newErrors.studentId = 'Student ID is required';
        } else if (!/^\d{8}$/.test(formData.studentId)) {
            newErrors.studentId = 'Student ID must be exactly 8 digits';
        }

        if (!formData.name) {
            newErrors.name = 'Name is required';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Confirm password is required';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        return newErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validateForm();

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setGeneralError('');

        try {
            await register(
                formData.studentId,
                formData.name,
                formData.password,
                formData.confirmPassword
            );
            toast.success('Registration successful!');
            navigate('/dashboard');
        } catch (error) {
            setGeneralError(error.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="auth-container d-flex align-items-center justify-content-center min-vh-100">
            <div className="w-100" style={{ maxWidth: '500px' }}>
                <Card className="shadow-lg border-0 rounded-lg">
                    <Card.Body className="p-5">
                        <div className="text-center mb-4">
                            <FaUserPlus className="auth-icon text-success mb-3" style={{ fontSize: '3rem' }} />
                            <h2 className="fw-bold text-dark">Student Registration</h2>
                            <p className="text-muted">Create your TPC account</p>
                        </div>

                        {generalError && <Alert variant="danger">{generalError}</Alert>}

                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Student ID</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="studentId"
                                    placeholder="8-digit ID (e.g., 22123456)"
                                    value={formData.studentId}
                                    onChange={handleChange}
                                    isInvalid={!!errors.studentId}
                                    disabled={loading}
                                    maxLength="8"
                                    className="border-2"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.studentId}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Full Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="name"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    isInvalid={!!errors.name}
                                    disabled={loading}
                                    className="border-2"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.name}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="password"
                                    placeholder="Enter password (min 6 characters)"
                                    value={formData.password}
                                    onChange={handleChange}
                                    isInvalid={!!errors.password}
                                    disabled={loading}
                                    className="border-2"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.password}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold">Confirm Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    isInvalid={!!errors.confirmPassword}
                                    disabled={loading}
                                    className="border-2"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.confirmPassword}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Button
                                variant="success"
                                type="submit"
                                className="w-100 fw-bold py-2 mb-3"
                                disabled={loading}
                                size="lg"
                            >
                                {loading ? 'Registering...' : 'Register'}
                            </Button>
                        </Form>

                        <div className="text-center">
                            <p className="text-muted mb-0">
                                Already have an account?{' '}
                                <Link to="/login" className="fw-bold text-primary text-decoration-none">
                                    Login here
                                </Link>
                            </p>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </Container>
    );
};

export default RegisterPage;
