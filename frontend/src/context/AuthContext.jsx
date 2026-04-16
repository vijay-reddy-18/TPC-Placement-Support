import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(sessionStorage.getItem('token'));
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on mount
    useEffect(() => {
        const checkAuth = async () => {
            if (token) {
                try {
                    const response = await authAPI.getCurrentUser();
                    setUser(response.data.user);
                    
                    try {
                        const featuresRes = await authAPI.getFeatures();
                        setFeatures(featuresRes.data.features || []);
                    } catch (fErr) { console.error('Failed to fetch features on load:', fErr); }
                    
                } catch (error) {
                    console.error('Auth check failed:', error);
                    sessionStorage.removeItem('token');
                    setToken(null);
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, [token]);

    const login = async (studentId, password, role) => {
        try {
            const response = await authAPI.login(studentId, password, role);
            const { token, user } = response.data;
            sessionStorage.setItem('token', token);
            setToken(token);
            setUser(user);
            
            try {
                const featuresRes = await authAPI.getFeatures();
                setFeatures(featuresRes.data.features || []);
            } catch (fErr) { console.error('Failed to fetch features on login:', fErr); }

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    };

    const register = async (studentId, name, password, confirmPassword) => {
        try {
            const response = await authAPI.register(studentId, name, password, confirmPassword);
            const { token, user } = response.data;
            sessionStorage.setItem('token', token);
            setToken(token);
            setUser(user);

            try {
                const featuresRes = await authAPI.getFeatures();
                setFeatures(featuresRes.data.features || []);
            } catch (fErr) { console.error('Failed to fetch features on register:', fErr); }

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setFeatures([]);
        import('react-toastify').then(({ toast }) => {
            toast.success("Logged out successfully");
        });
    };

    return (
        <AuthContext.Provider value={{ user, token, features, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
