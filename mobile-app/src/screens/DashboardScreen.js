import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, SafeAreaView,
} from 'react-native';
import { useAuth }    from '../context/AuthContext';
import { paymentAPI } from '../services/api';

const shortAddr = (a = '') => a.length > 10 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a;
const fmtEth    = (v)      => parseFloat(v || 0).toFixed(4);

const StatCard = ({ label, value, unit = 'ETH', color }) => (
  <View style={[s.statCard, { borderTopColor: color, borderTopWidth: 2 }]}>
    <Text style={[s.statVal, { color }]}>{fmtEth(value)}</Text>
    <Text style={s.statUnit}>{unit}</Text>
    <Text style={s.statLbl}>{label}</Text>
  </View>
);

const QuickBtn = ({ label, icon, color, onPress }) => (
  <TouchableOpacity style={s.quickBtn} onPress={onPress} activeOpacity={0.75}>
    <View style={[s.quickIcon, { backgroundColor: color + '22' }]}>
      <Text style={{ color, fontSize: 20, fontWeight: '700' }}>{icon}</Text>
    </View>
    <Text style={s.quickLbl}>{label}</Text>
  </TouchableOpacity>
);

export default function DashboardScreen({ navigation }) {
  const { user }    = useAuth();
  const [stats,     setStats]     = useState(null);
  const [txs,       setTxs]       = useState([]);
  const [refreshing,setRefreshing]= useState(false);

  const load = useCallback(async () => {
    try {
      const [sRes, hRes] = await Promise.all([
        paymentAPI.getStats(),
        paymentAPI.getHistory(1),
      ]);
      setStats(sRes.data.stats);
      setTxs(hRes.data.transactions.slice(0, 5));
    } catch { Alert.alert('Error', 'Failed to load data'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const txDir = (tx) => {
    if (tx.type === 'split') return 'split';
    return tx.senderAddress?.toLowerCase() === user?.walletAddress?.toLowerCase() ? 'sent' : 'received';
  };

  const dirCfg = { sent: { icon:'↑', color:'#ff6b9d' }, received: { icon:'↓', color:'#00d4aa' }, split: { icon:'⊗', color:'#6c63ff' } };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll} contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6c63ff" />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{greeting},</Text>
            <Text style={s.name}>{user?.fullName?.split(' ')[0]} 👋</Text>
            <Text style={s.addr}>{shortAddr(user?.walletAddress)}</Text>
          </View>
          <View style={[s.avatar, { backgroundColor: '#6c63ff' }]}>
            <Text style={s.avatarTxt}>{user?.fullName?.[0]?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <StatCard label="Sent"     value={stats?.sentEth}     color="#ff6b9d" />
          <StatCard label="Received" value={stats?.receivedEth} color="#00d4aa" />
          <StatCard label="Txs"      value={stats?.count}       unit="txs" color="#6c63ff" />
        </View>

        {/* Quick actions */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.quickGrid}>
          <QuickBtn label="Send"    icon="↑" color="#6c63ff" onPress={() => navigation.navigate('Send')} />
          <QuickBtn label="Split"   icon="⊗" color="#ff6b9d" onPress={() => navigation.navigate('Send')} />
          <QuickBtn label="QR Pay"  icon="▣" color="#00d4aa" onPress={() => navigation.navigate('QR')} />
          <QuickBtn label="History" icon="◷" color="#ffb703" onPress={() => navigation.navigate('History')} />
        </View>

        {/* Recent */}
        <Text style={s.sectionTitle}>Recent Transactions</Text>
        {txs.length === 0
          ? <Text style={s.empty}>No transactions yet</Text>
          : txs.map(tx => {
              const dir = txDir(tx);
              const dc  = dirCfg[dir];
              return (
                <View key={tx._id} style={s.txRow}>
                  <View style={[s.txIcon, { backgroundColor: dc.color + '22' }]}>
                    <Text style={{ color: dc.color, fontWeight: '700', fontSize: 16 }}>{dc.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txPeer}>
                      {dir === 'sent'     ? `→ @${tx.recipientUsername || shortAddr(tx.recipientAddress)}`
                       : dir === 'received'? `← @${tx.senderUsername   || shortAddr(tx.senderAddress)}`
                       : `Split (${tx.splits?.length || 0} recipients)`}
                    </Text>
                    {tx.note ? <Text style={s.txNote}>"{tx.note}"</Text> : null}
                  </View>
                </View>
              );
            })
        }
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#0a0a1a' },
  scroll:      { flex: 1 },
  content:     { padding: 20, paddingBottom: 40 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting:    { fontSize: 13, color: '#9999cc' },
  name:        { fontSize: 24, color: '#f0f0ff', fontWeight: '700' },
  addr:        { fontSize: 11, color: '#5555aa', fontFamily: 'monospace', marginTop: 2 },
  avatar:      { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:   { color: '#fff', fontSize: 20, fontWeight: '700' },
  statsRow:    { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard:    { flex: 1, backgroundColor: '#16163a', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  statVal:     { fontSize: 18, fontWeight: '800' },
  statUnit:    { fontSize: 10, color: '#9999cc', marginTop: 2 },
  statLbl:     { fontSize: 11, color: '#9999cc', marginTop: 3 },
  sectionTitle:{ fontSize: 16, color: '#f0f0ff', fontWeight: '700', marginBottom: 12 },
  quickGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  quickBtn:    { width: '47%', backgroundColor: '#16163a', borderRadius: 14, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  quickIcon:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLbl:    { fontSize: 13, color: '#9999cc', fontWeight: '600' },
  txRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  txIcon:      { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txPeer:      { fontSize: 13, color: '#f0f0ff', fontWeight: '600' },
  txNote:      { fontSize: 11, color: '#9999cc', fontStyle: 'italic', marginTop: 2 },
  empty:       { color: '#5555aa', textAlign: 'center', padding: 20 },
});
