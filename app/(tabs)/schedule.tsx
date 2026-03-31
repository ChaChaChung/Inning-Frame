import React, { useState, useMemo } from 'react';
import {
  View, Text, SafeAreaView, TouchableOpacity, ScrollView, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSchedule } from '../../hooks/useSchedule';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { TEAMS } from '../../constants/teams';
import { Game, TeamId } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_SIZE = Math.floor((SCREEN_WIDTH - 32) / 7);
const CELL_HEIGHT = DAY_SIZE - 4; // 格子高度稍小
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

// 產生月曆天數陣列（含前後月補齊）
function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startPad = firstDay.getDay();
  const endPad = 6 - lastDay.getDay();
  const days: Date[] = [];
  for (let i = startPad - 1; i >= 0; i--) days.push(new Date(year, month - 1, -i));
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month - 1, d));
  for (let i = 1; i <= endPad; i++) days.push(new Date(year, month, i));
  return days;
}

// 取得某場比賽對特定球迷的勝負
function getGameResult(game: Game, favoriteTeam?: TeamId | null) {
  if (game.status !== 'final' || game.homeScore == null || game.awayScore == null) return null;
  if (!favoriteTeam) return null;
  const isHome = game.homeTeam === favoriteTeam;
  const isAway = game.awayTeam === favoriteTeam;
  if (!isHome && !isAway) return null;
  const myScore = isHome ? game.homeScore : game.awayScore;
  const oppScore = isHome ? game.awayScore : game.homeScore;
  if (myScore > oppScore) return 'win';
  if (myScore < oppScore) return 'lose';
  return 'tie';
}

