import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useAuthNavigation } from '@navigation/AuthNavigationContext';
import { Input } from '@shared/components/ui/Input';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { AmbientBackground } from '@shared/components/motion/AmbientBackground';
import { useAuth } from '../hooks/useAuth';
import { theme } from '@constants/designSystem';

const { color: C, spacing: S, typography: T, radii: R, motion: M } = theme;

const LeafMark: React.FC = () => (
  <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3C12 3 5 6 5 13C5 17.4183 8.13 21 12 21C15.87 21 19 17.4183 19 13C19 6 12 3 12 3Z" fill={C.primary} opacity={0.9} />
    <Path d="M12 3V21" stroke={C.canvas} strokeWidth={1.3} strokeLinecap="round" />
  </Svg>
);

const CheckMark: React.FC = () => (
  <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12.5L10 17.5L19 7" stroke={C.primary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ForgotPasswordScreen: React.FC = () => {
  const { goBack } = useAuthNavigation();
  const { resetPassword, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) return;
    const success = await resetPassword(email.trim().toLowerCase());
    if (success) setSent(true);
  };

  return (
    <View style={styles.root}>
      <AmbientBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* dim space above — the card slides up like a sheet */}
        <View style={styles.spacer} />

        <Animated.View entering={FadeInUp.duration(M.duration.expressive).springify().damping(20)} style={styles.sheet}>
          <View style={styles.grabber} />

          {sent ? (
            <Animated.View entering={FadeIn.duration(M.duration.standard)} style={styles.successWrap}>
              <View style={styles.badge}><CheckMark /></View>
              <Text style={styles.title}>Check your inbox</Text>
              <Text style={styles.body}>
                We've sent a reset link to <Text style={styles.emailHi}>{email}</Text>.{' '}
                Check spam if you don't see it.
              </Text>
              <PressableScale style={styles.cta} onPress={() => goBack()}>
                <Text style={styles.ctaText}>Back to Sign In</Text>
              </PressableScale>
            </Animated.View>
          ) : (
            <>
              <View style={styles.badge}><LeafMark /></View>
              <Text style={styles.title}>Reset password</Text>
              <Text style={styles.body}>Enter your email and we'll send you a reset link.</Text>

              {error ? (
                <TouchableOpacity onPress={clearError} style={styles.errorBanner} activeOpacity={0.7}>
                  <Text style={styles.errorText}>{error}</Text>
                </TouchableOpacity>
              ) : null}

              <View style={styles.formGap}>
                <Input
                  label="Email"
                  placeholder="you@plant.co"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <PressableScale
                style={[styles.cta, (!email.trim() || isLoading) && styles.ctaDisabled]}
                onPress={handleReset}
                disabled={!email.trim() || isLoading}
              >
                <Text style={styles.ctaText}>{isLoading ? 'Sending…' : 'Send Reset Link'}</Text>
              </PressableScale>

              <PressableScale style={styles.backLink} onPress={() => goBack()} to={0.92}>
                <Text style={styles.backLinkText}>← Back to Sign In</Text>
              </PressableScale>
            </>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  safe: { flex: 1, justifyContent: 'flex-end' },
  spacer: { flex: 1 },

  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: R.sheet,
    borderTopRightRadius: R.sheet,
    paddingHorizontal: 28,
    paddingTop: S.md,
    paddingBottom: 36,
    ...theme.shadows.lg,
  },
  grabber: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.border, marginBottom: S['2xl'],
  },

  badge: {
    width: 64, height: 64, borderRadius: R.xl,
    backgroundColor: C.primaryWash, alignItems: 'center', justifyContent: 'center',
    marginBottom: S['2xl'],
  },
  title: { ...T.h2, color: C.textPrimary, marginBottom: S.sm },
  body: { ...T.bodyStrong, fontFamily: theme.fonts.sans, color: C.textSecondary, lineHeight: 22, marginBottom: S['2xl'] },

  errorBanner: {
    backgroundColor: C.criticalBg, borderWidth: 1, borderColor: '#FECACA',
    borderRadius: R.md, paddingHorizontal: S.md, paddingVertical: 11, marginBottom: S.lg,
  },
  errorText: { ...T.caption, fontSize: 13, color: C.criticalFg, lineHeight: 18 },

  formGap: { marginBottom: S.sm },

  cta: { backgroundColor: C.inkBtn, borderRadius: R.pill, paddingVertical: 17, alignItems: 'center', marginTop: S.sm },
  ctaDisabled: { opacity: 0.35 },
  ctaText: { ...T.button, color: C.onInkBtn, fontFamily: theme.fonts.sansMedium },

  backLink: { alignSelf: 'center', marginTop: S.xl, paddingVertical: S.sm },
  backLinkText: { ...T.label, fontSize: 13, color: C.textSecondary },

  successWrap: { alignItems: 'center' },
  emailHi: { color: C.primary, fontFamily: theme.fonts.sansMedium },
});
