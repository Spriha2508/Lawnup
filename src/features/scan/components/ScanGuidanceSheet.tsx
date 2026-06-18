import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { theme } from '@constants/designSystem';

const { spacing: S, radii: R, fonts: F } = theme;
const C = theme.dark.color;

// Pre-capture guidance — shown the first time the camera opens (and re-openable
// via the "?" button). Plant.id is most accurate on a clear, well-lit subject,
// so steering framing BEFORE capture lifts the success rate without touching the
// AI provider (LB-032 / LB-038).
const DO: { icon: string; label: string }[] = [
  { icon: '🌿', label: 'A whole plant, well framed' },
  { icon: '🍃', label: 'A single leaf, up close' },
  { icon: '🌸', label: 'A flower, if it has one' },
  { icon: '☀️', label: 'Bright, even lighting' },
];

const DONT: { icon: string; label: string }[] = [
  { icon: '🌫️', label: 'Blurry or out of focus' },
  { icon: '🌑', label: 'Dark or heavy shadow' },
  { icon: '🔭', label: 'Too far — plant too small' },
];

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export const ScanGuidanceSheet: React.FC<Props> = ({ visible, onDismiss }) => {
  if (!visible) return null;
  return (
    <View style={styles.backdrop}>
      <View style={styles.sheet}>
        <Text style={styles.title}>Get the best identification</Text>
        <Text style={styles.subtitle}>
          A clear, well-lit subject is all the AI needs. Aim for one of these:
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} style={{ alignSelf: 'stretch' }}>
          <Text style={[styles.groupLabel, { color: C.healthyFg }]}>WORKS WELL</Text>
          {DO.map((d) => (
            <View key={d.label} style={styles.row}>
              <Text style={styles.rowIcon}>{d.icon}</Text>
              <Text style={styles.rowText}>{d.label}</Text>
              <Text style={[styles.mark, { color: C.healthyFg }]}>✓</Text>
            </View>
          ))}

          <Text style={[styles.groupLabel, { color: C.waterFg, marginTop: S.lg }]}>AVOID</Text>
          {DONT.map((d) => (
            <View key={d.label} style={styles.row}>
              <Text style={styles.rowIcon}>{d.icon}</Text>
              <Text style={styles.rowText}>{d.label}</Text>
              <Text style={[styles.mark, { color: C.waterFg }]}>✕</Text>
            </View>
          ))}
        </ScrollView>

        <Pressable style={styles.cta} onPress={onDismiss}>
          <Text style={styles.ctaText}>Start scanning</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,13,8,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: S.xl,
    zIndex: 50,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '82%',
    backgroundColor: C.canvas,
    borderRadius: R.sheet,
    paddingHorizontal: S.xl,
    paddingTop: S['2xl'],
    paddingBottom: S.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  title: {
    fontFamily: F.serifMedium,
    fontSize: 24,
    color: C.textPrimary,
    textAlign: 'center',
    marginBottom: S.sm,
  },
  subtitle: {
    fontFamily: F.sans,
    fontSize: 14,
    lineHeight: 20,
    color: C.textMuted,
    textAlign: 'center',
    marginBottom: S.xl,
  },
  groupLabel: {
    fontFamily: F.sansBold,
    fontSize: 11,
    letterSpacing: 1.6,
    marginBottom: S.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingVertical: 9,
  },
  rowIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  rowText: { flex: 1, fontFamily: F.sansMedium, fontSize: 14, color: C.textPrimary },
  mark: { fontFamily: F.sansBold, fontSize: 15 },
  cta: {
    marginTop: S.xl,
    alignSelf: 'stretch',
    backgroundColor: C.primary,
    borderRadius: R.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ctaText: { fontFamily: F.sansBold, fontSize: 16, color: C.onPrimary },
});
