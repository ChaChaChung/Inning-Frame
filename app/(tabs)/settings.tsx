import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { setFavoriteTeam as saveFavoriteTeam } from '../../lib/firestore';
import { TEAM_LIST } from '../../constants/teams';
import { TeamId } from '../../types';

interface SettingRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function SettingRow({ label, value, onPress, danger }: SettingRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between py-4 px-4 border-b border-gray-50"
      activeOpacity={0.6}
    >
      <Text className={`text-base ${danger ? 'text-red-500' : 'text-brand-navy'}`}>{label}</Text>
      {value && <Text className="text-brand-gray text-sm">{value}</Text>}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, logout, favoriteTeam, setFavoriteTeam, nickname, setNickname } = useAuth();
  const router = useRouter();
  const [nicknameModal, setNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  const handleTeamPress = async (teamId: TeamId) => {
    if (!user) return;
    const next = favoriteTeam === teamId ? null : teamId;
    setFavoriteTeam(next);
    if (next) await saveFavoriteTeam(user.uid, next);
  };

  const handleNicknameEdit = () => {
    setNicknameInput(nickname ?? user?.displayName ?? '');
    setNicknameModal(true);
  };

  const handleNicknameSave = async () => {
    const trimmed = nicknameInput.trim();
    if (!trimmed) { Alert.alert('請輸入暱稱'); return; }
    await setNickname(trimmed);
    setNicknameModal(false);
  };

  const handleLogout = () => {
    Alert.alert('登出', '確定要登出嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '登出',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-cream">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4 pb-6">
          <Text className="text-2xl font-bold text-brand-navy">設定</Text>
        </View>

        {/* 使用者資訊 */}
        <View className="mx-4 bg-white rounded-2xl p-4 mb-4 flex-row items-center gap-4 shadow-sm border border-gray-50">
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} className="w-14 h-14 rounded-full" />
          ) : (
            <View className="w-14 h-14 rounded-full bg-brand-navy/10 items-center justify-center">
              <Text className="text-2xl">👤</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text className="text-brand-navy font-bold text-base">
              {nickname || user?.displayName || '球迷'}
            </Text>
            <Text className="text-brand-gray text-sm">{user?.email}</Text>
          </View>
          <TouchableOpacity onPress={handleNicknameEdit} style={ns.editBtn}>
            <Text style={ns.editBtnText}>改暱稱</Text>
          </TouchableOpacity>
        </View>

        {/* 暱稱編輯 Modal */}
        <Modal visible={nicknameModal} transparent animationType="fade" onRequestClose={() => setNicknameModal(false)}>
          <View style={ns.overlay}>
            <View style={ns.modal}>
              <Text style={ns.modalTitle}>修改暱稱</Text>
              <TextInput
                style={ns.input}
                value={nicknameInput}
                onChangeText={setNicknameInput}
                placeholder="輸入你的暱稱"
                placeholderTextColor="#bdc3c7"
                maxLength={20}
                autoFocus
              />
              <Text style={ns.hint}>{nicknameInput.length} / 20</Text>
              <View style={ns.btnRow}>
                <TouchableOpacity style={ns.cancelBtn} onPress={() => setNicknameModal(false)}>
                  <Text style={ns.cancelText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={ns.saveBtn} onPress={handleNicknameSave}>
                  <Text style={ns.saveText}>儲存</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 偏好球隊 */}
        <View className="mx-4 bg-white rounded-2xl mb-4 overflow-hidden shadow-sm border border-gray-50">
          <Text className="text-brand-gray text-xs px-4 pt-3 pb-2 uppercase tracking-wider">偏好設定</Text>
          <View className="px-4 pb-4">
            <Text className="text-brand-navy text-sm mb-3">偏好球隊</Text>
            <View className="flex-row flex-wrap gap-2">
              {TEAM_LIST.map((team) => (
                <TouchableOpacity
                  key={team.id}
                  onPress={() => handleTeamPress(team.id)}
                  className={`px-3 py-1.5 rounded-full border ${
                    favoriteTeam === team.id ? 'border-brand-navy' : 'border-gray-200 bg-gray-50'
                  }`}
                  style={favoriteTeam === team.id ? { backgroundColor: team.color + '20' } : {}}
                >
                  <Text className="text-xs">
                    {team.emoji} {team.shortName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 關於 */}
        <View className="mx-4 bg-white rounded-2xl mb-4 overflow-hidden shadow-sm border border-gray-50">
          <Text className="text-brand-gray text-xs px-4 pt-3 pb-1 uppercase tracking-wider">關於</Text>
          <SettingRow label="版本" value="1.0.0" />
          <SettingRow label="服務條款" onPress={() => {}} />
          <SettingRow label="隱私政策" onPress={() => {}} />
        </View>

        {/* 登出 */}
        <View className="mx-4 bg-white rounded-2xl mb-8 overflow-hidden shadow-sm border border-gray-50">
          <SettingRow label="登出" onPress={handleLogout} danger />
        </View>

        <Text className="text-center text-brand-gray text-xs mb-8">
          定格九局 · Inning Frame{'\n'}為中華職棒球迷打造
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const ns = StyleSheet.create({
  editBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#1a3a5c',
  },
  editBtnText: { color: '#1a3a5c', fontSize: 12, fontWeight: '600' },
  // Modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  modal: {
    width: '82%', backgroundColor: 'white',
    borderRadius: 20, padding: 24,
  },
  modalTitle: { color: '#1a3a5c', fontWeight: '700', fontSize: 17, marginBottom: 16 },
  input: {
    borderWidth: 1.5, borderColor: '#e8e0d0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: '#1a3a5c',
  },
  hint: { color: '#bdc3c7', fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 20 },
  btnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1, borderColor: '#e0dbd0', alignItems: 'center',
  },
  cancelText: { color: '#7f8c8d', fontWeight: '600' },
  saveBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    backgroundColor: '#1a3a5c', alignItems: 'center',
  },
  saveText: { color: 'white', fontWeight: '700' },
});
