import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { SafeScreen } from '../../../shared/components/layout/SafeScreen';
import { Button } from '../../../shared/components/ui/Button';
import type { OnboardingStackParamList } from '../../../navigation/types';

type Nav = StackNavigationProp<OnboardingStackParamList, 'Welcome'>;

const FEATURES = [
  { emoji: '🔍', text: 'Scan & identify any plant instantly' },
  { emoji: '🤒', text: 'Detect diseases before they spread' },
  { emoji: '🤖', text: 'AI doctor that knows Indian plants' },
  { emoji: '💧', text: 'Smart reminders for your garden' },
];

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  return (
    <SafeScreen>
      <View className="flex-1 px-6 pt-16 pb-8 justify-between">
        <View>
          <Text style={{ fontSize: 64 }} className="mb-4">🌿</Text>
          <Text className="text-text-primary text-4xl font-nunito-extrabold mb-2 leading-10">
            LawnUp AI
          </Text>
          <Text className="text-primary text-lg font-nunito-semibold mb-10">
            India's smartest plant companion
          </Text>

          <View className="gap-4">
            {FEATURES.map((f) => (
              <View key={f.text} className="flex-row items-center">
                <Text style={{ fontSize: 24 }} className="mr-4">{f.emoji}</Text>
                <Text className="text-text-primary text-base font-nunito-regular flex-1">
                  {f.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View>
          <Button
            label="Let's set up your garden →"
            onPress={() => navigation.navigate('Location')}
            fullWidth
          />
          <Text className="text-text-secondary text-xs text-center mt-4 font-nunito-regular">
            Takes less than 1 minute
          </Text>
        </View>
      </View>
    </SafeScreen>
  );
};
