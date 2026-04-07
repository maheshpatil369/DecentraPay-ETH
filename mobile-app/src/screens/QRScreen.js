import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ScrollView, SafeAreaView,
} from 'react-native';
import { Camera, CameraType }  from 'expo-camera';
import { BarCodeScanner }      from 'expo-barcode-scanner';
import QRCode                  from 'react-native-qrcode-svg';
import { useAuth }             from '../context/AuthContext';

export default function QRScreen({ navigation }) {
  const { user } = useAuth();
  const [tab,         setTab]         = useState('show');
  const [permission,  setPermission]  = useState(null);
  const [scanned,     setScanned]     = useState(false);
  const [scannedData, setScannedData] = useState(null);

  const qrValue = JSON.stringify({
    app:           'decentrapay',
    username:      user?.username,
    walletAddress: user?.walletAddress,
    name:          user?.fullName,
  });

  const requestPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setPermission(status === 'granted');
  };

  useEffect(() => {
    if (tab === 'scan') requestPermission();
  }, [tab]);

  const onBarCodeScanned = ({ data }) => {
    setScanned(true);
    try { setScannedData(JSON.parse(data)); }
    catch { setScannedData({ raw: data }); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>QR Payments</Text>

        {/* Tabs */}
        <View style={s.tabs}>
          {[['show', '▣ My QR'], ['scan', '◎ Scan']].map(([t, label]) => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]}
              onPress={() => { setTab(t); setScanned(false); setScannedData(null); }}>
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Show QR */}
        {tab === 'show' && (
          <View style={s.qrCard}>
            <View style={s.qrBox}>
              <QRCode value={qrValue} size={200} color="#f0f0ff" backgroundColor="transparent" />
            </View>
            <Text style={s.qrUsername}>@{user?.username}</Text>
            <Text style={s.qrName}>{user?.fullName}</Text>
            <Text style={s.qrAddr} numberOfLines={1}>{user?.walletAddress}</Text>
          </View>
        )}

        {/* Scan QR */}
        {tab === 'scan' && (
          <View style={s.scanArea}>
            {permission === null && (
              <View style={s.permBox}>
                <Text style={s.permText}>Camera access needed to scan QR codes</Text>
                <TouchableOpacity style={s.btn} onPress={requestPermission}>
                  <Text style={s.btnText}>Allow Camera</Text>
                </TouchableOpacity>
              </View>
            )}

            {permission === false && (
              <Text style={s.errText}>Camera permission denied. Enable in device settings.</Text>
            )}

            {permission === true && !scanned && (
              <Camera
                style={s.camera}
                type={CameraType.back}
                barCodeScannerSettings={{ barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr] }}
                onBarCodeScanned={onBarCodeScanned}
              />
            )}

            {scanned && scannedData && (
              <View style={s.resultCard}>
                <View style={s.successRing}>
                  <Text style={{ color: '#00d4aa', fontSize: 22 }}>✓</Text>
                </View>
                {scannedData.username ? (
                  <>
                    <Text style={s.resultName}>{scannedData.name}</Text>
                    <Text style={s.resultHandle}>@{scannedData.username}</Text>
                    <Text style={s.resultAddr} numberOfLines={1}>{scannedData.walletAddress}</Text>
                    <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Send', { prefill: scannedData.username })}>
                      <Text style={s.btnText}>Send Payment →</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={s.resultAddr}>{scannedData.raw}</Text>
                )}
                <TouchableOpacity style={s.ghostBtn} onPress={() => { setScanned(false); setScannedData(null); }}>
                  <Text style={s.ghostText}>Scan Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#0a0a1a' },
  content:     { padding: 20, paddingBottom: 40 },
  title:       { fontSize: 24, color: '#f0f0ff', fontWeight: '700', marginBottom: 20 },
  tabs:        { flexDirection: 'row', backgroundColor: '#11112a', borderRadius: 12, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  tab:         { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  tabActive:   { backgroundColor: '#16163a' },
  tabText:     { color: '#9999cc', fontSize: 14, fontWeight: '600' },
  tabTextActive:{ color: '#f0f0ff' },
  qrCard:      { alignItems: 'center', gap: 12, backgroundColor: '#16163a', borderRadius: 20, padding: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  qrBox:       { padding: 16, backgroundColor: 'rgba(240,240,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  qrUsername:  { fontSize: 22, color: '#6c63ff', fontWeight: '700' },
  qrName:      { fontSize: 15, color: '#f0f0ff' },
  qrAddr:      { fontSize: 11, color: '#5555aa', fontFamily: 'monospace' },
  scanArea:    { gap: 16, alignItems: 'center' },
  camera:      { width: '100%', height: 300, borderRadius: 16, overflow: 'hidden' },
  permBox:     { alignItems: 'center', gap: 16, padding: 20 },
  permText:    { color: '#9999cc', textAlign: 'center', fontSize: 14 },
  errText:     { color: '#ff4d6d', textAlign: 'center' },
  resultCard:  { width: '100%', backgroundColor: '#16163a', borderRadius: 20, padding: 28, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  successRing: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,212,170,0.12)', borderWidth: 2, borderColor: '#00d4aa', alignItems: 'center', justifyContent: 'center' },
  resultName:  { fontSize: 20, color: '#f0f0ff', fontWeight: '700' },
  resultHandle:{ fontSize: 14, color: '#6c63ff' },
  resultAddr:  { fontSize: 11, color: '#9999cc', fontFamily: 'monospace' },
  btn:         { backgroundColor: '#6c63ff', borderRadius: 12, padding: 14, alignItems: 'center', width: '100%', shadowColor: '#6c63ff', shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  btnText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
  ghostBtn:    { padding: 10 },
  ghostText:   { color: '#9999cc', fontSize: 13 },
});
