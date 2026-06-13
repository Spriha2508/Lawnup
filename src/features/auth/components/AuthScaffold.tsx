/**
 * AuthScaffold — shared immersive composition for Login / Signup / Forgot.
 *
 * Continues the Welcome environment for one unbroken atmosphere: cinematic
 * AmbientBackground + light pouring from above + botanicals drifting at depth.
 * Typography leads (no emblem chrome); the form floats on a soft frosted
 * surface rather than a heavy opaque card. Calm motion choreography.
 */

import React from 'react';
import {
  View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Defs, RadialGradient, Stop, Circle, G } from 'react-native-svg';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { theme } from '@constants/designSystem';

const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;
const { width: AW, height: AH } = Dimensions.get('window');

// ─── Warm botanical backdrop — soft light pools + foliage framing the corners,
//     so the auth screens feel like the warmest, most welcoming moment. ────────
const leafD = (L: number) => {
  const w = L * 0.5;
  return `M0 0 C ${L * 0.5} ${-w} ${L} ${-w * 0.4} ${L} 0 C ${L} ${w * 0.4} ${L * 0.5} ${w} 0 0 Z`;
};
const AUTH_GREENS = ['#6FA06B', '#5E7F61', '#88B07E', '#4E7C4A'];
const AUTH_LEAVES = (() => {
  const arr: { x: number; y: number; L: number; rot: number; c: string }[] = [];
  for (let k = 0; k < 8; k++) arr.push({ x: AW * 0.04, y: AH * 1.0, L: 36 + (k % 3) * 12, rot: -88 + k * 13, c: AUTH_GREENS[k % 4] });
  for (let k = 0; k < 8; k++) arr.push({ x: AW * 0.96, y: AH * 1.0, L: 36 + (k % 3) * 12, rot: -92 - k * 13, c: AUTH_GREENS[(k + 1) % 4] });
  return arr;
})();

const AuthBackdrop: React.FC = () => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Svg width={AW} height={AH}>
      <Defs>
        <RadialGradient id="au-blush" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#F4B8CE" stopOpacity={0.28} /><Stop offset="1" stopColor="#F4B8CE" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="au-sage" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#9DBE8F" stopOpacity={0.30} /><Stop offset="1" stopColor="#9DBE8F" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="au-butter" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#F2D98C" stopOpacity={0.26} /><Stop offset="1" stopColor="#F2D98C" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={AW * 0.86} cy={AH * 0.06} r={AW * 0.62} fill="url(#au-blush)" />
      <Circle cx={AW * 0.08} cy={AH * 0.30} r={AW * 0.56} fill="url(#au-sage)" />
      <Circle cx={AW * 0.92} cy={AH * 0.72} r={AW * 0.52} fill="url(#au-butter)" />
      {AUTH_LEAVES.map((lf, i) => (
        <G key={i} transform={`translate(${lf.x}, ${lf.y}) rotate(${lf.rot})`} opacity={0.5}>
          <Path d={leafD(lf.L)} fill={lf.c} />
        </G>
      ))}
    </Svg>
  </View>
);

const KAV: React.FC<{ children: React.ReactNode }> =
  Platform.OS === 'ios'
    ? ({ children }) => <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">{children}</KeyboardAvoidingView>
    : ({ children }) => <View style={{ flex: 1 }}>{children}</View>;

export const calm = (i: number) => FadeInDown.delay(80 + i * 90).duration(M.duration.expressive);

// ─── Soft error (replaces the harsh red banner) ──────────────────────────────
export const SoftError: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => (
  <Animated.View entering={FadeInDown.duration(M.duration.standard)}>
    <Pressable onPress={onDismiss} style={errStyles.wrap}>
      <View style={errStyles.dot}>
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path d="M12 8V13" stroke={C.criticalFg} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M12 16.5V16.6" stroke={C.criticalFg} strokeWidth={2.4} strokeLinecap="round" />
        </Svg>
      </View>
      <Text style={errStyles.text}>{message}</Text>
    </Pressable>
  </Animated.View>
);

const errStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    backgroundColor: 'rgba(229,72,77,0.08)', borderRadius: R.md,
    paddingHorizontal: S.lg, paddingVertical: S.md, marginBottom: S.lg,
  },
  dot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(229,72,77,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  text: { ...T.bodyMd, color: C.criticalFg, flex: 1 },
});

// ─── Scaffold ────────────────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
  eyebrow: string;
  headline: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthScaffold: React.FC<Props> = ({ onBack, eyebrow, headline, subtitle, children }) => (
  <View style={styles.root}>
    {/* Warm botanical backdrop over the persistent root atmosphere. */}
    <AuthBackdrop />
    <KAV>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          bounces={false}
        >
          <PressableScale style={styles.backBtn} onPress={onBack} hitSlop={8} to={0.9}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M15 5L8 12L15 19" stroke={C.textSecondary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </PressableScale>

          {/* Typography-led hero over the living environment */}
          <View style={styles.hero}>
            <Animated.Text entering={calm(0)} style={styles.eyebrow}>{eyebrow}</Animated.Text>
            <Animated.Text entering={calm(1)} style={styles.headline}>{headline}</Animated.Text>
            <Animated.Text entering={calm(2)} style={styles.subtitle}>{subtitle}</Animated.Text>
          </View>

          {/* Form sits on a soft white card — warm & welcoming */}
          <Animated.View entering={FadeInDown.delay(320).duration(M.duration.expressive)} style={styles.formCard}>
            {children}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </KAV>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: S.sm, paddingBottom: S['3xl'] },

  backBtn: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, marginBottom: S.xl,
    ...theme.shadows.sm,
  },

  hero: { paddingHorizontal: S.xs, marginBottom: S['2xl'] },
  eyebrow: { ...T.eyebrow, color: C.textMuted, letterSpacing: 3, marginBottom: S.md },
  headline: { fontFamily: F.serif, fontSize: 52, lineHeight: 56, letterSpacing: -0.8, color: C.textPrimary, marginBottom: S.lg },
  subtitle: { ...T.bodyLg, fontFamily: F.sans, color: C.textSecondary, lineHeight: 25, maxWidth: '94%' },

  // The form sits on a soft white card for a warm, welcoming feel.
  formCard: {
    marginTop: S.xs,
    backgroundColor: C.card,
    borderRadius: R.xl,
    paddingHorizontal: S.xl,
    paddingTop: S.xl,
    paddingBottom: S.lg,
    borderWidth: 1,
    borderColor: C.border,
    ...theme.shadows.card,
  },
});
