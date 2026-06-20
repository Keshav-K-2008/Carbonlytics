import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Redirect or clear details on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear credentials
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // If we are in user pages, we can reload or redirect
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
};

// Dashboard Endpoints
export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
  exportPDFUrl: () => '/api/dashboard/export-pdf', // Directly used for <a> link downloads
};

// Activities Endpoints
export const activitiesAPI = {
  log: (data) => api.post('/activities', data),
  getAll: (params) => api.get('/activities', { params }),
  delete: (id) => api.delete(`/activities/${id}`),
  getFactors: () => api.get('/activities/factors'),
};

// Goals Endpoints
export const goalsAPI = {
  create: (data) => api.post('/goals', data),
  getAll: () => api.get('/goals'),
  delete: (id) => api.delete(`/goals/${id}`),
};

// Challenges Endpoints
export const challengesAPI = {
  getAll: () => api.get('/challenges'),
  enroll: (id) => api.post(`/challenges/${id}/enroll`),
  updateProgress: (id, progress) => api.put(`/challenges/${id}/progress`, { progress }),
};

// Education Endpoints
export const educationAPI = {
  getAll: (params) => api.get('/education', { params }),
  getOne: (id) => api.get(`/education/${id}`),
  toggleBookmark: (id) => api.post(`/education/${id}/bookmark`),
  getBookmarks: () => api.get('/education/bookmarks'),
};

// Admin Endpoints
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  createChallenge: (data) => api.post('/admin/challenges', data),
  publishArticle: (data) => api.post('/admin/articles', data),
};

export default api;
