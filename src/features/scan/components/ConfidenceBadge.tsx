import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
interface ConfidenceBadgeProps {
  confidence: number; // 0–1
  size?: 'sm' | 'md' | 'lg';
}

const getConfidenceColor = (v: number): string => {
  if (v >= 0.85) return '#6F943E';
  if (v >= 0.65) return '#B07000';
  return '#9E9A94';
};

const getConfidenceLabel = (v: number): string => {
  if (v >= 0.90) return 'High confidence';
  if (v >= 0.70) return 'Good match';
  return 'Possible match';
};

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  size = 'md',
}) => {
  const color = getConfidenceColor(confidence);
  const pct = Math.round(confidence * 100);
  const label = getConfidenceLabel(confidence);

  const isLg = size === 'lg';
  const isSm = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
      {/* Percentage */}
      <Text
        style={[
          styles.pct,
          { color },
          isLg && styles.pctLg,
          isSm && styles.pctSm,
        ]}
      >
        {pct}%
      </Text>
      {/* Label */}
      {size !== 'sm' && (
        <Text style={[styles.label, { color }]}>{label}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  pct: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 18,
  },
  pctLg: {
    fontSize: 26,
  },
  pctSm: {
    fontSize: 13,
  },
  label: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 11,
    marginTop: 1,
    opacity: 0.85,
  },
});
