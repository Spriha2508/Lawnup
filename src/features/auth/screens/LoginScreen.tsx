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
import { Input } from '../../../shared/components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { useAuthNavigation } from '../../../navigation/AuthNavigationContext';

const { width: W } = Dimensions.get('window');

// adjustPan (native build) handles keyboard avoidance on Android natively — no KAV needed there.
const KeyboardSafeArea = Platform.OS === 'ios'
  ? ({ children }: { children: React.ReactNode }) => (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">{children}</KeyboardAvoidingView>
    )
  : ({ children }: { children: React.ReactNode }) => (
      <View style={{ flex: 1 }}>{children}</View>
    );

export const LoginScreen: React.FC = () => {
  const { navigate: authNavigate, goBack: authGoBack } = useAuthNavigation();
  const { signIn, isLoading, error, clearError } = useAuth();
  const [email,    setEmail]    = useState('');
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
      {/* Static background blob */}
      <View style={styles.blobGreen} />

      <KeyboardSafeArea>
        <SafeAreaView style={styles.flex} edges={['top']}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            bounces={false}
          >
            {/* Back */}
            <Pressable style={styles.backBtn} onPress={goBack}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>

            {/* Heading — plain View, no entering animation */}
            <View style={styles.header}>
              <Text style={styles.headline}>
                Welcome{'\n'}
                <Text style={styles.headlineItalic}>back.</Text>
              </Text>
              <Text style={styles.subtitle}>Your plants missed you.</Text>
            </View>

            {/* Error */}
            {error ? (
              <TouchableOpacity onPress={clearError} style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </TouchableOpacity>
            ) : null}

            {/* Form */}
            <View style={styles.form}>
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
              <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                isPassword
                autoFocus={false}
              />
              <Pressable style={styles.forgotRow} onPress={goForgot}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            </View>

            {/* CTA */}
            <Pressable
              style={[styles.ctaBtn, (!canSubmit || isLoading) && styles.ctaBtnDisabled]}
              onPress={handleLogin}
              disabled={!canSubmit || isLoading}
            >
              <Text style={styles.ctaBtnText}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Text>
            </Pressable>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Pressable onPress={goSignup}>
                <Text style={styles.footerLink}>Sign up</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardSafeArea>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  blobGreen: {
    position: 'absolute',
    width: W * 0.7,
    height: W * 0.5,
    borderRadius: W * 0.35,
    backgroundColor: 'rgba(160,195,120,0.22)',
    top: -W * 0.2,
    left: -W * 0.1,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 32,
    paddingTop: 8,
  },

  backBtn: {
    marginBottom: 32,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: '#6E6A64',
  },

  header: { marginBottom: 32 },
  headline: {
    fontSize: 40,
    fontFamily: 'Cormorant-SemiBold',
    color: '#111111',
    lineHeight: 48,
    marginBottom: 10,
  },
  headlineItalic: {
    fontFamily: 'Cormorant-SemiBoldItalic',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: '#6E6A64',
  },

  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
  },

  form: { marginBottom: 8 },
  forgotRow: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    marginTop: 4,
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: '#6F943E',
  },

  ctaBtn: {
    backgroundColor: '#111111',
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 32,
  },
  ctaBtnDisabled: {
    opacity: 0.35,
  },
  ctaBtnText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

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
