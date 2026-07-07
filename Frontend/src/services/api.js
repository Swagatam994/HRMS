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

export const hrApi = {
  dashboard: () => api.get('/hr/dashboard').then((res) => res.data),
  listInterviews: () => api.get('/hr/interviews').then((res) => res.data),
  createInterview: (payload) => api.post('/hr/interviews', payload).then((res) => res.data),
  getInterview: (id) => api.get(`/hr/interviews/${id}`).then((res) => res.data),
  updateInterview: (id, payload) => api.patch(`/hr/interviews/${id}`, payload).then((res) => res.data),
  getRankings: (id, params) => api.get(`/hr/interviews/${id}/rankings`, { params }).then((res) => res.data),
  getSession: (sessionId) => api.get(`/hr/sessions/${sessionId}`).then((res) => res.data),
  updateCandidateStatus: (rankingId, status) =>
    api.patch(`/hr/rankings/${rankingId}/status`, { status }).then((res) => res.data)
};

export const candidateApi = {
  dashboard: () => api.get('/candidate/dashboard').then((res) => res.data),
  getInvite: (code) => api.get(`/candidate/invite/${encodeURIComponent(code)}`).then((res) => res.data),
  join: (inviteCode) => api.post('/candidate/join', { inviteCode }).then((res) => res.data),
  getSession: (sessionId) => api.get(`/candidate/interviews/${sessionId}`).then((res) => res.data),
  startSession: (sessionId) => api.post(`/candidate/interviews/${sessionId}/start`).then((res) => res.data),
  submitAnswer: (sessionId, payload) => api.post(`/candidate/interviews/${sessionId}/answer`, payload).then((res) => res.data),
  completeSession: (sessionId, payload) => api.post(`/candidate/interviews/${sessionId}/complete`, payload).then((res) => res.data)
};

export default api;
