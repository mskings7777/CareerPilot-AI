import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { firstName: string; lastName: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  updateProfile: (data: Record<string, unknown>) => api.put('/auth/profile', data),
};

// Resume API
export const resumeApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: () => api.get('/resume'),
  getById: (id: string) => api.get(`/resume/${id}`),
  delete: (id: string) => api.delete(`/resume/${id}`),
};

// Career API
export const careerApi = {
  getDashboard: () => api.get('/career/dashboard'),
  getPaths: () => api.get('/career/paths'),
  getPathBySlug: (slug: string) => api.get(`/career/paths/${slug}`),
  analyze: (resumeId: string) => api.post(`/career/analyze/${resumeId}`),
  getRecommendations: () => api.get('/career/recommendations'),
  getRecommendationById: (id: string) => api.get(`/career/recommendations/${id}`),
  getSkillGap: (resumeId: string, careerPathId?: string) =>
    api.get(`/career/skill-gap/${resumeId}`, { params: { careerPathId } }),
  getPersonalizedRoadmap: (careerPathId: string, resumeId: string) =>
    api.get(`/career/roadmap/${careerPathId}`, { params: { resumeId } }),
};

export default api;
