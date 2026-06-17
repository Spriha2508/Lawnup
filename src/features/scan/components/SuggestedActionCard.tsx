import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '@constants/designSystem';

const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;

interface SuggestedActionCardProps {
  action: string;
  index: number;
}

// Care-category icon inferred from the action text, so each recommendation is
// scannable at a glance (💧 Water · ☀️ Sunlight · 🌱 Soil · 🪴 Fertilizer ·
// 🌡 Temperature). Falls back to a leaf for general care.
function careIcon(action: string): string {
  const a = action.toLowerCase();
  if (/\b(water|watering|moist|hydrat|drench|soak|overwater|underwater|dry soil)\b/.test(a)) return '💧';
  if (/\b(sun|sunlight|light|bright|shade|indirect|window|lux)\b/.test(a)) return '☀️';
  if (/\b(soil|repot|re-pot|potting|pot\b|drainage|mix|substrate)\b/.test(a)) return '🌱';
  if (/\b(fertil|feed|feeding|nutrient|compost|npk)\b/.test(a)) return '🪴';
  if (/\b(temp|temperature|heat|hot|cold|warm|cool|humid|humidity|frost|mist)\b/.test(a)) return '🌡';
  return '🌿';
}

export const SuggestedActionCard: React.FC<SuggestedActionCardProps> = ({ action, index }) => (
  <Animated.View entering={FadeInDown.delay(index * M.stagger.base).duration(M.duration.expressive)} style={styles.card}>
    <View style={styles.badge}>
      <Text style={styles.badgeIcon}>{careIcon(action)}</Text>
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
    width: 30, height: 30, borderRadius: 15, backgroundColor: C.primaryWash,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  badgeIcon: { fontSize: 15 },
  text: { flex: 1, ...T.body, color: C.textPrimary, lineHeight: 22 },
});
