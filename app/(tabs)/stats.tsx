import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { getUserTickets, computeStats } from '../../lib/firestore';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { UserStats, TicketRecord } from '../../types';
import { TEAMS } from '../../constants/teams';

function StatBox({ value, label, color = '#1a3a5c' }: { value: string | number; label: string; color?: string }) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 items-center shadow-sm border border-gray-50">
      <Text className="text-3xl font-bold" style={{ color }}>{value}</Text>
      <Text className="text-brand-gray text-xs mt-1">{label}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getUserTickets(user.uid)
      .then((tickets: TicketRecord[]) => {
        setStats(computeStats(tickets));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <LoadingSpinner />;

  if (!stats || stats.totalGames === 0) {
    return (
      <SafeAreaView className="flex-1 bg-brand-cream items-center justify-center px-8">
        <Text className="text-6xl">📊</Text>
        <Text className="text-brand-navy font-bold text-xl mt-4">還沒有統計資料</Text>
        <Text className="text-brand-gray text-center mt-2">先去記錄你的直觀票根吧！</Text>
      </SafeAreaView>
    );
  }

  const winRate = stats.totalGames > 0
    ? Math.round((stats.wins / stats.totalGames) * 100)
    : 0;

  // 最常看的球隊
  const topTeam = Object.entries(stats.teamCount)
    .sort((a, b) => b[1] - a[1])[0];

  // 最常去的球場
  const topStadium = Object.entries(stats.stadiumCount)
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <SafeAreaView className="flex-1 bg-brand-cream">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-brand-navy">我的統計</Text>
          <Text className="text-brand-gray text-sm">你的直觀足跡</Text>
        </View>

        {/* 主要數字 */}
        <View className="px-4 mt-3 flex-row gap-3">
          <StatBox value={stats.totalGames} label="場次" />
          <StatBox value={`${winRate}%`} label="勝率" color="#27ae60" />
          <StatBox value={`$${Math.round(stats.totalSpent / 1000)}k`} label="總花費" color="#f39c12" />
        </View>

        {/* 勝負平 */}
        <View className="px-4 mt-3 flex-row gap-3">
          <StatBox value={stats.wins} label="勝" color="#27ae60" />
          <StatBox value={stats.losses} label="敗" color="#c0392b" />
          <StatBox value={stats.ties} label="平" color="#7f8c8d" />
        </View>

        {/* 勝負視覺化進度條 */}
        {stats.totalGames > 0 && (
          <View className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
            <Text className="text-brand-navy font-semibold mb-3">勝負分佈</Text>
            <View className="h-3 rounded-full overflow-hidden flex-row">
              <View style={{ flex: stats.wins, backgroundColor: '#27ae60' }} />
              <View style={{ flex: stats.ties, backgroundColor: '#95a5a6' }} />
              <View style={{ flex: stats.losses, backgroundColor: '#c0392b' }} />
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-xs text-green-700">{stats.wins} 勝</Text>
              <Text className="text-xs text-gray-500">{stats.ties} 平</Text>
              <Text className="text-xs text-red-700">{stats.losses} 敗</Text>
            </View>
          </View>
        )}

        {/* 最愛球隊 */}
        {topTeam && (
          <View className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
            <Text className="text-brand-navy font-semibold mb-3">最常加油的球隊</Text>
            <View className="flex-row items-center gap-3">
              <Text className="text-3xl">{TEAMS[topTeam[0] as keyof typeof TEAMS]?.emoji}</Text>
              <View>
                <Text className="text-brand-navy font-bold text-base">
                  {TEAMS[topTeam[0] as keyof typeof TEAMS]?.name}
                </Text>
                <Text className="text-brand-gray text-sm">看了 {topTeam[1]} 場</Text>
              </View>
            </View>
          </View>
        )}

        {/* 最愛球場 */}
        {topStadium && (
          <View className="mx-4 mt-3 mb-8 bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
            <Text className="text-brand-navy font-semibold mb-3">最常去的球場</Text>
            <View className="flex-row items-center gap-3">
              <Text className="text-3xl">🏟️</Text>
              <View>
                <Text className="text-brand-navy font-bold text-base">{topStadium[0]}</Text>
                <Text className="text-brand-gray text-sm">去了 {topStadium[1]} 次</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