// 月曆單格
function CalendarCell({
  date, games, isCurrentMonth, isSelected, isToday, favoriteTeam, onPress,
}: {
  date: Date; games: Game[]; isCurrentMonth: boolean;
  isSelected: boolean; isToday: boolean;
  favoriteTeam?: TeamId | null; onPress: () => void;
}) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isFuture = date > today;

  const dayGames = games.filter((g) => {
    const gDate = new Date(g.date);
    return gDate.getDate() === date.getDate() &&
      gDate.getMonth() === date.getMonth() &&
      gDate.getFullYear() === date.getFullYear();
  });

  const favGames = dayGames.filter((g) =>
    !favoriteTeam || g.homeTeam === favoriteTeam || g.awayTeam === favoriteTeam
  );
  const hasUpcoming = isFuture && favGames.length > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: DAY_SIZE, minHeight: CELL_HEIGHT, alignItems: 'center', paddingBottom: 2,
        backgroundColor: hasUpcoming && isCurrentMonth ? '#eef4ff' : 'transparent',
        borderRadius: 8,
      }}
    >
      {/* 日期數字 */}
      <View style={{
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: isToday ? '#c0392b' : isSelected ? '#1a3a5c' : 'transparent',
        alignItems: 'center', justifyContent: 'center', marginBottom: 1,
      }}>
        <Text style={{
          fontSize: 11,
          fontWeight: isToday || isSelected ? '700' : '400',
          color: isToday || isSelected ? 'white' : isCurrentMonth ? '#1a3a5c' : '#c8c0b0',
        }}>
          {date.getDate()}
        </Text>
      </View>

      {/* 比賽 emoji + 勝負 */}
      {dayGames
        .filter((game) => !favoriteTeam || game.homeTeam === favoriteTeam || game.awayTeam === favoriteTeam)
        .slice(0, 2)
        .map((game, idx) => {
        const result = getGameResult(game, favoriteTeam);
        // 顯示對手 emoji
        const teamId = favoriteTeam
          ? (game.homeTeam === favoriteTeam ? game.awayTeam : game.homeTeam)
          : game.homeTeam;
        const team = TEAMS[teamId];
        return (
          <View key={idx} style={{ marginTop: 0, alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 14, opacity: isCurrentMonth ? 1 : 0.4 }}>
                {team?.emoji ?? '⚾'}
              </Text>
              {result && (
                <View style={{
                  position: 'absolute', bottom: -2, right: -4,
                  width: 11, height: 11, borderRadius: 6,
                  backgroundColor: result === 'win' ? '#27ae60' : result === 'lose' ? '#c0392b' : '#95a5a6',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: '#fdf6e3',
                }}>
                  <Text style={{ fontSize: 6, color: 'white', fontWeight: 'bold' }}>
                    {result === 'win' ? '✓' : result === 'lose' ? '✗' : '—'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}

      {dayGames.length > 2 && (
        <Text style={{ fontSize: 8, color: '#95a5a6', marginTop: 1 }}>
          +{dayGames.length - 2}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// 當日比賽詳細卡片
function GameDetailCard({ game, favoriteTeam }: { game: Game; favoriteTeam?: TeamId | null }) {
  const router = useRouter();
  const isFinal = game.status === 'final';
  const isPostponed = game.status === 'postponed';
  const awayTeam = TEAMS[game.awayTeam];
  const homeTeam = TEAMS[game.homeTeam];
  const isFav = (id: TeamId) => favoriteTeam === id;

  return (
    <View style={{
      backgroundColor: 'white', borderRadius: 16, marginHorizontal: 16,
      marginBottom: 10, padding: 16,
      borderWidth: favoriteTeam && (game.homeTeam === favoriteTeam || game.awayTeam === favoriteTeam) ? 1.5 : 0,
      borderColor: '#c0392b',
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
    }}>
      {/* 上半：球隊 + 比分（客隊左、主隊右） */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        {/* 客隊（左） */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          
          <Text style={{ fontSize: 36 }}>{awayTeam?.emoji}</Text>
          <Text style={{ fontSize: 13, color: '#1a3a5c', fontWeight: '700', marginTop: 4 }}>
            {awayTeam?.shortName}
          </Text>
          <Text style={{ fontSize: 10, color: '#95a5a6', marginTop: 1 }}>AWAY</Text>
          {isFinal && (
            <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#1a3a5c', marginTop: 4 }}>
              {game.awayScore}
            </Text>
          )}
        </View>

        {/* 中間 */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          {isFinal ? (
            <>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1a3a5c' }}>
                {game.awayScore} : {game.homeScore}
              </Text>
              <View style={{
                marginTop: 6, paddingHorizontal: 12, paddingVertical: 3,
                backgroundColor: '#f0ebe0', borderRadius: 20,
              }}>
                <Text style={{ fontSize: 11, color: '#7f8c8d', fontWeight: '600' }}>比賽結束</Text>
              </View>
            </>
          ) : isPostponed ? (
            <View style={{
              paddingHorizontal: 12, paddingVertical: 4,
              backgroundColor: '#fef9c3', borderRadius: 20,
            }}>
              <Text style={{ fontSize: 11, color: '#a16207', fontWeight: '600' }}>延賽</Text>
            </View>
          ) : (
            <>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1a3a5c' }}>VS</Text>
              <Text style={{ fontSize: 14, color: '#c0392b', fontWeight: '600', marginTop: 4 }}>
                {game.time}
              </Text>
            </>
          )}
        </View>

        {/* 主隊（右） */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 36 }}>{homeTeam?.emoji}</Text>
          <Text style={{ fontSize: 13, color: '#1a3a5c', fontWeight: '700', marginTop: 4 }}>
            {homeTeam?.shortName}
          </Text>
          <Text style={{ fontSize: 10, color: '#95a5a6', marginTop: 1 }}>HOME</Text>
          {isFinal && (
            <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#1a3a5c', marginTop: 4 }}>
              {game.homeScore}
            </Text>
          )}
        </View>
      </View>

      {/* 下半：球場 + 去紀錄 */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderTopWidth: 1, borderTopColor: '#f0ebe0', paddingTop: 10,
      }}>
        <Text style={{ fontSize: 12, color: '#7f8c8d' }}>
          📍 {game.stadium}
        </Text>
        <TouchableOpacity
          onPress={() => router.push({
            pathname: '/ticket/new',
            params: {
              date: game.date,
              homeTeam: game.homeTeam,
              awayTeam: game.awayTeam,
              stadium: game.stadium,
              homeScore: game.homeScore?.toString() ?? '',
              awayScore: game.awayScore?.toString() ?? '',
            },
          })}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            backgroundColor: '#1a3a5c', paddingHorizontal: 14, paddingVertical: 6,
            borderRadius: 20,
          }}>
          <Text style={{ fontSize: 12, color: 'white', fontWeight: '600' }}>去紀錄</Text>
          <Text style={{ fontSize: 12, color: 'white' }}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ScheduleScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  const { favoriteTeam } = useAuth();
  const { games, loading } = useSchedule(year, month);

  const calendarDays = useMemo(() => getCalendarDays(year, month), [year, month]);

  const weekDays = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const selectedGames = useMemo(() => {
    const filtered = games.filter((g) => new Date(g.date).toDateString() === selectedDate.toDateString());
    return filtered.sort((a, b) => {
      const aHasFav = favoriteTeam && (a.homeTeam === favoriteTeam || a.awayTeam === favoriteTeam) ? -1 : 0;
      const bHasFav = favoriteTeam && (b.homeTeam === favoriteTeam || b.awayTeam === favoriteTeam) ? -1 : 0;
      return aHasFav - bHasFav;
    });
  }, [games, selectedDate, favoriteTeam]);

  const handlePrev = () => {
    if (viewMode === 'week') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 7);
      setSelectedDate(d);
      setYear(d.getFullYear());
      setMonth(d.getMonth() + 1);
    } else {
      if (month === 1) { setYear((y) => y - 1); setMonth(12); }
      else setMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 7);
      setSelectedDate(d);
      setYear(d.getFullYear());
      setMonth(d.getMonth() + 1);
    } else {
      if (month === 12) { setYear((y) => y + 1); setMonth(1); }
      else setMonth((m) => m + 1);
    }
  };

  const dayName = WEEKDAYS[selectedDate.getDay()];
  const displayDays = viewMode === 'month' ? calendarDays : weekDays;
  const weeks = viewMode === 'month'
    ? Array.from({ length: Math.ceil(displayDays.length / 7) })
    : [null];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fdf6e3' }}>
      {/* Header：月/週切換 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', backgroundColor: '#e8e0d0', borderRadius: 20, padding: 3 }}>
          {(['month', 'week'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setViewMode(mode)}
              style={{
                paddingHorizontal: 18, paddingVertical: 6, borderRadius: 17,
                backgroundColor: viewMode === mode ? '#1a3a5c' : 'transparent',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: viewMode === mode ? 'white' : '#7f8c8d' }}>
                {mode === 'month' ? '月間' : '週間'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flex: 1 }} />
      </View>

      {/* 月份導航 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6 }}>
        <TouchableOpacity onPress={handlePrev} style={{ padding: 10 }}>
          <Text style={{ fontSize: 22, color: '#c0392b', fontWeight: '300' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 'bold', color: '#1a3a5c' }}>
          {year} 年 {month} 月
        </Text>
        <TouchableOpacity onPress={handleNext} style={{ padding: 10 }}>
          <Text style={{ fontSize: 22, color: '#c0392b', fontWeight: '300' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 星期標頭 */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 2 }}>
        {WEEKDAYS.map((d, i) => (
          <View key={d} style={{ width: DAY_SIZE, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: i === 0 ? '#c0392b' : i === 6 ? '#2980b9' : '#95a5a6' }}>
              {d}
            </Text>
          </View>
        ))}
      </View>

      {/* 月曆格子 */}
      {loading ? (
        <View style={{ height: 180, alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner />
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16 }}>
          {weeks.map((_, weekIdx) => (
            <View key={weekIdx} style={{ flexDirection: 'row' }}>
              {displayDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((date, dayIdx) => {
                const isCurrentMonth = date.getMonth() === month - 1;
                return (
                  <CalendarCell
                    key={dayIdx}
                    date={date}
                    games={games}
                    isCurrentMonth={viewMode === 'week' ? true : isCurrentMonth}
                    isSelected={date.toDateString() === selectedDate.toDateString()}
                    isToday={date.toDateString() === now.toDateString()}
                    favoriteTeam={favoriteTeam}
                    onPress={() => {
                      setSelectedDate(date);
                      if (!isCurrentMonth) {
                        setYear(date.getFullYear());
                        setMonth(date.getMonth() + 1);
                      }
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      )}

      {/* 分隔線 */}
      <View style={{ height: 1, backgroundColor: '#e8e0d0', marginTop: 6 }} />

      {/* 當日賽事 */}
      <View style={{ flex: 1 }}>
        <Text style={{ paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, fontWeight: '600', color: '#1a3a5c' }}>
          {month} 月 {selectedDate.getDate()} 日（{dayName}）
          {selectedGames.length === 0 && (
            <Text style={{ color: '#95a5a6', fontWeight: '400' }}> · 無賽事</Text>
          )}
        </Text>
        {selectedGames.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 }}>
            <Text style={{ fontSize: 40 }}>⚾</Text>
            <Text style={{ color: '#95a5a6', marginTop: 8, fontSize: 14 }}>今日無賽事</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {selectedGames.map((game) => (
              <GameDetailCard key={game.id} game={game} favoriteTeam={favoriteTeam} />
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
