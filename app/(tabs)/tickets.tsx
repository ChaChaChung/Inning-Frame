import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, SafeAreaView, TouchableOpacity,
  RefreshControl, StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getUserTickets } from '../../lib/firestore';
import { TicketCard } from '../../components/tickets/TicketCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { TicketRecord } from '../../types';

export default function TicketsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    setError(null);
    try {
      const data = await getUserTickets(user.uid);
      setTickets(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 每次回到此頁面時重新載入（新增票根後即時顯示）
  useFocusEffect(useCallback(() => { load(); }, [user]));

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return <LoadingSpinner />;

  if (error) return (
    <SafeAreaView style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>我的票根</Text>
      </View>
      <View style={s.empty}>
        <Text style={{ fontSize: 40 }}>⚠️</Text>
        <Text style={s.emptyTitle}>載入失敗</Text>
        <Text style={[s.emptyDesc, { fontSize: 12, color: '#e74c3c' }]}>{error}</Text>
        <TouchableOpacity style={s.emptyBtn} onPress={() => { setLoading(true); load(); }}>
          <Text style={s.emptyBtnText}>重新載入</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.screen}>
      {/* 頂部標題列 */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>我的票根</Text>
          <Text style={s.subtitle}>共 {tickets.length} 場直觀記錄</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/ticket/new')}>
          <Text style={s.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      {tickets.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 60 }}>🎫</Text>
          <Text style={s.emptyTitle}>還沒有票根記錄</Text>
          <Text style={s.emptyDesc}>{'去看比賽了嗎？\n記錄下你的第一場直觀回憶！'}</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/ticket/new')}>
            <Text style={s.emptyBtnText}>新增票根</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TicketCard
              ticket={item}
              onPress={() => router.push(`/ticket/${item.id}`)}
            />
          )}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a3a5c" />
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fdf6e3' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  title: { color: '#1a3a5c', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#95a5a6', fontSize: 13, marginTop: 2 },
  addBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#1a3a5c', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1a3a5c', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  addBtnText: { color: 'white', fontSize: 22, lineHeight: 26, fontWeight: '400' },
  // 空狀態
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 },
  emptyTitle: { color: '#1a3a5c', fontSize: 20, fontWeight: '700', marginTop: 8 },
  emptyDesc: { color: '#95a5a6', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    marginTop: 12, backgroundColor: '#1a3a5c', paddingHorizontal: 32,
    paddingVertical: 13, borderRadius: 24,
  },
  emptyBtnText: { color: 'white', fontWeight: '600', fontSize: 15 },
});
