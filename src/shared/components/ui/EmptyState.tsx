import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { PressableScale } from '../motion/PressableScale';
import { theme } from '@constants/designSystem';

const { color: C, spacing: S, typography: T, radii: R, fonts: F } = theme;

interface EmptyStateProps {
  /** A small illustration node rendered inside the standard washed icon badge. */
  icon: ReactNode;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Layout override — e.g. `flex: 1` for full-screen, or padding tweaks inline. */
  style?: ViewStyle;
}

/**
 * The one standard empty state: illustration + explanation + (optional) CTA.
 * Matches the My Garden gold-standard pattern so every empty screen reads the same.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
}) => (
  <View style={[styles.wrap, style]}>
    <View style={styles.iconWrap}>{icon}</View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.sub}>{subtitle}</Text>
    {actionLabel && onAction && (
      <PressableScale style={styles.btn} onPress={onAction} to={0.97}>
        <Text style={styles.btnText}>{actionLabel}</Text>
      </PressableScale>
    )}
  </View>
);

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: S['3xl'] },
  iconWrap: {
    width: 88, height: 88, borderRadius: 30, backgroundColor: C.primaryWash,
    alignItems: 'center', justifyContent: 'center', marginBottom: S['2xl'],
  },
  title: { fontFamily: F.serifMedium, fontSize: 26, lineHeight: 31, color: C.textPrimary, textAlign: 'center', marginBottom: S.md },
  sub: { ...T.bodyMd, color: C.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: S['2xl'] },
  btn: { backgroundColor: C.inkBtn, borderRadius: R.pill, paddingVertical: S.lg, paddingHorizontal: S['3xl'], ...theme.shadows.cta },
  btnText: { ...T.button, fontFamily: F.sansMedium, color: C.onInkBtn },
});
