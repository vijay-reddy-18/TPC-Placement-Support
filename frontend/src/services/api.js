import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log(`[API] ${config.method.toUpperCase()} ${config.url} - Token attached`);
        } else {
            console.warn(`[API] ${config.method.toUpperCase()} ${config.url} - No token found!`);
        }
        return config;
    },
    (error) => {
        console.error('[API REQUEST ERROR]', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
    (response) => {
        console.log(`[API RESPONSE] ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('[API ERROR]', {
            status: error.response?.status,
            url: error.response?.config?.url,
            method: error.response?.config?.method,
            message: error.response?.data?.message || error.message,
            data: error.response?.data
        });
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    register: (studentId, name, password, confirmPassword) =>
        api.post('/auth/register', { studentId, name, password, confirmPassword }),
    login: (studentId, password, role) =>
        api.post('/auth/login', { studentId, password, role }),
    getCurrentUser: () => api.get('/auth/me'),
    getFeatures: () => api.get('/auth/features'),
};

// Ticket APIs
export const ticketAPI = {
    createTicket: (title, description, category, priority, department) =>
        api.post('/tickets', { title, description, category, priority, department }),
    getAllTickets: (status, priority, category, page = 1, limit = 10) =>
        api.get('/tickets', { params: { status, priority, category, page, limit } }),
    getTicket: (id) => api.get(`/tickets/${id}`),
    updateTicket: (id, data) => api.put(`/tickets/${id}`, data),
    closeTicket: (id) => api.put(`/tickets/${id}/close`),
    assignTicket: (id, assignedTo) => api.put(`/tickets/${id}/assign`, { assignedTo }),
    escalateTicket: (id, escalationReason) => api.put(`/tickets/escalate/${id}`, { escalationReason }),
    reopenTicket: (id, reason) => api.put(`/tickets/reopen/${id}`, { reason }),
    getTicketHistory: (id) => api.get(`/tickets/history/${id}`),
    getDashboardStats: () => api.get('/tickets/stats/dashboard'),
    getSLADashboard: () => api.get('/tickets/stats/sla'),
    getCategoryAnalytics: () => api.get('/tickets/stats/categories'),
    getWeeklyTrends: () => api.get('/tickets/stats/weekly-trends'),
    getPerformanceStats: () => api.get('/tickets/stats/performance'),
    getEscalatedTickets: (page = 1, limit = 10) => api.get('/tickets/escalated/list', { params: { page, limit } }),
    addInternalNote: (id, note) => api.post(`/tickets/${id}/note`, { note }),
    submitFeedback: (id, rating, comment) => api.put(`/tickets/${id}/feedback`, { rating, comment }),
    addStudentResponse: (id, message) => api.post(`/tickets/${id}/student-response`, { message }),
};

// User Settings APIs
export const userAPI = {
    getProfile: () =>
        api.get('/user/profile'),
    getStudentProfile: (studentId) =>
        api.get(`/user/student/${studentId}`),
    updateProfile: (profileData) =>
        api.put('/user/profile', profileData),
    uploadProfilePhoto: (file) => {
        const formData = new FormData();
        formData.append('profilePhoto', file);
        return api.post('/user/upload-photo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    updateSettings: (settings) =>
        api.put('/user/settings', settings),
    changePassword: (currentPassword, newPassword, confirmPassword) =>
        api.post('/user/change-password', { currentPassword, newPassword, confirmPassword }),
    downloadData: () =>
        api.get('/user/download-data', { responseType: 'blob' }),
    deleteAccount: (password) =>
        api.delete('/user/delete-account', { data: { password } }),
};

// Announcement APIs
export const announcementAPI = {
    getAll: (category, page = 1, limit = 10) =>
        api.get('/announcements', { params: { category, page, limit } }),
    getOne: (id) => api.get(`/announcements/${id}`),
    create: (title, description, category, content, targetAudience, targetBatch, targetBranch, expiryDate, priority) =>
        api.post('/announcements', { title, description, category, content, targetAudience, targetBatch, targetBranch, expiryDate, priority }),
    update: (id, data) => api.put(`/announcements/${id}`, data),
    delete: (id) => api.delete(`/announcements/${id}`),
};

// Activity Log APIs
export const activityLogAPI = {
    getTicketActivity: (ticketId, page = 1, limit = 20) =>
        api.get(`/activity-logs/ticket/${ticketId}`, { params: { page, limit } }),
    getUserActivity: (userId, page = 1, limit = 20, action) =>
        api.get(`/activity-logs/user/${userId}`, { params: { page, limit, action } }),
    getAllActivityLogs: (page = 1, limit = 20, action, startDate, endDate) =>
        api.get('/activity-logs/all/logs', { params: { page, limit, action, startDate, endDate } }),
};

export default api;
