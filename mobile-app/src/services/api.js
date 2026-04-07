import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change to your machine's LAN IP when testing on a physical device
// e.g. 'http://192.168.1.5:5000/api'
// For Android emulator use: 'http://10.0.2.2:5000/api'
// For iOS simulator use:    'http://localhost:5000/api'
const API_BASE = 'http://10.0.2.2:5000/api';

const api = axios.create({ baseURL: API_BASE, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('dp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
}, Promise.reject);

api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('dp_token').catch(() => {});
      await SecureStore.deleteItemAsync('dp_user').catch(() => {});
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
  search:        (q) => api.get(`/users/search?username=${encodeURIComponent(q)}`),
};

export const paymentAPI = {
  payByUsername: (data)    => api.post('/payment/pay-by-username', data),
  splitPayment:  (data)    => api.post('/payment/split-payment',   data),
  getHistory:    (page=1)  => api.get(`/payment/history?page=${page}`),
  getStats:      ()        => api.get('/payment/stats'),
};

export const securityAPI = {
  verifyPin: (pin) => api.post('/security/verify-pin', { pin }),
  setPin:    (pin) => api.post('/security/set-pin',    { pin }),
};

export default api;
