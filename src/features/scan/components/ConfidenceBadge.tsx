import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ConfidenceBadgeProps {
  confidence: number; // 0–1
  size?: 'sm' | 'md' | 'lg';
}

function getConfidenceMeta(v: number): { label: string; color: string } {
  if (v >= 0.85) return { label: 'High confidence',         color: '#6F943E' };
  if (v >= 0.70) return { label: 'Likely match',            color: '#5A8032' };
  if (v >= 0.50) return { label: 'Possible match',          color: '#B07000' };
  return             { label: 'Low confidence',             color: '#9E9A94' };
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  size = 'md',
}) => {
  const pct = Math.round(confidence * 100);
  const { label, color } = getConfidenceMeta(confidence);

  return (
    <View style={[styles.badge, { backgroundColor: `${color}18`, borderColor: `${color}38` }]}>
      <Text
        style={[
          styles.pct,
          { color },
          size === 'lg' && styles.pctLg,
          size === 'sm' && styles.pctSm,
        ]}
      >
        {pct}%
      </Text>
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
  pctLg: { fontSize: 26 },
  pctSm: { fontSize: 13 },
  label: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 11,
    marginTop: 1,
    opacity: 0.85,
  },
});
