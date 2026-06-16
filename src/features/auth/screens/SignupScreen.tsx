import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { AuthField } from '../components/AuthField';
import { AuthScaffold, SoftError, calm } from '../components/AuthScaffold';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { useAuth } from '../hooks/useAuth';
import { useAuthNavigation } from '@navigation/AuthNavigationContext';
import { theme } from '@constants/designSystem';

const { color: C, spacing: S, typography: T, radii: R, fonts: F } = theme;

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

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && password.length >= 6;

  return (
    <AuthScaffold
      onBack={authGoBack}
      eyebrow="CREATE ACCOUNT"
      headline={<Text>Let's grow{'\n'}<Text style={styles.accent}>together.</Text></Text>}
      subtitle="Free to start. No card, no clutter — just your garden."
    >
      {error ? <SoftError message={error} onDismiss={clearError} /> : null}

      <Animated.View entering={calm(0)}>
        <AuthField label="Full name" placeholder="Alex Green" value={name} onChangeText={setName}
          autoCapitalize="words" autoComplete="name" returnKeyType="next" />
      </Animated.View>
      <Animated.View entering={calm(1)}>
        <AuthField label="Email" placeholder="you@plant.co" value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="next" />
      </Animated.View>
      <Animated.View entering={calm(2)}>
        <AuthField label="Password" placeholder="Min. 6 characters" value={password} onChangeText={setPassword}
          isPassword returnKeyType="done" onSubmitEditing={handleSignup} />
      </Animated.View>

      <PressableScale
        style={[styles.cta, (!canSubmit || isLoading) && styles.ctaDisabled]}
        onPress={handleSignup}
        disabled={!canSubmit || isLoading}
        to={0.97}
      >
        <Text style={styles.ctaText}>{isLoading ? 'Creating account…' : 'Create account'}</Text>
      </PressableScale>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?  </Text>
        <PressableScale onPress={() => authNavigate('Login')} to={0.9}>
          <Text style={styles.footerLink}>Sign in</Text>
        </PressableScale>
      </View>
    </AuthScaffold>
  );
};

const styles = StyleSheet.create({
  accent: { fontFamily: F.serifMediumItalic, color: C.primary },

  cta: { backgroundColor: C.inkBtn, borderRadius: R.pill, paddingVertical: 18, alignItems: 'center', marginTop: S.sm, ...theme.shadows.cta },
  ctaDisabled: { backgroundColor: C.textFaint, shadowOpacity: 0, elevation: 0 },
  ctaText: { ...T.button, fontFamily: F.sansMedium, color: C.onInkBtn },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: S.xl },
  footerText: { ...T.bodyMd, color: C.textMuted },
  footerLink: { ...T.bodyMd, fontFamily: F.sansBold, color: C.primary },
});
