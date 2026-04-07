import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const INACTIVITY_TIMEOUT_MS = 60_000; // 60 seconds

const AppLockContext = createContext(null);

export const AppLockProvider = ({ children }) => {
  const [locked,    setLocked]    = useState(false);
  const [hasPIN,    setHasPIN]    = useState(false);
  const [pinError,  setPinError]  = useState('');
  const [verifying, setVerifying] = useState(false);
  const bgTime   = useRef(null);
  const appState = useRef(AppState.currentState);

  // On mount: check if PIN flag stored
  useEffect(() => {
    SecureStore.getItemAsync('dp_has_pin').then(v => {
      if (v === 'true') { setHasPIN(true); setLocked(true); }
    }).catch(() => {});
  }, []);

  // Lock on inactivity
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current === 'active' && next !== 'active') {
        bgTime.current = Date.now();
      }
      if (next === 'active' && bgTime.current) {
        if (hasPIN && (Date.now() - bgTime.current) >= INACTIVITY_TIMEOUT_MS) {
          setLocked(true);
        }
        bgTime.current = null;
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [hasPIN]);

  /**
   * Verify PIN by calling backend API.
   * Only called when user IS logged in (token exists in SecureStore).
   */
  const verifyPin = useCallback(async (pin) => {
    setVerifying(true);
    setPinError('');
    try {
      // Import here to avoid circular deps and premature calls
      const { securityAPI } = require('../services/api');
      await securityAPI.verifyPin(String(pin));
      setLocked(false);
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Incorrect PIN';
      setPinError(msg);
      return false;
    } finally {
      setVerifying(false);
    }
  }, []);

  const enablePIN = useCallback(async (pin) => {
    const { securityAPI } = require('../services/api');
    await securityAPI.setPin(String(pin));
    await SecureStore.setItemAsync('dp_has_pin', 'true');
    setHasPIN(true);
  }, []);

  const disablePIN = useCallback(async () => {
    await SecureStore.deleteItemAsync('dp_has_pin').catch(() => {});
    setHasPIN(false);
    setLocked(false);
  }, []);

  const lock   = useCallback(() => { if (hasPIN) setLocked(true); }, [hasPIN]);
  const unlock = useCallback(() => setLocked(false), []);

  return (
    <AppLockContext.Provider value={{ locked, hasPIN, pinError, verifying, verifyPin, enablePIN, disablePIN, lock, unlock }}>
      {children}
    </AppLockContext.Provider>
  );
};

export const useAppLock = () => {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error('useAppLock must be inside AppLockProvider');
  return ctx;
};
