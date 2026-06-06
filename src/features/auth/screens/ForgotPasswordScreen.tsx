import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeScreen } from '../../../shared/components/layout/SafeScreen';
import { KeyboardAwareView } from '../../../shared/components/layout/KeyboardAwareView';
import { Input } from '../../../shared/components/ui/Input';
import { Button } from '../../../shared/components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
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
      <SafeScreen>
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ fontSize: 64 }} className="mb-4">📬</Text>
          <Text className="text-text-primary text-2xl font-nunito-bold text-center mb-3">
            Check your inbox
          </Text>
          <Text className="text-text-secondary text-base font-nunito-regular text-center mb-8 leading-6">
            We've sent a reset link to {email}. Check your spam folder if you don't see it.
          </Text>
          <Button
            label="Back to Sign In"
            onPress={() => navigation.goBack()}
            fullWidth
          />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <KeyboardAwareView>
        <View className="flex-1 px-6 pt-16 pb-8">
          <TouchableOpacity className="mb-8" onPress={() => navigation.goBack()}>
            <Text className="text-primary font-nunito-semibold text-base">← Back</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 40 }} className="mb-2">🔐</Text>
          <Text className="text-text-primary text-3xl font-nunito-bold mb-2">
            Reset password
          </Text>
          <Text className="text-text-secondary text-base font-nunito-regular mb-10">
            Enter your email and we'll send you a reset link.
          </Text>

          {error && (
            <TouchableOpacity
              onPress={clearError}
              className="bg-red-50 border border-error rounded-xl px-4 py-3 mb-4"
            >
              <Text className="text-error text-sm font-nunito-regular">{error}</Text>
            </TouchableOpacity>
          )}

          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Button
            label="Send Reset Link"
            onPress={handleReset}
            loading={isLoading}
            fullWidth
            className="mt-2"
          />
        </View>
      </KeyboardAwareView>
    </SafeScreen>
  );
};
