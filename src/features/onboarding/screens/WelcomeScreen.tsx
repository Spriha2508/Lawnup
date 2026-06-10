import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '../../auth/store/authStore';
import { AmbientBackground } from '@shared/components/motion/AmbientBackground';
import { FloatingLeaves } from '@shared/components/motion/FloatingLeaves';
import { PlantEmblem } from '@shared/components/motion/PlantEmblem';
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
      <AmbientBackground />
      <FloatingLeaves />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Cinematic hero */}
        <View style={styles.hero}>
          <Animated.View entering={FadeIn.duration(M.duration.cinematic)} style={styles.emblemWrap}>
            <PlantEmblem size={104} />
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(240).duration(M.duration.expressive)} style={styles.eyebrow}>
            WELCOME TO LAWNUP
          </Animated.Text>

          <Animated.Text entering={FadeInDown.delay(340).duration(M.duration.expressive)} style={styles.headline}>
            Hello,{'\n'}<Text style={styles.headlineName}>{firstName}.</Text>
          </Animated.Text>

          <Animated.View entering={FadeIn.delay(560)} style={styles.sep} />

          <Animated.Text entering={FadeInDown.delay(620).duration(M.duration.expressive)} style={styles.body}>
            A calmer way to care for your green world.{'\n'}Let's shape LawnUp around your home — then grow, together.
          </Animated.Text>
        </View>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(780).duration(M.duration.expressive)} style={styles.ctaWrap}>
          <PressableScale style={styles.cta} onPress={() => navigation.navigate('Location')} to={0.97}>
            <Text style={styles.ctaText}>Begin your garden</Text>
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
  emblemWrap: { marginBottom: S['3xl'], marginLeft: -S.xs },
  eyebrow: { ...T.eyebrow, color: C.textMuted, letterSpacing: 2.8, marginBottom: S.lg },
  headline: { fontFamily: F.serifMedium, fontSize: 56, lineHeight: 60, letterSpacing: -0.8, color: C.textPrimary, marginBottom: S.xl },
  headlineName: { fontFamily: F.serifMediumItalic, color: C.primary },
  sep: { width: 28, height: 3, borderRadius: 2, backgroundColor: C.primary, marginBottom: S.xl, opacity: 0.7 },
  body: { ...T.bodyLg, color: C.textSecondary, lineHeight: 27, maxWidth: '94%' },

  ctaWrap: { alignItems: 'center', gap: S.md },
  cta: { width: '100%', backgroundColor: C.inkBtn, borderRadius: R.pill, paddingVertical: 19, alignItems: 'center', ...theme.shadows.cta },
  ctaText: { ...T.button, fontFamily: F.sansMedium, color: C.onInkBtn, letterSpacing: 0.3 },
  hint: { ...T.caption, color: C.textMuted },
});
