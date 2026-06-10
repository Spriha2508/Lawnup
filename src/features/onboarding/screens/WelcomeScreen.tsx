import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useAuthStore } from '../../auth/store/authStore';
import { AmbientBackground } from '@shared/components/motion/AmbientBackground';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { theme } from '@constants/designSystem';
import type { OnboardingStackParamList } from '@navigation/types';

type Nav = StackNavigationProp<OnboardingStackParamList, 'Welcome'>;
const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;

const Emblem: React.FC = () => (
  <View style={styles.emblem}>
    <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3C12 3 5 6 5 13C5 17.4183 8.13 21 12 21C15.87 21 19 17.4183 19 13C19 6 12 3 12 3Z" fill={C.primary} opacity={0.92} />
      <Path d="M12 3V21" stroke={C.canvas} strokeWidth={1.3} strokeLinecap="round" />
      <Path d="M12 13C9.5 15 6.5 15 5 16.5M12 16C14.5 18 17.5 17.2 19 18" stroke={C.canvas} strokeWidth={1} strokeLinecap="round" opacity={0.7} />
    </Svg>
  </View>
);

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const firstName = user?.name?.split(' ')[0] ?? 'Gardener';

  return (
    <View style={styles.root}>
      <AmbientBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.hero}>
          <Animated.View entering={FadeInDown.duration(M.duration.cinematic).springify().damping(20)}>
            <Emblem />
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(160).duration(M.duration.expressive)} style={styles.eyebrow}>
            WELCOME TO LAWNUP
          </Animated.Text>

          <Animated.Text entering={FadeInDown.delay(260).duration(M.duration.expressive)} style={styles.headline}>
            Hello,{'\n'}<Text style={styles.headlineName}>{firstName}.</Text>
          </Animated.Text>

          <Animated.View entering={FadeIn.delay(440)} style={styles.sep} />

          <Animated.Text entering={FadeInDown.delay(500).duration(M.duration.expressive)} style={styles.body}>
            Let's shape LawnUp around your home and your plants. A few calm questions — then we grow together.
          </Animated.Text>
        </View>

        <Animated.View entering={FadeInUp.delay(640).duration(M.duration.expressive)} style={styles.ctaWrap}>
          <PressableScale style={styles.cta} onPress={() => navigation.navigate('Location')}>
            <Text style={styles.ctaText}>Begin</Text>
          </PressableScale>
          <Text style={styles.hint}>Takes less than a minute</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  safe: { flex: 1, paddingHorizontal: 32, justifyContent: 'space-between', paddingBottom: S.lg },

  hero: { flex: 1, justifyContent: 'center' },
  emblem: {
    width: 84, height: 84, borderRadius: 28, backgroundColor: C.primaryWash,
    alignItems: 'center', justifyContent: 'center', marginBottom: S['2xl'],
  },
  eyebrow: { ...T.eyebrow, color: C.textMuted, letterSpacing: 2.5, marginBottom: S.lg },
  headline: { fontFamily: F.serifMedium, fontSize: 48, lineHeight: 54, letterSpacing: -0.5, color: C.textPrimary, marginBottom: S.xl },
  headlineName: { fontFamily: F.serifMediumItalic, color: C.primary },
  sep: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary, marginBottom: S.xl },
  body: { ...T.bodyLg, color: C.textSecondary, lineHeight: 26, maxWidth: '92%' },

  ctaWrap: { alignItems: 'center', gap: S.md },
  cta: { width: '100%', backgroundColor: C.inkBtn, borderRadius: R.pill, paddingVertical: 18, alignItems: 'center' },
  ctaText: { ...T.button, fontFamily: F.sansMedium, color: C.onInkBtn },
  hint: { ...T.caption, color: C.textMuted },
});
