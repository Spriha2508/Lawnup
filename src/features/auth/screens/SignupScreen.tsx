import React, { useCallback, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
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

const KAV: React.FC<{ children: React.ReactNode }> =
  Platform.OS === 'ios'
    ? ({ children }) => <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">{children}</KeyboardAvoidingView>
    : ({ children }) => <View style={{ flex: 1 }}>{children}</View>;

const calm = (i: number) => FadeInDown.delay(60 + i * 90).duration(M.duration.expressive);

export const SignupScreen: React.FC = () => {
  const { navigate: authNavigate, goBack: authGoBack } = useAuthNavigation();
  const { signUp, isLoading, error, clearError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = useCallback(async () => {
    if (!name.trim() || !email.trim() || !password) return;
    await signUp({ name: name.trim(), email: email.trim().toLowerCase(), password });
  }, [name, email, password, signUp]);

  const goBack = useCallback(() => authGoBack(), [authGoBack]);
  const goLogin = useCallback(() => authNavigate('Login'), [authNavigate]);

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && password.length >= 6;

  return (
    <View style={styles.root}>
      <AmbientBackground />
      <KAV>
        <SafeAreaView style={styles.flex} edges={['top']}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            bounces={false}
          >
            <PressableScale style={styles.backBtn} onPress={goBack} hitSlop={8} to={0.9}>
              <Text style={styles.backText}>← Back</Text>
            </PressableScale>

            <Animated.View entering={calm(0)} style={styles.header}>
              <Text style={styles.eyebrow}>CREATE ACCOUNT</Text>
              <Text style={styles.headline}>
                Let's grow{'\n'}<Text style={styles.headlineAccent}>together.</Text>
              </Text>
              <Text style={styles.subtitle}>Free to start. No card, no clutter — just your garden.</Text>
            </Animated.View>

            {error ? (
              <Animated.View entering={FadeInDown.duration(M.duration.standard)}>
                <Pressable onPress={clearError} style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </Pressable>
              </Animated.View>
            ) : null}

            <Animated.View entering={calm(1)} style={styles.form}>
              <AuthField label="Full name" placeholder="Spriha Roy" value={name} onChangeText={setName}
                autoCapitalize="words" autoComplete="name" returnKeyType="next" />
              <AuthField label="Email" placeholder="you@plant.co" value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="next" />
              <AuthField label="Password" placeholder="Min. 6 characters" value={password} onChangeText={setPassword}
                isPassword returnKeyType="done" onSubmitEditing={handleSignup} />
            </Animated.View>

            <Animated.View entering={calm(2)}>
              <PressableScale
                style={[styles.cta, (!canSubmit || isLoading) && styles.ctaDisabled]}
                onPress={handleSignup}
                disabled={!canSubmit || isLoading}
                to={0.97}
              >
                <Text style={styles.ctaText}>{isLoading ? 'Creating account…' : 'Create account'}</Text>
              </PressableScale>
            </Animated.View>

            <Animated.View entering={calm(3)} style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?  </Text>
              <PressableScale onPress={goLogin} hitSlop={8} to={0.9}>
                <Text style={styles.footerLink}>Sign in</Text>
              </PressableScale>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </KAV>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: S.sm, paddingBottom: S['4xl'] },

  backBtn: { alignSelf: 'flex-start', paddingVertical: S.xs + 2, marginBottom: 36 },
  backText: { ...T.bodyStrong, fontFamily: F.sans, color: C.textMuted },

  header: { marginBottom: 36 },
  eyebrow: { ...T.eyebrow, color: C.textMuted, marginBottom: S.md },
  headline: { fontFamily: F.serifMedium, fontSize: 42, lineHeight: 48, letterSpacing: -0.5, color: C.textPrimary, marginBottom: S.md },
  headlineAccent: { fontFamily: F.serifMediumItalic, color: C.primary },
  subtitle: { ...T.bodyLg, fontFamily: F.sans, color: C.textSecondary, lineHeight: 24 },

  errorBanner: { backgroundColor: C.criticalBg, borderWidth: 1, borderColor: '#FECACA', borderRadius: R.md, padding: S.md, marginBottom: S.lg },
  errorText: { ...T.caption, fontSize: 13, color: C.criticalFg },

  form: { marginBottom: S.xl },

  cta: { backgroundColor: C.inkBtn, borderRadius: R.pill, paddingVertical: 18, alignItems: 'center', marginBottom: 28 },
  ctaDisabled: { backgroundColor: C.textFaint },
  ctaText: { ...T.button, fontFamily: F.sansMedium, color: C.onInkBtn },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...T.bodyMd, color: C.textMuted },
  footerLink: { ...T.bodyMd, fontFamily: F.sansBold, color: C.primary },
});
