import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useAuth }    from '../context/AuthContext';
import { paymentAPI } from '../services/api';

const shortAddr = (a = '') => a.length > 10 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a;
const fmtDate   = (ts) => ts ? new Date(ts).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '';

const DIR = {
  sent:     { icon: '↑', color: '#ff6b9d' },
  received: { icon: '↓', color: '#00d4aa' },
  split:    { icon: '⊗', color: '#6c63ff' },
};

export default function HistoryScreen() {
  const { user }     = useAuth();
  const [txs,        setTxs]       = useState([]);
  const [page,       setPage]      = useState(1);
  const [pages,      setPages]     = useState(1);
  const [loading,    setLoading]   = useState(true);
  const [refreshing, setRefreshing]= useState(false);

  const load = useCallback(async (p = 1) => {
    try {
      const res = await paymentAPI.getHistory(p);
      setTxs(prev => p === 1 ? res.data.transactions : [...prev, ...res.data.transactions]);
      setPages(res.data.pages);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const onRefresh = () => { setRefreshing(true); setPage(1); load(1); };

  const txDir = (tx) => {
    if (tx.type === 'split') return 'split';
    return tx.senderAddress?.toLowerCase() === user?.walletAddress?.toLowerCase() ? 'sent' : 'received';
  };

  const renderItem = ({ item: tx }) => {
    const dir = txDir(tx);
    const dc  = DIR[dir];
    return (
      <View style={s.txRow}>
        <View style={[s.txIcon, { backgroundColor: dc.color + '22' }]}>
          <Text style={{ color: dc.color, fontWeight: '700', fontSize: 16 }}>{dc.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.peer}>
            {dir === 'sent'     ? `→ @${tx.recipientUsername || shortAddr(tx.recipientAddress)}`
             : dir === 'received'? `← @${tx.senderUsername   || shortAddr(tx.senderAddress)}`
             : `Split · ${tx.splits?.length || 0} recipients`}
          </Text>
          {tx.note ? <Text style={s.note}>"{tx.note}"</Text> : null}
          <Text style={s.date}>{fmtDate(tx.createdAt)}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: dc.color + '22' }]}>
          <Text style={[s.badgeText, { color: dc.color }]}>{dir}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>History</Text>
        <Text style={s.sub}>{txs.length} transactions</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#6c63ff" style={{ flex: 1 }} size="large" />
      ) : (
        <FlatList
          data={txs}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6c63ff" />}
          ListEmptyComponent={<Text style={s.empty}>No transactions yet</Text>}
          onEndReached={() => { if (page < pages) { const next = page + 1; setPage(next); load(next); } }}
          onEndReachedThreshold={0.3}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#0a0a1a' },
  header:    { padding: 20, paddingBottom: 8 },
  title:     { fontSize: 24, color: '#f0f0ff', fontWeight: '700' },
  sub:       { fontSize: 12, color: '#9999cc', marginTop: 2 },
  list:      { padding: 16, paddingTop: 8 },
  txRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  txIcon:    { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  peer:      { fontSize: 13, color: '#f0f0ff', fontWeight: '600' },
  note:      { fontSize: 11, color: '#9999cc', fontStyle: 'italic', marginTop: 2 },
  date:      { fontSize: 11, color: '#5555aa', marginTop: 2 },
  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, alignSelf: 'flex-start', marginTop: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  empty:     { color: '#5555aa', textAlign: 'center', padding: 40 },
});
