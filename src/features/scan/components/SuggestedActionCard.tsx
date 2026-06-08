import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SuggestedActionCardProps {
  action: string;
  index: number;
}

export const SuggestedActionCard: React.FC<SuggestedActionCardProps> = ({ action, index }) => (
  <View style={styles.card}>
    <View style={styles.indexBubble}>
      <Text style={styles.indexText}>{String(index + 1).padStart(2, '0')}</Text>
    </View>
    <Text style={styles.text}>{action}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEE7DA',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 8,
  },
  indexBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(111,148,62,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  indexText: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 12,
    color: '#6F943E',
    letterSpacing: 0.5,
  },
  text: {
    flex: 1,
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    color: '#111111',
    lineHeight: 20,
  },
});
