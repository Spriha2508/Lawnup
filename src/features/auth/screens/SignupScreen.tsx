import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
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

// iOS only — plain View on Android to avoid keyboard layout conflicts
const KAV: React.FC<{ children: React.ReactNode }> =
  Platform.OS === 'ios'
    ? ({ children }) => (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">{children}</KeyboardAvoidingView>
      )
    : ({ children }) => <View style={{ flex: 1 }}>{children}</View>;

const stagger = (i: number) =>
  FadeInDown.delay(80 + i * M.stagger.base).duration(M.duration.expressive).springify().damping(18);

export const SignupScreen: React.FC = () => {
  const { navigate: authNavigate, goBack: authGoBack } = useAuthNavigation();
  const { signUp, isLoading, error, clearError } = useAuth();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [burstKey, setBurstKey] = useState(0);

  const handleSignup = useCallback(async () => {
    if (!name.trim() || !email.trim() || !password) return;
    setBurstKey(k => k + 1);
    await signUp({ name: name.trim(), email: email.trim().toLowerCase(), password });
  }, [name, email, password, signUp]);

  const goBack  = useCallback(() => authGoBack(),          [authGoBack]);
  const goLogin = useCallback(() => authNavigate('Login'), [authNavigate]);

  const canSubmit =
    name.trim().length > 0 && email.trim().length > 0 && password.length >= 6;

  return (
    <View style={styles.root}>
      <View style={styles.blobGreen} />
      <FloatingLeaves />

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

            <Animated.View entering={stagger(0)} style={styles.header}>
              <Text style={styles.eyebrow}>Create account</Text>
              <Text style={styles.headline}>
                Let's grow{'\n'}
                <Text style={styles.headlineAccent}>together.</Text>
              </Text>
              <Text style={styles.subtitle}>Free forever. No credit card required.</Text>
            </Animated.View>

            {error ? (
              <Pressable onPress={clearError} style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </Pressable>
            ) : null}

            <View style={styles.form}>
              <Animated.View entering={stagger(1)}>
                <Input label="Full name" placeholder="Spriha Roy" value={name} onChangeText={setName}
                  autoCapitalize="words" autoComplete="name" autoFocus={false} returnKeyType="next" />
              </Animated.View>
              <Animated.View entering={stagger(2)}>
                <Input label="Email" placeholder="you@plant.co" value={email} onChangeText={setEmail}
                  keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoFocus={false} returnKeyType="next" />
              </Animated.View>
              <Animated.View entering={stagger(3)}>
                <Input label="Password" placeholder="Min. 6 characters" value={password} onChangeText={setPassword}
                  isPassword autoFocus={false} returnKeyType="done" onSubmitEditing={handleSignup} />
              </Animated.View>
            </View>

            <Animated.View entering={stagger(4)}>
              <PressableScale
                style={[styles.cta, (!canSubmit || isLoading) && styles.ctaDisabled]}
                onPress={handleSignup}
                disabled={!canSubmit || isLoading}
              >
                <Text style={styles.ctaText}>{isLoading ? 'Creating account…' : 'Create account'}</Text>
              </PressableScale>
            </Animated.View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <PressableScale style={styles.socialPill}>
                <Text style={styles.socialText}>Apple</Text>
              </PressableScale>
              <PressableScale style={styles.socialPill}>
                <Text style={styles.socialText}>Google</Text>
              </PressableScale>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?  </Text>
              <PressableScale onPress={goLogin} hitSlop={8} to={0.9}>
                <Text style={styles.footerLink}>Sign in</Text>
              </PressableScale>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KAV>

      <LeafBurst playKey={burstKey} origin={{ x: W / 2, y: H * 0.5 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  blobGreen: {
    position: 'absolute',
    width: W * 0.7, height: W * 0.5, borderRadius: W * 0.35,
    backgroundColor: 'rgba(160,195,120,0.16)', top: -W * 0.22, right: -W * 0.12,
  },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: S.sm, paddingBottom: S['4xl'] },

  backBtn: { alignSelf: 'flex-start', paddingVertical: S.xs + 2, marginBottom: 36 },
  backText: { ...T.bodyStrong, fontFamily: theme.fonts.sans, color: C.textMuted },

  header: { marginBottom: 36 },
  eyebrow: { ...T.label, color: C.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: S.md },
  headline: { ...T.display, fontFamily: theme.fonts.serifMedium, fontSize: 38, lineHeight: 44, color: C.textPrimary, marginBottom: S.sm + 2 },
  headlineAccent: { fontFamily: theme.fonts.serifMediumItalic, color: C.primary },
  subtitle: { ...T.bodyMd, color: C.textMuted },

  errorBanner: {
    backgroundColor: C.criticalBg, borderWidth: 1, borderColor: '#FECACA',
    borderRadius: R.md, padding: S.md, marginBottom: S.lg,
  },
  errorText: { ...T.caption, fontSize: 13, color: C.criticalFg },

  form: { marginBottom: S['2xl'] },

  cta: { backgroundColor: C.inkBtn, borderRadius: R.pill, paddingVertical: 17, alignItems: 'center', marginBottom: 28 },
  ctaDisabled: { backgroundColor: C.textFaint },
  ctaText: { ...T.button, color: C.onInkBtn, fontFamily: theme.fonts.sansMedium },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, marginBottom: S.xl },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: C.border },
  dividerText: { ...T.caption, color: C.textFaint, letterSpacing: 1 },

  socialRow: { flexDirection: 'row', gap: S.md, marginBottom: 36 },
  socialPill: {
    flex: 1, paddingVertical: S.lg - 2, alignItems: 'center',
    backgroundColor: C.surface, borderRadius: R.pill,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.border,
  },
  socialText: { ...T.bodyMd, fontFamily: theme.fonts.sansMedium, color: C.textSecondary },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...T.bodyMd, color: C.textMuted },
  footerLink: { ...T.bodyMd, fontFamily: theme.fonts.sansBold, color: C.primary },
});
