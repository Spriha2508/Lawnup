import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../../../shared/components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { useAuthNavigation } from '../../../navigation/AuthNavigationContext';

// iOS only — plain View on Android to avoid keyboard layout conflicts
const KAV: React.FC<{ children: React.ReactNode }> =
  Platform.OS === 'ios'
    ? ({ children }) => (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          {children}
        </KeyboardAvoidingView>
      )
    : ({ children }) => <View style={{ flex: 1 }}>{children}</View>;

export const SignupScreen: React.FC = () => {
  const { navigate: authNavigate, goBack: authGoBack } = useAuthNavigation();
  const { signUp, isLoading, error, clearError } = useAuth();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = useCallback(async () => {
    if (!name.trim() || !email.trim() || !password) return;
    await signUp({ name: name.trim(), email: email.trim().toLowerCase(), password });
  }, [name, email, password, signUp]);

  const goBack  = useCallback(() => authGoBack(),          [authGoBack]);
  const goLogin = useCallback(() => authNavigate('Login'), [authNavigate]);

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6;

  return (
    <View style={styles.root}>
      <KAV>
        <SafeAreaView style={styles.flex} edges={['top']}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            bounces={false}
          >
            {/* Back */}
            <Pressable style={styles.backBtn} onPress={goBack} hitSlop={8}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>

            {/* Heading */}
            <View style={styles.header}>
              <Text style={styles.eyebrow}>Create account</Text>
              <Text style={styles.headline}>
                Let's grow{'\n'}
                <Text style={styles.headlineAccent}>together.</Text>
              </Text>
              <Text style={styles.subtitle}>
                Free forever. No credit card required.
              </Text>
            </View>

            {/* Error */}
            {error ? (
              <Pressable onPress={clearError} style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </Pressable>
            ) : null}

            {/* Form */}
            <View style={styles.form}>
              <Input
                label="Full name"
                placeholder="Spriha Roy"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                autoFocus={false}
                returnKeyType="next"
              />
              <Input
                label="Email"
                placeholder="you@plant.co"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoFocus={false}
                returnKeyType="next"
              />
              <Input
                label="Password"
                placeholder="Min. 6 characters"
                value={password}
                onChangeText={setPassword}
                isPassword
                autoFocus={false}
                returnKeyType="done"
                onSubmitEditing={handleSignup}
              />
            </View>

            {/* Primary CTA */}
            <Pressable
              style={[styles.cta, (!canSubmit || isLoading) && styles.ctaDisabled]}
              onPress={handleSignup}
              disabled={!canSubmit || isLoading}
            >
              <Text style={styles.ctaText}>
                {isLoading ? 'Creating account…' : 'Create account'}
              </Text>
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social options */}
            <View style={styles.socialRow}>
              <Pressable style={styles.socialPill}>
                <Text style={styles.socialText}>Apple</Text>
              </Pressable>
              <Pressable style={styles.socialPill}>
                <Text style={styles.socialText}>Google</Text>
              </Pressable>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?  </Text>
              <Pressable onPress={goLogin} hitSlop={8}>
                <Text style={styles.footerLink}>Sign in</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KAV>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // Solid background — no translucent blobs, no compositing layers
    backgroundColor: '#F5F1E8',
  },
  flex:   { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // ── Navigation ──────────────────────────────────────────────────────────────
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    marginBottom: 36,
  },
  backText: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
  },

  // ── Heading ─────────────────────────────────────────────────────────────────
  header:       { marginBottom: 36 },
  eyebrow: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
    color: '#9E9A94',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  headline: {
    fontSize: 38,
    fontFamily: 'Cormorant-SemiBold',
    color: '#111111',
    lineHeight: 44,
    marginBottom: 10,
  },
  headlineAccent: {
    fontFamily: 'Cormorant-SemiBoldItalic',
    color: '#6F943E',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
    lineHeight: 20,
  },

  // ── Error ───────────────────────────────────────────────────────────────────
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#DC2626',
  },

  // ── Form ────────────────────────────────────────────────────────────────────
  form: { marginBottom: 24 },

  // ── CTA ─────────────────────────────────────────────────────────────────────
  cta: {
    backgroundColor: '#111111',
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 28,
    // No elevation, no shadow — stable across Android focus states
  },
  ctaDisabled: {
    backgroundColor: '#C8C8BC',
  },
  ctaText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // ── Divider ─────────────────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#DDD4C7',
  },
  dividerText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#C4C0BA',
    letterSpacing: 1,
  },

  // ── Social ──────────────────────────────────────────────────────────────────
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 36,
  },
  socialPill: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#EEE7DA',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDD4C7',
  },
  socialText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#4A4640',
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#6F943E',
  },
});
