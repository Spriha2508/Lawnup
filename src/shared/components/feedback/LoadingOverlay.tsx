import React from 'react';
import { View, ActivityIndicator, Text, Modal } from 'react-native';
import { colors } from '../../../constants/colors';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Please wait...',
}) => (
  <Modal visible={visible} transparent animationType="fade">
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: colors.overlay }}
    >
      <View className="bg-surface rounded-2xl p-8 items-center mx-8">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-text-primary text-base font-nunito-semibold mt-4 text-center">
          {message}
        </Text>
      </View>
    </View>
  </Modal>
);
