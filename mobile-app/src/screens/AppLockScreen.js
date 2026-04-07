import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Vibration, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useAppLock } from '../context/AppLockContext';
import { useAuth }    from '../context/AuthContext';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
const MAX_PIN = 6;

export default function AppLockScreen() {
  const { verifyPin, verifying, pinError } = useAppLock();
  const { user, logout } = useAuth();
  const [pin, setPin] = useState('');

  const onKey = async (key) => {
    if (verifying || key === '') return;

    if (key === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= MAX_PIN) return;

    const next = pin + key;
    setPin(next);

    if (next.length === MAX_PIN) {
      const ok = await verifyPin(next);
      if (!ok) { Vibration.vibrate(400); setPin(''); }
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.logo}>Ð</Text>
        <Text style={s.appName}>DecentraPay</Text>
        <Text style={s.greeting}>Welcome back</Text>
        <Text style={s.userName}>{user?.fullName?.split(' ')[0]} 👋</Text>
        <Text style={s.sub}>Enter your PIN to unlock</Text>

        {/* PIN dots */}
        <View style={s.dotsRow}>
          {Array.from({ length: MAX_PIN }).map((_, i) => (
            <View key={i} style={[
              s.dot,
              i < pin.length && s.dotFilled,
              pinError && i < pin.length && s.dotError,
            ]} />
          ))}
        </View>

        {pinError ? <Text style={s.error}>{pinError}</Text> : null}
        {verifying ? <ActivityIndicator color="#6c63ff" style={{ marginTop: 8 }} /> : null}

        {/* Keypad */}
        <View style={s.keypad}>
          {KEYS.map((k, i) => (
            <TouchableOpacity
              key={i}
              style={[s.key, k === '' && s.keyHidden]}
              onPress={() => onKey(k)}
              disabled={verifying || k === ''}
              activeOpacity={0.6}
            >
              <Text style={[s.keyText, k === '⌫' && s.backspace]}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={logout} style={s.logoutBtn}>
          <Text style={s.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#0a0a1a' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo:      { fontSize: 52, color: '#6c63ff', fontWeight: '800', lineHeight: 60 },
  appName:   { fontSize: 22, color: '#f0f0ff', fontWeight: '700', marginBottom: 32 },
  greeting:  { fontSize: 14, color: '#9999cc' },
  userName:  { fontSize: 26, color: '#f0f0ff', fontWeight: '700', marginBottom: 4 },
  sub:       { fontSize: 13, color: '#5555aa', marginBottom: 32 },
  dotsRow:   { flexDirection: 'row', gap: 14, marginBottom: 10 },
  dot:       { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#3333aa', backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  dotError:  { backgroundColor: '#ff4d6d', borderColor: '#ff4d6d' },
  error:     { color: '#ff4d6d', fontSize: 13, marginBottom: 4 },
  keypad:    { flexDirection: 'row', flexWrap: 'wrap', width: 240, gap: 14, marginTop: 32, justifyContent: 'center' },
  key:       { width: 64, height: 64, borderRadius: 32, backgroundColor: '#16163a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  keyHidden: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText:   { fontSize: 22, color: '#f0f0ff', fontWeight: '600' },
  backspace: { fontSize: 20, color: '#9999cc' },
  logoutBtn: { marginTop: 44 },
  logoutText:{ color: '#5555aa', fontSize: 14 },
});
