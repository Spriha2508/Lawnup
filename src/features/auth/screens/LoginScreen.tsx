import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { SafeScreen } from '../../../shared/components/layout/SafeScreen';
import { KeyboardAwareView } from '../../../shared/components/layout/KeyboardAwareView';
import { Input } from '../../../shared/components/ui/Input';
import { Button } from '../../../shared/components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import type { AuthStackParamList } from '../../../navigation/types';

type Nav = StackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { signIn, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    await signIn({ email: email.trim().toLowerCase(), password });
  };

  return (
    <SafeScreen>
      <KeyboardAwareView>
        <View className="flex-1 px-6 pt-16 pb-8">
          {/* Header */}
          <View className="mb-10">
            <Text style={{ fontSize: 40 }} className="mb-2">🌿</Text>
            <Text className="text-text-primary text-3xl font-nunito-bold mb-1">
              Welcome back
            </Text>
            <Text className="text-text-secondary text-base font-nunito-regular">
              Your plants missed you.
            </Text>
          </View>

          {/* Form */}
          <View className="flex-1">
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
              autoComplete="email"
            />

            <Input
              label="Password"
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              isPassword
            />

            <TouchableOpacity
              className="items-end mb-6"
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text className="text-primary text-sm font-nunito-semibold">
                Forgot password?
              </Text>
            </TouchableOpacity>

            <Button
              label="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
            />
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-center mt-6">
            <Text className="text-text-secondary text-base font-nunito-regular">
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text className="text-primary text-base font-nunito-bold">Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareView>
    </SafeScreen>
  );
};
