import React, { useEffect, useState } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity,
  Alert, StyleSheet, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getUserTickets, deleteTicket } from '../../lib/firestore';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { TicketRecord } from '../../types';
import { TEAMS } from '../../constants/teams';

const RESULT_CONFIG = {
  win:  { bg: 'rgba(255,255,255,0.25)', color: '#fff', label: '勝利', emoji: '🎉' },
  lose: { bg: 'rgba(0,0,0,0.2)',        color: '#fff', label: '敗北', emoji: '😔' },
  tie:  { bg: 'rgba(255,255,255,0.2)',  color: '#fff', label: '平手', emoji: '🤝' },
};

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserTickets(user.uid).then((tickets) => {
      setTicket(tickets.find((t) => t.id === id) ?? null);
      setLoading(false);
    });
  }, [id, user]);

  const handleDelete = () => {
    Alert.alert('刪除票根', '確定要刪除這筆記錄嗎？此操作無法復原。', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除', style: 'destructive',
        onPress: async () => { if (id) await deleteTicket(id); router.back(); },
      },
    ]);
  };

  if (loading) return <LoadingSpinner />;

  if (!ticket) {
    return (
      <SafeAreaView style={[s.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: '#95a5a6', fontSize: 16 }}>找不到這筆記錄</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#1a3a5c', fontWeight: '600' }}>返回</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { favoriteTeam } = useAuth();
  const home = TEAMS[ticket.homeTeam];
  const away = TEAMS[ticket.awayTeam];

  // 用當前最愛球隊決定顯示顏色；若此場比賽沒有支持的球隊則用灰色
  const teamInGame = favoriteTeam && (ticket.homeTeam === favoriteTeam || ticket.awayTeam === favoriteTeam);
  const heroColor = teamInGame ? TEAMS[favoriteTeam!].color : '#7f8c8d';
  const support = teamInGame ? TEAMS[favoriteTeam!] : null;

  const resultCfg = ticket.result ? RESULT_CONFIG[ticket.result] : null;
  const itemsTotal = ticket.expenseItems?.reduce((s, e) => s + e.amount, 0) ?? 0;
  const totalSpent = (ticket.ticketPrice ?? 0) + itemsTotal;

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Hero 區塊 ── */}
        <View style={[s.hero, { backgroundColor: heroColor }]}>

          {/* 關閉按鈕 */}
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.closeBtnText}>✕</Text>
          </TouchableOpacity>

          {/* 日期 + 球場 */}
          <Text style={s.heroMeta}>{ticket.date}　·　{ticket.stadium}</Text>

          {/* 對戰 */}
          <View style={s.matchRow}>
            {/* 客隊 */}
            <View style={s.teamCol}>
              <Text style={s.teamEmoji}>{away.emoji}</Text>
              <Text style={s.teamName}>{away.shortName}</Text>
              <Text style={s.teamRole}>客隊</Text>
            </View>

            {/* 比分 / VS */}
            <View style={s.centerCol}>
              {ticket.awayScore !== undefined && ticket.homeScore !== undefined ? (
                <Text style={s.score}>{ticket.awayScore} : {ticket.homeScore}</Text>
              ) : (
                <Text style={s.vs}>VS</Text>
              )}
              {resultCfg && (
                <View style={[s.resultBadge, { backgroundColor: resultCfg.bg }]}>
                  <Text style={s.resultText}>{resultCfg.emoji} {resultCfg.label}</Text>
                </View>
              )}
            </View>

            {/* 主隊 */}
            <View style={s.teamCol}>
              <Text style={s.teamEmoji}>{home.emoji}</Text>
              <Text style={s.teamName}>{home.shortName}</Text>
              <Text style={s.teamRole}>主隊</Text>
            </View>
          </View>

          {/* 支持球隊標籤 */}
          {support && (
            <View style={s.supportRow}>
              <Text style={s.supportText}>⭐ 支持 {support.name}</Text>
            </View>
          )}

          {/* 底部弧形裝飾 */}
          <View style={s.heroArc} />
        </View>

        {/* ── 內容區 ── */}
        <View style={s.body}>

          {/* 座位視角照片 */}
          {ticket.photoUrl && (
            <View style={s.photoWrap}>
              <Image source={{ uri: ticket.photoUrl }} style={s.seatPhoto} resizeMode="cover" />
              <View style={s.photoLabel}>
                <Text style={s.photoLabelText}>📸 座位視角</Text>
              </View>
            </View>
          )}

          {/* 比賽 & 座位資訊 */}
          <View style={s.infoCard}>
            <InfoRow icon="🏟️" label="球場" value={ticket.stadium} />
            {ticket.seatSection ? <InfoRow icon="🪑" label="座位" value={ticket.seatSection} /> : null}
          </View>

          {/* 支出明細 */}
          {(ticket.ticketPrice !== undefined || (ticket.expenseItems && ticket.expenseItems.length > 0)) && (
            <View style={s.infoCard}>
              {ticket.ticketPrice !== undefined && (
                <InfoRow icon="🎟" label="票價" value={`NT$ ${ticket.ticketPrice.toLocaleString()}`} />
              )}
              {ticket.expenseItems?.map((item, i) => (
                <InfoRow key={i} icon={categoryIcon(item.category)} label={item.label} value={`NT$ ${item.amount.toLocaleString()}`} />
              ))}
              {totalSpent > 0 && (
                <InfoRow icon="💰" label="合計" value={`NT$ ${totalSpent.toLocaleString()}`} bold />
              )}
            </View>
          )}

          {/* 備注 */}
          {ticket.notes ? (
            <View style={s.notesCard}>
              <Text style={s.notesLabel}>備注</Text>
              <Text style={s.notesText}>{ticket.notes}</Text>
            </View>
          ) : null}

          {/* 刪除按鈕 */}
          <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
            <Text style={s.deleteBtnText}>🗑　刪除票根</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function categoryIcon(cat: string) {
  const map: Record<string, string> = { ticket: '🎟', food: '🍔', transport: '🚗', hotel: '🛏', other: '🧾' };
  return map[cat] ?? '🧾';
}

