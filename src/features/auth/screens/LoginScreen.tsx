import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AuthField } from '../components/AuthField';
import { AmbientBackground } from '@shared/components/motion/AmbientBackground';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { useAuth } from '../hooks/useAuth';
import { useAuthNavigation } from '@navigation/AuthNavigationContext';
import { theme } from '@constants/designSystem';

const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;

const KeyboardSafeArea = Platform.OS === 'ios'
  ? ({ children }: { children: React.ReactNode }) => (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">{children}</KeyboardAvoidingView>
    )
  : ({ children }: { children: React.ReactNode }) => <View style={{ flex: 1 }}>{children}</View>;

const calm = (i: number) => FadeInDown.delay(60 + i * 90).duration(M.duration.expressive);

export const LoginScreen: React.FC = () => {
  const { navigate: authNavigate, goBack: authGoBack } = useAuthNavigation();
  const { signIn, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password) return;
    await signIn({ email: email.trim().toLowerCase(), password });
  }, [email, password, signIn]);

  const goBack = useCallback(() => authGoBack(), [authGoBack]);
  const goSignup = useCallback(() => authNavigate('Signup'), [authNavigate]);
  const goForgot = useCallback(() => authNavigate('ForgotPassword'), [authNavigate]);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  return (
    <View style={styles.root}>
      <AmbientBackground />
      <KeyboardSafeArea>
        <SafeAreaView style={styles.flex} edges={['top']}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            bounces={false}
          >
            <PressableScale style={styles.backBtn} onPress={goBack} to={0.9}>
              <Text style={styles.backText}>← Back</Text>
            </PressableScale>

            <Animated.View entering={calm(0)} style={styles.header}>
              <Text style={styles.eyebrow}>SIGN IN</Text>
              <Text style={styles.headline}>
                Welcome{'\n'}<Text style={styles.headlineItalic}>back.</Text>
              </Text>
              <Text style={styles.subtitle}>Your plants have been waiting for you.</Text>
            </Animated.View>

            {error ? (
              <Animated.View entering={FadeInDown.duration(M.duration.standard)}>
                <TouchableOpacity onPress={clearError} style={styles.errorBanner} activeOpacity={0.8}>
                  <Text style={styles.errorText}>{error}</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : null}

            <Animated.View entering={calm(1)} style={styles.form}>
              <AuthField
                label="Email"
                placeholder="you@plant.co"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <AuthField
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                isPassword
              />
              <Pressable style={styles.forgotRow} onPress={goForgot} hitSlop={8}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            </Animated.View>

            <Animated.View entering={calm(2)}>
              <PressableScale
                style={[styles.cta, (!canSubmit || isLoading) && styles.ctaDisabled]}
                onPress={handleLogin}
                disabled={!canSubmit || isLoading}
                to={0.97}
              >
                <Text style={styles.ctaText}>{isLoading ? 'Signing in…' : 'Sign in'}</Text>
              </PressableScale>
            </Animated.View>

            <Animated.View entering={calm(3)} style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <PressableScale onPress={goSignup} to={0.9}>
                <Text style={styles.footerLink}>Sign up</Text>
              </PressableScale>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardSafeArea>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: S['3xl'], paddingTop: S.sm },

  backBtn: { marginBottom: S['3xl'], paddingVertical: S.xs, alignSelf: 'flex-start' },
  backText: { ...T.bodyStrong, fontFamily: F.sans, color: C.textSecondary },

  header: { marginBottom: S['3xl'] },
  eyebrow: { ...T.eyebrow, color: C.textMuted, marginBottom: S.md },
  headline: { fontFamily: F.serifMedium, fontSize: 44, lineHeight: 50, letterSpacing: -0.5, color: C.textPrimary, marginBottom: S.md },
  headlineItalic: { fontFamily: F.serifMediumItalic, color: C.primary },
  subtitle: { ...T.bodyLg, fontFamily: F.sans, color: C.textSecondary },

  errorBanner: { backgroundColor: C.criticalBg, borderWidth: 1, borderColor: '#FECACA', borderRadius: R.md, padding: S.md, marginBottom: S.lg },
  errorText: { ...T.caption, fontSize: 13, color: C.criticalFg },

  form: { marginBottom: S.lg },
  forgotRow: { alignSelf: 'flex-end', paddingVertical: S.xs, marginTop: S.xs },
  forgotText: { ...T.label, fontSize: 13, color: C.primary },

  cta: { backgroundColor: C.inkBtn, borderRadius: R.pill, paddingVertical: 18, alignItems: 'center', marginTop: S.xl, marginBottom: S['2xl'] },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { ...T.button, fontFamily: F.sansMedium, color: C.onInkBtn },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...T.bodyMd, color: C.textMuted },
  footerLink: { ...T.bodyMd, fontFamily: F.sansBold, color: C.primary },
});
