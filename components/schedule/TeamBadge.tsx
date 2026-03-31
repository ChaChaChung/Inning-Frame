import React from 'react';
import { View, Text } from 'react-native';
import { TeamId } from '../../types';
import { TEAMS } from '../../constants/teams';

interface Props {
  teamId: TeamId;
  size?: 'sm' | 'md' | 'lg';
}

export function TeamBadge({ teamId, size = 'md' }: Props) {
  const team = TEAMS[teamId];
  const sizeClasses = {
    sm: { outer: 'w-8 h-8', emoji: 'text-base', name: 'text-xs' },
    md: { outer: 'w-12 h-12', emoji: 'text-2xl', name: 'text-xs' },
    lg: { outer: 'w-16 h-16', emoji: 'text-3xl', name: 'text-sm' },
  };
  const s = sizeClasses[size];

  return (
    <View className="items-center gap-1">
      <View
        className={`${s.outer} rounded-full items-center justify-center`}
        style={{ backgroundColor: team.color + '22' }}
      >
        <Text className={s.emoji}>{team.emoji}</Text>
      </View>
      <Text className={`${s.name} text-brand-navy font-medium`}>{team.shortName}</Text>
    </View>
  );
}