function InfoRow({ icon, label, value, bold }: {
  icon: string; label: string; value: string; bold?: boolean;
}) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoIcon}>{icon}</Text>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoValue, bold && { fontWeight: '700' }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fdf6e3' },

  // ── Hero ──
  hero: {
    paddingTop: 20, paddingBottom: 44, paddingHorizontal: 20,
    position: 'relative', overflow: 'hidden',
  },
  heroArc: {
    position: 'absolute', bottom: -30, left: -20, right: -20,
    height: 60, backgroundColor: '#fdf6e3', borderTopLeftRadius: 40, borderTopRightRadius: 40,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  closeBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
  heroMeta: { color: 'rgba(255,255,255,0.8)', fontSize: 12, textAlign: 'center', marginBottom: 20 },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  teamCol: { flex: 1, alignItems: 'center', gap: 6 },
  teamEmoji: { fontSize: 44 },
  teamName: { color: 'white', fontWeight: '800', fontSize: 15 },
  teamRole: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
  centerCol: { flex: 1.2, alignItems: 'center', gap: 10 },
  score: { color: 'white', fontWeight: '900', fontSize: 32, letterSpacing: 2 },
  vs: { color: 'rgba(255,255,255,0.8)', fontWeight: '700', fontSize: 22 },
  resultBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  resultText: { color: 'white', fontSize: 13, fontWeight: '700' },
  supportRow: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
  },
  supportText: { color: 'white', fontSize: 12, fontWeight: '600' },

  // ── Body ──
  body: { paddingTop: 8, paddingHorizontal: 16 },
  photoWrap: { marginBottom: 12, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  seatPhoto: { width: '100%', height: 200 },
  photoLabel: {
    position: 'absolute', bottom: 10, left: 12,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  photoLabelText: { color: 'white', fontSize: 11, fontWeight: '600' },
  infoCard: {
    marginBottom: 12, backgroundColor: 'white', borderRadius: 16,
    borderWidth: 1, borderColor: '#f0ebe0', overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f9f5ed',
  },
  infoIcon: { fontSize: 16, width: 26 },
  infoLabel: { color: '#95a5a6', fontSize: 13, flex: 1, marginLeft: 4 },
  infoValue: { color: '#1a3a5c', fontSize: 13 },
  notesCard: {
    marginBottom: 12, backgroundColor: 'white',
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f0ebe0',
  },
  notesLabel: { color: '#95a5a6', fontSize: 11, marginBottom: 6 },
  notesText: { color: '#1a3a5c', fontSize: 14, lineHeight: 22 },
  deleteBtn: {
    marginTop: 4, marginBottom: 8, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#e74c3c', alignItems: 'center',
  },
  deleteBtnText: { color: '#e74c3c', fontSize: 15, fontWeight: '600' },
});
