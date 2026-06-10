import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SuggestedActionCardProps {
  action: string;
  index: number;
}

export const SuggestedActionCard: React.FC<SuggestedActionCardProps> = ({ action, index }) => (
  <View style={styles.card}>
    <Text style={styles.indexText}>{String(index + 1).padStart(2, '0')}</Text>
    <Text style={styles.text}>{action}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEE7DA',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DDD4C7',
  },
  indexText: {
    fontFamily: 'Cormorant-SemiBold',
    fontSize: 18,
    color: '#6F943E',
    lineHeight: 22,
    marginTop: 1,
    minWidth: 22,
  },
  text: {
    flex: 1,
    fontFamily: 'Nunito-Regular',
    fontSize: 15,
    color: '#2A2A22',
    lineHeight: 22,
  },
});
