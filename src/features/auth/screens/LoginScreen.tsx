import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { AuthField } from '../components/AuthField';
import { AuthScaffold, SoftError, calm } from '../components/AuthScaffold';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { useAuth } from '../hooks/useAuth';
import { useAuthNavigation } from '@navigation/AuthNavigationContext';
import { theme } from '@constants/designSystem';

const { color: C, spacing: S, typography: T, radii: R, fonts: F } = theme;

// Lightweight email-format guard (Firebase does authoritative validation).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginScreen: React.FC = () => {
  const { navigate: authNavigate, goBack: authGoBack } = useAuthNavigation();
  const { signIn, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = useCallback(async () => {
    if (!EMAIL_RE.test(email.trim()) || !password) return;
    await signIn({ email: email.trim().toLowerCase(), password });
  }, [email, password, signIn]);

  const canSubmit = EMAIL_RE.test(email.trim()) && password.length > 0;

  return (
    <AuthScaffold
      onBack={authGoBack}
      eyebrow="SIGN IN"
      headline={<Text>Welcome{'\n'}<Text style={styles.accent}>back.</Text></Text>}
      subtitle="Your plants have been waiting for you."
    >
      {error ? <SoftError message={error} onDismiss={clearError} /> : null}

      <Animated.View entering={calm(0)}>
        <AuthField
          label="Email"
          placeholder="you@plant.co"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      </Animated.View>
      <Animated.View entering={calm(1)}>
        <AuthField
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          isPassword
        />
      </Animated.View>

      <Pressable style={styles.forgotRow} onPress={() => authNavigate('ForgotPassword')} hitSlop={8}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </Pressable>

      <PressableScale
        style={[styles.cta, (!canSubmit || isLoading) && styles.ctaDisabled]}
        onPress={handleLogin}
        disabled={!canSubmit || isLoading}
        to={0.97}
      >
        <Text style={styles.ctaText}>{isLoading ? 'Signing in…' : 'Sign in'}</Text>
      </PressableScale>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <PressableScale onPress={() => authNavigate('Signup')} to={0.9}>
          <Text style={styles.footerLink}>Sign up</Text>
        </PressableScale>
      </View>
    </AuthScaffold>
  );
};

const styles = StyleSheet.create({
  accent: { fontFamily: F.serifMediumItalic, color: C.primary },

  forgotRow: { alignSelf: 'flex-end', paddingVertical: S.xs, marginTop: S.xs, marginBottom: S.lg },
  forgotText: { ...T.label, fontSize: 13, color: C.primary },

  cta: { backgroundColor: C.inkBtn, borderRadius: R.pill, paddingVertical: 18, alignItems: 'center', ...theme.shadows.cta },
  ctaDisabled: { backgroundColor: C.textFaint, shadowOpacity: 0, elevation: 0 },
  ctaText: { ...T.button, fontFamily: F.sansMedium, color: C.onInkBtn },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: S.xl },
  footerText: { ...T.bodyMd, color: C.textMuted },
  footerLink: { ...T.bodyMd, fontFamily: F.sansBold, color: C.primary },
});
