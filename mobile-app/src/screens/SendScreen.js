import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { userAPI, paymentAPI } from '../services/api';

const STEP = { FORM: 'form', CONFIRM: 'confirm', SUCCESS: 'success' };

export default function SendScreen({ navigation, route }) {
  const prefill   = route?.params?.prefill || '';
  const [step,        setStep]       = useState(STEP.FORM);
  const [username,    setUsername]   = useState(prefill);
  const [amountEth,   setAmountEth]  = useState('');
  const [message,     setMessage]    = useState('');
  const [privateKey,  setPrivateKey] = useState('');
  const [recipient,   setRecipient]  = useState(null);
  const [resolving,   setResolving]  = useState(false);
  const [sending,     setSending]    = useState(false);
  const debounce = useRef(null);

  const onUsernameChange = (val) => {
    setUsername(val);
    setRecipient(null);
    clearTimeout(debounce.current);
    const q = val.toLowerCase().replace(/^@/, '').trim();
    if (q.length < 2) return;
    debounce.current = setTimeout(async () => {
      setResolving(true);
      try { setRecipient((await userAPI.getByUsername(q)).data.user); }
      catch { setRecipient(null); }
      finally { setResolving(false); }
    }, 500);
  };

  const onContinue = () => {
    if (!recipient)                      return Alert.alert('Error', 'User not found');
    if (!amountEth || +amountEth <= 0)   return Alert.alert('Error', 'Enter a valid amount');
    if (!privateKey)                     return Alert.alert('Error', 'Private key required');
    setStep(STEP.CONFIRM);
  };

  const onConfirm = async () => {
    setSending(true);
    try {
      await paymentAPI.payByUsername({
        toUsername: recipient.username, amountEth,
        message, senderPrivateKey: privateKey,
      });
      setStep(STEP.SUCCESS);
    } catch (err) {
      Alert.alert('Payment Failed', err.response?.data?.message || 'Transaction failed');
      setStep(STEP.FORM);
    } finally { setSending(false); }
  };

  const reset = () => {
    setStep(STEP.FORM); setUsername(''); setAmountEth('');
    setMessage(''); setPrivateKey(''); setRecipient(null);
  };

  if (step === STEP.SUCCESS) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <View style={s.successRing}><Text style={{ color: '#00d4aa', fontSize: 28 }}>✓</Text></View>
        <Text style={s.successTitle}>Payment Sent!</Text>
        <Text style={s.successSub}>{amountEth} ETH → @{recipient?.username}</Text>
        <TouchableOpacity style={[s.btn, { marginTop: 24 }]} onPress={reset}>
          <Text style={s.btnText}>Send Another</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ghostBtn} onPress={() => navigation.goBack()}>
          <Text style={s.ghostText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (step === STEP.CONFIRM) return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.pageTitle}>Confirm Payment</Text>
        <View style={s.confirmCard}>
          <Text style={s.confirmLbl}>Sending to</Text>
          <View style={s.recipientRow}>
            <View style={[s.avatar, { backgroundColor: '#6c63ff' }]}>
              <Text style={s.avatarTxt}>{recipient?.fullName?.[0]?.toUpperCase()}</Text>
            </View>
            <View>
              <Text style={s.recipName}>{recipient?.fullName}</Text>
              <Text style={s.recipHandle}>@{recipient?.username}</Text>
            </View>
          </View>
          <Text style={s.amountBig}>{amountEth} <Text style={{ fontSize: 20, color: '#9999cc', fontWeight: '400' }}>ETH</Text></Text>
          {message ? <Text style={s.noteText}>"{message}"</Text> : null}
        </View>
        <View style={s.rowBtns}>
          <TouchableOpacity style={[s.secondaryBtn, { flex: 1 }]} onPress={() => setStep(STEP.FORM)}>
            <Text style={s.secondaryBtnText}>← Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, { flex: 2 }]} onPress={onConfirm} disabled={sending}>
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Confirm & Send</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Text style={s.pageTitle}>Send Payment</Text>
          <Text style={s.pageSub}>Pay anyone using their @username</Text>

          <View style={s.fieldGroup}>
            <Text style={s.label}>RECIPIENT USERNAME</Text>
            <View style={s.prefixWrap}>
              <Text style={s.prefix}>@</Text>
              <TextInput style={s.inputPrefixed} value={username}
                onChangeText={onUsernameChange} placeholder="username"
                placeholderTextColor="#5555aa" autoCapitalize="none" />
            </View>
          </View>

          {resolving && <ActivityIndicator color="#6c63ff" style={{ marginBottom: 8 }} />}
          {!resolving && recipient && (
            <View style={s.recipientPreview}>
              <View style={[s.avatar, { width: 36, height: 36, backgroundColor: '#6c63ff' }]}>
                <Text style={[s.avatarTxt, { fontSize: 14 }]}>{recipient.fullName?.[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.recipName}>{recipient.fullName}</Text>
                <Text style={s.recipHandle}>@{recipient.username}</Text>
              </View>
              <Text style={{ color: '#00d4aa', fontWeight: '700', fontSize: 16 }}>✓</Text>
            </View>
          )}
          {!resolving && username.length > 1 && !recipient && (
            <Text style={s.notFound}>User not found</Text>
          )}

          <View style={s.fieldGroup}>
            <Text style={s.label}>AMOUNT (ETH)</Text>
            <TextInput style={s.input} value={amountEth} onChangeText={setAmountEth}
              placeholder="0.1" placeholderTextColor="#5555aa" keyboardType="decimal-pad" />
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.label}>NOTE (OPTIONAL)</Text>
            <TextInput style={s.input} value={message} onChangeText={setMessage}
              placeholder="Dinner, rent…" placeholderTextColor="#5555aa" maxLength={256} />
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.label}>PRIVATE KEY <Text style={{ color: '#ffb703' }}>(GANACHE ONLY)</Text></Text>
            <TextInput style={[s.input, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12 }]}
              value={privateKey} onChangeText={setPrivateKey}
              placeholder="0x…" placeholderTextColor="#5555aa" secureTextEntry />
          </View>

          <TouchableOpacity style={[s.btn, !recipient && s.btnDisabled]} onPress={onContinue} disabled={!recipient}>
            <Text style={s.btnText}>Continue →</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#0a0a1a' },
  content:       { padding: 20, paddingBottom: 40 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  pageTitle:     { fontSize: 24, color: '#f0f0ff', fontWeight: '700', marginBottom: 4 },
  pageSub:       { fontSize: 13, color: '#9999cc', marginBottom: 24 },
  fieldGroup:    { marginBottom: 16 },
  label:         { fontSize: 10, color: '#9999cc', fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  input:         { backgroundColor: '#11112a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 14, color: '#f0f0ff', fontSize: 15 },
  prefixWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#11112a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 12, paddingLeft: 14 },
  prefix:        { color: '#6c63ff', fontWeight: '700', fontSize: 16, marginRight: 4 },
  inputPrefixed: { flex: 1, padding: 14, color: '#f0f0ff', fontSize: 15 },
  recipientPreview:{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: 'rgba(0,212,170,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,212,170,0.2)', marginBottom: 12 },
  notFound:      { color: '#ff4d6d', fontSize: 13, marginBottom: 12 },
  avatar:        { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:     { color: '#fff', fontWeight: '700', fontSize: 17 },
  recipName:     { color: '#f0f0ff', fontWeight: '600', fontSize: 14 },
  recipHandle:   { color: '#9999cc', fontSize: 12 },
  btn:           { backgroundColor: '#6c63ff', borderRadius: 12, padding: 15, alignItems: 'center', shadowColor: '#6c63ff', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  btnText:       { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDisabled:   { opacity: 0.4 },
  ghostBtn:      { padding: 12 },
  ghostText:     { color: '#9999cc', fontSize: 14 },
  secondaryBtn:  { backgroundColor: '#16163a', borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  secondaryBtnText:{ color: '#f0f0ff', fontSize: 15, fontWeight: '600' },
  rowBtns:       { flexDirection: 'row', gap: 10, marginTop: 20 },
  confirmCard:   { backgroundColor: '#16163a', borderRadius: 16, padding: 24, marginBottom: 24, gap: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  confirmLbl:    { fontSize: 10, color: '#9999cc', letterSpacing: 1, textTransform: 'uppercase' },
  recipientRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amountBig:     { fontSize: 40, color: '#f0f0ff', fontWeight: '800', textAlign: 'center', marginVertical: 8 },
  noteText:      { color: '#9999cc', fontStyle: 'italic', textAlign: 'center' },
  successRing:   { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,212,170,0.12)', borderWidth: 2, borderColor: '#00d4aa', alignItems: 'center', justifyContent: 'center' },
  successTitle:  { fontSize: 26, color: '#f0f0ff', fontWeight: '700' },
  successSub:    { fontSize: 14, color: '#9999cc' },
});
