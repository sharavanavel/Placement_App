import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Student API calls
export const studentAPI = {
  register: (data) => api.post('/students/register', data),
  login: (data) => api.post('/students/login', data),
  getCompanies: () => api.get('/students/companies'),
  applyToCompany: (companyId) => api.post(`/students/apply/${companyId}`),
  getProfile: () => api.get('/students/profile')
};

// Coordinator API calls
export const coordinatorAPI = {
  login: (data) => api.post('/coordinators/login', data),
  addCompany: (data) => api.post('/coordinators/companies', data),
  getCompanies: () => api.get('/coordinators/companies'),
  getCompanyApplications: (companyId) => api.get(`/coordinators/companies/${companyId}/applications`),
  deleteCompany: (companyId) => api.delete(`/coordinators/companies/${companyId}`),
  getProfile: () => api.get('/coordinators/profile')
};

export default api;
