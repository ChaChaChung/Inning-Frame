import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useSchedule } from '../../hooks/useSchedule';
import { getUserTickets } from '../../lib/firestore';
import { TicketRecord, Game } from '../../types';
import { TEAMS } from '../../constants/teams';

function TodayGameCard({ game, favoriteTeam }: { game: Game; favoriteTeam?: string | null; }) {
  const isFinished = game.status === 'final';
  const away = TEAMS[game.awayTeam];
  const home = TEAMS[game.homeTeam];
  const isFavGame = favoriteTeam && (game.homeTeam === favoriteTeam || game.awayTeam === favoriteTeam);

  const [y, m, d] = game.date.split('-');
  const dateLabel = `${parseInt(m)}/${parseInt(d)}`;
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][new Date(game.date).getDay()];

  return (
    <View style={[styles.gameCard, isFavGame && styles.gameCardFav]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{dateLabel}（{weekday}）</Text>
        </View>
        {isFavGame && (
          <View style={styles.favBadge}>
            <Text style={styles.favBadgeText}>⭐ 支持球隊出賽</Text>
          </View>
        )}
      </View>
      <View style={styles.gameCardInner}>
        <View style={styles.teamBlock}>
          <Text style={{ fontSize: 36 }}>{away?.emoji}</Text>
          <Text style={styles.teamName}>{away?.shortName}</Text>
          <Text style={styles.teamRole}>AWAY</Text>
          {isFinished && <Text style={styles.scoreText}>{game.awayScore}</Text>}
        </View>
        <View style={styles.vsBlock}>
          {isFinished ? (
            <Text style={styles.vsText}>終</Text>
          ) : (
            <>
              <Text style={styles.vsText}>VS</Text>
              <Text style={styles.gameTime}>{game.time}</Text>
            </>
          )}
          <Text style={styles.stadiumText}>{game.stadium}</Text>
        </View>
        <View style={styles.teamBlock}>
          <Text style={{ fontSize: 36 }}>{home?.emoji}</Text>
          <Text style={styles.teamName}>{home?.shortName}</Text>
          <Text style={styles.teamRole}>HOME</Text>
          {isFinished && <Text style={styles.scoreText}>{game.homeScore}</Text>}
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { user, nickname, favoriteTeam } = useAuth();
  const router = useRouter();
  const now = new Date();

  // 抓當月 + 未來兩個月，確保跨月比賽也能找到
  const m0 = { year: now.getFullYear(), month: now.getMonth() + 1 };
  const m1 = now.getMonth() + 2 > 12
    ? { year: now.getFullYear() + 1, month: 1 }
    : { year: now.getFullYear(), month: now.getMonth() + 2 };
  const m2 = now.getMonth() + 3 > 12
    ? { year: now.getFullYear() + 1, month: (now.getMonth() + 3) % 12 || 12 }
    : { year: now.getFullYear(), month: now.getMonth() + 3 };

  const { games: games0 } = useSchedule(m0.year, m0.month);
  const { games: games1 } = useSchedule(m1.year, m1.month);
  const { games: games2 } = useSchedule(m2.year, m2.month);
  const games = [...games0, ...games1, ...games2];

  const [recentTickets, setRecentTickets] = useState<TicketRecord[]>([]);

  useEffect(() => {
    if (user) {
      getUserTickets(user.uid).then((tickets) => {
        setRecentTickets(tickets.slice(0, 3));
      });
    }
  }, [user]);

  // 今日賽程
  const todayStr = now.toISOString().split('T')[0];
  const todayGames = games.filter((g) => g.date === todayStr);

  // 支持球隊未來 3 場賽事
  const upcomingGames = games
    .filter((g) =>
      g.date >= todayStr &&
      g.status === 'scheduled' &&
      favoriteTeam &&
      (g.homeTeam === favoriteTeam || g.awayTeam === favoriteTeam)
    )
    .slice(0, 3);

  const displayName = nickname || user?.displayName?.split(' ')[0] || '球迷';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 頂部問候 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>哈囉，{displayName} 👋</Text>
            <Text style={styles.subGreeting}>今天也來看球嗎？</Text>
          </View>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>⚾</Text>
          </View>
        </View>

        {/* 今日賽事 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>今日賽事</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/schedule')}>
              <Text style={styles.sectionMore}>查看全部 ›</Text>
            </TouchableOpacity>
          </View>

          {todayGames.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>😴</Text>
              <Text style={styles.emptyText}>今天沒有比賽</Text>
            </View>
          ) : (
            todayGames.map((game) => (
              <TodayGameCard key={game.id} game={game} favoriteTeam={favoriteTeam} />
            ))
          )}
        </View>

        {/* 即將到來 */}
        {upcomingGames.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>即將到來</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/schedule')}>
                <Text style={styles.sectionMore}>更多 ›</Text>
              </TouchableOpacity>
            </View>
            {upcomingGames.map((game) => (
              <TodayGameCard key={game.id} game={game} />
            ))}
          </View>
        )}

        {/* 快速操作 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>快速操作</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: '#1a3a5c' }]}
              onPress={() => router.push('/(tabs)/schedule')}
            >
              <Text style={styles.quickBtnEmoji}>📅</Text>
              <Text style={styles.quickBtnText}>查賽程</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: '#c0392b' }]}
              onPress={() => router.push('/(tabs)/tickets')}
            >
              <Text style={styles.quickBtnEmoji}>🎫</Text>
              <Text style={styles.quickBtnText}>我的票根</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: '#f39c12' }]}
              onPress={() => router.push('/(tabs)/stats')}
            >
              <Text style={styles.quickBtnEmoji}>📊</Text>
              <Text style={styles.quickBtnText}>統計</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 最近票根 */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近記錄</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/tickets')}>
              <Text style={styles.sectionMore}>全部 ›</Text>
            </TouchableOpacity>
          </View>

          {recentTickets.length === 0 ? (
            <TouchableOpacity
              style={styles.addTicketCard}
              onPress={() => router.push('/(tabs)/tickets')}
            >
              <Text style={styles.addTicketEmoji}>🎫</Text>
              <Text style={styles.addTicketTitle}>還沒有票根記錄</Text>
              <Text style={styles.addTicketSub}>點此記錄你的第一場比賽</Text>
            </TouchableOpacity>
          ) : (
            recentTickets.map((ticket) => (
              <View key={ticket.id} style={styles.ticketRow}>
                <Text style={styles.ticketDate} numberOfLines={1}>
                  {ticket.date.replace(/-/g, '/')}
                </Text>
                <Text style={styles.ticketTeams} numberOfLines={1}>
                  {TEAMS[ticket.awayTeam]?.shortName ?? ticket.awayTeam}
                  {' vs '}
                  {TEAMS[ticket.homeTeam]?.shortName ?? ticket.homeTeam}
                </Text>
                <Text style={styles.ticketStadium} numberOfLines={1}>{ticket.stadium}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf6e3' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#1a3a5c' },
  subGreeting: { fontSize: 13, color: '#7f8c8d', marginTop: 2 },
  logoBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1a3a5c',
    alignItems: 'center', justifyContent: 'center',
  },
  logoEmoji: { fontSize: 22 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a3a5c' },
  sectionMore: { fontSize: 13, color: '#c0392b' },
  gameCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 8,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  gameCardFav: {
    borderWidth: 1.5,
    borderColor: '#c0392b',
  },
  favBadge: {
    backgroundColor: '#fff3f0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  favBadgeText: { fontSize: 11, color: '#c0392b', fontWeight: '600' },
  dateBadge: {
    backgroundColor: '#eef4ff',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  dateBadgeText: { fontSize: 11, color: '#1a3a5c', fontWeight: '600' },
  gameCardInner: { flexDirection: 'row', alignItems: 'center' },
  teamBlock: { flex: 1, alignItems: 'center' },
  teamName: { fontSize: 13, fontWeight: '600', color: '#1a3a5c', textAlign: 'center' },
  scoreText: { fontSize: 24, fontWeight: 'bold', color: '#1a3a5c', marginTop: 4 },
  vsBlock: { flex: 1, alignItems: 'center' },
  teamRole: { fontSize: 11, color: '#95a5a6', marginTop: 2 },
  gameTime: { fontSize: 13, color: '#c0392b', fontWeight: '600', marginTop: 2 },
  vsText: { fontSize: 16, fontWeight: '800', color: '#1a3a5c' },
  stadiumText: { fontSize: 12, color: '#7f8c8d' },
  cardBottom: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#f0ebe0',
    marginTop: 12, paddingTop: 10,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 14, color: '#7f8c8d', marginTop: 8 },
  quickActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  quickBtn: {
    flex: 1, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  quickBtnEmoji: { fontSize: 24 },
  quickBtnText: { fontSize: 12, color: '#fff', fontWeight: '600', marginTop: 6 },
  addTicketCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0ece0',
    borderStyle: 'dashed',
  },
  addTicketEmoji: { fontSize: 32 },
  addTicketTitle: { fontSize: 15, fontWeight: '600', color: '#1a3a5c', marginTop: 8 },
  addTicketSub: { fontSize: 12, color: '#7f8c8d', marginTop: 4 },
  ticketRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketDate: { fontSize: 12, color: '#7f8c8d', width: 72 },
  ticketTeams: { flex: 1, fontSize: 13, color: '#1a3a5c', fontWeight: '500' },
  ticketStadium: { fontSize: 11, color: '#7f8c8d' },
});
