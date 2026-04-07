import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('dp_token');
        if (!token) { setLoading(false); return; }
        const res = await authAPI.getMe();
        setUser(res.data.user);
      } catch {
        await SecureStore.deleteItemAsync('dp_token').catch(() => {});
        await SecureStore.deleteItemAsync('dp_user').catch(() => {});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (emailOrUsername, password) => {
    const res = await authAPI.login({ emailOrUsername, password });
    await SecureStore.setItemAsync('dp_token', res.data.token);
    await SecureStore.setItemAsync('dp_user',  JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('dp_token').catch(() => {});
    await SecureStore.deleteItemAsync('dp_user').catch(() => {});
    setUser(null);
  };

  const updateUser = (updates) => setUser(p => ({ ...p, ...updates }));

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
