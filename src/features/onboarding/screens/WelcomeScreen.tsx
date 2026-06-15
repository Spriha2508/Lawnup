/**
 * WelcomeScreen — in-app welcome: "Grow Something Beautiful".
 *
 * The first emotional beat after the splash: WONDER. An immersive environment
 * rather than a page — warm light pouring in from above, botanicals drifting at
 * depth, and oversized editorial typography revealed line by line. Minimal
 * chrome, no cards: typography + atmosphere carry the feeling.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '../../auth/store/authStore';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { theme } from '@constants/designSystem';
import type { OnboardingStackParamList } from '@navigation/types';

type Nav = StackNavigationProp<OnboardingStackParamList, 'Welcome'>;
const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const firstName = user?.name?.split(' ')[0] ?? 'Gardener';

  return (
    <View style={styles.root}>
      {/* Atmosphere is the persistent root world — this screen is transparent over it. */}
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.hero}>
          <Animated.Text
            entering={FadeInDown.delay(180).duration(M.duration.expressive)}
            style={styles.eyebrow}
          >
            WELCOME{firstName ? `, ${firstName.toUpperCase()}` : ''}
          </Animated.Text>

          {/* Oversized editorial statement, line by line */}
          <View style={styles.headlineWrap}>
            <Animated.Text entering={FadeInDown.delay(320).duration(M.duration.cinematic)} style={styles.line}>
              Grow Something
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(440).duration(M.duration.cinematic)} style={styles.lineEmph}>
              Beautiful
            </Animated.Text>
          </View>

          <Animated.View entering={FadeIn.delay(640)} style={styles.rule} />

          <Animated.Text
            entering={FadeInDown.delay(700).duration(M.duration.expressive)}
            style={styles.body}
          >
            An intelligent companion for every plant you love — sensing what they
            need, and quietly growing alongside you.
          </Animated.Text>
        </View>

        <Animated.View entering={FadeInUp.delay(880).duration(M.duration.expressive)} style={styles.ctaWrap}>
          <PressableScale style={styles.cta} onPress={() => navigation.navigate('Location')} to={0.97}>
            <Text style={styles.ctaText}>Begin your garden</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </PressableScale>
          <Text style={styles.hint}>Takes less than a minute</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  safe: { flex: 1, paddingHorizontal: 32, justifyContent: 'space-between', paddingBottom: S.lg },

  hero: { flex: 1, justifyContent: 'center' },
  eyebrow: { ...T.eyebrow, color: C.textMuted, letterSpacing: 3, marginBottom: S['2xl'] },

  headlineWrap: { marginBottom: S.xl },
  line: { fontFamily: F.serif, fontSize: 56, lineHeight: 60, letterSpacing: -1, color: C.textPrimary },
  lineEmph: { fontFamily: F.serifMediumItalic, fontSize: 58, lineHeight: 62, letterSpacing: -1, color: C.primary },

  rule: { width: 32, height: 2, borderRadius: 2, backgroundColor: C.primary, opacity: 0.7, marginBottom: S.xl },
  body: { ...T.bodyLg, color: C.textSecondary, lineHeight: 28, maxWidth: '95%' },

  ctaWrap: { alignItems: 'center', gap: S.md },
  cta: {
    width: '100%', backgroundColor: C.inkBtn, borderRadius: R.pill,
    paddingVertical: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: S.sm, ...theme.shadows.cta,
  },
  ctaText: { ...T.button, fontFamily: F.sansMedium, color: C.onInkBtn, letterSpacing: 0.3 },
  ctaArrow: { ...T.button, color: C.onInkBtn, marginTop: -1 },
  hint: { ...T.caption, color: C.textMuted },
});
