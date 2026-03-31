import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { setFavoriteTeam } from '../lib/firestore';
import { TEAM_LIST } from '../constants/teams';
import { TeamId } from '../types';

export default function OnboardingScreen() {
  const { user, setFavoriteTeam: setLocalFavoriteTeam } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<TeamId | null>(null);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selected || !user) return;
    setSaving(true);
    await setFavoriteTeam(user.uid, selected);
    setLocalFavoriteTeam(selected);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-cream">
      <View className="flex-1 px-6 pt-12">
        <Text className="text-3xl font-bold text-brand-navy text-center">歡迎加入</Text>
        <Text className="text-3xl font-bold text-brand-navy text-center">定格九局 ⚾</Text>
        <Text className="text-base text-brand-gray text-center mt-4">
          選擇你支持的球隊，開始記錄你的觀賽旅程
        </Text>

        <ScrollView className="mt-8" showsVerticalScrollIndicator={false}>
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {TEAM_LIST.map((team) => {
              const isSelected = selected === team.id;
              return (
                <TouchableOpacity
                  key={team.id}
                  onPress={() => setSelected(team.id)}
                  className="w-[47%] rounded-2xl p-4 items-center"
                  style={{
                    backgroundColor: isSelected ? team.color : '#ffffff',
                    borderWidth: 2,
                    borderColor: isSelected ? team.color : '#e5e7eb',
                  }}
                >
                  <Text className="text-4xl mb-2">{team.emoji}</Text>
                  <Text
                    className="font-bold text-center text-sm"
                    style={{ color: isSelected ? '#ffffff' : '#1a3a5c' }}
                  >
                    {team.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <TouchableOpacity
          onPress={handleConfirm}
          disabled={!selected || saving}
          className="mt-6 mb-4 py-4 rounded-2xl items-center"
          style={{ backgroundColor: selected ? '#1a3a5c' : '#d1d5db' }}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold text-lg">
              {selected ? `支持${TEAM_LIST.find(t => t.id === selected)?.shortName}，出發！` : '請選擇球隊'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
