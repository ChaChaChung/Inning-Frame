import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const { signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 已登入則導向主頁
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('登入失敗', '請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      {/* 背景裝飾 */}
      <View className="absolute inset-0 overflow-hidden">
        <View className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white opacity-5" />
        <View className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white opacity-5" />
      </View>

      <View className="flex-1 px-8 justify-between py-16">
        {/* 標題區 */}
        <View className="items-center mt-12">
          {/* Logo 佔位 */}
          <View className="w-24 h-24 rounded-full bg-white/10 items-center justify-center mb-6">
            <Text className="text-5xl">⚾</Text>
          </View>
          <Text className="text-white text-4xl font-bold tracking-wide">定格九局</Text>
          <Text className="text-white/60 text-base mt-2 tracking-widest">INNING FRAME</Text>
        </View>

        {/* 說明文字 */}
        <View className="items-center">
          <Text className="text-white/80 text-center text-base leading-7">
            記錄每一次進場的感動{'\n'}讓每一場比賽成為永恆記憶
          </Text>

          <View className="flex-row mt-8 gap-8">
            {[
              { icon: '📅', label: '賽程查詢' },
              { icon: '🎫', label: '票根記錄' },
              { icon: '📊', label: '個人統計' },
            ].map((item) => (
              <View key={item.label} className="items-center">
                <Text className="text-2xl">{item.icon}</Text>
                <Text className="text-white/60 text-xs mt-1">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 登入按鈕 */}
        <View className="gap-4">
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            disabled={loading}
            className="bg-white rounded-2xl py-4 flex-row items-center justify-center gap-3 shadow-lg"
            activeOpacity={0.85}
          >
            <Text className="text-xl">G</Text>
            <Text className="text-brand-navy font-bold text-base">
              {loading ? '登入中...' : '使用 Google 帳號登入'}
            </Text>
          </TouchableOpacity>

          <Text className="text-white/40 text-xs text-center">
            登入即代表您同意我們的服務條款與隱私政策
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
