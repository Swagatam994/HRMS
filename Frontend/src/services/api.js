import axios from 'axios';
import { storageKeys } from '../utils/constants.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 60000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(storageKeys.token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then((res) => res.data),
  login: (payload) => api.post('/auth/login', payload).then((res) => res.data)
};

export const userApi = {
  getProfile: () => api.get('/user/profile').then((res) => res.data),
  updateProfile: (payload) => api.patch('/user/profile', payload).then((res) => res.data)
};

export const questionApi = {
  getByRole: (role, params) => api.get(`/questions/${encodeURIComponent(role)}`, { params }).then((res) => res.data)
};

export const interviewApi = {
  start: (payload) => api.post('/interview/start', payload).then((res) => res.data),
  submitAnswer: (payload) => api.post('/interview/answer', payload).then((res) => res.data),
  end: (payload) => api.post('/interview/end', payload).then((res) => res.data),
  history: () => api.get('/interview/history').then((res) => res.data),
  getById: (id) => api.get(`/interview/${id}`).then((res) => res.data)
};

export default api;
