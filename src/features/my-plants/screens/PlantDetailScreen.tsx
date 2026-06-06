import React from 'react';
import { View, Text } from 'react-native';
import { SafeScreen } from '../../../shared/components/layout/SafeScreen';

export const PlantDetailScreen: React.FC = () => (
  <SafeScreen>
    <View className="flex-1 items-center justify-center">
      <Text className="text-text-secondary font-nunito-regular">Plant Detail — Phase 3</Text>
    </View>
  </SafeScreen>
);
