import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export function MonthSelector({ year, month, onChange }: Props) {
  const prev = () => {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  };
  const next = () => {
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  };

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-brand-cream">
      <TouchableOpacity onPress={prev} className="w-9 h-9 rounded-full bg-white items-center justify-center shadow-sm">
        <Text className="text-brand-navy font-bold">‹</Text>
      </TouchableOpacity>
      <Text className="text-brand-navy font-bold text-lg">
        {year} 年 {month} 月
      </Text>
      <TouchableOpacity onPress={next} className="w-9 h-9 rounded-full bg-white items-center justify-center shadow-sm">
        <Text className="text-brand-navy font-bold">›</Text>
      </TouchableOpacity>
    </View>
  );
}
