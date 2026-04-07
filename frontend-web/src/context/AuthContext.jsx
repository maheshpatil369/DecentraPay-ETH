import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('dp_user') || 'null'); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dp_token');
    if (!token) { setLoading(false); return; }
    authAPI.getMe()
      .then(res => { setUser(res.data.user); localStorage.setItem('dp_user', JSON.stringify(res.data.user)); })
      .catch(() => { localStorage.removeItem('dp_token'); localStorage.removeItem('dp_user'); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (emailOrUsername, password) => {
    const res = await authAPI.login({ emailOrUsername, password });
    localStorage.setItem('dp_token', res.data.token);
    localStorage.setItem('dp_user',  JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  }, []);

  const register = useCallback(async (formData) => {
    const res = await authAPI.register(formData);
    localStorage.setItem('dp_token', res.data.token);
    localStorage.setItem('dp_user',  JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('dp_token');
    localStorage.removeItem('dp_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('dp_user', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
