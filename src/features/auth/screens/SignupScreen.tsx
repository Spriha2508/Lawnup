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

type Nav = StackNavigationProp<AuthStackParamList, 'Signup'>;

export const SignupScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { signUp, isLoading, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password) return;
    await signUp({ name: name.trim(), email: email.trim().toLowerCase(), password });
  };

  return (
    <SafeScreen>
      <KeyboardAwareView>
        <View className="flex-1 px-6 pt-16 pb-8">
          {/* Header */}
          <View className="mb-10">
            <Text style={{ fontSize: 40 }} className="mb-2">🌱</Text>
            <Text className="text-text-primary text-3xl font-nunito-bold mb-1">
              Start your garden
            </Text>
            <Text className="text-text-secondary text-base font-nunito-regular">
              India's smartest plant companion awaits.
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
              label="Your name"
              placeholder="Priya, Arjun, Spriha..."
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

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
              placeholder="Min. 6 characters"
              value={password}
              onChangeText={setPassword}
              isPassword
              hint="At least 6 characters"
            />

            <Button
              label="Create Account"
              onPress={handleSignup}
              loading={isLoading}
              fullWidth
              className="mt-2"
            />

            <Text className="text-text-secondary text-xs text-center mt-4 font-nunito-regular leading-5">
              By signing up you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-center mt-4">
            <Text className="text-text-secondary text-base font-nunito-regular">
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-primary text-base font-nunito-bold">Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareView>
    </SafeScreen>
  );
};
