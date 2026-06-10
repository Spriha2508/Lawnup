import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Input } from '@shared/components/ui/Input';
import { FloatingLeaves } from '@shared/components/motion/FloatingLeaves';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { LeafBurst } from '@shared/components/motion/LeafBurst';
import { useAuth } from '../hooks/useAuth';
import { useAuthNavigation } from '@navigation/AuthNavigationContext';
import { theme } from '@constants/designSystem';

const { width: W, height: H } = Dimensions.get('window');
const { color: C, spacing: S, typography: T, radii: R, motion: M } = theme;

// adjustPan (native build) handles keyboard avoidance on Android natively — no KAV needed there.
const KeyboardSafeArea = Platform.OS === 'ios'
  ? ({ children }: { children: React.ReactNode }) => (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">{children}</KeyboardAvoidingView>
    )
  : ({ children }: { children: React.ReactNode }) => (
      <View style={{ flex: 1 }}>{children}</View>
    );

const stagger = (i: number) =>
  FadeInDown.delay(80 + i * M.stagger.base).duration(M.duration.expressive).springify().damping(18);

export const LoginScreen: React.FC = () => {
  const { navigate: authNavigate, goBack: authGoBack } = useAuthNavigation();
  const { signIn, isLoading, error, clearError } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [burstKey, setBurstKey] = useState(0);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password) return;
    setBurstKey(k => k + 1); // celebratory leaf-burst as auth resolves
    await signIn({ email: email.trim().toLowerCase(), password });
  }, [email, password, signIn]);

  const goBack = useCallback(() => authGoBack(), [authGoBack]);
  const goSignup = useCallback(() => authNavigate('Signup'), [authNavigate]);
  const goForgot = useCallback(() => authNavigate('ForgotPassword'), [authNavigate]);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  return (
    <View style={styles.root}>
      <View style={styles.blobGreen} />
      <FloatingLeaves />

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

            <Animated.View entering={stagger(0)} style={styles.header}>
              <Text style={styles.headline}>
                Welcome{'\n'}
                <Text style={styles.headlineItalic}>back.</Text>
              </Text>
              <Text style={styles.subtitle}>Your plants missed you.</Text>
            </Animated.View>

            {error ? (
              <TouchableOpacity onPress={clearError} style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.form}>
              <Animated.View entering={stagger(1)}>
                <Input
                  label="Email"
                  placeholder="you@plant.co"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoFocus={false}
                />
              </Animated.View>
              <Animated.View entering={stagger(2)}>
                <Input
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  autoFocus={false}
                />
              </Animated.View>
              <Pressable style={styles.forgotRow} onPress={goForgot}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            </View>

            <Animated.View entering={stagger(3)}>
              <PressableScale
                style={[styles.ctaBtn, (!canSubmit || isLoading) && styles.ctaBtnDisabled]}
                onPress={handleLogin}
                disabled={!canSubmit || isLoading}
              >
                <Text style={styles.ctaBtnText}>{isLoading ? 'Signing in...' : 'Sign in'}</Text>
              </PressableScale>
            </Animated.View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <PressableScale onPress={goSignup} to={0.9}>
                <Text style={styles.footerLink}>Sign up</Text>
              </PressableScale>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardSafeArea>

      <LeafBurst playKey={burstKey} origin={{ x: W / 2, y: H * 0.58 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  blobGreen: {
    position: 'absolute',
    width: W * 0.7, height: W * 0.5, borderRadius: W * 0.35,
    backgroundColor: 'rgba(160,195,120,0.22)', top: -W * 0.2, left: -W * 0.1,
  },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: S['3xl'], paddingTop: S.sm },

  backBtn: { marginBottom: S['3xl'], paddingVertical: S.xs, alignSelf: 'flex-start' },
  backText: { ...T.bodyStrong, fontFamily: theme.fonts.sans, color: C.textSecondary },

  header: { marginBottom: S['3xl'] },
  headline: { ...T.display, fontFamily: theme.fonts.serifMedium, fontSize: 40, lineHeight: 48, color: C.textPrimary, marginBottom: S.sm + 2 },
  headlineItalic: { fontFamily: theme.fonts.serifMediumItalic },
  subtitle: { ...T.bodyStrong, fontFamily: theme.fonts.sans, color: C.textSecondary },

  errorBanner: {
    backgroundColor: C.criticalBg, borderWidth: 1, borderColor: '#FECACA',
    borderRadius: R.md, padding: S.md, marginBottom: S.lg,
  },
  errorText: { ...T.caption, fontSize: 13, color: C.criticalFg },

  form: { marginBottom: S.sm },
  forgotRow: { alignSelf: 'flex-end', paddingVertical: S.xs, marginTop: S.xs, marginBottom: S['2xl'] },
  forgotText: { ...T.label, fontSize: 13, color: C.primary },

  ctaBtn: { backgroundColor: C.inkBtn, borderRadius: R.pill, paddingVertical: 17, alignItems: 'center', marginBottom: S['3xl'] },
  ctaBtnDisabled: { opacity: 0.35 },
  ctaBtnText: { ...T.button, color: C.onInkBtn, fontFamily: theme.fonts.sansMedium },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...T.bodyMd, color: C.textMuted },
  footerLink: { ...T.bodyMd, fontFamily: theme.fonts.sansBold, color: C.primary },
});
