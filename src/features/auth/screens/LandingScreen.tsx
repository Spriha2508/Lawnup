import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthNavigation } from '@navigation/AuthNavigationContext';
import { AmbientBackground } from '@shared/components/motion/AmbientBackground';
import { PlantEmblem } from '@shared/components/motion/PlantEmblem';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { GOOGLE_AUTH_READY, signInWithGooglePrompt } from '../services/googleSignIn';
import { theme } from '@constants/designSystem';

const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;

// Google Sign-In activates automatically when EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
// is set + a native build includes the SDK (rebuild required). Until then the
// button stays VISIBLE and shows a "coming soon" notice rather than silently
// opening email signup. See docs/google-signin-setup.md.

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

  const handleGoogle = async () => {
    if (!GOOGLE_AUTH_READY) {
      Alert.alert(
        'Google Sign-In coming soon',
        'We’re putting the finishing touches on Google sign-in. Please continue with email for now.',
      );
      return;
    }
    // On success the auth listener (RootNavigator) signs the user in and
    // navigates automatically — nothing else to do here.
    const res = await signInWithGooglePrompt();
    if (res.status === 'error') {
      Alert.alert('Couldn’t sign in with Google', 'Please try again, or continue with email.');
    }
  };

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
            DON'T LET IT DIE!
          </Animated.Text>

          <Animated.Text entering={FadeInDown.delay(340).duration(M.duration.expressive)} style={styles.headline}>
            Grow Something{'\n'}<Text style={styles.headlineAccent}>Beautiful</Text>
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

          <PressableScale style={styles.btnGoogle} onPress={handleGoogle} to={0.97}>
            <GoogleLogo />
            <Text style={styles.btnSocialText}>Continue with Google</Text>
          </PressableScale>

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
  btnGoogle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm,
    backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: R.pill, paddingVertical: 16,
    borderWidth: 1, borderColor: C.border,
  },
  btnSocialText: { ...T.bodyStrong, color: C.textPrimary },
  signinRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: S.xs },
  signinLabel: { ...T.bodyMd, color: C.textMuted },
  signinLink: { ...T.bodyMd, fontFamily: F.sansBold, color: C.primary },
  terms: { ...T.caption, color: C.textMuted, textAlign: 'center', marginTop: S.xs },
  termsLink: { color: C.textSecondary, fontFamily: F.sansMedium },
});
