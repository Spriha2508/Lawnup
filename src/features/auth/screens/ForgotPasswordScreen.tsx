import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthNavigation } from '../../../navigation/AuthNavigationContext';
import { AuthCard } from '../components/AuthCard';
import { Input } from '../../../shared/components/ui/Input';
import { Button } from '../../../shared/components/ui/Button';
import { useAuth } from '../hooks/useAuth';

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

  if (sent) {
    return (
      <AuthCard>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>✦</Text>
          <Text style={styles.successTitle}>Check your inbox</Text>
          <Text style={styles.successBody}>
            We've sent a reset link to{' '}
            <Text style={styles.emailHighlight}>{email}</Text>.{' '}
            Check your spam folder if you don't see it.
          </Text>
          <Button
            label="Back to Sign In"
            onPress={() => goBack()}
            fullWidth
            size="lg"
            style={styles.backButton}
          />
        </View>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      {/* Back link */}
      <TouchableOpacity style={styles.backRow} onPress={() => goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Brand mark */}
      <View style={styles.iconBadge}>
        <Text style={styles.iconEmoji}>◇</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a reset link.
        </Text>
      </View>

      {/* Error banner */}
      {error && (
        <TouchableOpacity
          onPress={clearError}
          style={styles.errorBanner}
          activeOpacity={0.7}
        >
          <Text style={styles.errorText}>{error}</Text>
        </TouchableOpacity>
      )}

      <Input
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      <Button
        label="Send Reset Link"
        onPress={handleReset}
        loading={isLoading}
        disabled={!email.trim()}
        fullWidth
        size="lg"
        style={styles.ctaButton}
      />
    </AuthCard>
  );
};

const styles = StyleSheet.create({
  backRow: {
    marginBottom: 24,
  },
  backText: {
    color: '#6F943E',
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(111,148,62,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 32,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Nunito-ExtraBold',
    fontWeight: '800',
    color: '#1B1B1B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: '#6B7280',
    lineHeight: 22,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    lineHeight: 18,
  },
  ctaButton: {
    marginTop: 8,
  },
  // Success state
  successContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: 20,
    color: 'rgba(111,148,62,0.5)',
  },
  successTitle: {
    fontSize: 26,
    fontFamily: 'Nunito-ExtraBold',
    fontWeight: '800',
    color: '#1B1B1B',
    marginBottom: 12,
    textAlign: 'center',
  },
  successBody: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emailHighlight: {
    color: '#6F943E',
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  backButton: {
    width: '100%',
  },
});
