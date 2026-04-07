import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { authAPI }    from '../services/api';
import { useAuth }    from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', username: '', walletAddress: '', pin: '',
  });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onRegister = async () => {
    if (!form.fullName || !form.email || !form.password || !form.username || !form.walletAddress)
      return Alert.alert('Error', 'Fill all required fields');
    if (form.password.length < 8)
      return Alert.alert('Error', 'Password min 8 characters');
    if (!/^0x[a-fA-F0-9]{40}$/.test(form.walletAddress.trim()))
      return Alert.alert('Error', 'Invalid Ethereum wallet address');

    setLoading(true);
    try {
      const res = await authAPI.register({
        fullName:      form.fullName.trim(),
        email:         form.email.trim(),
        password:      form.password,
        username:      form.username.replace(/^@/, '').trim(),
        walletAddress: form.walletAddress.trim(),
        pin:           form.pin || undefined,
      });
      await SecureStore.setItemAsync('dp_token', res.data.token);
      await SecureStore.setItemAsync('dp_user',  JSON.stringify(res.data.user));
      // Trigger auth state update via login
      await login(form.email.trim(), form.password);
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const FIELDS = [
    { label: 'FULL NAME',      key: 'fullName',      placeholder: 'Mahesh Kumar' },
    { label: 'EMAIL',          key: 'email',         placeholder: 'you@example.com', keyboard: 'email-address' },
    { label: 'PASSWORD',       key: 'password',      placeholder: 'Min 8 chars, 1 uppercase, 1 number', secure: true },
    { label: 'USERNAME',       key: 'username',      placeholder: 'mahesh', prefix: '@' },
    { label: 'WALLET ADDRESS', key: 'walletAddress', placeholder: '0x...', mono: true },
    { label: 'PIN (optional)', key: 'pin',           placeholder: '4-6 digit PIN', secure: true, keyboard: 'numeric', maxLen: 6 },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <Text style={s.logo}>Ð</Text>
          <Text style={s.title}>Create Account</Text>

          {FIELDS.map(({ label, key, placeholder, secure, keyboard, mono, prefix, maxLen }) => (
            <View key={key} style={s.fieldGroup}>
              <Text style={s.label}>{label}</Text>
              {prefix ? (
                <View style={s.prefixWrap}>
                  <Text style={s.prefix}>{prefix}</Text>
                  <TextInput
                    style={[s.input, s.inputPrefixed]}
                    value={form[key]} onChangeText={v => setF(key, v)}
                    placeholder={placeholder} placeholderTextColor="#5555aa"
                    autoCapitalize="none"
                  />
                </View>
              ) : (
                <TextInput
                  style={[s.input, mono && s.mono]}
                  value={form[key]} onChangeText={v => setF(key, v)}
                  placeholder={placeholder} placeholderTextColor="#5555aa"
                  secureTextEntry={!!secure} keyboardType={keyboard || 'default'}
                  autoCapitalize="none" maxLength={maxLen}
                />
              )}
            </View>
          ))}

          <TouchableOpacity style={s.btn} onPress={onRegister} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.switchRow}>
            <Text style={s.switchText}>Have an account? <Text style={s.link}>Sign in</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#0a0a1a' },
  container:     { padding: 28, paddingBottom: 48 },
  logo:          { fontSize: 44, color: '#6c63ff', fontWeight: '800', textAlign: 'center', marginTop: 20 },
  title:         { fontSize: 24, color: '#f0f0ff', fontWeight: '700', textAlign: 'center', marginBottom: 28 },
  fieldGroup:    { marginBottom: 16 },
  label:         { fontSize: 10, color: '#9999cc', fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  input:         { backgroundColor: '#11112a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 14, color: '#f0f0ff', fontSize: 15 },
  prefixWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#11112a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 12, paddingLeft: 14 },
  prefix:        { color: '#6c63ff', fontWeight: '700', fontSize: 16, marginRight: 4 },
  inputPrefixed: { flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingLeft: 0, padding: 14, color: '#f0f0ff', fontSize: 15 },
  mono:          { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12 },
  btn:           { backgroundColor: '#6c63ff', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 8, shadowColor: '#6c63ff', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  btnText:       { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchRow:     { marginTop: 24, alignItems: 'center' },
  switchText:    { color: '#9999cc', fontSize: 14 },
  link:          { color: '#6c63ff', fontWeight: '700' },
});
