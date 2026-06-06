import React from 'react';
import { View, Text } from 'react-native';
import { SafeScreen } from '../../../shared/components/layout/SafeScreen';

export const ChatScreen: React.FC = () => (
  <SafeScreen>
    <View className="flex-1 items-center justify-center px-8">
      <Text style={{ fontSize: 48 }} className="mb-4">🤖</Text>
      <Text className="text-text-primary text-xl font-nunito-bold text-center mb-2">
        AI Plant Doctor
      </Text>
      <Text className="text-text-secondary text-base font-nunito-regular text-center">
        Coming in Phase 4 — ask anything about your plants by name.
      </Text>
    </View>
  </SafeScreen>
);
