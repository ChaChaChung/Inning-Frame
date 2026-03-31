import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TicketRecord } from '../../types';
import { TEAMS } from '../../constants/teams';

interface Props {
  ticket: TicketRecord;
  onPress?: () => void;
}

const RESULT_CONFIG = {
  win:  { bg: '#e8f5e9', color: '#2e7d32', label: '勝', emoji: '🎉' },
  lose: { bg: '#ffebee', color: '#c62828', label: '敗', emoji: '😔' },
  tie:  { bg: '#f5f5f5', color: '#616161', label: '平', emoji: '🤝' },
};

export function TicketCard({ ticket, onPress }: Props) {
  const home = TEAMS[ticket.homeTeam];
  const away = TEAMS[ticket.awayTeam];
  const support = TEAMS[ticket.supportTeam];
  const result = ticket.result ? RESULT_CONFIG[ticket.result] : null;
  const totalSpent = (ticket.ticketPrice ?? 0) + (ticket.otherExpenses ?? 0);

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.75}>
      {/* 頂部色帶 */}
      <View style={[s.top, { backgroundColor: support.color + '18' }]}>
        {/* 日期 + 結果徽章 */}
        <View style={s.topRow}>
          <Text style={s.date}>{ticket.date}</Text>
          {result && (
            <View style={[s.resultBadge, { backgroundColor: result.bg }]}>
              <Text style={[s.resultText, { color: result.color }]}>
                {result.emoji} {result.label}
              </Text>
            </View>
          )}
        </View>

        {/* 對戰區 */}
        <View style={s.matchRow}>
          <View style={s.teamBlock}>
            <Text style={s.teamEmoji}>{away.emoji}</Text>
            <Text style={s.teamName}>{away.shortName}</Text>
            <Text style={s.teamRole}>客隊</Text>
          </View>

          <View style={s.scoreBlock}>
            {ticket.awayScore !== undefined && ticket.homeScore !== undefined ? (
              <Text style={s.score}>{ticket.awayScore} - {ticket.homeScore}</Text>
            ) : (
              <Text style={s.vs}>VS</Text>
            )}
          </View>

          <View style={s.teamBlock}>
            <Text style={s.teamEmoji}>{home.emoji}</Text>
            <Text style={s.teamName}>{home.shortName}</Text>
            <Text style={s.teamRole}>主隊</Text>
          </View>
        </View>
      </View>

      {/* 虛線分隔（票根撕孔效果） */}
      <View style={s.dividerRow}>
        <View style={s.notchLeft} />
        <View style={s.dashes} />
        <View style={s.notchRight} />
      </View>

      {/* 底部資訊 */}
      <View style={s.bottom}>
        <InfoChip icon="🏟️" value={ticket.stadium} />
        {ticket.seatSection ? <InfoChip icon="🪑" value={ticket.seatSection} /> : null}
        {totalSpent > 0 && <InfoChip icon="💰" value={`NT$${totalSpent.toLocaleString()}`} />}
      </View>
    </TouchableOpacity>
  );
}

function InfoChip({ icon, value }: { icon: string; value: string }) {
  return (
    <View style={s.chip}>
      <Text style={s.chipIcon}>{icon}</Text>
      <Text style={s.chipText} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const NOTCH = 10;

const s = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#1a3a5c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0ebe0',
  },
  top: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  date: { color: '#95a5a6', fontSize: 12 },
  resultBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  resultText: { fontSize: 12, fontWeight: '700' },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamBlock: { flex: 1, alignItems: 'center' },
  teamEmoji: { fontSize: 30 },
  teamName: { color: '#1a3a5c', fontWeight: '700', fontSize: 13, marginTop: 4 },
  teamRole: { color: '#95a5a6', fontSize: 10, marginTop: 2 },
  scoreBlock: { flex: 1, alignItems: 'center' },
  score: { color: '#1a3a5c', fontWeight: '800', fontSize: 22 },
  vs: { color: '#1a3a5c', fontWeight: '700', fontSize: 16 },
  // 票根虛線
  dividerRow: { flexDirection: 'row', alignItems: 'center', height: NOTCH * 2 },
  notchLeft: {
    width: NOTCH, height: NOTCH * 2, borderTopRightRadius: NOTCH,
    borderBottomRightRadius: NOTCH, backgroundColor: '#fdf6e3',
    borderWidth: 1, borderLeftWidth: 0, borderColor: '#f0ebe0',
  },
  dashes: { flex: 1, borderTopWidth: 1.5, borderColor: '#e8e0d0', borderStyle: 'dashed' },
  notchRight: {
    width: NOTCH, height: NOTCH * 2, borderTopLeftRadius: NOTCH,
    borderBottomLeftRadius: NOTCH, backgroundColor: '#fdf6e3',
    borderWidth: 1, borderRightWidth: 0, borderColor: '#f0ebe0',
  },
  // 底부
  bottom: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f9f5ed', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  chipIcon: { fontSize: 11 },
  chipText: { color: '#1a3a5c', fontSize: 11, fontWeight: '500', maxWidth: 100 },
});
