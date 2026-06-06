import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  emoji,
  title,
  subtitle,
  actionLabel,
  onAction,
}) => (
  <View className="flex-1 items-center justify-center px-8 py-16">
    <Text style={{ fontSize: 64 }} className="mb-4">{emoji}</Text>
    <Text className="text-text-primary text-xl font-nunito-bold text-center mb-2">{title}</Text>
    <Text className="text-text-secondary text-base font-nunito-regular text-center mb-8 leading-6">
      {subtitle}
    </Text>
    {actionLabel && onAction && (
      <Button label={actionLabel} onPress={onAction} fullWidth />
    )}
  </View>
);
