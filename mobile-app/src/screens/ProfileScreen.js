import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, SafeAreaView, Switch, Platform,
} from 'react-native';
import { useAuth }    from '../context/AuthContext';
import { useAppLock } from '../context/AppLockContext';
import { securityAPI, userAPI } from '../services/api';

const shortAddr = (a = '') => a.length > 10 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a;

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { hasPIN, enablePIN, disablePIN } = useAppLock();
  const [editName,  setEditName]  = useState(user?.fullName || '');
  const [saving,    setSaving]    = useState(false);
  const [newPin,    setNewPin]    = useState('');
  const [savingPin, setSavingPin] = useState(false);

  const saveProfile = async () => {
    if (!editName.trim()) return Alert.alert('Error', 'Name cannot be empty');
    setSaving(true);
    try {
      const res = await userAPI.updateProfile({ fullName: editName.trim() });
      updateUser(res.data.user);
      Alert.alert('Success', 'Profile updated!');
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const savePin = async () => {
    if (newPin.length < 4 || newPin.length > 6) return Alert.alert('Error', 'PIN must be 4-6 digits');
    if (!/^\d+$/.test(newPin)) return Alert.alert('Error', 'PIN must be numeric');
    setSavingPin(true);
    try {
      await enablePIN(newPin);
      setNewPin('');
      Alert.alert('Success', 'App PIN set! App will lock after 60 seconds in background.');
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Failed to set PIN'); }
    finally { setSavingPin(false); }
  };

  const togglePIN = async (val) => {
    if (!val) {
      Alert.alert('Disable PIN?', 'The app will no longer lock automatically.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disable', style: 'destructive', onPress: disablePIN },
      ]);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Profile</Text>

        {/* Identity */}
        <View style={s.card}>
          <View style={[s.avatar, { backgroundColor: '#6c63ff' }]}>
            <Text style={s.avatarTxt}>{user?.fullName?.[0]?.toUpperCase()}</Text>
          </View>
          <Text style={s.displayName}>{user?.fullName}</Text>
          <Text style={s.handle}>@{user?.username}</Text>
          <Text style={s.addr}>{shortAddr(user?.walletAddress)}</Text>
        </View>

        {/* Edit name */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Edit Profile</Text>
          <Text style={s.label}>FULL NAME</Text>
          <TextInput style={s.input} value={editName} onChangeText={setEditName} placeholder="Your name" placeholderTextColor="#5555aa" />
          <TouchableOpacity style={s.btn} onPress={saveProfile} disabled={saving}>
            <Text style={s.btnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>

        {/* PIN */}
        <View style={s.section}>
          <View style={s.row}>
            <Text style={s.sectionTitle}>App Lock PIN</Text>
            <Switch
              value={hasPIN}
              onValueChange={togglePIN}
              trackColor={{ false: '#3333aa', true: '#6c63ff' }}
              thumbColor="#f0f0ff"
            />
          </View>
          <Text style={s.hint}>Lock app after 60s in background</Text>
          {!hasPIN && (
            <>
              <Text style={[s.label, { marginTop: 12 }]}>SET NEW PIN</Text>
              <TextInput style={s.input}
                value={newPin}
                onChangeText={v => setNewPin(v.replace(/\D/g, '').slice(0, 6))}
                placeholder="4-6 digit PIN" placeholderTextColor="#5555aa"
                keyboardType="numeric" secureTextEntry maxLength={6} />
              <TouchableOpacity style={[s.btn, { marginTop: 8 }]} onPress={savePin} disabled={savingPin}>
                <Text style={s.btnText}>{savingPin ? 'Setting…' : 'Enable PIN Lock'}</Text>
              </TouchableOpacity>
            </>
          )}
          {hasPIN && (
            <View style={s.pinActive}>
              <Text style={{ color: '#00d4aa', fontWeight: '700' }}>✓ PIN active</Text>
              <Text style={s.hint}>App will lock after 60 seconds in background</Text>
            </View>
          )}
        </View>

        {/* Wallet info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Wallet Details</Text>
          {[
            ['Address',      user?.walletAddress],
            ['Network',      'Ganache (Local)'],
            ['Member Since', user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'],
          ].map(([k, v]) => (
            <View key={k} style={s.detailRow}>
              <Text style={s.detailKey}>{k}</Text>
              <Text style={s.detailVal} numberOfLines={1}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={() => Alert.alert('Sign Out?', '', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: logout },
        ])}>
          <Text style={s.logoutText}>⏻  Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#0a0a1a' },
  content:     { padding: 20, paddingBottom: 48 },
  title:       { fontSize: 24, color: '#f0f0ff', fontWeight: '700', marginBottom: 20 },
  card:        { alignItems: 'center', gap: 6, backgroundColor: '#16163a', borderRadius: 20, padding: 28, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  avatar:      { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  avatarTxt:   { color: '#fff', fontSize: 28, fontWeight: '700' },
  displayName: { fontSize: 20, color: '#f0f0ff', fontWeight: '700' },
  handle:      { fontSize: 15, color: '#6c63ff', fontWeight: '600' },
  addr:        { fontSize: 11, color: '#5555aa', fontFamily: 'monospace' },
  section:     { backgroundColor: '#16163a', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  sectionTitle:{ fontSize: 15, color: '#f0f0ff', fontWeight: '700', marginBottom: 12 },
  label:       { fontSize: 10, color: '#9999cc', fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  input:       { backgroundColor: '#0a0a1a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 13, color: '#f0f0ff', fontSize: 15 },
  btn:         { backgroundColor: '#6c63ff', borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 12 },
  btnText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hint:        { fontSize: 12, color: '#9999cc', marginTop: 4 },
  pinActive:   { marginTop: 10, gap: 4 },
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  detailKey:   { color: '#9999cc', fontSize: 13 },
  detailVal:   { color: '#f0f0ff', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', maxWidth: '60%', textAlign: 'right' },
  logoutBtn:   { backgroundColor: 'rgba(255,77,109,0.12)', borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,77,109,0.2)' },
  logoutText:  { color: '#ff4d6d', fontSize: 15, fontWeight: '700' },
});
