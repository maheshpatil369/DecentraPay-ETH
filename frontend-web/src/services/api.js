import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '/api';

const api = axios.create({ baseURL: API_BASE, timeout: 15000 });

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('dp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
}, Promise.reject);

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      try {
        localStorage.removeItem('dp_token');
        localStorage.removeItem('dp_user');
      } catch {}
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
};

export const paymentAPI = {
  payByUsername: (data)   => api.post('/payment/pay-by-username', data),
  payByAddress:  (data)   => api.post('/payment/pay-by-address',  data),
  splitPayment:  (data)   => api.post('/payment/split-payment',   data),
  getHistory:    (page=1) => api.get(`/payment/history?page=${page}`),
  getStats:      ()       => api.get('/payment/stats'),
};

export const paymentsAPI = {
  send: (data) => api.post('/payments/send', data),
};

export const qrAPI = {
  validate: (qrData) => api.post('/qr/validate', { qrData }),
  resolveUser: (username) => api.post('/qr/resolve-user', { username }),
};

export const securityAPI = {
  verifyPin: (pin) => api.post('/security/verify-pin', { pin }),
  setPin:    (pin) => api.post('/security/set-pin',    { pin }),
};

export default api;