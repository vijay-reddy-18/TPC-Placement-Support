import axios from "axios";

// ✅ Correct API base URL (Vercel + Render compatible)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (cleaned)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid auth
      sessionStorage.removeItem("token");
      window.location.href = "/login?expired=true";
    }
    
    console.error("[API ERROR]", {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
    });
    return Promise.reject(error);
  }
);

// ================= AUTH =================
export const authAPI = {
  register: (studentId, name, password, confirmPassword) =>
    api.post("/auth/register", {
      studentId,
      name,
      password,
      confirmPassword,
    }),

  login: (studentId, password, role) =>
    api.post("/auth/login", { studentId, password, role }),

  getCurrentUser: () => api.get("/auth/me"),
  getFeatures: () => api.get("/auth/features"),
};

// ================= TICKETS =================
export const ticketAPI = {
  createTicket: (title, description, category, priority, department) =>
    api.post("/tickets", {
      title,
      description,
      category,
      priority,
      department,
    }),

  getAllTickets: (status, priority, category, page = 1, limit = 10) =>
    api.get("/tickets", {
      params: { status, priority, category, page, limit },
    }),

  getTicket: (id) => api.get(`/tickets/${id}`),
  updateTicket: (id, data) => api.put(`/tickets/${id}`, data),
  closeTicket: (id) => api.put(`/tickets/${id}/close`),
  reopenTicket: (id, reason) => api.put(`/tickets/reopen/${id}`, { reason }),
  assignTicket: (id, assignedTo) =>
    api.put(`/tickets/${id}/assign`, { assignedTo }),
  addStudentResponse: (id, message) =>
    api.post(`/tickets/${id}/student-response`, { message }),
  submitFeedback: (id, data) =>
    api.put(`/tickets/${id}/feedback`, data),
};

// ================= USER =================
export const userAPI = {
  getProfile: () => api.get("/user/profile"),
  getStudentProfile: (studentId) =>
    api.get(`/user/student/${studentId}`),
  updateProfile: (data) => api.put("/user/profile", data),
};

// ================= ANNOUNCEMENTS =================
export const announcementAPI = {
  getAll: (category, page = 1, limit = 10) =>
    api.get("/announcements", {
      params: { category, page, limit },
    }),

  getOne: (id) => api.get(`/announcements/${id}`),
};

// ================= ACTIVITY =================
export const activityLogAPI = {
  getTicketActivity: (ticketId, page = 1, limit = 20) =>
    api.get(`/activity-logs/ticket/${ticketId}`, {
      params: { page, limit },
    }),
};

export default api;