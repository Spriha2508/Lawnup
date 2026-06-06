import React from 'react';
import { View, Text } from 'react-native';
import type { HealthStatus } from '../../../constants/plants';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
}

const variantClasses = {
  success: 'bg-green-100',
  warning: 'bg-yellow-100',
  error: 'bg-red-100',
  info: 'bg-blue-100',
  default: 'bg-gray-100',
};

const textClasses = {
  success: 'text-green-700',
  warning: 'text-yellow-700',
  error: 'text-red-700',
  info: 'text-blue-700',
  default: 'text-gray-700',
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default' }) => (
  <View className={`rounded-full px-3 py-1 ${variantClasses[variant]}`}>
    <Text className={`text-xs font-nunito-semibold ${textClasses[variant]}`}>{label}</Text>
  </View>
);

// Convenience component for plant health status
export const HealthBadge: React.FC<{ status: HealthStatus }> = ({ status }) => {
  const variantMap: Record<HealthStatus, BadgeProps['variant']> = {
    Healthy: 'success',
    'Needs Attention': 'warning',
    Critical: 'error',
  };
  return <Badge label={status} variant={variantMap[status]} />;
};
