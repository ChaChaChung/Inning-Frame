import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';

interface Props {
  message?: string;
}

export function LoadingSpinner({ message = '載入中...' }: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-brand-cream">
      <ActivityIndicator size="large" color="#1a3a5c" />
      <Text className="mt-3 text-brand-gray text-sm">{message}</Text>
    </View>
  );
}
