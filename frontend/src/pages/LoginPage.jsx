import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import '../styles/Auth.css';

const LoginPage = () => {
    const [tab, setTab] = useState('student'); // student or staff (tpc/admin)
    const [staffRole, setStaffRole] = useState('tpc'); // tpc or admin
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('expired') === 'true') {
            toast.warn('Your session has expired. Please log in again.');
            params.delete('expired');
            navigate('/login', { replace: true });
        }
    }, [location, navigate]);

    const validateForm = () => {
        const newErrors = {};

        if (!studentId) {
            newErrors.studentId = 'ID is required';
        } else if (!/^\d{8}$/.test(studentId)) {
            newErrors.studentId = 'ID must be exactly 8 digits';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        }

        return newErrors;
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
            const role = tab === 'student' ? 'student' : staffRole;
            await login(studentId, password, role);
            toast.success('Successfully logged in!');
            navigate('/dashboard');
        } catch (error) {
            setGeneralError(error.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (newTab) => {
        setTab(newTab);
        setStudentId('');
        setPassword('');
        setErrors({});
        setGeneralError('');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #e0e8f5 0%, #d4d8f5 100%)',
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                padding: '40px',
                maxWidth: '450px',
                width: '100%'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                    <div style={{
                        fontSize: '2.5rem',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}>
                        <span style={{ fontSize: '2.5rem' }}>🛡️</span>
                        <span style={{
                            fontWeight: '700',
                            fontSize: '1.8rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            Placement Portal
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', marginBottom: '30px', gap: '10px' }}>
                    <button
                        onClick={() => handleTabChange('student')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: 'none',
                            borderRadius: '25px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            background: tab === 'student'
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : '#f0f0f0',
                            color: tab === 'student' ? 'white' : '#333',
                            boxShadow: tab === 'student' ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none'
                        }}
                    >
                        Student
                    </button>
                    <button
                        onClick={() => handleTabChange('staff')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: 'none',
                            borderRadius: '25px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            background: tab === 'staff'
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : '#f0f0f0',
                            color: tab === 'staff' ? 'white' : '#333',
                            boxShadow: tab === 'staff' ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none'
                        }}
                    >
                        TPC / Admin
                    </button>
                </div>

                {/* Error Message */}
                {generalError && (
                    <div style={{
                        padding: '12px',
                        marginBottom: '20px',
                        background: '#fee',
                        color: '#c33',
                        borderRadius: '8px',
                        fontSize: '14px',
                        border: '1px solid #fcc'
                    }}>
                        {generalError}
                    </div>
                )}

                {/* Staff Role Selection */}
                {tab === 'staff' && (
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#333'
                        }}>
                            Select Role:
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <select
                                value={staffRole}
                                onChange={(e) => setStaffRole(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '10px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    background: 'white',
                                    color: '#333',
                                    cursor: 'pointer',
                                    transition: 'border-color 0.3s ease'
                                }}
                            >
                                <option value="tpc">TPC Department</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                    {/* ID Field */}
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#333'
                        }}>
                            {tab === 'student' ? 'Student ID' : 'ID'}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#999',
                                fontSize: '16px'
                            }}>
                                📧
                            </span>
                            <input
                                type="text"
                                placeholder={tab === 'student' ? 'Student ID (8 digits)' : 'ID (8 digits)'}
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                maxLength="8"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 40px',
                                    border: errors.studentId ? '1px solid #c33' : '1px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                                    boxSizing: 'border-box',
                                    background: '#fafafa'
                                }}
                                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'}
                                onBlur={(e) => e.target.style.boxShadow = 'none'}
                            />
                            {errors.studentId && (
                                <div style={{
                                    fontSize: '12px',
                                    color: '#c33',
                                    marginTop: '5px'
                                }}>
                                    {errors.studentId}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Password Field */}
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#333'
                        }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#999',
                                fontSize: '16px'
                            }}>
                                🔐
                            </span>
                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 40px',
                                    border: errors.password ? '1px solid #c33' : '1px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                                    boxSizing: 'border-box',
                                    background: '#fafafa'
                                }}
                                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'}
                                onBlur={(e) => e.target.style.boxShadow = 'none'}
                            />
                            {errors.password && (
                                <div style={{
                                    fontSize: '12px',
                                    color: '#c33',
                                    marginTop: '5px'
                                }}>
                                    {errors.password}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '13px',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '15px',
                            fontWeight: '700',
                            background: loading
                                ? 'linear-gradient(135deg, #999 0%, #777 100%)'
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                            opacity: loading ? 0.8 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                                e.target.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                                e.target.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                {/* Footer Links */}
                <div style={{
                    marginTop: '25px',
                    textAlign: 'center',
                    fontSize: '13px'
                }}>
                    {tab === 'student' && (
                        <>
                            <p style={{ margin: '0 0 12px 0', color: '#666' }}>
                                Don't have an account?{' '}
                                <Link to="/register" style={{
                                    color: '#667eea',
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    transition: 'color 0.3s ease'
                                }} onMouseEnter={(e) => e.target.style.color = '#764ba2'} onMouseLeave={(e) => e.target.style.color = '#667eea'}>
                                    Sign up here
                                </Link>
                            </p>
                        </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                        <a href="#" style={{
                            color: '#999',
                            textDecoration: 'none',
                            transition: 'color 0.3s ease'
                        }} onMouseEnter={(e) => e.target.style.color = '#667eea'} onMouseLeave={(e) => e.target.style.color = '#999'}>
                            Forgot password?
                        </a>
                        <span style={{ color: '#ddd' }}>|</span>
                        <a href="#" style={{
                            color: '#999',
                            textDecoration: 'none',
                            transition: 'color 0.3s ease'
                        }} onMouseEnter={(e) => e.target.style.color = '#667eea'} onMouseLeave={(e) => e.target.style.color = '#999'}>
                            Need help?
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
