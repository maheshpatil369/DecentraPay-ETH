import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, Promise.reject);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dp_token');
      localStorage.removeItem('dp_user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login',    data),
  getMe:    ()     => api.get('/auth/me'),
};

export const userAPI = {
  getByUsername: (u) => api.get(`/users/${encodeURIComponent(u)}`),
  getByAddress:  (a) => api.get(`/users/address/${encodeURIComponent(a)}`),
  search:        (q) => api.get(`/users/search?username=${encodeURIComponent(q)}`),
  updateProfile: (d) => api.put('/users/profile', d),
};

export const paymentAPI = {
  payByUsername: (d)      => api.post('/payment/pay-by-username', d),
  payByAddress:  (d)      => api.post('/payment/pay-by-address',  d),
  splitPayment:  (d)      => api.post('/payment/split-payment',   d),
  getHistory:    (page=1) => api.get(`/payment/history?page=${page}&limit=20`),
  getStats:      ()       => api.get('/payment/stats'),
};

export const securityAPI = {
  verifyPin: (pin) => api.post('/security/verify-pin', { pin }),
  setPin:    (pin) => api.post('/security/set-pin',    { pin }),
};

export default api;