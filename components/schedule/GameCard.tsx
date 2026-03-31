import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Game } from '../../types';
import { TeamBadge } from './TeamBadge';

interface Props {
  game: Game;
  onPress?: () => void;
}

const STATUS_LABEL: Record<Game['status'], string> = {
  scheduled: '即將開賽',
  live: '進行中',
  final: '已結束',
  postponed: '延期',
};

const STATUS_COLOR: Record<Game['status'], string> = {
  scheduled: 'text-brand-navy',
  live: 'text-red-500',
  final: 'text-brand-gray',
  postponed: 'text-yellow-600',
};

export function GameCard({ game, onPress }: Props) {
  const isFinal = game.status === 'final';
  const dateObj = new Date(game.date);
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][dateObj.getDay()];

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl mx-4 mb-3 p-4 shadow-sm border border-gray-100"
      activeOpacity={0.7}
    >
      {/* 日期 + 狀態 */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-brand-gray text-xs">
          {game.date} (週{weekday}) {game.time}
        </Text>
        <View className={`px-2 py-0.5 rounded-full ${game.status === 'live' ? 'bg-red-50' : 'bg-gray-50'}`}>
          <Text className={`text-xs font-medium ${STATUS_COLOR[game.status]}`}>
            {STATUS_LABEL[game.status]}
          </Text>
        </View>
      </View>

      {/* 對戰 */}
      <View className="flex-row items-center justify-between px-2">
        {/* 客隊 */}
        <TeamBadge teamId={game.awayTeam} size="md" />

        {/* 比分 / VS */}
        <View className="items-center">
          {isFinal ? (
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl font-bold text-brand-navy">{game.awayScore}</Text>
              <Text className="text-brand-gray text-sm">-</Text>
              <Text className="text-2xl font-bold text-brand-navy">{game.homeScore}</Text>
            </View>
          ) : (
            <Text className="text-xl font-light text-brand-gray">VS</Text>
          )}
          <Text className="text-xs text-brand-gray mt-1">客 / 主</Text>
        </View>

        {/* 主隊 */}
        <TeamBadge teamId={game.homeTeam} size="md" />
      </View>

      {/* 球場 */}
      <View className="mt-3 pt-3 border-t border-gray-50">
        <Text className="text-center text-brand-gray text-xs">📍 {game.stadium}</Text>
      </View>
    </TouchableOpacity>
  );
}
