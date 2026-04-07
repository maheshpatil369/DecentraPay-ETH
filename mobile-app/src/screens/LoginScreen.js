import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password,        setPassword]        = useState('');
  const [loading,         setLoading]         = useState(false);

  const onLogin = async () => {
    if (!emailOrUsername.trim() || !password) return Alert.alert('Error', 'Fill all fields');
    setLoading(true);
    try {
      await login(emailOrUsername.trim(), password);
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <Text style={s.logo}>Ð</Text>
          <Text style={s.title}>DecentraPay</Text>
          <Text style={s.sub}>Sign in to continue</Text>

          <View style={s.form}>
            <View style={s.fieldGroup}>
              <Text style={s.label}>EMAIL OR USERNAME</Text>
              <TextInput style={s.input} value={emailOrUsername} onChangeText={setEmailOrUsername}
                placeholder="you@example.com or @username" placeholderTextColor="#5555aa"
                autoCapitalize="none" keyboardType="email-address" />
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.label}>PASSWORD</Text>
              <TextInput style={s.input} value={password} onChangeText={setPassword}
                placeholder="••••••••" placeholderTextColor="#5555aa" secureTextEntry />
            </View>
            <TouchableOpacity style={s.btn} onPress={onLogin} disabled={loading} activeOpacity={0.8}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={s.switchRow}>
            <Text style={s.switchText}>No account? <Text style={s.link}>Register</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#0a0a1a' },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  logo:      { fontSize: 52, color: '#6c63ff', fontWeight: '800', lineHeight: 60 },
  title:     { fontSize: 26, color: '#f0f0ff', fontWeight: '700', marginBottom: 6 },
  sub:       { fontSize: 14, color: '#9999cc', marginBottom: 36 },
  form:      { width: '100%', gap: 16 },
  fieldGroup:{ gap: 6 },
  label:     { fontSize: 10, color: '#9999cc', fontWeight: '700', letterSpacing: 1 },
  input:     { backgroundColor: '#11112a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 14, color: '#f0f0ff', fontSize: 15 },
  btn:       { backgroundColor: '#6c63ff', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 8, shadowColor: '#6c63ff', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  btnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchRow: { marginTop: 28 },
  switchText:{ color: '#9999cc', fontSize: 14 },
  link:      { color: '#6c63ff', fontWeight: '700' },
});
