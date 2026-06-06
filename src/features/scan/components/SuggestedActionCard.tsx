import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';

const ACTION_ICONS: Record<number, string> = {
  0: '💧',
  1: '☀️',
  2: '🌱',
  3: '🩺',
  4: '🔄',
};

interface SuggestedActionCardProps {
  action: string;
  index: number;
}

export const SuggestedActionCard: React.FC<SuggestedActionCardProps> = ({ action, index }) => {
  const icon = ACTION_ICONS[index] ?? '✅';

  return (
    <View style={styles.card}>
      <View style={styles.iconBubble}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.text}>{action}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0FFF4',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: 20,
  },
  text: {
    flex: 1,
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
