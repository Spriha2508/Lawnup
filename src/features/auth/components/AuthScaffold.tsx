/**
 * AuthScaffold — shared immersive composition for Login / Signup.
 *
 * Layered depth: cinematic AmbientBackground → a breathing PlantEmblem hero
 * over open space → the form on a floating, elevated surface panel. Plus a
 * soft (non-harsh) error treatment. Calm motion choreography.
 */

import React from 'react';
import {
  View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { AmbientBackground } from '@shared/components/motion/AmbientBackground';
import { FloatingLeaves } from '@shared/components/motion/FloatingLeaves';
import { PlantEmblem } from '@shared/components/motion/PlantEmblem';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { theme } from '@constants/designSystem';

const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;

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
    <AmbientBackground />
    <FloatingLeaves />
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

          {/* Hero over ambient */}
          <View style={styles.hero}>
            <Animated.View entering={FadeIn.duration(M.duration.cinematic)} style={styles.emblem}>
              <PlantEmblem size={76} />
            </Animated.View>
            <Animated.Text entering={calm(0)} style={styles.eyebrow}>{eyebrow}</Animated.Text>
            <Animated.Text entering={calm(1)} style={styles.headline}>{headline}</Animated.Text>
            <Animated.Text entering={calm(2)} style={styles.subtitle}>{subtitle}</Animated.Text>
          </View>

          {/* Floating form panel */}
          <Animated.View entering={FadeInDown.delay(320).duration(M.duration.expressive)} style={styles.panel}>
            {children}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </KAV>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: S.sm, paddingBottom: S['3xl'] },

  backBtn: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)', marginBottom: S.lg,
  },

  hero: { paddingHorizontal: S.xs, marginBottom: S['2xl'] },
  emblem: { marginBottom: S.xl, marginLeft: -S.xs },
  eyebrow: { ...T.eyebrow, color: C.textMuted, letterSpacing: 2.6, marginBottom: S.md },
  headline: { fontFamily: F.serifMedium, fontSize: 46, lineHeight: 50, letterSpacing: -0.6, color: C.textPrimary, marginBottom: S.md },
  subtitle: { ...T.bodyLg, fontFamily: F.sans, color: C.textSecondary, lineHeight: 24, maxWidth: '94%' },

  panel: {
    backgroundColor: C.card,
    borderRadius: R.sheet,
    padding: S.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    ...theme.shadows.lg,
  },
});
