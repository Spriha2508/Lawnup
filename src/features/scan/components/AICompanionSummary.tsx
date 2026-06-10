/**
 * AICompanionSummary — the emotional heart of the scan result.
 * A warm, conversational read on the user's plant + an animated vitality meter
 * and recovery outlook. Derived entirely from existing scan data (no backend).
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, withDelay, withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { theme } from '@constants/designSystem';

const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;

interface Disease { name: string; probability: number }
interface Props {
  name: string;
  nickname?: string;
  isHealthy: boolean;
  confidence: number;
  diseases: Disease[];
}

const tone = (v: number) => (v >= 70 ? C.healthyFg : v >= 45 ? C.waterFg : C.criticalFg);

function vitality(isHealthy: boolean, confidence: number, diseases: Disease[]): number {
  if (confidence < 0.5) return 0;
  if (isHealthy) return Math.round(80 + confidence * 12);
  const worst = diseases.reduce((m, d) => Math.max(m, d.probability), 0);
  if (worst === 0) return 60;
  return Math.max(28, Math.round(100 - worst * 58));
}

function statusLabel(v: number, lowConf: boolean): string {
  if (lowConf) return 'Unsure';
  if (v >= 80) return 'Thriving';
  if (v >= 60) return 'Doing well';
  if (v >= 45) return 'A little stressed';
  return 'Needs your care';
}

function summary(name: string, isHealthy: boolean, confidence: number, diseases: Disease[]): string {
  const who = name;
  if (confidence < 0.5) {
    return `I'm not fully sure about this one yet. Try a closer, well-lit photo of a single leaf and I'll give you a clearer read on ${who}.`;
  }
  if (isHealthy || diseases.length === 0) {
    return `Good news — your ${who} looks happy and healthy. I don't see any trouble in this scan, so keep doing exactly what you're doing.`;
  }
  const first = diseases[0]?.name ?? 'some stress';
  const more = diseases.length > 1 ? `, and a couple of other early signs` : '';
  return `Your ${who} looks a little stressed — I'm seeing signs of ${first.toLowerCase()}${more}. The good news: caught early like this, most plants bounce back with a few small changes.`;
}

const Leaf: React.FC = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3C12 3 5 6 5 13C5 17.4183 8.13 21 12 21C15.87 21 19 17.4183 19 13C19 6 12 3 12 3Z" fill={C.primary} opacity={0.95} />
    <Path d="M12 3V21" stroke={C.card} strokeWidth={1.2} strokeLinecap="round" />
  </Svg>
);

export const AICompanionSummary: React.FC<Props> = ({ name, isHealthy, confidence, diseases }) => {
  const v = vitality(isHealthy, confidence, diseases);
  const lowConf = confidence < 0.5;
  const t = tone(v);
  const status = statusLabel(v, lowConf);
  const text = summary(name, isHealthy, confidence, diseases);
  const showOutlook = !isHealthy && diseases.length > 0 && !lowConf;

  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = withDelay(400, withTiming(v / 100, { duration: M.duration.cinematic, easing: M.ease.smooth }));
  }, [v]); // eslint-disable-line react-hooks/exhaustive-deps
  const barStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%`, backgroundColor: t }));

  return (
    <Animated.View entering={FadeInDown.duration(M.duration.expressive)} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}><Leaf /></View>
        <Text style={styles.eyebrow}>LAWNUP AI</Text>
        <View style={[styles.statusChip, { backgroundColor: `${t}1A` }]}>
          <View style={[styles.statusDot, { backgroundColor: t }]} />
          <Text style={[styles.statusText, { color: t }]}>{status}</Text>
        </View>
      </View>

      <Text style={styles.summary}>{text}</Text>

      {!lowConf && (
        <View style={styles.meterWrap}>
          <View style={styles.meterTop}>
            <Text style={styles.meterLabel}>PLANT VITALITY</Text>
            <Text style={[styles.meterValue, { color: t }]}>{v}%</Text>
          </View>
          <View style={styles.meterTrack}>
            <Animated.View style={[styles.meterFill, barStyle]} />
          </View>
        </View>
      )}

      {showOutlook && (
        <View style={styles.outlookRow}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M3 17L9 11L13 15L21 7" stroke={C.healthyFg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M16 7H21V12" stroke={C.healthyFg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={styles.outlookText}>
            <Text style={styles.outlookStrong}>Recovery outlook: good.</Text> With consistent care, expect visible improvement within 1–2 weeks.
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card, borderRadius: R.sheet, padding: S.xl, marginHorizontal: 20, marginTop: 20,
    borderWidth: 1, borderColor: C.border, gap: S.lg, ...theme.shadows.card,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.primaryWash, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { ...T.eyebrow, color: C.textMuted, letterSpacing: 2, flex: 1 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.pill },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { ...T.statLabel, fontSize: 11, fontFamily: F.sansBold },

  summary: { ...T.bodyLg, fontFamily: F.sans, color: C.textPrimary, lineHeight: 25 },

  meterWrap: { gap: S.sm },
  meterTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meterLabel: { ...T.statLabel, color: C.textMuted, letterSpacing: 1.4 },
  meterValue: { fontFamily: F.sansHeavy, fontSize: 15 },
  meterTrack: { height: 8, borderRadius: 4, backgroundColor: C.input, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 4 },

  outlookRow: { flexDirection: 'row', gap: S.sm, alignItems: 'flex-start', backgroundColor: C.healthyBg, borderRadius: R.md, padding: S.md },
  outlookText: { ...T.caption, fontSize: 13, color: C.textSecondary, lineHeight: 19, flex: 1 },
  outlookStrong: { fontFamily: F.sansBold, color: C.healthyFg },
});
