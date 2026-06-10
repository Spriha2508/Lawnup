import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '@constants/designSystem';

const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;

interface SuggestedActionCardProps {
  action: string;
  index: number;
}

export const SuggestedActionCard: React.FC<SuggestedActionCardProps> = ({ action, index }) => (
  <Animated.View entering={FadeInDown.delay(index * M.stagger.base).duration(M.duration.expressive)} style={styles.card}>
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{index + 1}</Text>
    </View>
    <Text style={styles.text}>{action}</Text>
  </Animated.View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: C.card, borderRadius: R.lg,
    paddingHorizontal: S.lg, paddingVertical: S.lg, gap: S.lg, marginBottom: S.sm,
    borderWidth: 1, borderColor: C.border, ...theme.shadows.sm,
  },
  badge: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: C.primaryWash,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  badgeText: { fontFamily: F.sansHeavy, fontSize: 13, color: C.primary },
  text: { flex: 1, ...T.body, color: C.textPrimary, lineHeight: 22 },
});
