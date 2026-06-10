import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthNavigation } from '@navigation/AuthNavigationContext';
import { AmbientBackground } from '@shared/components/motion/AmbientBackground';
import { PlantEmblem } from '@shared/components/motion/PlantEmblem';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { theme } from '@constants/designSystem';

const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;

const AppleLogo: React.FC = () => (
  <Svg width={18} height={18} viewBox="0 0 814 1000" fill={C.textPrimary}>
    <Path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-105.5-90.5-170.1-90.5-252.9c0-156.7 100.7-239.3 199.3-239.3 51.7 0 94.9 33.2 126.4 33.2 30.4 0 78.7-35.1 136.8-35.1 55.1 0 145.3 35.8 195.7 150zm-201.4-227.6c34.8-41.5 58.9-99.4 58.9-157.3 0-8.1-.6-16.2-1.9-23.8-55.4 2.1-120.9 37-159.7 82.9-31 35.8-59.5 93.2-59.5 152.1 0 9.2 1.6 18.4 2.3 21.4 3.2.6 8.4 1.3 13.6 1.3 49.4 0 111.2-32.5 146.3-76.6z" />
  </Svg>
);

const GoogleLogo: React.FC = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </Svg>
);

export const LandingScreen: React.FC = () => {
  const { navigate } = useAuthNavigation();

  return (
    <View style={styles.root}>
      <AmbientBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Cinematic hero */}
        <View style={styles.hero}>
          <Animated.View entering={FadeIn.duration(M.duration.cinematic)} style={styles.emblem}>
            <PlantEmblem size={108} />
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(240).duration(M.duration.expressive)} style={styles.eyebrow}>
            YOUR AI PLANT COMPANION
          </Animated.Text>

          <Animated.Text entering={FadeInDown.delay(340).duration(M.duration.expressive)} style={styles.headline}>
            Grow something{'\n'}<Text style={styles.headlineAccent}>beautiful.</Text>
          </Animated.Text>

          <Animated.Text entering={FadeInDown.delay(460).duration(M.duration.expressive)} style={styles.body}>
            Identify, diagnose and care for every plant in your home — with a companion that learns your garden.
          </Animated.Text>
        </View>

        {/* Auth actions */}
        <Animated.View entering={FadeInUp.delay(600).duration(M.duration.expressive)} style={styles.buttons}>
          <PressableScale style={styles.btnEmail} onPress={() => navigate('Signup')} to={0.97}>
            <Text style={styles.btnEmailText}>Continue with Email</Text>
          </PressableScale>

          <View style={styles.socialRow}>
            <PressableScale style={styles.btnSocial} onPress={() => navigate('Signup')} to={0.95}>
              <AppleLogo />
              <Text style={styles.btnSocialText}>Apple</Text>
            </PressableScale>
            <PressableScale style={styles.btnSocial} onPress={() => navigate('Signup')} to={0.95}>
              <GoogleLogo />
              <Text style={styles.btnSocialText}>Google</Text>
            </PressableScale>
          </View>

          <View style={styles.signinRow}>
            <Text style={styles.signinLabel}>Already have an account?  </Text>
            <PressableScale onPress={() => navigate('Login')} to={0.9}>
              <Text style={styles.signinLink}>Sign in</Text>
            </PressableScale>
          </View>

          <Text style={styles.terms}>
            By continuing you agree to our <Text style={styles.termsLink}>Terms & Privacy</Text>.
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  safe: { flex: 1, paddingHorizontal: 30, justifyContent: 'space-between', paddingBottom: S.md },

  hero: { flex: 1, justifyContent: 'center' },
  emblem: { marginBottom: S['3xl'], marginLeft: -S.xs },
  eyebrow: { ...T.eyebrow, color: C.textMuted, letterSpacing: 2.8, marginBottom: S.lg },
  headline: { fontFamily: F.serifMedium, fontSize: 52, lineHeight: 56, letterSpacing: -0.7, color: C.textPrimary, marginBottom: S.xl },
  headlineAccent: { fontFamily: F.serifMediumItalic, color: C.primary },
  body: { ...T.bodyLg, color: C.textSecondary, lineHeight: 27, maxWidth: '94%' },

  buttons: { gap: S.md },
  btnEmail: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.inkBtn, borderRadius: R.pill, paddingVertical: 18, ...theme.shadows.cta },
  btnEmailText: { ...T.button, color: C.onInkBtn, fontFamily: F.sansMedium },
  socialRow: { flexDirection: 'row', gap: S.md },
  btnSocial: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm,
    backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: R.pill, paddingVertical: 15,
    borderWidth: 1, borderColor: C.border,
  },
  btnSocialText: { ...T.bodyStrong, color: C.textPrimary },
  signinRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: S.xs },
  signinLabel: { ...T.bodyMd, color: C.textMuted },
  signinLink: { ...T.bodyMd, fontFamily: F.sansBold, color: C.primary },
  terms: { ...T.caption, color: C.textMuted, textAlign: 'center', marginTop: S.xs },
  termsLink: { color: C.textSecondary, fontFamily: F.sansMedium },
});
